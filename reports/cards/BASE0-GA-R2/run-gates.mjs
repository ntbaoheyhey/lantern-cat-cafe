import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const card='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GA-R2';
const root='/Users/bao/.codex/worktrees/mega-base0-grade-a-280ff4b/taskbar-hero';
const env={...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',SCREENSHOTS:'0',E2E_PORT_CLASSIC:'4420',E2E_PORT_V2:'4421',E2E_PORT_SERVER:'4422',E2E_PORT_API:'4423'};
const specs='e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts e2e/server/fixture-clock.spec.ts e2e/server/journeys.spec.ts e2e/server/n1-relic-recovery.spec.ts e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts e2e/layout/stage-redraw.spec.ts';
const steps=[['install','pnpm install --frozen-lockfile'],['typecheck','pnpm typecheck'],['lint','pnpm lint'],['unit','pnpm test'],['deno','pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs'],...['1280x720','1600x900'].map(size=>['repeat-'+size,'pnpm test:e2e '+specs+' --repeat-each=10 --workers=1',root+'/apps/web',size])];
fs.mkdirSync(card+'/logs',{recursive:true});
for(const [name,command,cwd=root,size] of steps){
 if(!fs.readFileSync(card+'/CONTROL.md','utf8').startsWith('ACTIVE'))throw new Error('CONTROL stopped');
 const runtime=JSON.parse(fs.readFileSync(card+'/runtime.json'));Object.assign(runtime,{pid:process.pid,step:name,updated_at:new Date().toISOString()});fs.writeFileSync(card+'/runtime.json',JSON.stringify(runtime,null,2));
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).stdout.trim();
 const row={name,command,cwd,head,started_at:new Date().toISOString(),size:size??null,ports:[4420,4421,4422,4423],workers:1};
 const fd=fs.openSync(card+'/logs/'+name+'.log','wx');fs.writeSync(fd,JSON.stringify(row)+'\n');
 const r=spawnSync(command,{cwd,shell:'/bin/bash',env:{...env,...(size?{E2E_VIEWPORT:size}:{})},stdio:['ignore',fd,fd]});
 Object.assign(row,{exit:r.status,signal:r.signal,ended_at:new Date().toISOString()});fs.writeSync(fd,'\n'+JSON.stringify(row)+'\n');fs.closeSync(fd);fs.appendFileSync(card+'/results.jsonl',JSON.stringify(row)+'\n');console.log(name+': '+r.status);
 if(name==='install'&&r.status!==0)break;
}
fs.writeFileSync(card+'/GATES-DONE',new Date().toISOString());
