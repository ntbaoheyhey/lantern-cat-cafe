"""Register the current A5 source + only the measured Hush correction before sampling."""
from pathlib import Path
import datetime
import hashlib
import json
import subprocess

repo = Path(__file__).resolve().parents[3]
out = repo / 'reports/cardrpg-big/a5/b2/suppression-current-16'
root = Path('/tmp/cardrpg-a5-suppression-current-16')
assert not out.exists() and not root.exists(), 'Never overwrite a registered attempt'
out.mkdir(parents=True)
root.mkdir()
digest = lambda data: hashlib.sha256(data).hexdigest()
paths = subprocess.check_output(['git', 'ls-files', 'packages/game-rules/src'], cwd=repo, text=True).splitlines()
source = {}
for path in paths:
    data = (repo / path).read_bytes()
    if path == 'packages/game-rules/src/cardrpg/depth/battle.ts':
        old = "  if (impaired) damage(b,actor,target,40,0,b.v4&&spec.mechanic!=='steal');\n"
        new = old + "  else if (b.v4&&signature&&quiet&&['heal','shield'].includes(spec.mechanic)) {\n    // Suppression spends the committed utility turn; it does not replace it with a hit.\n  }\n"
        text = data.decode()
        assert text.count(old) == 1 and new not in text
        data = text.replace(old, new).encode()
    target = root / 'source' / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    source[path] = digest(data)
runtime = {p: h for p, h in source.items() if p.endswith('.ts') and not p.endswith('.test.ts')}
combat = {p: h for p, h in runtime.items() if p.startswith('packages/game-rules/src/cardrpg/') or p.endswith('/rng.ts')}
base = repo / 'tools/cardrpg-big/a5-drafts/b3-closure/anchored'
matrix = (base / 'matrix.mjs').read_text()
needle = "const cp=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));"
assert matrix.count(needle) == 1
matrix = matrix.replace(needle, "const reg=JSON.parse(await readFile('reports/cardrpg-big/a5/b2/suppression-current-16/REGISTERED-METHOD.json','utf8'));\nassert.deepEqual(source,reg.combatSource);\n" + needle)
(out / 'matrix.mjs').write_text(matrix)
(out / 'cohort.mjs').write_bytes((base / 'cohort.mjs').read_bytes())
prior = repo / 'reports/cardrpg-big/a5/b3/anchored-validation-03'
dayreg = json.loads((prior / 'day7-checks/REGISTERED-METHOD.json').read_text())
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
dayreg.update(registeredAt=now, inputs=str(prior.relative_to(repo) / 'day7'), source=combat,
    candidate='Current A5 plus Hush utility suppression only',
    hypothesis='Same 90 previously earned anchored day7 saves, current A5 + Hush repair. Paired saved-input regression, not a fresh 45-day earned cohort.')
dayreg['runnerSha256'] = digest((out / 'cohort.mjs').read_bytes())
(out / 'day7-checks').mkdir()
(out / 'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(dayreg, indent=2))
registration = dict(registeredAt=now, sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),
    sourceRoot=str(root / 'source'), source=source, combatSource=combat, seedOffset=0, count=50,
    scopes=dict(equipped=384, tiers=210, sets=64, teams=663),
    scripts={str(p.relative_to(repo)): digest(p.read_bytes()) for p in [out/'matrix.mjs',out/'cohort.mjs']},
    savedInputs={str(p.relative_to(repo)):digest(p.read_bytes()) for p in sorted((prior/'day7').glob('*.save'))},
    method='Current production A5 including anchored60 and fatal-followup guard, plus only suppression15 branch. Original B1/B2 TRAIN1–50 matrix and 90 old earned day7 snapshots. No new acceptance, kit, AI, fixture, or numeric change.')
(out / 'REGISTERED-METHOD.json').write_text(json.dumps(registration, indent=2))
(out / 'REGISTERED-METHOD.md').write_text('''# Suppression current16 — registered before sampling

Apply exactly the isolated utility-suppression branch to current A5, which already includes anchored60 and the fatal-followup guard. This verifies composition; common15/carrier15 use the older frozen common-fixture source. Preserve both sets of results.

Run the original 384 fourth-slot, 210 tier/band/farming, 64 homogeneous-set and 663 team/crew TRAIN1–50 cells without changing cases, weights or thresholds. Reuse all 90 previously earned anchored day7 saves, same first/retry seeds and recommendation policy. Hash every input before evaluation. This saved-input regression is NOT a new 45-day earned cohort; reward/progression acceptance still needs final-source remeasurement.

No source adoption is implied by starting this diagnostic. No acceptance seeds, extra reach, Cinnamon cooldown, kit-fit or AI changes. All negative outcomes and original gate misses remain. Shared110s leases/7s handoffs, no browser or model calls.
''')
print(out)
