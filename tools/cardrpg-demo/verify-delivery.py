"""Verify the packaged artifact, evidence identity and recorded functional gates.

This verifies existing observations; it does not rerun browser tests. Performance
percentile misses and subjective art limitations remain explicit PARTIAL results.
Use --write-manifest only after capture and report files have stopped changing.
"""
from pathlib import Path
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[2]
report = root / 'reports/cardrpg'
manifest_path = report / 'validation/delivery-manifest.json'

def read(path):
    return json.loads((root / path).read_text())

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

build = read('docs/cardrpg/build.json')
artifact_hash = digest(root / 'docs/cardrpg/index.html')
assert artifact_hash == build['sha256']
assert (root / 'docs/cardrpg/index.html').stat().st_size == build['bytes']
assert build['dirty'] is False and build['rulesOverride'] is None
for path, expected in build['sourceHashes'].items():
    assert digest(root / path) == expected, path

checks = [
    'offline-path/check.json', 'offline-commands/check.json', 'fallback/check.json',
    'meta/checks.json', 'layout-delivery/checks.json', 'art/effect-captures.json',
    'performance-delivery/performance-metal.json', 'performance-delivery/transitions.json',
    'performance-software-delivery/performance-software.json',
    'performance-retina-delivery/performance-metal.json',
    'lifecycle-delivery/measurement.json', 'lifecycle-retina-delivery/measurement.json', 'preview-lifetime/check.json',
]
for name in checks:
    data = read('reports/cardrpg/' + name)
    assert data['artifactSha256'] == artifact_hash, name
    for key in ['errors', 'warnings', 'requests', 'writes']:
        assert not data.get(key), (name, key, data.get(key))

commands = read('reports/cardrpg/validation/delivery-results.json')
assert len(commands) >= 23
assert all(row['exit'] == 0 and row['source'] == build['head'] for row in commands)
casts = read('reports/cardrpg/performance-delivery/performance-metal.json')['rows']
assert len(casts) == 258 and all(not row['longTasks'] for row in casts)
retina = read('reports/cardrpg/performance-retina-delivery/performance-metal.json')['rows']
assert len(retina) == 258 and all(not row['longTasks'] for row in retina)
retina_life = read('reports/cardrpg/lifecycle-retina-delivery/measurement.json')['rows']
assert len(retina_life) == 1 and retina_life[0]['pixelRatio'] == 2
assert not retina_life[0]['long'] and retina_life[0]['result']['winner'] == 'party'
transitions = read('reports/cardrpg/performance-delivery/transitions.json')['rows']
assert len(transitions) == 9 and all(not row['longTasks'] for row in transitions)
life = read('reports/cardrpg/lifecycle-delivery/measurement.json')['rows']
assert len(life) == 3
for row in life:
    assert not row['long'] and row['rendererRetained']
    assert row['contexts'] == row['contextsAtStart'] == 5
    assert row['result']['winner'] == 'party'
    assert len([m for m in row['marks'] if m['event'] == 'rest']) == 3
assert all(row['live'] == 0 for row in read('reports/cardrpg/preview-lifetime/check.json')['rows'])
assert all(row['differingPixels'] == 0 for row in read('reports/cardrpg/isolation/pixels.json'))
art = read('reports/cardrpg/art/effect-captures.json')
assert art['frames'] == 215 and art['recipes'] == 43 and not art['missing']
for line in (report / 'art/effect-captures.jsonl').read_text().splitlines():
    row = json.loads(line)
    assert row['recipe'] == row['id']
    assert digest(root / row['file']) == row['sha256']
signature = read('reports/cardrpg/art/distinctness-signatures.json')
assert signature['threshold'] == 64 and signature['pairsBelow'] == 0
assert not read('reports/cardrpg/validation/round-audit.json')['matches']
safety = read('reports/cardrpg/validation/safety-delivery.json')
assert not safety['aSourceDifferences'] and not safety['forbiddenSourceChanges']
assert safety['noNewRuntimeDependencies']

if '--write-manifest' in sys.argv:
    paths = sorted(p for directory in [root / 'docs/cardrpg', report]
                   for p in directory.rglob('*') if p.is_file() and p != manifest_path)
    records = [dict(path=str(p.relative_to(root)), bytes=p.stat().st_size, sha256=digest(p)) for p in paths]
    manifest_path.write_text(json.dumps(dict(runtimeSource=build['head'], artifactSha256=artifact_hash,
        scope='All packaged docs/cardrpg and reports/cardrpg files, except this manifest itself.', files=records), indent=2) + '\n')

manifest = json.loads(manifest_path.read_text())
for row in manifest['files']:
    path = root / row['path']
    assert path.stat().st_size == row['bytes'] and digest(path) == row['sha256'], row['path']
print(json.dumps(dict(artifactSha256=artifact_hash, hashBoundChecks=len(checks), commandReceipts=len(commands),
    manifestFiles=len(manifest['files']), functionalEvidence='verified',
    strictCastP95Misses=sum(row['p95Ms'] > 16.700001 for row in casts),
    status='PARTIAL: exact percentile and subjective art gates remain disclosed'), indent=2))
