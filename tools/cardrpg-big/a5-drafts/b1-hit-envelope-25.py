"""Register current-source boss hit envelopes before sampling; no runtime edits."""
from pathlib import Path
from datetime import datetime, timezone
import json,hashlib,subprocess,shutil
repo=Path.cwd();out=repo/'reports/cardrpg-big/a5/b1/hit-envelope-25';root=Path('/tmp/cardrpg-a5-hit-envelope-25')
assert not out.exists() and not root.exists()
out.mkdir(parents=True);root.mkdir()
sha=lambda x:hashlib.sha256(x).hexdigest()
parent=repo/'reports/cardrpg-big/a5/b1/current-cliffs-24'
reg=json.loads((parent/'REGISTERED-METHOD.json').read_text())
for p,d in reg['source'].items():assert sha((repo/p).read_bytes())==d,p
source=root/'source';shutil.copytree(repo/'packages/game-rules/src',source/'packages/game-rules/src')
base='packages/game-rules/src/cardrpg/depth/battle.ts';text=(repo/base).read_text()
needle="  if (b.v4 && cover && target.row==='rear' && living(b,target.side).some(a=>a.row==='front')) {"
assert text.count(needle)==1
variants={}
for name,knee,slope in [('hard35',.35,0),('hard45',.45,0),('soft25',.25,.25)]:
 code=f'''  // TRAIN-only envelope before cover/shields: all boss direct hits, both phases.
  if (b.v4 && source.side==='enemy' && target.side==='party' && ENEMY_BY_ID[source.catalogId]?.tier==='boss') {{
    const knee=target.maxHp*{knee};
    if(amount>knee) amount=Math.max(1,Math.round(knee+(amount-knee)*{slope}));
  }}
'''
 data=text.replace(needle,code+needle)+f'\nexport const A5_HIT_ENVELOPE25 = "{name}";\n'
 path=out/(name+'-battle.ts.txt');path.write_text(data)
 variants[name]={'knee':knee,'slope':slope,'path':str(path.relative_to(repo)),'sha256':sha(data.encode())}
original=repo/reg['original']['path'];data=json.loads(original.read_text())
method={'registeredAt':datetime.now(timezone.utc).isoformat(),'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),
 'sourceRoot':str(source),'source':reg['source'],'count':50,'seedOffset':0,'keys':[r['key'] for r in data['rows']],
 'original':reg['original'],'variants':variants,'tools':{},
 'method':'All384 original fourth-slot TRAIN1–50 pairs on current copy/Hush/anchored source; only boss-to-party direct-hit envelope before cover and shields differs. Three fixed arms: hard35%maxHP, hard45%, soft25%knee with25%excess slope. Original stats, AI, phase, targeting, random draws, equipment, save fields and fixtures unchanged. Existing control reused, no acceptance.',
 'decision':'Retain every arm and pair; report worst gain, all >12pp, both >=95% win and <=5% win saturation. No adoption from selected residuals. An arm advances only if all384 gains <=16pp and neither win/loss saturation count exceeds control, a diagnostic screen not a relaxed12pp gate. Any advance needs tiers/bands, sets/teams,500TRAIN and earned regression before acceptance.',
 'mechanism':'Prevent unusually large repeated boss blows from making one defense piece buy an entire extra guardian turn. Hard and soft envelopes compare bounded burst versus a graded tail. The cap may weaken guardian defense identity or trivially ease combat; those are rejection reasons, not hidden costs.'}
assert len(method['keys'])==384
(out/'REGISTERED-METHOD.json').write_text(json.dumps(method,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Boss hit envelope25 — prospective TRAIN diagnostic

The completed current24 diagnostic retains68residuals and20,400component battles. Current chapter2's worst main-only gain is70pp; set4 alone is zero in all22chapter2 residuals. The losing guardian can die immediately before its next teamwide shield. No set, gear, AI, boss stat or gate has been changed.

Register all384original fourth-slot cells, TRAIN1–50 paired seeds, current copy/Hush/anchored source. Test three isolated envelopes for direct boss damage to party cats before cover and shields: hard35%maxHP, hard45%maxHP, and25%maxHP knee plus25%of excess. All other source, phase timing, targeting, RNG calls, stats, kits and equipment remain exact. Existing control outcomes are reused, never resampled. Exported candidate identity and exact-once overlay checks prevent a silent ignored transform.

Retain every outcome, negative gain and both >=95%win/<=5%win saturation counts. Only an arm with worstgain<=16pp and neither saturation count above control advances to the original wider TRAINmatrix; this is a diagnostic screen, not the12pp acceptance threshold. Even an advancing arm needs500TRAIN, tier/band, crew/set/niche, earned-path and forecast checks before any adoption. Hard cap costs include compressed defense identity; weaker boss pressure may merely saturate wins. Neither is called fairness.

Native headless single-agent;110second leases/sevensecond handoffs. No model call, runtime/save/schema change, acceptance20001–20500or gate movement. All previous failures remain retained.
''')
print(out)
