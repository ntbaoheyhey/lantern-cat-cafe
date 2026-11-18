"""Audit completed native-cat evidence without displaying or resetting any image."""
from pathlib import Path
import datetime, hashlib, json, subprocess, urllib.request

ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / 'reports/v5/CXV'
CATS = ['sorrel', 'biscuit', 'inkcap', 'cinnamon', 'brioche', 'velvet', 'marigold']
RUNTIME = 'a3173c08e'
EMPTY_SHA = hashlib.sha256(b'').hexdigest()

def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT).decode().strip()

assert not git('diff', RUNTIME, '--', 'apps/web'), 'Current app differs from tested profiles'
live_html = urllib.request.urlopen('http://127.0.0.1:6310/', timeout=10).read()
live_sha = hashlib.sha256(live_html).hexdigest()
rows = []
for cat in CATS:
    path = REPORTS / f'M-{cat}-native-R1.json'
    report = json.loads(path.read_text())
    review = report['visualReview']
    comparison = review['comparison']
    assert report['cat'] == cat and report['pass'] and not report['errors']
    assert report['viewport'] == {'width': 1280, 'height': 720}
    assert report['runtimePatchSha256'] == EMPTY_SHA and not report['runtimeUntrackedSha256']
    assert not git('diff', RUNTIME, report['sourceCommit'], '--', 'apps/web')
    assert report['artifactSha256'] == live_sha
    assert digest(review['captureReport']) == review['captureReportSha256']
    assert digest(comparison['captureReport']) == comparison['captureReportSha256']
    assert digest(comparison['video']) == comparison['sha256']
    assert comparison['dimensions'] == [1280, 720] and comparison['frames'] == 300
    assert comparison['fps'] == 30 and comparison['durationSeconds'] == 10
    assert len(review['images']) == 4
    for image in review['images']:
        assert image['reviewed'] and image['views'] == 1 and max(image['dimensions']) <= 1024
        assert digest(image['path']) == image['sha256']
    for mode in report['modes']:
        assert mode['maxFootWorldDelta'] == mode['seamMeshDelta'] == mode['seamRootDelta'] == 0
        assert all(boundary['maxDelta'] == 0 for boundary in mode['boundaries'])
    assert len(report['sootParity']) == 2 and all(row['exact'] for row in report['sootParity'])
    assert report['cast']['exactHit'] == {'ms': 350, 'pose': 'skill', 'at': .55}
    assert report['cast']['pass']
    mesh = max(row['maxMeshDelta'] for row in report['cast']['handoffs'])
    root = max(row['maxRootDelta'] for row in report['cast']['handoffs'])
    assert mesh < .001 and root < .001
    minimum = min(row['minTriangleRatio'] for row in report['geometry'])
    assert minimum >= .55
    rows.append({'cat': cat, 'report': str(path), 'reportSha256': digest(path),
                 'sourceCommit': report['sourceCommit'], 'captureUTC': report['utc'],
                 'reviewedUTC': review['images'][0]['reviewedUTC'], 'url': report['url'],
                 'headRangePercentH': review['rangesPercentH']['head'],
                 'footDrift': 0, 'loopSeam': 0, 'castHit': report['cast']['exactHit'],
                 'maxHandoffMesh': mesh, 'maxHandoffRoot': root, 'minTriangleRatio': minimum,
                 'film': comparison['video'], 'filmSha256': comparison['sha256'],
                 'reviewedImages': 4, 'sootParity': report['sootParity'],
                 'limitations': review['assessment']['limits']})

baseline_ref = json.loads((REPORTS / 'M-soot-baseline.json').read_text())
assert digest(baseline_ref['fullManifest']) == baseline_ref['manifestSha256']
baseline = json.loads(Path(baseline_ref['fullManifest']).read_text())
expected = {row['path'] for row in baseline['sootPaths']}
current = {path for path in git('ls-files').splitlines() if 'soot' in path.lower()}
audit_reports = {'reports/v5/CXV/M-soot-baseline.json', 'reports/v5/CXV/M-soot-verification.json'}
assert current - audit_reports == expected
named_app_diff = [path for path in git('diff', '--name-only', baseline['baseCommit'], '--', 'apps/web').splitlines() if 'soot' in path.lower()]
assert not named_app_diff
changed = [row['path'] for row in baseline['sootPaths'] if digest(ROOT / row['path']) != row['sha256']]
assert not changed
arrival = digest(ROOT / 'tools/v5vfx/capture-arrival.mjs')
assert arrival == baseline['captureArrivalSha256']
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
verification = {'utc': now, 'baseCommit': baseline['baseCommit'], 'verifiedPaths': len(expected),
                'changedSootPaths': changed, 'namedSootAppDiff': named_app_diff, 'captureArrivalSha256': arrival,
                'excludedAuditReports': sorted(audit_reports),
                'sharedBehavior': 'All seven actual-scene captures: Soot301 samples/11 mesh snapshots exactly match baseline in both modes.'}
(REPORTS / 'M-soot-verification.json').write_text(json.dumps(verification, indent=2) + '\n')
files = ['apps/web/src/game/rig/native-living.ts', 'apps/web/src/game/rig/cutout.ts',
         'apps/web/src/game/rig/native-living.test.ts', 'apps/web/src/game/cardrpg/spine/scene.ts']
packet = {'utc': now, 'status': 'READY for scoped integration; integrated judge and performance acceptance pending',
          'runtimeEquivalentTo': RUNTIME, 'appDiffEmpty': True, 'liveArtifactSha256': live_sha,
          'runtimeFileSha256': {path: digest(ROOT / path) for path in files},
          'dependency': 'After existing Mallow4ec917401+c7d3cf13a: apply only a3173c08e hunks in rig/native-living.ts, rig/cutout.ts and rig/native-living.test.ts. Never apply reverted Panko d419002a4.',
          'priorChecks': {'focusedTests': 60, 'files': 4, 'typecheckExit': 0,
                          'reuse': 'Application sources unchanged from a3173c08e; existing checks reused, not rerun.',
                          'logs': ['work/v5/CXV/jobs/m-native-eight-tests-r2.log', 'work/v5/CXV/jobs/m-native-eight-typecheck-r2.log']},
          'soot': verification, 'cats': rows,
          'limits': 'Seven deterministic experimental6310 captures at1280x720. Films generated and stream/hash verified; four fresh static images per cat reviewed once. No claim of continuously watched films, integrated6301 approval or laptop performance. Mochi/Clover media acceptance remains open.'}
out = REPORTS / 'M-native-seven-READY.json'
out.write_text(json.dumps(packet, indent=2) + '\n')
print(json.dumps({'cats': len(rows), 'imagesReviewedOnce': sum(row['reviewedImages'] for row in rows),
                  'filmsVerified': len(rows), 'sootPathsUnchanged': len(expected),
                  'minTriangleRatio': min(row['minTriangleRatio'] for row in rows),
                  'runtimeEquivalentTo': RUNTIME, 'reportBytes': out.stat().st_size}))
