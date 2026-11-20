"""Prospectively register two isolated, round-committed boss pressure transfers."""
from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,shutil,subprocess
repo=Path.cwd();parent=repo/'reports/cardrpg-big/a5/b1/committed-pattern-26';out=repo/'reports/cardrpg-big/a5/b1/pressure-transfer-27';temp=Path('/tmp/cardrpg-a5-pressure-transfer-27')
assert not out.exists() and not temp.exists()
sha=lambda b:hashlib.sha256(b).hexdigest()
base=json.loads((parent/'REGISTERED-METHOD.json').read_text());now=datetime.now(timezone.utc).isoformat()
for p,h in base['source'].items():assert sha((Path(base['sourceRoot'])/p).read_bytes())==h,p
out.mkdir(parents=True);temp.mkdir()
for name,transfer in [('transfer15',15),('transfer30',30)]:
 dest=out/name;dest.mkdir();source=temp/name/'source';shutil.copytree(base['sourceRoot'],source)
 path='packages/game-rules/src/cardrpg/depth/battle.ts';s=(source/path).read_text()
 old="    return {actorId:a.id,targetId:target.id,label:signature?"
 new=f'''    // Move a fixed part of a boss cycle into its two basic turns.
    // With unchanged targets, 2*(100+T)+N*(175-2*T/N)=200+175*N.
    // Mitigation, row changes, control and phase transitions can change actual damage.
    const transfer=b.v4&&spec.tier==='boss'?{transfer}:0;
    const count=Math.max(1,party.filter(p=>a.phase===2||p.row==='front').length);
    const power=signature?175-2*transfer/count:100+transfer;
    return {{actorId:a.id,targetId:target.id,label:signature?'''
 assert s.count(old)==1;s=s.replace(old,new)
 old='power:signature?175:100,status:';assert s.count(old)==1;s=s.replace(old,'power,status:')
 old='damage(b,actor,t,signature?intent.power:100,0,';assert s.count(old)==1;s=s.replace(old,'damage(b,actor,t,b.v4?intent.power:signature?intent.power:100,0,')
 (source/path).write_text(s)
 reg=json.loads(json.dumps(base));oldroot=str(parent.relative_to(repo));newroot=str(dest.relative_to(repo))
 for name2 in ['matrix.mjs','cohort.mjs','run.mjs']:
  text=(parent/name2).read_text().replace(oldroot,newroot).replace('A5 committed pattern26 regression ','A5 pressure transfer27 '+name+' ')
  (dest/name2).write_text(text)
 reg.update(registeredAt=now,sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),sourceRoot=str(source),
  source={p:sha((source/p).read_bytes()) for p in base['source']},combatSource={p:sha((source/p).read_bytes()) for p in base['combatSource']},
  scripts={str((dest/n).relative_to(repo)):sha((dest/n).read_bytes()) for n in ['matrix.mjs','cohort.mjs']},parent=oldroot+'/REGISTERED-METHOD.json',
  method=f'Current-source candidate26 plus transfer T={transfer} per basic turn. Boss basic100+T; signature175-2T/N with N=committed eligible row target count. Intent power used for V4 basics and signatures. Drowsy40 unchanged. No RNG/stat/AI/fixture/gate changes.',
  decision='Retain both complete1321TRAIN50 matrices and90old earned save cohorts. No isolated adoption if any progression gate regresses; no balance closure on a pilot. All saturation and negative pairs retained. Wider500TRAIN/fresh-earned/cohort and source/browser/OFF checks required for a supported candidate.')
 reg['changed']={p:reg['source'][p] for p in base['changed']}
 (dest/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
 for p in reg['changed']:
  f=dest/'source-snapshot'/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_bytes((source/p).read_bytes())
 day=json.loads((parent/'day7-checks/REGISTERED-METHOD.json').read_text());day.update(registeredAt=now,source=reg['combatSource'],candidate='Committed pressure transfer27 '+name,runnerSha256=sha((dest/'cohort.mjs').read_bytes()))
 (dest/'day7-checks').mkdir();(dest/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(day,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Pressure transfer27 — prospective TRAIN experiment

Candidate26 fixes same-round target expansion but increases heavy first wins28/30→30/30, and leaves52/384piece misses. It is rejected for isolated adoption. No production change follows.

Two new arms use that exact immutable26 source with a single pressure-distribution change: T=15 or30. Each boss basic uses100+T power; its signature commits175−2T/N power, where N is the number of eligible targets at round start (at least1). With fixed targets, total raw cycle power is unchanged:2(100+T)+N(175−2T/N)=200+175N. This is not equality of actual HP loss: defense, shields, formation, death, control and phase transitions differ. The aim is a smaller signature peak with meaningful sustained front-row pressure. Earlier A4 pilots120/135 did not conserve the multi-target raw budget; their failures remain historical.

Intent power, phase, preview and actual resolver agree. Old pending intents retain their existing100/175power and live-phase fallback until a new round. OFF data and execution stay unchanged. No new RNG draws, stat/gear/AI change or fixture recalibration. Candidate26 source/save/copy remains staged; no artifact change.

Before sampling, register both1321originalTRAIN1–50 matrices and90previously earned day7 saves, including allnegativepairs and saturated cells. Compare to both current22 and candidate26. Every arm runs to completion; no gate moves and acceptance20001–20500 remains unused. A worsened progression gate prevents isolated adoption. Passing this pilot would still require500TRAIN, fresh earned cohorts, semantic/unit tests, source gates,OFF8250 and browser review.

One native coordinator runs110s shared-lock slices with7s handoffs. No modelhelpers, B/protected edits, merge or deploy. Semantic probe first verifies power conservation on fixed1–3target snapshots, phase commitment, Drowsy/Hush/legacy intents, exactOFF events, replay and preview immutability.
''')
print(out)
