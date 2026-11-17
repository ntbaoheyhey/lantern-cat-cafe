"""Bind reviewed caster-banner films and layouts to the installed runtime, without overwriting evidence."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import argparse
import re

ROOT = Path(__file__).resolve().parents[3]
read = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()
now = datetime.now(timezone.utc).isoformat()
parser = argparse.ArgumentParser()
parser.add_argument('--attempt', required=True)
parser.add_argument('--revision', default='')
args = parser.parse_args()
assert re.fullmatch(r'r[1-9][0-9]*', args.attempt), 'Invalid attempt'
OUT = ROOT / ('reports/v4-art/REVIEW/A11/banner-runtime-' + args.attempt)
assert not args.revision or re.fullmatch(r'[a-z0-9-]+', args.revision), 'Invalid revision'
suffix = '-' + args.revision if args.revision else ''
targets = ['lane-audit-final' + suffix + '.json', 'acceptance-receipt' + suffix + '.json']
assert not any((OUT / name).exists() for name in targets), 'Never overwrite a receipt'
checkpoint_paths = ['reports/v4-art/' + name for name in
                    ['HANDOFF-ART.md', 'QUEUE-ART.md', 'STATE-ART.md', 'STATUS-VI.md']]
checkpoint_paths.append(str((OUT / 'film-review.json').relative_to(ROOT)))
assert not git('diff', '--name-only', '--', *checkpoint_paths), 'Explicitly stage pending checkpoint changes first'
runtime = read(OUT / 'source-hashes.json')
validation = read(OUT / 'validation.json')
pipeline = read(OUT / 'capture-jobs.json')
films = read(OUT / 'film-review.json')
capture = read(OUT / 'film-capture-verification.json')
markers = read(OUT / 'encoded-markers.json')
layout = read(OUT / 'layout900.json')
visual = read(OUT / 'layout900-review.json')
native = read(OUT / 'native-banner-review.json')
assert validation['complete'] and validation['pass'] and validation['runtimeUnchanged']
assert pipeline['complete'] and pipeline['pass'] and pipeline['runtimeUnchanged']
assert films['reviewComplete'] and len(films['sheets']) == films['reviewedCount'] > 0
assert all(s['reviewed'] and s['visualObservation'] for s in films['sheets'])
assert films['assessmentScope'] and films['limitations'] and films['finding']
assert visual['reviewComplete'] and len(visual['sheets']) == 3
assert all(s['reviewed'] and s['observation'] for s in visual['sheets'])
assert native['complete'] and native['mappingPass'] and native['reviewComplete']
assert native['mappings'] and native['reviewedCount'] == len(native['sheets'])
assert sum(f['ultimateWindows'] for f in native['fixtures']) == len({(m['fixture'],m['actionKey']) for m in native['mappings']})
assert all(s['reviewed'] and s['observation'] for s in native['sheets'])
assert native['finding'] and native['limitations']
assert native['visualCoverageComplete'] and all(m.get('bannerFullyVisible') for m in native['mappings'])
for index in native.get('originalMissingCaptionMappings', []):
    mapping = native['mappings'][index]
    assert mapping['originalCropFullyVisible'] is False
    assert any(index in s['mappingIndices'] and s.get('coveragePass') is False
               for s in native['sheets'] if not s.get('supplement'))
    supplement = next(s for s in native['sheets'] if s['path'] == mapping['supplementalCoveragePath'])
    assert supplement['supplement'] and supplement['reviewed'] and supplement['coveragePass']
    binding = next(b for b in supplement['sourceBindings'] if b['mappingIndex'] == index)
    assert binding['encodedFrame'] == mapping['encodedFrame']
    assert sha(ROOT / binding['sourcePath']) == binding['sourceSha256']
assert sha(ROOT / native['verificationPath']) == native['verificationSha256']
assert read(ROOT / native['verificationPath'])['pass']
fixtures = {'wave1', 'wave3', 'boss'}
assert capture['pass'] and {r['fixture'] for r in capture['rows']} == fixtures
assert len(markers) == 3 and {r['fixture'] for r in markers} == fixtures
assert all(r['pass'] and r['frames'] == r['valid'] == 900 for r in markers)
assert len(layout['results']) == 3 and {r['fixture'] for r in layout['results']} == fixtures
assert all(r['parity'] and not r['errors'] and not r['failures'] for r in layout['results'])
assert runtime == validation['runtimeHashes'] == pipeline['runtimeSourceHashes']
assert all(sha(ROOT / p) == h for p, h in runtime.items()), 'Runtime changed'
assert all(sha(ROOT / s['reviewPath']) == s['sha256'] for s in films['sheets'])
assert all(sha(ROOT / s['path']) == s['sha256'] for s in visual['sheets'])
assert all(sha(ROOT / s['path']) == s['sha256'] for s in native['sheets'])
assert all(sha(ROOT / r['video']) == r['videoSha256'] for r in capture['rows'])
runtime_commit = validation['sourceCommit']
runtime_delta = git('diff', '--name-only', runtime_commit, 'HEAD', '--', 'apps/web/src', 'apps/web/public').splitlines()
test_validation = None
test_delta = [p for p in runtime_delta if p in {
    'apps/web/src/game/cardrpg/spine/cat-presentation.test.ts',
    'apps/web/src/game/cardrpg/spine/outcome-labels.test.ts'}]
if test_delta:
    qa_path = ROOT / 'reports/v4-art/REVIEW/QA-5/r4.json'
    qa = read(qa_path)
    assert qa['complete'] and qa['pass'] and qa['parityPass']
    assert all(sha(ROOT / p) == qa['testHashes'][p] for p in test_delta)
    assert all(step['exitCode'] == 0 for step in qa['steps'])
    test_validation = {'path': str(qa_path.relative_to(ROOT)), 'sha256': sha(qa_path),
                       'changedTestFiles': test_delta, 'runtimeImpact': 'Tests only; all captured runtime hashes remain checked above'}
    runtime_delta = [p for p in runtime_delta if p not in test_delta]
assert not runtime_delta, runtime_delta
parity = read(OUT / 'parity.json')
assert parity['pass'] and parity['runtimeHashes'] == runtime
assert len(parity['rows']) == 3 and all(r['parity'] and r['baselineMatches'] and not r['errors'] for r in parity['rows'])
assert sha(ROOT / 'reports/v3-feel/parity-new.json') == parity['baselineSha256']
replay = read(OUT / ('runtime-check-' + args.attempt + '.json'))
assert replay['complete'] and replay['pass'] and replay['productionInstalled'] and replay['runtimeUnchanged']

# Bind reviewed inputs to the index, including new files that plain git diff omits.
required = checkpoint_paths + [str((OUT / name).relative_to(ROOT)) for name in
    ['capture-jobs.json', 'film-capture-verification.json', 'encoded-markers.json', 'film-review.json', 'layout900.json', 'layout900-review.json', 'native-banner-review.json']]
for path in required:
    assert git('hash-object', path) == git('rev-parse', ':' + path), 'Checkpoint input is not staged: ' + path
tracked_bytes = sum((ROOT / p).stat().st_size for p in git('ls-files', 'reports/v4-art').splitlines())
assert tracked_bytes <= 150000000, 'Tracked V4 report budget exceeded'
prior = ROOT / 'reports/v4-art/REVIEW/A11/banner-runtime-r1'
assert read(prior / 'runtime-check-r1.json')['pass'] is False
retained = [{'path': str((prior / name).relative_to(ROOT)), 'sha256': sha(prior / name)} for name in
            ['runtime-check-r1.json', 'checkpoint-failure.json', 'initial-geometry-trace-r1.json']]

baseline = read(OUT / 'lane-audit.json')['baseline']
committed = [line.split('\t') for line in git('diff', '--name-status', baseline, 'HEAD').splitlines()]
staged = [line.split('\t') for line in git('diff', '--cached', '--name-status').splitlines()]
planned = [str((OUT / name).relative_to(ROOT)) for name in targets]
files = sorted({row[-1] for row in committed + staged} | set(planned))
allowed = ('apps/web/public/units/', 'apps/web/public/vfx/', 'apps/web/src/game/cardrpg/battle-v3/',
           'apps/web/src/game/cardrpg/spine/', 'apps/web/src/game/cardrpg/stage/',
           'apps/web/src/game/cardrpg/vfx-craft/', 'apps/web/src/game/cardrpg/vfx-layered/',
           'apps/web/src/game/rig/', 'tools/v3craft-lab/', 'scripts/v3feel/', 'reports/v4-art/', 'reports/v3-feel/')
progress_path = 'reports/v4-art/PROGRESS-ART.log'
progress_before = subprocess.check_output(['git', 'show', baseline + ':' + progress_path], cwd=ROOT)
progress_append_only = (ROOT / progress_path).read_bytes().startswith(progress_before)
violations = [p for p in files if not p.startswith(allowed) or 'audio' in p.lower()
              or (p.endswith(('.log', '.webm', '.mp4', '.DS_Store')) and p != progress_path)
              or (p == progress_path and not progress_append_only) or '/raw/' in p or '/private/' in p]
originals = [p for p in files if p.startswith(('apps/web/public/units/', 'apps/web/public/vfx/')) and '/sampled-delivery/' not in p]
v3_changes = [row for row in committed + staged if row[-1].startswith('reports/v3') and row[0] != 'A']
audit = {'at': now, 'baseline': baseline, 'head': git('rev-parse', 'HEAD'), 'count': len(files), 'files': files,
         'scope': 'Committed ART paths, explicitly staged checkpoint paths and the two planned receipt outputs; inherited unstaged files excluded.',
         'pendingCheckpointPaths': [row[-1] for row in staged], 'plannedReceiptPaths': planned,
         'requiredProgressLogAppendOnly': progress_append_only,
         'violations': violations, 'originalOrExactMapChanges': originals, 'v3NonAppendChanges': v3_changes,
         'pass': not (violations or originals or v3_changes)}
(OUT / targets[0]).write_text(json.dumps(audit, indent=2) + '\n')
assert audit['pass'], audit
proofs = ['source-hashes.json', 'validation-preflight.json', 'validation.json', 'parity.json',
          ('runtime-check-' + args.attempt + '.json'), 'capture-jobs.json', 'film-capture-verification.json', 'encoded-markers.json',
          'film-review.json', 'layout900.json', 'layout900-review.json', 'native-banner-review.json', targets[0]]
proofs.append(Path(native['verificationPath']).name)
receipt = {
    'at': now, 'status': 'SCOPED_CASTER_BANNER_REVIEW_COMPLETE; full composition, blind association and integration acceptance OPEN',
    'runtimeCommit': runtime_commit, 'captureSourceCommit': pipeline['sourceCommit'], 'receiptSourceCommit': git('rev-parse', 'HEAD'),
    'scriptSha256': sha(Path(__file__)), 'runtime': {'verifiedHashes': len(runtime), 'changesSinceInstalledRuntime': runtime_delta},
    'revision': args.revision or 'original',
    'subsequentTestValidation': test_validation,
    'proofs': [{'path': str((OUT / p).relative_to(ROOT)), 'sha256': sha(OUT / p)} for p in proofs],
    'validation': {'fullWeb': validation['fullWebSummary'], 'typecheck': 'Source-matched preflight passed',
                   'explicitThreeFixtureParity': True, 'installedDomReplay': True, 'installedSamples': sum(len(c['samples']) for c in replay['cases']), 'lanePass': True},
    'films': [{'fixture': r['fixture'], 'videoSha256': r['videoSha256'], 'durationSeconds': r['containerDurationSeconds'],
               'encodedFrames': r['encodedFrames'], 'medianRenderFPS': r['medianRenderFPS'], 'audioCodecs': r['audioCodecs']}
              for r in capture['rows']],
    'visualReview': {'actionSheets': len(films['sheets']), 'ultimateSheets': sum(s['tier'] == 'ultimate' for s in films['sheets']),
                     'layout900Sheets': len(visual['sheets']), 'layout900Samples': sum(r['frames'] for r in layout['results']),
                     'scope': films['assessmentScope'], 'finding': films['finding'], 'limitations': films['limitations']},
    'nativeBannerReview': {'sheets': len(native['sheets']), 'semanticSamples': len(native['mappings']),
                          'originalCropFailuresRetained': native.get('originalMissingCaptionMappings', []),
                          'supplementSheets': sum(bool(s.get('supplement')) for s in native['sheets']),
                          'maxElapsedDifferenceMs': max(abs(m['elapsedDifferenceMs']) for m in native['mappings']),
                          'scope': native['scope'], 'finding': native['finding'], 'limitations': native['limitations']},
    'open': ['All original defects without exact reproduced evidence remain retained.',
             'Detached banner-to-caster association has not had a user blind test; shield/result-number crowding and900p wave1 orange-glow attribution remain open.',
             'Continuous-shake duration, reduced-motion film, activation, final SHIP classes and process-time split.',
             'Audio quality and complete native-pixel legibility are not accepted by reduced review sheets.'],
    'transfer': {'integratedProductionGate': 'OPEN', 'boundShipBytes': [27546250, 27546252], 'limitBytes': 8000000,
                 'previousProjectionBytes': 7966311, 'previousProjectionPredatesPlacementAndBannerRuntime': True,
                 'cumulativeAddedAsset6MbGate': 'Remeasure at integration'},
    'retainedFailedR1Evidence': retained,
    'trackedV4BytesBeforeReceipt': tracked_bytes,
    'fullAcceptance': False,
}
(OUT / targets[1]).write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps({'receipt': str((OUT / targets[1]).relative_to(ROOT)), 'lanePaths': len(files),
                  'actionSheets': len(films['sheets']), 'fullAcceptance': False}))
