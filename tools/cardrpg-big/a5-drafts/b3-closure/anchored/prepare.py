from pathlib import Path
import shutil,json,hashlib,datetime
repo=Path('/Users/bao/taskbar-hero-cardrpg-a4'); root=Path('/tmp/cardrpg-a5-band-anchored-03'); out=repo/'reports/cardrpg-big/a5/b3/band-anchored-03'; out.mkdir(parents=True,exist_ok=True)
src=root/'source'; shutil.copytree(Path('/tmp/cardrpg-a5-band-ramp-02/linear/source'),src,dirs_exist_ok=True)
p=Path('packages/game-rules/src/cardrpg/depth/pacing-v4.ts'); original=(repo/p).read_text()
candidate=original.replace("const growth=(1+(level-1)*.012)*(level>=6?1.12:1);", "const training=level<=5?0:Math.min(1,.6+(level-6)*.1);\n const growth=(1+(level-1)*.012)*(1+.12*training);").replace("*(level>=6?1.15:1):1;","*(1+.15*training):1;")
assert candidate!=original
(src/p).write_text(candidate)
script=Path('/tmp/cardrpg-a5-band-ramp-02/linear/cohort.mjs').read_text(); (root/'cohort.mjs').write_text(script)
reg=json.loads((repo/'reports/cardrpg-big/a5/b3/linear-validation-01/day7-checks/REGISTERED-METHOD.json').read_text())
reg['registeredAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();reg['inputs']='reports/cardrpg-big/a5/e2/economy/day7';reg['candidate']='anchored60'
reg['hypothesis']='The linear1..10 ramp raises bands2..5 and lowers early campaign clears in the already complete casual/regular training cohorts. Preserve bands1..5 and10..50 exactly; reduce only6..9 using training weights .6/.7/.8/.9. This retains more day7 pressure than the rejected6..10 ramp, while removing40% of the abrupt extra band6 multipliers. Same original90earned snapshots and route seeds; no fresh earned progression or acceptance claim.'
reg['source']={str(f.relative_to(src)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted((src/'packages/game-rules/src/cardrpg').rglob('*.ts')) if not f.name.endswith('.test.ts')}
reg['source']['packages/game-rules/src/rng.ts']=hashlib.sha256((src/'packages/game-rules/src/rng.ts').read_bytes()).hexdigest()
reg['runnerSha256']=hashlib.sha256(script.encode()).hexdigest()
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2))
(out/'REGISTERED-METHOD.md').write_text('# Anchored early-band TRAIN diagnostic03\n\nRegistered before sampling; original90 E2 earned day7 saves and unchanged route/advice policy.\n'+reg['hypothesis']+'\n\nNo production adoption. All prior attempts retained. First execute a formula/parity audit; then the90-account diagnostic in110second shared-lock slices with7second handoffs. If any gate misses, retain it; no seed rerolls. New20001–20500 stays untouched.\n')
(out/'candidate-pacing-v4.ts.txt').write_text(candidate)
(root/'run.mjs').write_text('''import {spawn} from 'node:child_process';
import {open} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const root='/tmp/cardrpg-a5-band-anchored-03',out='reports/cardrpg-big/a5/b3/band-anchored-03';
let code,slice=1;
do{const fd=await open(`${out}/slice-${slice++}.log`,'wx');try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,['tools/cardrpg-big/with-timing-lock.mjs','A5 anchored early-band TRAIN',process.execPath,root+'/cohort.mjs'],{env:{...process.env,BIG_RULES_ROOT:root+'/source',A5_DAY7_OUT:out},stdio:['ignore',fd.fd,fd.fd]});p.on('error',reject);p.on('close',done);});}finally{await fd.close();}console.log(JSON.stringify({slice:slice-1,code}));if(code===75)await delay(7000);}while(code===75);
process.exitCode=code??1;
''')
print('Registered',out)
