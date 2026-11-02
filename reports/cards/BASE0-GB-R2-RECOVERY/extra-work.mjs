import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';
const out=new URL('.',import.meta.url).pathname,root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-mutants-280ff4b/taskbar-hero';
function control(){if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8')))throw Error('paused');}
while(!fs.existsSync(out+'UI-DONE')){control();await new Promise(r=>setTimeout(r,5000));}
const specs='e2e/ui/u2-hud.spec.ts e2e/ui/u3-layout.spec.ts e2e/ui/baseline-hud.spec.ts e2e/ui/f3-art.spec.ts e2e/ui/g1-perf.spec.ts e2e/ui/g3-combat.spec.ts e2e/v2/errors-notice.spec.ts';
const originals=new Map(execFileSync('git',['ls-files','reports'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(p=>p.endsWith('.png')).map(p=>[p,fs.readFileSync(root+'/'+p)]));
const rows=[];
try{
 for(const size of ['1280x720','1600x900']){
  control();const dir=root+'/.grade-optin/'+size;fs.mkdirSync(dir,{recursive:true});
  const command='pnpm test:e2e '+specs+' --workers=1',log=out+'logs/optin-existing-hud-'+size+'.log',fd=fs.openSync(log,'wx');
  fs.writeSync(fd,JSON.stringify({command,root,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),viewport:size,start:new Date().toISOString(),SCREENSHOTS:'1',SCREENSHOT_DIR:dir,REPORT_DIR:dir})+'\n');
  const env={...process.env,CI:'true',SCREENSHOTS:'1',SCREENSHOT_DIR:dir,REPORT_DIR:dir,VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_VIEWPORT:size,E2E_PORT_CLASSIC:'4450',E2E_PORT_V2:'4451',E2E_PORT_SERVER:'4452',E2E_PORT_API:'4453'};
  const p=spawn('/bin/bash',['-c',command],{cwd:root+'/apps/web',env,stdio:['ignore',fd,fd]});
  const runtime=out+'runtime.json';fs.writeFileSync(runtime,JSON.stringify({...JSON.parse(fs.readFileSync(runtime)),step:'opt-in and original HUD '+size,extra_pid:process.pid,extra_child:p.pid,updated_at:new Date().toISOString()},null,2)+'\n');
  const exit=await new Promise(r=>p.on('exit',r));fs.writeSync(fd,'\nEXIT_CODE='+exit+'\n');fs.closeSync(fd);
  const files=fs.readdirSync(dir).map(name=>({name,bytes:fs.statSync(dir+'/'+name).size}));
  for(const [path,bytes] of originals)if(!fs.readFileSync(root+'/'+path).equals(bytes))fs.copyFileSync(root+'/'+path,dir+'/'+path.replaceAll('/','_'));
  rows.push({size,command,exit,log,files,pngBudgetPass:files.filter(x=>x.name.endsWith('.png')).every(x=>x.bytes<200*1024)});
  fs.writeFileSync(out+'optin-results.json',JSON.stringify(rows,null,2)+'\n');
 }
}finally{for(const [path,bytes] of originals)fs.writeFileSync(root+'/'+path,bytes);}
fs.writeFileSync(out+'EXTRA-DONE','complete\n');
