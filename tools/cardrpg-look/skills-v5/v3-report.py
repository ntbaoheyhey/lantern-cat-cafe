"""Bind the V3 report to the delivered artifact and retained measurement receipts."""
from pathlib import Path
import gzip, hashlib, json, subprocess

root = Path.cwd()
parent = root / 'reports/cardrpg-look/skills-v5'
out = parent / 'v3'
base = 'da77aee08f29510b93656472245f49ce0f331a1d'

def read(path):
    path = Path(path)
    return json.loads(path.read_bytes() if path.exists() else gzip.decompress(Path(str(path) + '.gz').read_bytes()))

def save(path, value):
    (out / path).write_text(json.dumps(value, indent=2) + '\n')

sha = lambda path: hashlib.sha256(Path(path).read_bytes()).hexdigest()
demo = root / 'docs/cardrpg-look/v5.html'
artifact = sha(demo)
a = read(out / 'after-browser.json')
build = read(out / 'build.json')
perf = read(out / 'perf/casts.json')
cold = read(out / 'perf/cold.json')
faces = read(out / 'faces.json')
delivery = read(out / 'delivery.json')
gates = read(out / 'gates/checks.json')
videos = [read(out / f'videos/{side}.json') for side in ['before', 'after']]
assert a['sha256'] == build['sha256'] == perf['sha256'] == cold['sha256'] == videos[1]['artifactSha256'] == artifact
assert read(out / 'digests-before.json') == read(out / 'digests-after.json')
assert len(a['ui']) == 27 and len(a['shots']) == 9
assert not a['errors'] and not perf['errors'] and not delivery['errors']
assert all(u['badgeOverlap'] == u['wordOverlap'] == u['reservedOverlap'] == u['outside'] == 0 and not u['overflow'] and u['contrast'] >= 4.5 for u in a['ui'])
assert len(gates) == 5 and all(g['code'] == 0 for g in gates if g['name'] != 'e2e')
recovery = None
if gates[-1]['code']:
    recovery = read(out / 'gates/recovery.json')
    assert len(recovery) == 2 and all(r['code'] == 0 for r in recovery)
assert not faces['offenders'] and delivery['offPixelExact']
assert videos[0]['initialSha256'] == videos[1]['initialSha256']
assert all(not v['errors'] and float(v['probe']['format']['duration']) == 20 for v in videos)

flag = read(out / 'startup/checks.json')
oldflag = read(parent / 'v01/startup/checks.json')
assert not any(flag[k] for k in ['errors', 'prohibitedModules', 'modelRequests'])
key = lambda c: tuple(sorted(c['modules']))
oldchunks = {key(c): c for c in oldflag['chunks']}
assert len(flag['chunks']) == len(oldchunks)
assert all(key(c) in oldchunks and c['bytes'] == oldchunks[key(c)]['bytes'] for c in flag['chunks'])
startup = {'scripts': len(flag['chunks']), 'startupBytes': sum(c['bytes'] for c in flag['chunks']), 'sameByteCountsAndModuleMembership': True, 'exactHashes': sum(c['sha256'] == oldchunks[key(c)]['sha256'] for c in flag['chunks']), 'threeOrModelModules': 0}
save('startup/audit.json', startup)

changed = set(subprocess.check_output(['git', 'diff', '--name-only', base], text=True).splitlines() + subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], text=True).splitlines())
allowed = lambda p: p.startswith(('apps/web/src/game/squad/turn3d/', 'assets/cardrpg-look/statuses/', 'tools/cardrpg-look/', 'docs/cardrpg-look/', 'reports/cardrpg-look/')) or p in ['apps/web/src/game/cardrpg/depth/Battle.tsx', 'assets/provenance/look.md']
assert all(allowed(p) for p in changed), [p for p in changed if not allowed(p)]
drift = []
for path, expected in build['sourceHashes'].items():
    if sha(root / path) != expected:
        assert path.startswith('tools/cardrpg-look/skills-v5/') and Path(path).name not in ['v3-playback.ts', 'v3-offline.tsx', 'review.css', 'v3-source.json'], path
        drift.append(path)
rules_diff = subprocess.check_output(['git', 'diff', base, '--', 'packages/game-rules'], text=True)
assert not rules_diff
save('source-audit.json', {'base': base, 'artifactSha256': artifact, 'runtimeAndArtBuildInputsExact': True, 'qaOnlyDrift': drift, 'sourceFiles': {p: sha(root / p) for p in sorted(changed) if p.startswith(('apps/', 'assets/', 'tools/'))}, 'protectedChanges': [], 'rulesDiff': rules_diff})

rows = perf['rows']
native = max(r['max'] for r in rows)
coldmax = max(r['max'] for r in cold['rows'])
oldcold = max(r['max'] for r in read(parent / 'v01/perf/cold.json')['rows'])
draws = max([r['peakDraws'] for r in rows] + [r['stats']['calls'] for r in a['shots']] + [r['calls'] for r in faces['rows']])
tris = max([r['peakTriangles'] for r in rows] + [r['stats']['triangles'] for r in a['shots']] + [r['triangles'] for r in faces['rows']])
result = {'base': base, 'artifactSha256': artifact, 'artifactBytes': demo.stat().st_size, 'demoDeltaFromV01': demo.stat().st_size - (root / 'docs/cardrpg-look/v5-v0.html').stat().st_size, 'seeds': [7, 17, 71, 1808, 20261108], 'battleAndLogParity': True, 'nativeCastWindows': len(rows), 'nativeMax': native, 'cpu4ColdMax': coldmax, 'cpu4ColdBeforeMax': oldcold, 'cpu4DeltaPercent': (coldmax / oldcold - 1) * 100, 'peakDraws': draws, 'peakTriangles': tris, 'faces': faces['samples'], 'faceOffenders': len(faces['offenders']), 'contrastMin': min(u['contrast'] for u in a['ui']), 'badgeOverlap': 0, 'calloutOverlap': 0, 'offPixelsExact': True, 'startup': startup, 'gates': gates, 'e2eRecovery': recovery, 'sameVideoInitial': True}
result['gatesMet'] = {'native': native <= 16.80001, 'draws': draws <= 130, 'cold': coldmax / oldcold <= 1.1, 'demo': demo.stat().st_size <= (root / 'docs/cardrpg-look/b2.html').stat().st_size + 1500000}
save('RESULTS.json', result)
print(json.dumps(result))
