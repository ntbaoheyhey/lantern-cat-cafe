"""Verify the packaged artifact, evidence identity and recorded functional gates.

This verifies existing observations; it does not rerun browser tests. Performance
percentile misses and subjective art limitations remain explicit PARTIAL results.
Use --write-manifest only after capture and report files have stopped changing.
"""
from pathlib import Path
import hashlib
import json
import subprocess
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
runtime_roots = ['apps/web/src', 'apps/web/public', 'packages', 'assets']
# This audit document is refreshed after the measured VFX warmup correction.
# It is not imported by the runtime/build. Every source hash it names is checked
# below; no executable source, model, texture or portrait is excluded here.
provenance_metadata = ':(exclude)assets/cardrpg/procedural-manifest.json'
runtime_diff = subprocess.check_output(
    ['git', 'diff', build['head'], '--', *runtime_roots, provenance_metadata], cwd=root)
assert not runtime_diff, 'Runtime changed after the measured artifact was built'
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
# Count alone cannot prove coverage: reject duplicate/missing recipe trials and
# independently derive the reported percentiles from untouched RAF intervals.
capture_rows = [json.loads(line) for line in (report / 'art/effect-captures.jsonl').read_text().splitlines()]
recipe_ids = {row['id'] for row in capture_rows}
assert len(recipe_ids) == 43
expected_casts = {(width, height, recipe, temperature)
                  for width, height in [(1024, 600), (1280, 720), (1440, 900)]
                  for recipe in recipe_ids for temperature in ['cold', 'warm']}

def verify_cast_grid(rows, ratio):
    assert len(rows) == len(expected_casts)
    assert {(r['width'], r['height'], r['id'], r['temperature']) for r in rows} == expected_casts
    for row in rows:
        assert row['pixelRatio'] == ratio
        samples = sorted(row['raf'])
        assert samples
        for field, fraction in [('p95Ms', .95), ('p99Ms', .99)]:
            assert abs(row[field] - samples[int((len(samples) - 1) * fraction)]) < .000001

casts = read('reports/cardrpg/performance-delivery/performance-metal.json')['rows']
assert len(casts) == 258 and all(not row['longTasks'] for row in casts)
retina = read('reports/cardrpg/performance-retina-delivery/performance-metal.json')['rows']
assert len(retina) == 258 and all(not row['longTasks'] for row in retina)
verify_cast_grid(casts, 1)
verify_cast_grid(retina, 2)
retina_life = read('reports/cardrpg/lifecycle-retina-delivery/measurement.json')['rows']
assert len(retina_life) == 1 and retina_life[0]['pixelRatio'] == 2
assert not retina_life[0]['long'] and retina_life[0]['result']['winner'] == 'party'
assert retina_life[0]['rendererRetained']
assert len(retina_life[0]['buffers']) == 1
assert retina_life[0]['contexts'] == retina_life[0]['contextsAtStart'] == 5
assert sum(mark['event'] == 'rest' for mark in retina_life[0]['marks']) == 3
transitions = read('reports/cardrpg/performance-delivery/transitions.json')['rows']
assert len(transitions) == 9 and all(not row['longTasks'] for row in transitions)
life = read('reports/cardrpg/lifecycle-delivery/measurement.json')['rows']
assert len(life) == 3
for row in life:
    assert not row['long'] and row['rendererRetained']
    assert len(row['buffers']) == 1
    assert row['contexts'] == row['contextsAtStart'] == 5
    assert row['result']['winner'] == 'party'
    assert len([m for m in row['marks'] if m['event'] == 'rest']) == 3
assert all(row['live'] == 0 for row in read('reports/cardrpg/preview-lifetime/check.json')['rows'])
pixels = read('reports/cardrpg/isolation/pixels.json')
assert len(pixels) == 3 and all(row['differingPixels'] == 0 for row in pixels)
for row in pixels:
    for version in ['before', 'after']:
        assert digest(report / f"isolation/{row['width']}-{version}.png") == row[version + 'Sha256']
art = read('reports/cardrpg/art/effect-captures.json')
assert art['frames'] == 215 and art['recipes'] == 43 and not art['missing']
assert not art['overlaps']
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
assert all(row['passHash'] and digest(root / row['path']) == row['sha256']
           for row in read('reports/cardrpg/validation/provenance.json'))
assert all(digest(root / row['path']) == row['sha256']
           for row in read('assets/cardrpg/procedural-manifest.json')['sourceSha256'])

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
    strictRetinaP95Misses=sum(row['p95Ms'] > 16.700001 for row in retina),
    strictRetinaP99Misses=sum(row['p99Ms'] > 25.000001 for row in retina),
    status='PARTIAL: exact percentile and subjective art gates remain disclosed'), indent=2))
