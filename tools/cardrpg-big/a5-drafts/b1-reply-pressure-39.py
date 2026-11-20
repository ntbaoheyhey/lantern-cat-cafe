# REFERENCE: PROMPT-A5 B1. Register a finite current-source TRAIN diagnostic before samples.
import datetime, hashlib, json, shutil, subprocess
from pathlib import Path
root=Path.cwd(); out=root/'reports/cardrpg-big/a5/b1/reply-pressure-39'; scratch=Path('/tmp/cardrpg-a5-reply-pressure-39')
assert not out.exists() and not scratch.exists(), 'Never overwrite an attempt'
out.mkdir(parents=True);scratch.mkdir()
sha=lambda b:hashlib.sha256(b).hexdigest()
prior=root/'reports/cardrpg-big/a5/b1/queued-reply-34'; parent=json.loads((prior/'REGISTERED-METHOD.json').read_text())
policy='packages/game-rules/src/cardrpg/depth/policies.ts'; battle='packages/game-rules/src/cardrpg/depth/battle.ts'
full=(prior/'source-snapshot'/policy).read_bytes()
assert sha(full)==parent['source'][policy]
for p,h in parent['source'].items():
 if p!=policy: assert sha((root/p).read_bytes())==h,p
now=datetime.datetime.now(datetime.timezone.utc).isoformat();arms=[]
for name,multiplier in [('pressure115',1.15),('pressure130',1.30),('pressure145',1.45)]:
 arm=out/name;arm.mkdir(); source=scratch/name/'source';shutil.copytree(root/'packages/game-rules/src',source/'packages/game-rules/src')
 (source/policy).write_bytes(full)
 s=(source/battle).read_text();marker='    b.maxEnergy=0;';assert s.count(marker)==1
 s=s.replace(marker,marker+f"\n    // Registered diagnostic39: compensate stronger automatic defense with boss pressure.\n    if(!setup.tutorial)for(const a of actors)if(a.side==='enemy'&&ENEMY_BY_ID[a.catalogId]?.tier==='boss')a.attack=Math.round(a.attack*{multiplier});")
 (source/battle).write_text(s)
 for p in [policy,battle]:
  dest=arm/'source-snapshot'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source/p,dest)
 files={p:sha((source/p).read_bytes()) for p in parent['source']};combat={p:files[p] for p in parent['combatSource']}
 assert {p for p in files if files[p]!=sha((root/p).read_bytes())}=={policy,battle}
 matrix=(prior/'matrix.mjs').read_text().replace('queued-reply-34','reply-pressure-39/'+name)
 (arm/'matrix.mjs').write_text(matrix)
 reg={**parent,'registeredAt':now,'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceRoot':str(source),'source':files,'combatSource':combat,'scopes':{'equipped':384},'scripts':{str((arm/'matrix.mjs').relative_to(root)):sha(matrix.encode())},'savedInputs':{},'parent':str((prior/'REGISTERED-METHOD.json').relative_to(root)),'changed':{p:files[p] for p in [policy,battle]},'multiplier':multiplier,
 'method':'Exact full-value/all-survivor-guard AI34, plus fixed V4 non-tutorial boss attack multiplier at actor creation. No fixture, RNG, other stats, phase, gear, reward or save change. Current production source differs only in these two isolated files.',
 'decision':'TRAIN screening only. Expand only if worst fourth-slot gain <=18pp, mean before win rate 35-75%, and saturated before/after cell counts <=84/105 (current22 counts). Expansion requires a separately registered exact-prefix 500TRAIN confirmation and all original gates/day7 on this source; no automatic adoption.'}
 (arm/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n');arms.append(name)
(out/'REGISTERED-METHOD.md').write_text('''# Reply-aware pressure39: prospective finite TRAIN diagnostic

The full-value queued-reply34 policy uses all living allies to guard its private queue and passes the no-round-transition observer. It removes the measured equipment cliff by making364/384 three-piece builds and384/384 completed builds nearly certain wins. Emergency35 leaves96equipment misses and still makes heavy day7 first wins30/30. Neither is production.

Test whether stronger **gameplay** boss pressure can compensate the full policy's survival improvement without restoring its equipment cliff. Three fixed arms multiply only V4 non-tutorial boss attack at actor creation by1.15,1.30,1.45, on exact corrected34 policy and current production rules. No new randomness, future ally action, live-phase correction, gear nerf, fixture change or gate change. All other source hashes must equal current production. This revisits the early response/pressure hypothesis with the corrected current-source queue semantics and **all384** cases; old04 used31selected historical residuals and remains rejected.

Before outcome screening, verify source-bound immutable/legal/deterministic choices, six complete replay examples,45exact OFF hashes, correct boss-only scaling, nonboss/tutorial actors unchanged, and the bounded-round observer with whole-battle parity. The old first-fatal-prefix hashes are not comparable after changing initial boss attack; do not claim them.

Screen all384fourth-slot pairs at unchanged TRAIN1–50. Reuse current22 and corrected34 controls with provenance; never rerun or discard them. Record before/after wins, paired improvements/worsenings, intervals and saturation. Advance only if worst gain<=18pp (precision follow-up screen, not the12pp acceptance gate), mean before35–75%, and >=95%-win counts no greater than current22's84before/105after. All surviving arms need separately registered exact-prefix500TRAIN confirmation plus tiers/bands/cats/sets/crews and90same-band earned-input checks. No automatic production adoption.

Register immutable source/script hashes before samples, then use110second shared-lock slices and7second handoffs. Preserve failures and negative pairs. This is not fresh acceptance, a new45-day cohort, or a human playtest; seeds20001–20500 remain unused.
''')
(out/'arms.json').write_text(json.dumps(arms)+'\n')
print(json.dumps({'registered':str(out),'arms':arms,'productionUnchanged':True}))
