"""Read-only receipt audit for T001 retry; does not execute source test suites."""
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
CURRENT = ROOT / 'reports/cards/T014-CURRENT-MAIN-LIVE'
ORIGINAL = ROOT / 'reports/cards/BASE0-POSTMERGE/74d60da'
HEAD = '9c457a3e56b7c5813fa40e6aa20b0c14242ef26a'
CHECKPOINT = '4b895739a69cca13b9e331d224e5e834cf8bf39d'
BASE_CHECKPOINT = '89664d7057df9a3f6720162538014d4da3e70e1a'
VERIFIER_REPO = Path('/Users/bao/.codex/handoffs/taskbar-hero/reliability/base0-pr246-cli-mBQnzqAR/verify-pr-246')

def read(path):
    return json.loads(path.read_text())

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(*args, repo=ROOT):
    return subprocess.check_output(['git', *args], cwd=repo).decode().strip()

manifest = read(CURRENT / 'manifest.json')
for item in manifest['files']:
    path = CURRENT / item['path']
    data = path.read_bytes()
    assert len(data) == item['bytes'] and sha(data) == item['sha256'], item['path']
    committed = subprocess.check_output(['git', 'show', f'{CHECKPOINT}:{path.relative_to(ROOT)}'], cwd=ROOT)
    assert committed == data, item['path']
print(f'PASS current T014 manifest and checkpoint bytes: {len(manifest["files"])} files')

historical = []
for prefix in ['cli-forge-fixed', 'cli-20261102', 'live-phased-cli']:
    paths = git('ls-tree', '-r', '--name-only', BASE_CHECKPOINT, '--', str((ORIGINAL / prefix).relative_to(ROOT))).splitlines()
    for path in paths:
        data = (ROOT / path).read_bytes()
        prior = subprocess.check_output(['git', 'show', f'{BASE_CHECKPOINT}:{path}'], cwd=ROOT)
        assert data == prior, path
        historical.append({'path': path, 'sha256': sha(data)})
assert len(historical) >= 57
print(f'PASS historical BASE0 checkpoint bytes: {len(historical)} files')

verifier = read(ORIGINAL / 'cli-forge-fixed/reconciled-result.json')
for name, head in verifier['heads'].items():
    repo = VERIFIER_REPO if name == 'TESTED_HEAD' else ROOT
    assert git('cat-file', '-t', head, repo=repo) == 'commit', name
    print(f'{name}={head}')
trees = {name: git('rev-parse', f'{head}^{{tree}}', repo=VERIFIER_REPO if name == 'TESTED_HEAD' else ROOT) for name, head in verifier['heads'].items() if name != 'VERIFIER_HEAD'}
assert len(set(trees.values())) == 1 and trees == verifier['trees']
assert verifier['verifierExit'] == 0
raw = (ORIGINAL / 'cli-forge-fixed/logs/verifier-raw.log').read_text()
for head in verifier['heads'].values():
    assert head in raw, 'Recorded verifier head missing from raw log'
print('PASS original verifier exit=0; all four heads exist; PR/base/tested trees equal')

target = read(CURRENT / 'release-target.json')
assert target['approvedReleaseTarget'] == HEAD and target['task']['source'] == 'corrective-of-T001'
remote = git('ls-remote', 'origin', 'refs/heads/main', 'refs/heads/ai/codex-mega-ledger')
assert f'{HEAD}\trefs/heads/main' in remote
assert git('rev-parse', f'{HEAD}^{{tree}}') == target['tree']
git('merge-base', '--is-ancestor', CHECKPOINT, 'HEAD')
git('merge-base', '--is-ancestor', verifier['main'], HEAD)
print(f'PASS approved current target and remote main: {HEAD}')

for filename in ['artifact-before.json', 'artifact-after.json']:
    artifact = read(CURRENT / filename)
    assert artifact['expectedHead'] == HEAD and artifact['status'] == 'ARTIFACT_MATCH'
    assert artifact['testedTree'] == target['tree'] and artifact['entryManifestStable']
    assert len(artifact['assets']) == 32
    for asset in artifact['assets']:
        assert asset['status'] == 200 and asset['localBytes'] == asset['liveBytes']
        assert asset['localSha256'] == asset['liveSha256']
