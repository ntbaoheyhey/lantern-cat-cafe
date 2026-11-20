from pathlib import Path
import json,hashlib,datetime
r=Path('/Users/bao/taskbar-hero-cardrpg-a4');p=Path('/tmp/cardrpg-a5-b1-prep');out=p/'candidates-02';out.mkdir(exist_ok=True)
battle='packages/game-rules/src/cardrpg/depth/battle.ts';contract='packages/game-rules/src/cardrpg/depth/contract.ts';s=(r/battle).read_text();c=(r/contract).read_text()
assert s.count('power:signature?175:100,status:')==1
latched=s.replace('power:signature?175:100,status:',"...(b.v4?{phase:a.phase}:{}),power:signature?175:100,status:").replace("party.filter(a=>actor.phase===2||a.row===", "party.filter(a=>(intent.phase??actor.phase)===2||a.row===").replace("spec.mechanic==='banquet'&&actor.phase===2", "spec.mechanic==='banquet'&&(intent.phase??actor.phase)===2")
latchedContract=c.replace('export interface Intent { actorId:', 'export interface Intent { phase?: number; actorId:')
needle="damage(b,actor,t,signature?intent.power:100,0,!!b.v4&&!wide&&spec.mechanic!=='steal');"
assert s.count(needle)==1
def partial(src):
 phase='(intent.phase??actor.phase)' if src==latched else 'actor.phase'
 return src.replace(needle,f"const partialClosing=b.v4&&spec.tier==='boss'&&wide&&{phase}===2;\n      const power=signature?intent.power*(partialClosing?(t.row==='rear'?.5:.75):1):100;\n      damage(b,actor,t,power,0,!!b.v4&&!wide&&spec.mechanic!=='steal');")
variants={'baseline':{},'latched':{battle:latched,contract:latchedContract},'partial-closing':{battle:partial(s)},'latched-partial':{battle:partial(latched),contract:latchedContract}}
sha=lambda b:hashlib.sha256(b).hexdigest();manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'count':50,'seedStart':1,'seedEnd':50,'source':{f:sha((r/f).read_bytes()) for f in [battle,contract]},'variants':{}}
for name,files in variants.items():
 manifest['variants'][name]={}
 for f,body in files.items():
  dst=out/name/f;dst.parent.mkdir(parents=True,exist_ok=True);dst.write_text(body);manifest['variants'][name][f]=sha(dst.read_bytes())
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'REGISTERED-CANDIDATES.md').write_text('''# B1 candidate pilot02: closing-phase pressure

Registered before sampling, TRAIN1-50 on the same31 residual cells. The prior baseline is reused byte-for-byte from pilot01; no baseline reseeding. Keep every01 result: smooth and distributed worst88-90pp, so none is selected for production.

Read-only replay evidence shows all six first deaths at round6 occur after the boss crosses halfHP. In four chapter3 examples that transition occurs during round6, after the round's intent is already created. Existing enemyAct reads live actor.phase when selecting targets, although the cue says NEXT signature. A party attack can therefore widen a previously queued attack before the player-visible warning has had its next turn. This is a concrete telegraph inconsistency, not proof that fixing it eliminates all cliffs.

Latched: freeze boss phase in each v4 Intent at round creation and resolve target expansion/closing summons from that phase; absent phase on old saved intents falls back to historical live phase. OFF Intent objects are unchanged. Production requires optional typed phase validation and replay/migration tests.

Partial closing: phase2 wide boss signatures use75% of the original direct power against front cats,50% against rear cats. It still reaches both rows and retains original statuses and boss identities. Phase1 signatures, ordinary attacks, elites and OFF are unchanged. This tests whether full-strength multi-row pressure converts one survival threshold into a party collapse. Total damage is intentionally lower, not preserved; saturation and duration must be reported.

Latched-partial combines those two transforms. No utility, gear, cat stats, set effects, randomness, seed range or acceptance gate changes. Like pilot01, diagnostic intent descriptions remain historical except the latched phase field; this is not a publishable artifact.

Report paired gains, first-death rounds, before/after saturation and mean action counts. A lower worst gain due to100% victories is a failed fix, not a balance pass. Expand promising candidates to all fourth slots, tier/band ladders and original set/cat fixtures before adoption. Acceptance20001-20500 remains unused. Shared lock,110s CPU slices with120s handoff to B.
''')
pilot=(p/'a5-candidate-pilot.mjs').read_text().replace("candidates-01","candidates-02");(p/'a5-candidate-pilot-02.mjs').write_text(pilot)
report=r/'reports/cardrpg-big/a5/b1/candidates-02';report.mkdir(parents=True,exist_ok=True)
for f in ['manifest.json','REGISTERED-CANDIDATES.md']:(report/f).write_bytes((out/f).read_bytes())
old=json.loads((r/'reports/cardrpg-big/a5/b1/candidates-01/results.json').read_text());(report/'partial.json').write_text(json.dumps({'manifest':manifest,'source':old['source'],'rows':[v for v in old['rows'] if v['variant']=='baseline'],'baselineReuse':'pilot01 exact rows; not new samples'}))
runner=(p/'run-candidates.mjs').read_text().replace('candidates-01','candidates-02').replace('pilot 01','pilot 02').replace('a5-candidate-pilot.mjs','a5-candidate-pilot-02.mjs').replace('delay(7000)','delay(120000)');(p/'run-candidates-02.mjs').write_text(runner)
print('Registered pilot02 and reused immutable pilot01 baseline; no new run started.')
