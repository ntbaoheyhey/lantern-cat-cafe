import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const card='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GA-R2';
const root='/Users/bao/.codex/worktrees/mega-base0-ga-r2-mutants-280ff4b/taskbar-hero';
const out=card+'/mutations';fs.mkdirSync(out,{recursive:true});
const env={...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',SCREENSHOTS:'0',E2E_VIEWPORT:'1280x720',E2E_PORT_CLASSIC:'4420',E2E_PORT_V2:'4421',E2E_PORT_SERVER:'4422',E2E_PORT_API:'4423'};
const groups={deno:'node --test scripts/gen-deno-json.test.mjs',scene:'pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageScene.test.ts',canvas:'pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageCanvas.test.tsx',date:'pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/fixture-clock.test.ts',insert:'pnpm --filter @taskbar-hero/supabase-tests exec vitest run v2/functions-forge.test.ts -t "seeds inventory across database clock"'};
const gen='scripts/gen-deno-json.mjs',scene='apps/web/src/game/stage/StageScene.ts',canvas='apps/web/src/game/stage/StageCanvas.tsx',date='supabase/tests/src/fixture-clock.ts',insert='supabase/tests/v2/functions-forge.test.ts';
const mutants=[
 ['index-alias','deno',gen,"!entry.name.endsWith('.test.ts')","!entry.name.endsWith('.test.ts') && entry.name !== 'index.ts'"],
 ['directory-alias','deno',gen,"if (existsSync(join(full, 'index.ts')))","if (false && existsSync(join(full, 'index.ts')))"],
 ['test-exclusion','deno',gen,"!entry.name.endsWith('.test.ts')","true"],
 ['fixture-exclusion','deno',gen,"if (entry.name.startsWith('__')) continue;","if (false) continue;"],
 ['stable-order','deno',gen,'a.name.localeCompare(b.name)','b.name.localeCompare(a.name)'],
 ['auth-separation','deno',gen,"name.startsWith('auth-') ? auth : game","false ? auth : game"],
 ['preboot-relayout','scene',scene,'if (!this.sys.isActive()) return;','if (false) return;'],
 ['premature-destruction','canvas',canvas,'if (retiring.scene.isBooted)','if (retiring.isBooted)'],
 ['pending-destruction','canvas',canvas,'if (retiring.scene.isBooted) retiring.step(performance.now(), 0);','if (retiring.scene.isBooted) { /* discarded pending destruction */ }'],
 ['next-db-day','date',date,'now.getUTCDate() + 1','now.getUTCDate()'],
 ['db-anchor-hour','date',date,'now.getUTCDate() + 1, 10','now.getUTCDate() + 1, 9'],
 ['claim-micros-rounding','insert',insert,'Math.ceil(before.lastClaimMicros / 1000) + 10_000','Math.floor(before.lastClaimMicros / 1000) + 10_000'],
 ['claim-clock-max','insert',insert,'Math.max(clock, Math.ceil(before.lastClaimMicros / 1000) + 10_000)','clock']
];
function run(name,command){
 if(!fs.readFileSync(card+'/CONTROL.md','utf8').startsWith('ACTIVE'))throw new Error('Stopped');
 const meta={name,command,head:'280ff4bed495fd28bd489eb5f2dcfd1910f21fc0',cwd:root,started:new Date().toISOString()};
 const fd=fs.openSync(out+'/'+name+'.log','wx');fs.writeSync(fd,JSON.stringify(meta)+'\n');const r=spawnSync(command,{cwd:root,shell:'/bin/bash',env,stdio:['ignore',fd,fd]});fs.writeSync(fd,'\nEXIT='+r.status+' SIGNAL='+r.signal+'\n');fs.closeSync(fd);
 return {...meta,exit:r.status,signal:r.signal,finished:new Date().toISOString()};
}
const controls={};for(const [group,cmd] of Object.entries(groups)){controls[group]=run('control-'+group,cmd);if(controls[group].exit!==0)throw new Error('Red control '+group);}
const results=[];
for(const [name,group,file,from,to] of mutants){const p=root+'/'+file;const original=fs.readFileSync(p,'utf8');if(!original.includes(from))throw new Error('Missing replacement '+name);
 try{fs.writeFileSync(p,original.replace(from,to));fs.writeFileSync(out+'/'+name+'.diff',spawnSync('git',['diff','--',file],{cwd:root,encoding:'utf8'}).stdout);const result=run(name,groups[group]);Object.assign(result,{group,file,greenControl:controls[group].exit===0,expectedFailure:'assertion or exercised lifecycle error; inspect log before counting'});results.push(result);fs.writeFileSync(out+'/unit-results.json',JSON.stringify({controls,results},null,2));console.log(name+': '+result.exit);}finally{fs.writeFileSync(p,original);}}
fs.writeFileSync(out+'/unit-clean-status.txt',spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout);
