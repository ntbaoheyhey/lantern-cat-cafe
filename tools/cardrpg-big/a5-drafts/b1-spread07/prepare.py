from pathlib import Path
import shutil,json,hashlib,datetime
repo=Path('/Users/bao/taskbar-hero-cardrpg-a4');root=Path('/tmp/cardrpg-a5-encounter-spread-07');out=repo/'reports/cardrpg-big/a5/b1/encounter-spread-07';out.mkdir(parents=True,exist_ok=True)
base=Path('/tmp/cardrpg-a5-band-ramp-02/linear/source');source=root/'base';shutil.copytree(base,source,dirs_exist_ok=True)
pacing=Path('packages/game-rules/src/cardrpg/depth/pacing-v4.ts');(source/pacing).write_bytes((repo/pacing).read_bytes())
for name in ['battle.ts','contract.ts']:
 rel=Path('packages/game-rules/src/cardrpg/depth')/name
 (source/rel).write_bytes((Path('/tmp/cardrpg-a5-tie-noise-06/noise12')/rel).read_bytes())
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'trainingSeeds':'1..50','acceptance':'20001..20500 UNUSED','variants':{}}
for name,spread in [('spread30',.3),('spread50',.5)]:
 src=root/name/'source';shutil.copytree(source,src,dirs_exist_ok=True)
 rel=Path('packages/game-rules/src/cardrpg/depth/battle.ts');s=(src/rel).read_text();needle='  const b: Battle = {version:CONTRACT_VERSION'
 assert s.count(needle)==1
 code=f'''  // TRAIN-only candidate: one gear-independent encounter draw; replay uses the same seed.
  if(setup.gameplayV4&&!setup.tutorial) {{
    const factor=1-{spread}+2*{spread}*new Rng(deriveSeed(setup.seed,732517)).int(0,1000000)/1000000;
    for(const actor of actors)if(actor.side==='enemy'&&ENEMY_BY_ID[actor.catalogId]?.tier==='boss')actor.attack=Math.max(1,Math.round(actor.attack*factor));
  }}
'''
 s=s.replace(needle,code+needle);s+='\nexport const A5_TRAIN_SPREAD = '+str(spread)+';\n';(src/rel).write_text(s)
 matrix=Path('/tmp/cardrpg-a5-band-ramp-02/linear/matrix.mjs').read_text();needle='const rows=cp.rows??[]'
 matrix=matrix.replace(needle,f'assert.equal(R.A5_TRAIN_SPREAD,{spread});\n'+needle)
 (root/name/'matrix.mjs').write_text(matrix)
 manifest['variants'][name]={'spread':spread,'source':{str(f.relative_to(src)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((src/'packages/game-rules/src/cardrpg').rglob('*.ts')) if not f.name.endswith('.test.ts')},'matrixSha256':hashlib.sha256(matrix.encode()).hexdigest()}
 (out/name).mkdir(exist_ok=True);(out/name/'battle.ts.txt').write_text(s)
(out/'REGISTERED-METHOD.json').write_text(json.dumps(manifest,indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# Encounter pressure spread07 — TRAIN diagnostic only

Registered before sampling. Prior corrected weight2/sig100 pressure redistributed lethal row sweeps but left50/384 fourth-slot misses (worst38pp) and cats45.25–78.40%. Near-tie preference noise did not solve the discontinuity. This new diagnostic tests correlated encounter pressure rather than per-decision noise: a fixed seed-derived boss attack multiplier uniform[.7,1.3] or[.5,1.5]. Mean1, one independent draw per encounter, shared by every paired build; no gear/account/draw-conditioned tuning, no forced outcomes. Original production gear, policy, kits, challenge bands and fixture power budgets stay fixed. Base combat is exactly the earlier weight2/sig100 candidate with latched phase; not production.

First run all384 fourth-slot cells atTRAIN1–50; keep every loss and both-arm saturation. Only a variant with worst gain<=16pp and fewer than50 saturated after-arms proceeds to the original210 tiers/bands/farming,64 sets and663 teams/crew TRAIN cases, unchanged. This diagnostic expansion rule is not the12pp acceptance gate. Do not run fresh20001–20500. Replay first seed of every cell, assert executed exported spread, hash every actual source.110second shared-lock slices,7second handoffs. No browsers.

This is a causal diagnostic, not permission to conceal encounter difficulty or adoption. Any adoption would first require visible fixed enemy stats in Prepare, unchanged paired-seed behavior under gear changes, old-save/replay compatibility, the full500seed TRAIN suite and separately registered fresh acceptance. Larger seed variation may weaken player predictability; that cost must be reviewed, not called fairness automatically. All prior failed candidates remain retained.
''')
(root/'run.mjs').write_text('''import {spawn} from 'node:child_process';import {mkdir,open,readFile} from 'node:fs/promises';import {setTimeout as delay} from 'node:timers/promises';
const root='/tmp/cardrpg-a5-encounter-spread-07',base='reports/cardrpg-big/a5/b1/encounter-spread-07';
for(const variant of ['spread30','spread50']){
 const out=base+'/'+variant+'/equipped';await mkdir(out,{recursive:true});let code,slice=1;
 do{const fd=await open(`${out}/slice-${slice++}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 encounter pressure TRAIN '+variant,process.execPath,root+'/'+variant+'/matrix.mjs'],{env:{...process.env,BIG_RULES_ROOT:root+'/'+variant+'/source',BIG_BALANCE_SCOPE:'equipped',BIG_BALANCE_OUT:out,BIG_BALANCE_SAMPLE:'pilot',BIG_BALANCE_COUNT:'50'},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}console.log(JSON.stringify({variant,slice:slice-1,code}));await delay(7000);}while(code===75);
 if(code!==0){process.exitCode=code;break;}
}
''')
print('Registered both variants; no sampling yet')
