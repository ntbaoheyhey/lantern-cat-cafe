# REFERENCE: A5 B1 current24 and hit-envelope25. Prepare only; no battles.
from pathlib import Path
import hashlib,json,shutil,subprocess
from datetime import datetime,timezone
root=Path.cwd()
report=root/'reports/cardrpg-big/a5/b1/impact-delay-49'
report.mkdir(exist_ok=True)
base=root/'packages/game-rules/src/cardrpg/depth/battle.ts'
policy=root/'packages/game-rules/src/cardrpg/depth/policies.ts'
sha=lambda data: hashlib.sha256(data).hexdigest()

def replace_once(text, old, new):
    assert text.count(old)==1, old
    return text.replace(old,new)

for name,fraction in [('quarter',.25),('half',.5)]:
    out=report/name;out.mkdir(exist_ok=True)
    snapshot=Path('/tmp/cardrpg-a5-impact-delay-49')/name/'source'
    assert not (out/'REGISTERED-METHOD.json').exists(), 'Never overwrite a registration.'
    shutil.copytree(root/'packages/game-rules/src',snapshot/'packages/game-rules/src',dirs_exist_ok=False)
    code=base.read_text()
    helpers=f'''// Isolated diagnostic49, never adopted without visible debt/migration review.
const IMPACT_DELAY49 = {fraction};
const IMPACT_PREFIX49 = 'a5-impact49:';
export function pendingImpact49(actor: Actor): number {{
  return Object.entries(actor.bonuses).reduce((sum,[key,value])=>sum+(key.startsWith(IMPACT_PREFIX49)?value:0),0);
}}
function clearImpact49(actor: Actor) {{
  for(const key of Object.keys(actor.bonuses))if(key.startsWith(IMPACT_PREFIX49))delete actor.bonuses[key];
}}
function settleImpact49(b: Battle, actor: Actor) {{
  const debts=Object.entries(actor.bonuses).filter(([key])=>key.startsWith(IMPACT_PREFIX49));
  clearImpact49(actor);
  for(const [key,amount] of debts) {{
    if(actor.hp<=0)break;
    const source=b.actors.find(a=>a.id===key.slice(IMPACT_PREFIX49.length))??actor;
    loseHp(b,source,actor,amount,'delayed-impact');
  }}
}}
'''
    code=replace_once(code,'function loseHp(b: Battle, source: Actor, target: Actor, amount: number, kind: string) {',helpers+'function loseHp(b: Battle, source: Actor, target: Actor, amount: number, kind: string) {')
    code=replace_once(code,"  if (target.hp === 0) {\n    if (target.side", "  if (target.hp === 0) {\n    if(b.v4)clearImpact49(target);\n    if (target.side")
    code=replace_once(code,"  loseHp(b, source, target, hpDamage, 'damage');",'''  if(b.v4&&!b.initial.tutorial&&source.side==='enemy'&&ENEMY_BY_ID[source.catalogId]?.tier==='boss'&&target.side==='party') {
    const delayed=Math.round(hpDamage*IMPACT_DELAY49);
    if(delayed>0){
      target.bonuses[IMPACT_PREFIX49+source.id]=(target.bonuses[IMPACT_PREFIX49+source.id]??0)+delayed;
      hpDamage-=delayed;
      record(b,source,target,'pending-impact',delayed,'Remaining impact follows the next own action');
    }
  }
  loseHp(b, source, target, hpDamage, 'damage');''')
    code=replace_once(code,'function finishAction(b: Battle, actor: Actor) {\n  actor.turns++;','function finishAction(b: Battle, actor: Actor) {\n  if(b.v4&&actor.side===\'party\')settleImpact49(b,actor);\n  actor.turns++;')
    code += f"\nexport const A5_IMPACT_DELAY49 = '{name}';\n"
    pcode=policy.read_text()
    pcode=replace_once(pcode,'act, currentActor, enemyAct, legalChoices, skillById, stacks','act, currentActor, enemyAct, legalChoices, skillById, stacks, pendingImpact49')
    pcode=replace_once(pcode,'  let n=actorValue(a);','  let n=actorValue(a)-pendingImpact49(a);')
    changed={'packages/game-rules/src/cardrpg/depth/battle.ts':code,'packages/game-rules/src/cardrpg/depth/policies.ts':pcode}
    for path,text in changed.items():
        (snapshot/path).write_text(text)
        (out/(Path(path).name+'.snapshot.txt')).write_text(text)
    matrix=(root/'reports/cardrpg-big/a5/b1/threat-beats-47/boss/matrix.mjs').read_text()
    matrix=replace_once(matrix,'reports/cardrpg-big/a5/b1/threat-beats-47/boss/REGISTERED-METHOD.json',str(out.relative_to(root)/'REGISTERED-METHOD.json'))
    (out/'matrix.mjs').write_text(matrix)
    source={str(path.relative_to(snapshot)):sha(path.read_bytes()) for path in sorted((snapshot/'packages/game-rules/src').rglob('*')) if path.is_file()}
    combat={path:digest for path,digest in source.items() if path.endswith('.ts') and not path.endswith('.test.ts') and (path.startswith('packages/game-rules/src/cardrpg/') or path=='packages/game-rules/src/rng.ts')}
    scripts=['tools/cardrpg-big/a5-impact-delay-probe.mjs','tools/cardrpg-big/a5-impact-delay-run.mjs','tools/cardrpg-big/a4-load.mjs','tools/cardrpg-big/a5-drafts/prepare-impact-delay-49.py',str((out/'matrix.mjs').relative_to(root))]
    control='reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json'
    registration=dict(registeredAt=datetime.now(timezone.utc).isoformat(),name=name,fraction=fraction,
                      sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
                      runtimeSource='27f192301ba0774beeabda86bea5c5af7beb3039',sourceRoot=str(snapshot),
                      source=source,combatSource=combat,changedPaths=list(changed),seedOffset=0,count=50,cases=384,
                      acceptanceSeedsUsed=False,control=control,controlSha256=sha((root/control).read_bytes()),
                      scripts={path:sha((root/path).read_bytes()) for path in scripts})
    (out/'REGISTERED-METHOD.json').write_text(json.dumps(registration,indent=2)+'\n')
print('Prepared isolated sources and registrations only; no battles or runtime changes.')
