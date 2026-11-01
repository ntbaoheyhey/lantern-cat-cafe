import fs from 'node:fs';import {spawnSync,execFileSync} from 'node:child_process';
const out=new URL('.',import.meta.url).pathname, root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-mutants-280ff4b/taskbar-hero';
fs.mkdirSync(out+'mutations',{recursive:true});
const gen='scripts/gen-deno-json.mjs',gcmd='node --test scripts/gen-deno-json.test.mjs';
const jobs=[
['deno-root-index',gen,"out[spec(full.slice(0, -3))] = `${spec(full)}`;","if (full !== join(src, 'index.ts')) out[spec(full.slice(0, -3))] = `${spec(full)}`;",gcmd],
['deno-nested-index',gen,"out[spec(full.slice(0, -3))] = `${spec(full)}`;","if (entry.name !== 'index.ts' || dir === src) out[spec(full.slice(0, -3))] = `${spec(full)}`;",gcmd],
['deno-directory-alias',gen,"if (existsSync(join(full, 'index.ts')))","if (false && existsSync(join(full, 'index.ts')))",gcmd],
['deno-ordinary-module',gen,"entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')","entry.name === 'index.ts'",gcmd],
['deno-test-exclusion',gen,"!entry.name.endsWith('.test.ts')","true",gcmd],
['deno-auth-distinction',gen,"name.startsWith('auth-') ? auth : game","game",gcmd],
['deno-stable-order',gen,"a.name.localeCompare(b.name)","b.name.localeCompare(a.name)",gcmd],
['scene-preboot','apps/web/src/game/stage/StageScene.ts','if (!this.sys.isActive()) return;','// removed readiness guard','pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageScene.test.ts'],
['lifecycle-old-game-guard','apps/web/src/game/stage/StageCanvas.tsx','if (retiring.scene.isBooted)','if (retiring.isBooted)','pnpm --filter @taskbar-hero/web exec vitest run src/game/stage/StageCanvas.test.tsx'],
['sql-next-day','supabase/tests/src/fixture-clock.ts','now.getUTCDate() + 1','now.getUTCDate()','pnpm --filter @taskbar-hero/supabase-tests exec vitest run src/fixture-clock.test.ts'],
['sql-claim-rounding','supabase/tests/v2/functions-forge.test.ts','Math.ceil(before.lastClaimMicros / 1000) + 10_000','Math.floor(before.lastClaimMicros / 1000) + 10_000','pnpm --filter @taskbar-hero/supabase-tests exec vitest run v2/functions-forge.test.ts']
];
const rows=[];
function run(name,command){if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8')))throw Error('paused');
const path=out+'mutations/'+name+'.log',fd=fs.openSync(path,'wx');fs.writeSync(fd,JSON.stringify({command,root,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),start:new Date().toISOString(),pid:process.pid})+'\n');
const p=spawnSync('/bin/bash',['-c',command],{cwd:root,env:{...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:''},stdio:['ignore',fd,fd]});fs.writeSync(fd,'\nEXIT_CODE='+p.status+'\n');fs.closeSync(fd);return {exit:p.status,log:path};}
for(const [name,file,before,after,cmd] of jobs){
 const original=fs.readFileSync(root+'/'+file,'utf8');if(!original.includes(before))throw Error('missing selector '+name);
 const control=run(name+'-control',cmd);
 try{fs.writeFileSync(root+'/'+file,original.replace(before,after));fs.writeFileSync(out+'mutations/'+name+'.diff',execFileSync('git',['diff','--',file],{cwd:root}));const mutant=run(name,cmd);rows.push({name,file,command:cmd,control,mutant});}
 finally{fs.writeFileSync(root+'/'+file,original);}
 fs.writeFileSync(out+'unit-mutants.json',JSON.stringify(rows,null,2)+'\n');
}
fs.writeFileSync(out+'mutations/unit-restored-status.txt',execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root}));
