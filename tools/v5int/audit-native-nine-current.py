"""Hash and rule-parity audit of CXV's six native natural-play receipts; no image review."""
from pathlib import Path
import datetime
import hashlib
import json
import struct

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path('/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-native-nine-current-R1.json')
checked = {}

def verify(ref):
    path = Path(ref['path'])
    data = path.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    assert digest == ref['sha256'], path
    checked[str(path)] = digest
    return json.loads(data) if path.suffix == '.json' else data

delivery = verify({'path': str(SOURCE), 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest()})
rows = []
covered = set()
capture_count = 0
source = '0b669ecc7cf802cccdbae4a740431c3546e998e4'
index = '3e7d27a1321983ef655f4dfe5b3f4113e68736034e6d7b332aaa7e6bf086e8ae'
for group in delivery['groups']:
    assert group['source'] == source and group['indexSha256'] == index
    assert group['viewport'] == {'width': 1280, 'height': 720}
    raw = verify(group['raw'])
    assert raw['servedSource'] == source and raw['indexSha256'] == index
    assert not raw['errors'] and len(raw['runs']) == 2
    assert {run['mode'] for run in raw['runs']} == {'normal', 'reduced'}
    timelines = []
    for run, receipt in zip(raw['runs'], group['runs']):
        assert run['mode'] == receipt['mode']
        assert not run['errors'] and not run['blockedRequests'] and run['reachedResult']
        assert run['speed'] == 1 and run['final']['result'] == receipt['result'] == 'party'
        assert run['actions'] == receipt['actions']
        assert run['identity'] == run['identityAfter']
        timeline = verify(receipt['timeline'])
        assert timeline['mediaAudit'] is None
        assert len(timeline['log']) == run['logEvents']
        timelines.append(timeline)
        ultimates = [plan for plan in timeline['plans'] if plan['ultimate']]
        assert len(ultimates) == len(run['ultimates'])
        covered.update(plan['actorId'] for plan in ultimates if plan['actorId'] in group['roster'])
        rows.append({'group': group['group'], 'mode': run['mode'], 'result': 'party',
                     'actions': run['actions'], 'ultimates': len(ultimates),
                     'errors': 0, 'blockedRequests': 0})
    a, b = raw['runs']
    assert a['initialBattleSha256'] == b['initialBattleSha256']
    assert a['final']['actors'] == b['final']['actors']
    assert timelines[0]['log'] == timelines[1]['log']
    normalize = lambda plans: [{k:v for k,v in plan.items() if k != 'wallMs'} for plan in plans]
    assert normalize(timelines[0]['plans']) == normalize(timelines[1]['plans'])
    for capture in group['captures']:
        data = verify(capture)
        assert data[:8] == b'\x89PNG\r\n\x1a\n'
        assert list(struct.unpack('>II', data[16:24])) == capture['dimensions'] == [1280, 720]
        assert len(data) == capture['bytes']
        capture_count += 1
for ref in delivery['harnessProvenance']:
    verify(ref)
    verify(ref['artifactVerification'])
verify(delivery['protectedPaths'])
assert sorted(covered) == delivery['coveredCats'] and len(covered) == 9
assert len(rows) == 6 and sum(row['actions'] for row in rows) == 270
report = {'utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'delivery': {'path': str(SOURCE), 'sha256': checked[str(SOURCE)]},
          'harness': {'path': str(Path(__file__).resolve()), 'sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()},
          'sourceCommit': source, 'indexSha256': index, 'verifiedArtifacts': len(checked),
          'artifactHashes': checked, 'capturesRehashed': capture_count, 'imagesViewed': 0,
          'runs': rows, 'coveredCats': sorted(covered), 'ruleAndPresentationParity': True,
          'decision': 'ACCEPT numeric natural-play parity and artifact provenance within the recorded R1 build.',
          'limits': ['Lane visual judgements are not independently adopted.',
                     'Timing summaries are not recalculated or treated as normal-laptop proof.',
                     'R2 uses a new loader and requires its own fresh browser gates.',
                     'No Mochi/Clover media or release acceptance.']}
out = ROOT/'reports/v5/CXI/evidence/v8-native-nine-current-review.json'
out.write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({'out': str(out), 'artifacts': len(checked), 'captures': capture_count,
                  'runs': len(rows), 'actions': 270, 'nativeCats': len(covered)}))
