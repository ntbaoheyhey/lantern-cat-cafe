"""Verify depth delivery against frozen source, raw measurements and hashed receipts."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys

root = Path(__file__).resolve().parents[2]
report = root / 'reports/cardrpg-depth'
manifest_path = report / 'validation/delivery-manifest.json'


def read(path):
    return json.loads((root / path).read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


build = read('docs/cardrpg2/build.json')
artifact = root / 'docs/cardrpg2/index.html'
artifact_hash = digest(artifact)
assert artifact_hash == build['sha256'] and artifact.stat().st_size == build['bytes']
assert build['runtimeDirty'] is False, 'Build requires committed runtime and validation sources'
assert not subprocess.check_output(['git', 'diff', build['head'], '--', *build['sourceRoots']], cwd=root)
for path, expected in build['sourceHashes'].items():
    assert digest(root / path) == expected, path

checks = ['path/check.json', 'performance/measurement.json', 'performance-retina/measurement.json']
for name in checks:
    data = read('reports/cardrpg-depth/' + name)
    assert data['artifactSha256'] == artifact_hash, name
    for field in ['errors', 'warnings', 'requests', 'writes']:
        assert not data.get(field), (name, field, data.get(field))

path = read('reports/cardrpg-depth/path/check.json')
assert {(r['width'], r['height']) for r in path['rows']} == {(1024, 600), (1280, 720), (1440, 900)}
expected_screens = {'hub', 'tutorial', 'invite', 'save', 'team', 'map', 'battle', 'event',
                    'rewards', 'equipment', 'collection', 'keywords', 'enemies', 'relics', 'census'}
for row in path['rows']:
    assert {screen['name'] for screen in row['screens']} == expected_screens
    assert row['encounters'] == 3 and row['events'] == 1
    for screen in row['screens']:
        layout = screen['layout']
        assert layout['document'] == layout['viewport']
        assert not layout['horizontalOverflow'] and not layout['clippedControls']
        assert not screen['contrast']['failures'], screen['contrast']['failures']
        assert screen['contrast']['checked'] > 0

for name, ratio in [('performance', 1), ('performance-retina', 2)]:
    rows = read(f'reports/cardrpg-depth/{name}/measurement.json')['rows']
    assert len(rows) == 9
    assert {(r['width'], r['chapter']) for r in rows} == {(w, c) for w in [1024, 1280, 1440] for c in [1, 2, 3]}
    for row in rows:
        assert row['dpr'] == ratio and row['won'] and row['nodes'] == 7 and row['battles'] == 3
        assert 'Metal' in row['renderer'] and row['rendererRetained']
        assert row['contexts'] == row['released'] == 1 and len(row['buffers']) == 1
        assert not row['long']
        frames = sorted(row['frames'])
        assert frames
        for field, percentile, ceiling in [('p95', .95, 16.81), ('p99', .99, 33.31)]:
            assert abs(row[field] - frames[int(len(frames) * percentile)]) < .000001
            assert row[field] <= ceiling, (name, row['width'], row['chapter'], field, row[field])

isolation = read('reports/cardrpg-depth/isolation/check.json')
assert len(isolation['rows']) == 3 and not isolation['errors']
for row in isolation['rows']:
    assert row['pixelIdentical']
    assert (report / f"isolation/{row['width']}-before.png").read_bytes() == (report / f"isolation/{row['width']}-after.png").read_bytes()
app = read('reports/cardrpg-depth/browser/app-check.json')
assert not app['errors'] and len(app['results']) >= 3 and all(row['pass'] for row in app['results'])
safety = read('reports/cardrpg-depth/validation/safety.json')
assert not safety['outside'] and not safety['schedulerHits'] and not safety['mismatches']
assert safety['dependencyFilesUnchanged']
for row in safety['hashes']:
    assert digest(root / row['path']) == row['sha256']

commands = read('reports/cardrpg-depth/validation/delivery-results.json')
required = {'tests', 'typecheck', 'lint', 'build', 'contracts', 'e2e', 'combat-final', 'combat-heldout',
            'roster-broad', 'economy-final', 'app-check', 'path-check', 'isolation', 'performance', 'performance-retina', 'safety'}
assert {row['name'] for row in commands} == required and len(commands) == len(required)
for row in commands:
    assert row['exit'] == 0 and row['source'] == build['head'], row
    assert digest(root / row['log']) == row['sha256'], row['name']

for sample in ['combat-final', 'combat-heldout']:
    combat = read(f'reports/cardrpg-depth/sim/{sample}.json')
    assert len(combat['rows']) == 12 and combat['count'] == 150
    for chapter in [1, 2, 3]:
        policies = {r['policy']: r for r in combat['rows'] if r['chapter'] == chapter}
        for row in policies.values():
            assert len(row['runs']) == row['count']
            assert sum(run['won'] for run in row['runs']) == row['wins']
        if chapter >= 2:
            assert policies['smart']['winRate'] >= policies['auto']['winRate'] + .15
roster = read('reports/cardrpg-depth/sim/roster-broad.json')
assert len(roster['rows']) == 5280 and len(roster['cats']) == 12
assert len({tuple(sorted(row['team'])) for row in roster['rows']}) == 220
assert all(cat['runs'] == 1320 for cat in roster['cats'])
economy = read('reports/cardrpg-depth/sim/economy-45.json')
assert len(economy['accounts']) == 90 and all(len(a['days']) == 45 for a in economy['accounts'])
assert all(all(value <= 3 for value in week['heavyCasual'].values()) for week in economy['weekly'])
assert next(s for s in economy['summary'] if s['style'] == 'regular')['saturatedBy45'] == 0

if '--write-manifest' in sys.argv:
    paths = sorted(p for directory in [root / 'docs/cardrpg2', report]
                   for p in directory.rglob('*') if p.is_file() and p != manifest_path)
    files = [dict(path=str(p.relative_to(root)), bytes=p.stat().st_size, sha256=digest(p)) for p in paths]
    manifest_path.write_text(json.dumps(dict(source=build['head'], artifactSha256=artifact_hash, files=files), indent=2) + '\n')
manifest = json.loads(manifest_path.read_text())
for row in manifest['files']:
    path = root / row['path']
    assert path.stat().st_size == row['bytes'] and digest(path) == row['sha256'], row['path']
print(json.dumps(dict(source=build['head'], artifactSha256=artifact_hash, commandReceipts=len(commands),
    sourceFiles=len(build['sourceHashes']), manifestFiles=len(manifest['files']),
    naturalRuns=18, functionalEvidence='verified',
    status='PARTIAL — build balance, live integration and self-review thresholds remain disclosed'), indent=2))
