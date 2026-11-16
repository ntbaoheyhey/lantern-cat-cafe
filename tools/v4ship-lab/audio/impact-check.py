"""Bind fresh contact observations to immutable inputs without widening acceptance."""
from collections import Counter
from pathlib import Path
import datetime, gzip, hashlib, json, re, subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-ship/S11/impact-check-1.json'
assert not out.exists(), 'Preserve earlier evidence'
assert not (root / 'STOP-V4SHIP').exists()

def reference(name):
    data = (root / name).read_bytes()
    return {'path': name, 'sha256': hashlib.sha256(data).hexdigest()}

def read(name):
    return json.loads((root / name).read_text())

journeys = []
for attempt, width in [(1, 1280), (2, 1440)]:
    name = f'reports/v4-ship/S11/impact-journey-{attempt}.json'
    j = read(name)
    assert j['viewport']['width'] == width and j['rollback'] and j['journeyPass']
    assert reference(j['events']['path'])['sha256'] == j['events']['sha256']
    assert all(reference(r['path'])['sha256'] == r['sha256'] for r in j['harness'])
    impact, audio = j['impact'], j['audio']
    estimates = [r['estimatedAudioAfterSubmissionMs'] for r in impact['rows'] if r['estimatedAudioAfterSubmissionMs'] is not None]
    healer = [r for r in impact['rows'] if r['owner'] == 'clover']
    controls = [r for c in audio['controls'] for r in c['requests']]
    receipts = [r for c in audio['receipts'] for r in c['requests']]
    journeys.append({
        'evidence': reference(name), 'events': j['events'], 'viewport': j['viewport'],
        'sourceCommit': j['sourceCommit'], 'journeyPass': j['journeyPass'], 'rollback': j['rollback'],
        'receiptsVerified': j['receiptVerification']['receiptCount'],
        'controls': len(audio['controls']), 'controlsPass': audio['primaryControlsPass'],
        'receiptChimesPass': audio['everyReceiptChimePass'],
        'maxStartsPer100ms': audio['maxStartsPer100ms'], 'sourceBudgetPass': audio['sourceBudgetPass'],
        'controlMaxEstimatedOnsetMs': max(r['estimatedOnsetMs'] for r in controls if r['estimatedOnsetMs'] is not None),
        'receiptMaxEstimatedOnsetMs': max(r['estimatedOnsetMs'] for r in receipts if r['estimatedOnsetMs'] is not None),
        'receiptMaxDurationMs': max(r['durationMs'] for r in receipts),
        'scenes': impact['scenes'], 'expectedContacts': impact['expectedContacts'],
        'causallyPlayedContacts': impact['causallyPlayedContacts'],
        'failedContacts': impact['failedContacts'], 'unattributedImpactEvents': impact['unattributedImpactEvents'],
        'coverageByOwner': dict(Counter(r['owner'] for r in impact['rows'])),
        'observedContactCoveragePass': impact['observedImpactCoveragePass'],
        'estimatedOnsetMaxMs': max(estimates),
        'estimatedOver33ms': sum(r['within33msEstimate'] is False for r in impact['rows']),
        'estimatedUnavailable': sum(r['within33msEstimate'] is None for r in impact['rows']),
        'healerImpactCues': dict(Counter(c for r in healer for c in r['cues'])),
        'healerBasicImpactCues': dict(Counter(c for r in healer if not r['ultimate'] for c in r['cues'])),
    })

logs = []
for label in ['evidence-refresh-regression-1', 'impact-regression-1']:
    name = f'reports/v4-ship/S11/{label}/log.jsonl.gz'
    rows = [json.loads(line) for line in gzip.decompress((root / name).read_bytes()).decode().splitlines()]
    text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
    logs.append({**reference(name), 'failures': [s.strip().removeprefix('FAIL  ') for s in text.splitlines() if ' FAIL ' in s],
                 'counts': [s.strip() for s in text.splitlines() if re.match(r'\s*(Test Files|Tests)\s', s)]})
assert len(logs[0]['failures']) == 7 and logs[0]['failures'] == logs[1]['failures']
reg = read('reports/v4-ship/S11/impact-regression-1/check.json')
assert reg['complete'] and all(r['exitCode'] == (1 if r['name'] == 'web' else 0) for r in reg['rows'])
observer = read('reports/v4-ship/S11/impact-observer-check-2.json')
assert len(observer['rows']) == 6 and all(r['pass'] for r in observer['rows'])
manifest = read('apps/web/public/audio/manifest.json')
garden = manifest['designs']['kit.garden.impact']
heal = manifest['designs']['heal.medium']
assert any('impactWood' in v['variantId'] for l in garden['layers'] for v in l['variants'])
assert not any('impact-sounds' in v['variantId'] for l in heal['layers'] for v in l['variants'])
runtime = ['apps/web/src', 'apps/web/public', 'packages/game-rules/src', 'supabase/functions']
assert not subprocess.check_output(['git', 'diff', '--name-only', journeys[0]['sourceCommit'], '--', *runtime], cwd=root)
report = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Two complete production12 journeys. Observed submitted-contact-to-source-start attribution only; no global weapon or physical acceptance.',
    'learn': 'reports/v4-ship/LEARN/S11-impact-coverage.md', 'journeys': journeys,
    'observerCheck': reference('reports/v4-ship/S11/impact-observer-check-2.json'),
    'comparison': reference('reports/v4-ship/S11/impact-method-comparison-1.json'),
    'failedObserverPreserved': reference('reports/v4-ship/S11/impact-observer-1.harness.mjs.gz'),
    'semanticIssue': {
        'requirement': {'path': 'reports/v4-ship/REQUEST-SHIP.txt', 'lines': [138, 157]},
        'timeline': reference('apps/web/src/game/cardrpg/battle-v3/audio-timeline.ts'),
        'manifest': reference('apps/web/public/audio/manifest.json'),
        'finding': 'Fixed timing selects whoosh and elemental impact by owner role, including healer Clover. The garden impact design contains wood-impact layers. Ranged basics also lack a distinct travel event.',
        'resolutionEvidence': 'heal.medium is present through designs/bindings, with maximize and click/tick samples; lack of a direct cues entry does not imply a missing cue. Garden and ember designs differ despite identical fallback slices.',
        'next': 'Compare class-aware routing and resolved samples before implementing SHIP-owned audio changes. Preserve visual/combat clocks and all gates.'
    },
    'regression': {'check': reference('reports/v4-ship/S11/impact-regression-1/check.json'), 'logs': logs, 'sameSevenArtFailures': True, 'gRegPass': False, 'officialClassParityPass': False},
    'runtimeChanged': False, 'completeWeaponCoveragePass': False,
    'physicalAudiovisualOnsetVerified': False, 'humanListeningVerified': False, 'overallAudioGatePass': False,
}
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'output': str(out.relative_to(root)), 'journeys': [{k: j[k] for k in ['viewport', 'causallyPlayedContacts', 'estimatedOnsetMaxMs', 'estimatedOver33ms', 'healerBasicImpactCues']} for j in journeys]}))