window = read(CURRENT / 'stable-window.json')
assert window['status'] == 'PASS' and window['sameManifestAndAllAssetHashes']
assert window['liveJourneysWithinWindow'] and window['seconds'] >= 334
print('PASS adopted exact-main production builds: 32/32 files twice, stable 334.824-second window')

gates = ['typecheck', 'lint', 'unit', 'build', 'browser-1280', 'browser-1600', 'forge', 'legacy-check-live', 'live-phased-r2']
for gate in gates:
    assert (CURRENT / f'logs/{gate}.exit').read_text().strip() == '0', gate
assert (CURRENT / 'logs/deno-drift.exit').read_text().strip() == 'generator=0 drift=0'
legacy = (CURRENT / 'logs/legacy-check-live.log').read_text()
assert 'ALL CHECKS PASSED' in legacy
summary = read(CURRENT / 'live-phased-r2/summary.json')
assert summary['status'] == 'PASS' and summary['source']['head'] == HEAD
viewports = []
for result in summary['results']:
    viewport = result['viewport']
    viewports.append(f'{viewport["width"]}x{viewport["height"]}')
    assert result['source']['head'] == HEAD and result['deployment']['head'] == HEAD
    assert result['fullNineStagePass'] is False
    assert len(result['steps']) == 8 and all(step['status'] == 'PASS' for step in result['steps'])
assert sorted(viewports) == ['1280x720', '1600x900']
print('PASS adopted legacy live and eight-stage phased path at 1280x720 and 1600x900')

failures = read(CURRENT / 'historical-failures/manifest.json')
for item in failures:
    assert sha((CURRENT / 'historical-failures' / item['retainedPath']).read_bytes()) == item['sha256']
timeout_log = CURRENT / 'historical-failures/T001-independent/logs/test.log'
assert 'StageLayout.test.tsx:175' in timeout_log.read_text()
assert (CURRENT / 'historical-failures/T001-independent/logs/test.exit').read_text().strip() != '0'
assert (CURRENT / 'historical-failures/T001-independent/logs/test-repeat.exit').read_text().strip() == '0'
assert (CURRENT / 'logs/live-phased.exit').read_text().strip() == '1'
print('PASS historical asset mismatch, unit timeout/passing rerun, and first T014 journey failure retained')

output = {
    'status': 'PASS', 'observedAt': datetime.now(timezone.utc).isoformat(),
    'scope': 'T001 STEP 1 a-d only; T014 corrective target adopted; no source suites rerun',
    'historicalBASE0': verifier['main'], 'historicalCheckpoint': BASE_CHECKPOINT,
    'verifierHeads': verifier['heads'], 'historicalTrees': trees, 'testedHeadObjectStore': str(VERIFIER_REPO),
    'historicalReceipts': historical, 'adoptedCurrentCheckpoint': CHECKPOINT,
    'currentTargetAuthority': '../T014-CURRENT-MAIN-LIVE/release-target.json',
    'currentMain': HEAD, 'currentTree': target['tree'], 'remoteRefs': remote.splitlines(),
    'currentReceiptFilesVerified': len(manifest['files']),
    'currentBuildComparisons': ['../T014-CURRENT-MAIN-LIVE/artifact-before.json', '../T014-CURRENT-MAIN-LIVE/artifact-after.json'],
    'currentLegacyLiveExit': 0, 'currentPhasedViewports': viewports,
    'historicalFailuresRetained': len(failures), 'newSuitesRun': [],
    'currentLiveEqualsHistoricalBASE0': False,
    'reliabilityLimit': 'Historical isolated StageLayout timeout under concurrent build load; unchanged isolated and full reruns passed. No unconditional first-run reliability claim; no reproducible product defect established.',
}
(HERE / 'receipt-audit.json').write_text(json.dumps(output, indent=2) + '\n')
