# REFERENCE: PROMPT-A5 B2. Register one isolated policy candidate before sampling.
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil
root=Path.cwd(); out=root/'reports/cardrpg-big/a5/b2/scent-policy-06'
assert not out.exists(), 'Never overwrite an observed candidate'
base=json.loads((root/'reports/cardrpg-big/a5/b2/common-fixture-04/REGISTERED-METHOD.json').read_text())
source=Path('/tmp/cardrpg-a5-scent-policy-06/source'); assert not source.exists()
sha=lambda b:hashlib.sha256(b).hexdigest()
for path,h in base['source'].items():
 data=(Path(base['sourceRoot'])/path).read_bytes();assert sha(data)==h,path
 p=source/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
# Copy transitive rules, including JSON, unchanged; the original manifest contains only runtime inputs.
for p in (Path(base['sourceRoot'])/'packages/game-rules/src').rglob('*'):
 if p.is_file() and not (source/p.relative_to(base['sourceRoot'])).exists():
  q=source/p.relative_to(base['sourceRoot']);q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(p.read_bytes())
p=source/'packages/game-rules/src/cardrpg/depth/policies.ts'; text=p.read_text()
anchor='/** Bounded one-turn utility: value the prevention already present on an actor. */'
assert text.count(anchor)==1
helper='''/** Value the remaining marked-target follow-ups using visible basic attacks only. */
function scentValueV4(b: Battle, target: Actor): number {
  const mark = target.statuses.find(status => status.id === 'scent');
  if (!mark || target.hp <= 0) return 0;
  let damage = 0, recovery = 0;
  for (const ally of b.actors.filter(actor => actor.side === 'party' && actor.hp > 0)) {
    const turns = Math.max(0, mark.remaining - 1) + (b.queue.includes(ally.id) ? 1 : 0);
    if (!turns) continue;
    const basic = skillById(ally.skills[0]!);
    const power = basic?.effects.filter(effect => ['hit', 'execute', 'chain'].includes(effect.kind))
      .reduce((sum, effect) => sum + (effect.power ?? 0), 0) ?? 0;
    if (!power) continue;
    const mitigation = 80 / (80 + target.defense);
    const direct = ally.attack * power / 100 * mitigation
      * (1 - stacks(ally, 'rattled') * .15) * (1 - stacks(ally, 'tangle') * .04)
      * (1 - stacks(target, 'cozy') * .1);
    const marked = (ally.bonuses.markedDamage ?? 0) + (ally.bonuses.brokenDamage ?? 0)
      + (ally.setEffects.includes('marked-break') ? 3 : 0);
    damage += turns * (direct * .2 + marked * mitigation * 1.2);
    if (ally.setEffects.includes('ultimate-refund'))
      recovery += Math.min(ally.maxHp - ally.hp, turns * 6);
  }
  // A defeated target cannot yield further mark damage or recovery.
  return Math.min(target.hp, damage) + recovery;
}
'''
text=text.replace(anchor,helper+anchor)
anchor="    n-=stacks(a,'tangle')*a.attack*.04;";assert text.count(anchor)==1
text=text.replace(anchor,anchor+'\n    n-=scentValueV4(b,a);')
p.write_text(text)
out.mkdir(parents=True)
shutil.copytree(source,out/'source-snapshot')
method=dict(base)
method.update(registeredAt=datetime.now(timezone.utc).isoformat(),sourceRoot=str(source),
 source={k:sha((source/k).read_bytes()) for k in base['source']},
 original={'path':'reports/cardrpg-big/a5/b2/common-fixture-04/results.json','sha256':sha((root/'reports/cardrpg-big/a5/b2/common-fixture-04/results.json').read_bytes())},
 purpose='One bounded Scent policy candidate; unchanged combat, gear, kits, stats and fixed eight-scene fixture. All original1840cells TRAIN1..50. No acceptance or automatic adoption.',
 selection='Original commonfixture04 enemyStats/weights/budgets unchanged; no recalibration after this policy change.')
matrix=(root/'tools/cardrpg-big/a5-common-fixture.mjs').read_text()
matrix=matrix.replace("from './a4-load.mjs'", "from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a4-load.mjs'")
# Add observed Soot choices as a mechanism measurement; no change to choices or RNG.
matrix=matrix.replace('return { won: b.result === \'party\', ratio };', '''const sootActions = b.choices.filter(choice => choice.actorId === 'soot');
  return { won: b.result === 'party', ratio,
    sootActions: sootActions.length, blackCup: sootActions.filter(choice => choice.skillId === 'soot-2').length };''')
matrix=matrix.replace("outcomes: '', minPowerRatio: 1, maxPowerRatio: 1", "outcomes: '', minPowerRatio: 1, maxPowerRatio: 1, sootActions: 0, blackCup: 0")
matrix=matrix.replace('row.outcomes += r.code;', 'row.outcomes += r.code; row.sootActions += r.sootActions; row.blackCup += r.blackCup;')
(out/'matrix.mjs').write_text(matrix);method['matrixSha256']=sha(matrix.encode())
(out/'REGISTERED-METHOD.json').write_text(json.dumps(method,indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# Scent policy06 — registered TRAIN candidate

Read-only probe05 reproduced all22000original battles. Soot selected Black cup zero times in203598actions. Its Moonwick heal emitted3096events, all in teams also containing Velvet; no healing trigger without Velvet. The original one-action score omits Scent. This establishes an unused kit action, not that selecting it would win more.

One isolated candidate values Scent for the remaining visible mark duration: basic direct-damage amplification of20%, actual marked-damage affixes/set bonus and at most6missingHP per marked attack for Moonwick. Count still-queued allies in this round and future full mark rounds; cap estimated damage at targetHP and healing at missingHP. No enemy-RNG peeking, fixed skill bonus, skill/stat/gear/crew change or new combat input. This estimate assumes eligible allies use basic attacks, so healing/control opportunity costs may make it optimistic; report negative paired results too.

Run the original1840common-fixture cells, all8scenes/8sets/220triples/reference/pairedcrew, TRAIN1..50, fixed original budget/weights/enemyStats. Preserve every original result, first-seed replay parity and paired improved/worsened counts; report Soot Black cup choices and every cat/set gate. Do not recalibrate difficulty, replace acceptance, combine anchored/spread candidates or adopt automatically. Source snapshot and matrix hashes fixed before first run.110second shared leases and7second handoffs. Fresh20001–20500 remains unused.
''')
runner=(root/'reports/cardrpg-big/a5/b2/soot-kit-probe-05/run.mjs').read_text()
runner=runner.replace('soot-kit-probe-05','scent-policy-06').replace('probe.mjs','matrix.mjs').replace('probeSha256','matrixSha256').replace('Soot kit read-only TRAIN probe','Scent policy06 TRAIN candidate')
(out/'run.mjs').write_text(runner)
print(json.dumps({'registered':str(out),'source':str(source),'changed':['packages/game-rules/src/cardrpg/depth/policies.ts']}))
