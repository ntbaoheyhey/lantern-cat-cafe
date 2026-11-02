import fs from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
const out = new URL('.',import.meta.url).pathname;
const root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-280ff4b/taskbar-hero';
const runtime=()=>JSON.parse(fs.readFileSync(out+'runtime.json'));
function update(data){fs.writeFileSync(out+'runtime.json',JSON.stringify({...runtime(),...data,updated_at:new Date().toISOString()},null,2)+'\n');}
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const specs='e2e/smoke.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts e2e/server/fixture-clock.spec.ts e2e/server/journeys.spec.ts e2e/server/n1-relic-recovery.spec.ts e2e/layout/resize-burst.spec.ts e2e/layout/resize.spec.ts e2e/layout/stage-redraw.spec.ts';
const jobs=[
['pnpm-version','pnpm --version'],
['install','pnpm install --frozen-lockfile'],
['typecheck','pnpm typecheck'],
['lint','pnpm lint'],
['unit','pnpm test'],
['deno','pnpm gen:deno && git diff --exit-code -- supabase/functions && node scripts/check-deno-imports.mjs'],
...['1280x720','1600x900'].map(size=>['repeat-'+size,'pnpm test:e2e '+specs+' --repeat-each=10 --workers=1',root+'/apps/web',size])
];
update({pid:process.pid,pids:[process.pid],step:'core and repeats'});
for(const [name,command,cwd=root,viewport='1280x720'] of jobs){
 if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8'))){update({status:'PAUSED'});process.exit(2);}
 const log=out+'logs/'+name+'.log';
 const fd=fs.openSync(log,'wx');
 const start=new Date().toISOString();
 const env={...process.env,CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_VIEWPORT:viewport,E2E_PORT_CLASSIC:'4450',E2E_PORT_V2:'4451',E2E_PORT_SERVER:'4452',E2E_PORT_API:'4453'};
 const meta={name,command,cwd,head,viewport,start,log,workers:1};
 fs.writeSync(fd,JSON.stringify(meta)+'\n');
 const child=spawn('/bin/bash',['-c',command],{cwd,env,stdio:['ignore',fd,fd]});
 update({step:name,pids:[process.pid,child.pid]});
 const code=await new Promise(resolve=>child.on('exit',resolve));
 fs.writeSync(fd,'\nEXIT_CODE='+code+'\n');fs.closeSync(fd);
 fs.appendFileSync(out+'results.jsonl',JSON.stringify({...meta,exit_code:code,end:new Date().toISOString()})+'\n');
 if(name==='install'&&code!==0)process.exit(code);
}
update({step:'core and repeats finished',pids:[]});
fs.writeFileSync(out+'PIPELINE-DONE','complete\n');
