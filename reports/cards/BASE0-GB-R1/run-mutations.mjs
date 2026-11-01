import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const c='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GB-R1';
const w='/Users/bao/.codex/worktrees/mega-base0-grade-b-5db4949/scratch';
const env={...process.env,CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''};
function run(name,command){
 if(!fs.readFileSync(c+'/CONTROL.md','utf8').startsWith('ACTIVE:'))throw Error('PAUSED');
 const f=fs.openSync(c+'/mutations/'+name+'.log','w'), start=new Date().toISOString();
 const r=spawnSync(command,{cwd:w,shell:'/bin/zsh',env,stdio:['ignore',f,f]});fs.closeSync(f);
 const entry={name,command,exit:r.status,signal:r.signal,start,end:new Date().toISOString()};
 fs.appendFileSync(c+'/mutations/results.jsonl',JSON.stringify(entry)+'\n');return r.status;
}
if(run('install','pnpm install --frozen-lockfile')!==0)throw Error('install failed');
const gen='node --test scripts/gen-deno-json.test.mjs';
const stage='pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageScene.test.ts';
const clock='pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/fixture-clock.test.ts v2/functions-forge.test.ts';
const mutants=[
 ['deno-index','scripts/gen-deno-json.mjs',"!entry.name.endsWith('.test.ts')","!entry.name.endsWith('.test.ts') && entry.name !== 'index.ts'",gen],
 ['deno-directory','scripts/gen-deno-json.mjs',"if (existsSync(join(full, 'index.ts')))","if (false)",gen],
 ['deno-test-exclusion','scripts/gen-deno-json.mjs'," && !entry.name.endsWith('.test.ts')","",gen],
 ['deno-fixture-exclusion','scripts/gen-deno-json.mjs',"if (entry.name.startsWith('__')) continue;","",gen],
 ['deno-order','scripts/gen-deno-json.mjs',"a.name.localeCompare(b.name)","b.name.localeCompare(a.name)",gen],
 ['deno-auth','scripts/gen-deno-json.mjs',"name.startsWith('auth-') ? auth : game","game",gen],
 ['stage-preboot','apps/web/src/game/stage/StageScene.ts','    if (!this.sys.isActive()) return;','',stage],
 ['clock-next-day','supabase/tests/src/fixture-clock.ts','now.getUTCDate() + 1','now.getUTCDate()',clock],
 ['clock-fixed-future','supabase/tests/src/fixture-clock.ts','return nextFixtureDayUtc(Number(rows[0]!.millis));','return Date.UTC(2026, 10, 1, 10);',clock],
 ['claim-rounding','supabase/tests/v2/functions-forge.test.ts','Math.ceil(before.lastClaimMicros / 1000) + 10_000','Math.floor(before.lastClaimMicros / 1000) + 10_000',clock],
];
for(const [label,cmd] of [['gen-control-before',gen],['stage-control-before',stage],['clock-control-before',clock]])if(run(label,cmd)!==0)throw Error('control failed');
for(const [name,file,from,to,command]of mutants){
 const path=w+'/'+file,original=fs.readFileSync(path,'utf8');
 const count=original.split(from).length-1;
 if(count!==1){fs.appendFileSync(c+'/mutations/results.jsonl',JSON.stringify({name,setup_error:'selector count '+count})+'\n');continue;}
 try {fs.writeFileSync(path,original.replace(from,to));fs.writeFileSync(c+'/mutations/'+name+'.diff',spawnSync('git',['diff','--',file],{cwd:w,encoding:'utf8'}).stdout);run(name,command);} finally {fs.writeFileSync(path,original);}
}
for(const [label,cmd] of [['gen-control-after',gen],['stage-control-after',stage],['clock-control-after',clock]])run(label,cmd);
fs.writeFileSync(c+'/mutations/final-status.txt',spawnSync('git',['status','--short'],{cwd:w,encoding:'utf8'}).stdout);
fs.writeFileSync(c+'/MUTATIONS_DONE',new Date().toISOString());
