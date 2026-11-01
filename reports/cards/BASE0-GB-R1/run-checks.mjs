import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const card = '/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GB-R1';
const root = '/Users/bao/.codex/worktrees/mega-base0-grade-b-5db4949/taskbar-hero';
const env = {...process.env, CI:'true', SCREENSHOTS:'0', VITE_SUPABASE_URL:'', VITE_SUPABASE_ANON_KEY:'', E2E_PORT_CLASSIC:'4430', E2E_PORT_V2:'4431', E2E_PORT_SERVER:'4432', E2E_PORT_API:'4433'};
const specs='e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts';
const jobs=[['install','pnpm install --frozen-lockfile'],['typecheck','pnpm typecheck'],['lint','pnpm lint'],['test','pnpm test'],['deno','pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs'],['repeat-1280','pnpm test:e2e '+specs+' --repeat-each=10 --workers=1', '/apps/web','1280x720'],['repeat-1600','pnpm test:e2e '+specs+' --repeat-each=10 --workers=1', '/apps/web','1600x900'],['stage-1280','pnpm test:e2e e2e/layout/stage-redraw.spec.ts --workers=1','/apps/web','1280x720'],['stage-1600','pnpm test:e2e e2e/layout/stage-redraw.spec.ts --workers=1','/apps/web','1600x900']];
for(const [name,command,suffix='',viewport='1280x720'] of jobs){
 if(!fs.readFileSync(card+'/CONTROL.md','utf8').startsWith('ACTIVE:')){fs.writeFileSync(card+'/PAUSED','control changed');break;}
 const start=new Date().toISOString();
 fs.writeFileSync(card+'/current.json',JSON.stringify({name,command,pid:process.pid,start}));
 const fd=fs.openSync(card+'/logs/'+name+'.log','w');
 const res=spawnSync(command,{cwd:root+suffix,env:{...env,E2E_VIEWPORT:viewport},shell:'/bin/zsh',stdio:['ignore',fd,fd]});
 fs.closeSync(fd);
 fs.appendFileSync(card+'/results.jsonl',JSON.stringify({name,command,cwd:root+suffix,viewport,start,end:new Date().toISOString(),exit:res.status,signal:res.signal,head:'5db4949096e93eedeb98dff94ef1ec7019485f96'})+'\n');
 if(name==='install'&&res.status!==0) break;
}
fs.writeFileSync(card+'/RUNNER_DONE',new Date().toISOString());
