"""Register the current-source intent commitment repair; no production edit."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess,shutil
repo=Path.cwd();old=repo/'reports/cardrpg-big/a5/b2/hush-eligibility-22';out=repo/'reports/cardrpg-big/a5/b1/committed-pattern-26';root=Path('/tmp/cardrpg-a5-committed-pattern-26')
assert not out.exists() and not root.exists();out.mkdir(parents=True)
sha=lambda x:hashlib.sha256(x).hexdigest()
source=root/'source';shutil.copytree(repo/'packages/game-rules/src',source/'packages/game-rules/src')
base=json.loads((repo/'reports/cardrpg-big/a5/b1/current-cliffs-24/REGISTERED-METHOD.json').read_text())
for path,digest in base['source'].items():assert sha((repo/path).read_bytes())==digest,path
changes={
 'battle.ts':[("signature,interrupted:false};","signature,interrupted:false,...(b.v4?{phase:a.phase}:{} )};"),
   ("  const signature=intent.signature&&!impaired;","  const signature=intent.signature&&!impaired;\n  const patternPhase=b.v4?(intent.phase??actor.phase):actor.phase;"),
   ("party.filter(a=>actor.phase===2||a.row===", "party.filter(a=>patternPhase===2||a.row==="),
   ("spec.mechanic==='banquet'&&actor.phase===2", "spec.mechanic==='banquet'&&patternPhase===2")],
 'contract.ts':[("export interface Intent { actorId:","/** V4 commits phase when the round begins; legacy pending intents use their live phase. */\nexport interface Intent { phase?: number; actorId:")],
 'pacing-v4.ts':[("closing phase. The next signature reaches both rows.","closing phase. From next round, signatures reach both rows.")],
 'gameplay-v4.ts':[("Loomfall sweeps the front and summons threads; below half HP it reaches both rows.","Loomfall sweeps the front and summons threads. Closing patterns widen from the next round."),
 ("Cloudburst removes shields before hitting a row; below half HP it reaches both.","Cloudburst strips shields before hitting the front row. Closing patterns widen from the next round."),
 ("Empty banquet removes shield and applies Hush; the closing phase also summons.","Empty Banquet strips shield and applies Hush. Closing patterns widen and summon from the next round.")],
 'scouting-v4.ts':[("Below half HP, Loomfall reaches both rows and brings threads.","Below half HP, Loomfall reaches both rows from the next round; threads still arrive."),
 ("Below half HP, Cloudburst reaches both rows and removes shields.","Below half HP, Cloudburst reaches both rows from the next round and removes shields."),
 ("Below half HP, Empty Banquet reaches both rows and summons threads.","Below half HP, Empty Banquet widens and summons threads from the next round.")],
 'save.ts':[("state.v4?.journey ? '13'", "state.v4?.journey ? '14'"),
  ("5|6|7|8|9|10|11|12|13)","5|6|7|8|9|10|11|12|13|14)"),
  ("'7','8','9','10','11','12','13'","'7','8','9','10','11','12','13','14'"),
  ("if (match[1] !== '13') initializeJourneyV4(state);", "// Keep old pending intents unchanged; their absent phase uses the historical live phase.\n  // Newly generated rounds commit phase, and export advances V4 saves to THC14.\n  if (!['13','14'].includes(match[1]!)) initializeJourneyV4(state);"),
  ("  if (state.lastBattle) validateEnemySnapshot(state.lastBattle);", "  if(state.run?.battle?.intents.some(intent=>intent.phase!==undefined&&intent.phase!==1&&intent.phase!==2)) fail();\n  if (state.lastBattle) validateEnemySnapshot(state.lastBattle);")]
}
changed={}
for name,replacements in changes.items():
 p='packages/game-rules/src/cardrpg/depth/'+name;s=(source/p).read_text()
 for a,b in replacements:
  assert s.count(a)==1,(name,a,s.count(a));s=s.replace(a,b)
 (source/p).write_text(s);changed[p]=sha(s.encode())
 for kind in ['source-snapshot']:
  dest=out/kind/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(s)
reg=json.loads((old/'REGISTERED-METHOD.json').read_text());oldpath=str(old.relative_to(repo));newpath=str(out.relative_to(repo))
for name in ['matrix.mjs','cohort.mjs','run.mjs']:
 s=(old/name).read_text().replace(oldpath,newpath).replace('A5 Hush eligibility22 regression ','A5 committed pattern26 regression ')
 if name=='matrix.mjs':s=s.replace('heldout10001-10500;','acceptance20001-20500 UNUSED;')
 (out/name).write_text(s)
now=datetime.now(timezone.utc).isoformat();reg.update(registeredAt=now,sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
 sourceRoot=str(source),source={p:sha((source/p).read_bytes()) for p in base['source']},changed=changed,
 combatSource={p:sha((source/p).read_bytes()) for p in reg['combatSource']},
 scripts={str((out/n).relative_to(repo)):sha((out/n).read_bytes()) for n in ['matrix.mjs','cohort.mjs']},
 parent=oldpath+'/REGISTERED-METHOD.json',
 method='Current a30757265 plus committed phase on V4 intents. Full1321originalTRAIN1–50cells and90previously earned day7 saves; old current22 controls reused. No stat, equipment, AI, RNG, damage cap, fixture, numeric gate or acceptance change.',
 timing='Boss phase events still resolve immediately; row expansion and phase-dependent summons use phase captured before party actions. Old pending intents with absent phase keep live-phase behavior until next round. New save prefixTHC14; acceptTHC5–13. OFF intents and prefixTHC7 unchanged.',
 decision='Semantic fairness repair, not numeric closure. Review controlled phase/cap/Hush/replay/preview and save checks, all original balance differences and day7 gates before production adoption. Any worsened cohort gate remains a blocker for this isolated adoption; retain candidate and continue independent work.',
 evidence={'reports/cardrpg-big/a5/b1/current-cliffs-24/audit.json':sha((repo/'reports/cardrpg-big/a5/b1/current-cliffs-24/audit.json').read_bytes())})
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
day=json.loads((old/'day7-checks/REGISTERED-METHOD.json').read_text());day.update(registeredAt=now,source=reg['combatSource'],candidate='Current source with round-committed boss pattern',hypothesis='Same90previously earned saved inputs and unchanged route/advice policy; not a fresh45daycohort.',runnerSha256=sha((out/'cohort.mjs').read_bytes()))
(out/'day7-checks').mkdir();(out/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(day,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Committed boss pattern26 — prospective fairness repair

Current24 confirms the phase can change during the same round as a queued signature. Current25 hit envelopes are rejected: hard35/hard45 still48/86pp worst gains, soft25 makes all384before/after cells100%wins. None is combined here. Old A4 latched02 did not close balance; this is explicitly the same semantic repair on the current Hush/anchored source, with complete regression rather than a relabelled cure.

Each V4 intent captures actor.phase when the round starts. Row expansion and Pantry closing summons use that committed phase. Phase events still emit immediately, with truthful next-round copy. Old pending intents lacking phase preserve historical live-phase behavior until the next generated round; THC14 exports the additive field and acceptsTHC5–13. No field, prefix, action, amount or RNG draw changes in OFF.

Before sampling, register the same1321original TRAIN1–50 cells and90already-earned day7 saves. Reuse original22 controls, preserve every negative pair, do not alter selection/weights/kits/scenes. Controlled semantic checks cover crossing during/before a signature, all3bosses, old pending intents, Hush/Drowsy/cap/fatal retaliation, replay/preview consistency and save migrations. AI preview already clones intents, so phase stays consistent without reading presentation events.

No numeric balance closure, fresh45daycohort, or acceptance20001–20500claim. A worsening existing progression gate blocks isolated adoption. Every unchanged miss remains. All source gates/OFF8250/baseline/historical13 and relevant copy checks follow only after a supported candidate. Native single-agent110sleases/7shandoffs; no B/protected edits or model requests.
''')
print(out)
