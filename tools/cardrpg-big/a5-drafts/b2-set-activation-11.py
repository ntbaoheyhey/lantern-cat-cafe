# REFERENCE: PROMPT-A5 B1/B2. Register a read-only set-fixture activation audit.
from pathlib import Path
from datetime import datetime, timezone
import json
import hashlib

root = Path.cwd()
out = root / 'reports/cardrpg-big/a5/b2/set-activation-11'
assert not out.exists()
base = json.loads((root / 'reports/cardrpg-big/a5/b2/common-fixture-04/REGISTERED-METHOD.json').read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
for path, digest in base['source'].items():
    assert sha((Path(base['sourceRoot']) / path).read_bytes()) == digest, path
script = (root / 'tools/cardrpg-big/a5-common-fixture.mjs').read_text().split('const methodHash =')[0]
script = script.replace("from './a4-load.mjs'", "from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs'")
script = script.replace("  return { won: b.result === 'party', ratio };", """  const actors = Object.fromEntries(cats.map(cat => [cat.id, {
    skills: cat.skills.map(id => ({ id, effects: R.skillById(id).effects })),
    scald: b.log.filter(e => e.actorId === cat.id && e.kind === 'status' && e.text === R.STATUS_BY_ID.scald.name).length,
    gear: b.v4.events.filter(e => e.kind === 'gear-trigger' && e.actorId === cat.id)
      .map(e => ({ effect: e.effect, amount: e.amount })),
  }]));
  return { won: b.result === 'party', ratio, actors };""")
script += """
const originalBytes = await readFile(method.original.path);
assert.equal(sha(originalBytes), method.original.sha256);
const original = new Map(JSON.parse(originalBytes).rows.map(row => [row.key, row]));
const rows = [];
try {
  for (const set of R.SETS) for (let scene = 0; scene < method.scenarios.length; scene++) {
    const key = JSON.stringify({ kind: 'sets', setId: set.id, scene });
    const row = { key, setId: set.id, scene, outcomes: '', actors: {} };
    for (let seed = 1; seed <= method.count; seed++) {
      const result = battle(seed, scene, starter, set.id);
      row.outcomes += result.won ? '1' : '0';
      assert.equal(row.outcomes.at(-1), original.get(key).outcomes[seed - 1], key + '/' + seed);
      for (const [id, stats] of Object.entries(result.actors)) {
        const actor = row.actors[id] ??= { skills: stats.skills, scald: 0, gear: {} };
        assert.deepEqual(actor.skills, stats.skills);
        actor.scald += stats.scald;
        for (const event of stats.gear) {
          const bucket = actor.gear[event.effect] ??= { count: 0, amount: 0 };
          bucket.count++; bucket.amount += event.amount;
        }
      }
    }
    assert.equal(row.outcomes, original.get(key).outcomes);
    row.digest = sha(row.outcomes); rows.push(row);
  }
  assert.equal(rows.length, 64);
  await writeFile(out + '/results.json', JSON.stringify({ registration: method, methodHash: sha(JSON.stringify(method)), rows }, null, 2));
  console.log(JSON.stringify({ complete: true, cells: rows.length, battles: rows.length * method.count,
    scaldBySet: Object.fromEntries(R.SETS.map(set => [set.id, rows.filter(r => r.setId === set.id).reduce((n, r) => n + Object.values(r.actors).reduce((m, a) => m + a.scald, 0), 0)])) }));
} finally { await vite.close(); }
"""
out.mkdir(parents=True)
(out / 'probe.mjs').write_text(script)
base.update(registeredAt=datetime.now(timezone.utc).isoformat(), count=50, seedOffset=0,
    purpose='Read-only original64 set cells: exact outcome parity, static skill effects, successful Scald applications and explicitly emitted gear triggers.',
    original={'path': 'reports/cardrpg-big/a5/b2/common-fixture-04/results.json', 'sha256': sha((root / 'reports/cardrpg-big/a5/b2/common-fixture-04/results.json').read_bytes())},
    probeSha256=sha(script.encode()))
(out / 'REGISTERED-METHOD.json').write_text(json.dumps(base, indent=2))
(out / 'REGISTERED-METHOD.md').write_text('''# Set activation11 — read-only TRAIN audit

Registered before sampling. Commonfixture04 equips every starter cat with the same set. Source inspection shows the starter trio has no skill that applies Scald, yet Emberfelt is scored for its Scald identity. This audit tests fixture eligibility, not a balance adjustment.

Replay all original64set cells ×TRAIN1–50 with exact original source, AI, fixed enemyStats, gear and utility normalization. Require every outcome to match common04; first-seed full replay parity. Record each cat's unlocked skill effects, successful Scald applications and explicitly emitted gear-trigger events by effect/amount. No event does not imply zero contribution: permanent modifiers, reach and status extension do not all emit gear-trigger events. Scald eligibility must therefore use both source skill effects and actual status logs.

No source, gate, fixture, acceptance or production change. Preserve original misses. One shared-lock slice for3,200battles; no model calls or browser. This registration authorizes no carrier substitution or retune.
''')
runner = (root / 'reports/cardrpg-big/a5/b2/support-kit-probe-08/run.mjs').read_text()
runner = runner.replace('support-kit-probe-08', 'set-activation-11').replace('Support kit read-only TRAIN probe', 'Set activation read-only TRAIN probe')
(out / 'run.mjs').write_text(runner)
print(json.dumps({'registered': str(out), 'cells': 64, 'productionChanged': False}))
