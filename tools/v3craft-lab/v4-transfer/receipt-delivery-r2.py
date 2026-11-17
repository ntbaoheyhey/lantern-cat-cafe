"""Bind the completed A11 delivery review to its unchanged runtime and gate evidence."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[3]
REPORT = ROOT / 'reports/v4-art/REVIEW/A11/delivery-r1'
PREVIOUS = ROOT / 'reports/v4-art/REVIEW/A10/scene-ready-transfer'


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()


def write(name, data):
    (REPORT / name).write_text(json.dumps(data, indent=2) + '\n')


now = datetime.now(timezone.utc).isoformat()
source = read(REPORT / 'source-hashes.json')
pipeline = read(REPORT / 'capture-jobs.json')
films = read(REPORT / 'film-review.json')
capture = read(REPORT / 'film-capture-verification.json')
markers = read(REPORT / 'encoded-markers.json')
layout = read(REPORT / 'layout900.json')
visual = read(REPORT / 'layout900-review.json')
assert pipeline['complete'] and pipeline['pass'] and pipeline['runtimeUnchanged']
assert films['reviewComplete'] and len(films['sheets']) == films['reviewedCount'] == 84
assert all(x['reviewed'] and x['visualObservation'] for x in films['sheets'])
assert len(visual['sheets']) == 3 and visual['reviewComplete']
assert capture['pass'] and len(capture['rows']) == 3
assert len(markers) == 3 and all(x['pass'] and x['frames'] == x['valid'] == 900 for x in markers)
assert len(layout['results']) == 3
assert all(x['parity'] and not x['errors'] and not x['failures'] for x in layout['results'])

mismatches = [p for p, expected in source.items() if sha(ROOT / p) != expected]
assert not mismatches, mismatches
sheet_mismatches = [x['reviewPath'] for x in films['sheets'] if sha(ROOT / x['reviewPath']) != x['sha256']]
assert not sheet_mismatches, sheet_mismatches
assert all(sha(ROOT / x['path']) == x['sha256'] for x in visual['sheets'])
assert all(sha(ROOT / x['video']) == x['videoSha256'] for x in capture['rows'])
runtime_commit = git('rev-parse', 'ae96b7d85')
runtime_delta = git('diff', '--name-only', runtime_commit, 'HEAD', '--', 'apps/web/src', 'apps/web/public').splitlines()
assert not runtime_delta, runtime_delta

gates = []
for name in ['validation-pma-r2-regression.json', 'validation-pma-r2.json', 'parity-pma-r2.json']:
    path = PREVIOUS / name
    data = read(path)
    assert data['complete'] and data['pass']
    assert all(sha(ROOT / p) == expected for p, expected in data['runtimeHashes'].items())
    if name.startswith('parity'):
        assert len(data['rows']) == 3 and all(x['parity'] and x['baselineMatches'] and not x['errors'] for x in data['rows'])
        assert sha(ROOT / 'reports/v3-feel/parity-new.json') == data['baselineSha256']
    gates.append({'path': str(path.relative_to(ROOT)), 'sha256': sha(path), 'sourceCommit': data['sourceCommit'],
                  'pass': True, 'currentRuntimeHashesMatch': True})

old_audit = read(PREVIOUS / 'lane-audit-pma-r2.json')
rows = [line.split('\t') for line in git('diff', '--name-status', old_audit['baseline'], 'HEAD').splitlines()]
staged_rows = [line.split('\t') for line in git('diff', '--cached', '--name-status').splitlines()]
allowed = ('apps/web/public/units/', 'apps/web/public/vfx/', 'apps/web/src/game/cardrpg/battle-v3/',
           'apps/web/src/game/cardrpg/spine/', 'apps/web/src/game/cardrpg/stage/',
           'apps/web/src/game/cardrpg/vfx-craft/', 'apps/web/src/game/cardrpg/vfx-layered/',
           'apps/web/src/game/rig/', 'tools/v3craft-lab/', 'scripts/v3feel/', 'reports/v4-art/', 'reports/v3-feel/')
files = sorted({row[-1] for row in rows + staged_rows})
violations = [p for p in files if not p.startswith(allowed) or 'audio' in p.lower()
              or p.endswith(('.log', '.webm', '.mp4', '.DS_Store')) or '/raw/' in p or '/private/' in p]
original_changes = [p for p in files if p.startswith('assets/') or
                    (p.startswith(('apps/web/public/units/', 'apps/web/public/vfx/')) and '/sampled-delivery/' not in p)]
v3_changes = [row for row in rows + staged_rows if row[-1].startswith('reports/v3') and row[0] != 'A']
audit = {'at': now, 'baseline': old_audit['baseline'], 'head': git('rev-parse', 'HEAD'),
         'scope': 'Committed ART changes since contrast runtime plus explicitly staged checkpoint paths; inherited unstaged files excluded.',
         'pendingCheckpointPaths': [row[-1] for row in staged_rows],
         'count': len(files), 'files': files, 'violations': violations,
         'originalOrExactMapChanges': original_changes, 'v3NonAppendChanges': v3_changes,
         'pass': not (violations or original_changes or v3_changes)}
write('lane-audit.json', audit)
assert audit['pass'], audit

proofs = ['capture-jobs.json', 'source-hashes.json', 'film-capture-verification.json', 'encoded-markers.json',
          'film-review.json', 'layout900.json', 'layout900-review.json', 'lane-audit.json']
receipt = {
    'at': now, 'status': 'SCOPED_DELIVERY_REVIEW_COMPLETE; composition and integrated production acceptance OPEN',
    'runtimeCommit': runtime_commit, 'captureSourceCommit': pipeline['sourceCommit'],
    'receiptSourceCommit': git('rev-parse', 'HEAD'),
    'scriptSha256': sha(Path(__file__)),
    'runtime': {'verifiedHashes': len(source), 'mismatches': mismatches, 'changesSinceInstalledRuntime': runtime_delta},
    'proofs': [{'path': str((REPORT / p).relative_to(ROOT)), 'sha256': sha(REPORT / p)} for p in proofs],
    'reusedValidation': gates,
    'validationNote': 'No runtime changes since installed delivery; source-matched full web, focused tests, typecheck and explicit three-fixture parity remain applicable.',
    'films': [{'fixture': x['fixture'], 'videoSha256': x['videoSha256'], 'durationSeconds': x['containerDurationSeconds'],
               'encodedFrames': x['encodedFrames'], 'medianRenderFPS': x['medianRenderFPS'], 'recordedAudio': x['recordedAudio']}
              for x in capture['rows']],
    'visualReview': {'actionSheets': 84, 'ultimateSheets': sum(x['tier'] == 'ultimate' for x in films['sheets']),
                     'layout900Sheets': 3, 'layout900Samples': sum(x['frames'] for x in layout['results']),
                     'finding': 'No new delivery contour fault observed at the reviewed sheet scale.',
                     'scope': films['assessmentScope'],
                     'truncatedWindows': [{'fixture': x['fixture'], 'index': x['index'], 'actor': x['actor'],
                                           'skill': x['skill'], 'observation': x['visualObservation']}
                                          for x in films['sheets'] if x['boundaryTruncated']]},
    'open': ['Upper-stage counter/focus clipping and HUD overlap; private placement candidate not installed.',
             'Panko banner/portrait contact, Soot number crowding and Yarn low-banner proximity.',
             '900p wave1 orange-glow attribution; reduced-motion film and strict continuous-shake proof.',
             'Fresh sheets do not establish pose, timing, effect area, face coverage, text-legibility or audio-quality acceptance.',
             'Fallback exact 3/6 only; animated-intro attribution for remaining differences is an inference.',
             'Authoring/measurement time split, final classes and sole-baseline adoption remain open.'],
    'addedFirstBattle6MbGate': {'accepted': False, 'note': 'Earlier authored-asset upper bound predates sampled delivery; current cumulative bytes have not been remeasured.'},
    'transfer': {'projectionBytes': 7966311, 'mappingReserveBytes': 16384, 'limitBytes': 8000000,
                 'projectionIsIntegratedMeasurement': False, 'boundShipBytes': [27546250, 27546252],
                 'boundShipSource': 'e9af6a933', 'productionTransferAcceptance': False,
                 'note': 'Ten integrated production journeys after delivery installation are still required.'},
    'fullAcceptance': False,
}
write('acceptance-receipt.json', receipt)
print(json.dumps({'status': receipt['status'], 'runtimeHashes': len(source), 'actionSheets': 84,
                  'layout900Sheets': 3, 'lanePaths': len(files), 'lanePass': audit['pass']}))
