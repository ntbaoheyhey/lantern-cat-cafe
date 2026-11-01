import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';
const out=new URL('.',import.meta.url).pathname,root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-mutants-280ff4b/taskbar-hero',file=root+'/apps/web/e2e/smoke.spec.ts';
const original=fs.readFileSync(file,'utf8');fs.mkdirSync(out+'e2e-4450-4454.lock');
const command='pnpm test:e2e e2e/smoke.spec.ts --workers=1';
async function run(name){
 if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8')))throw Error('paused');
 const log=out+'mutations/'+name+'.log',fd=fs.openSync(log,'wx');fs.writeSync(fd,JSON.stringify({command,root,viewport:'1600x900',head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()})+'\n');
 const env={...process.env,CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_VIEWPORT:'1600x900',E2E_PORT_CLASSIC:'4450',E2E_PORT_V2:'4451',E2E_PORT_SERVER:'4452',E2E_PORT_API:'4453'};
 const p=spawn('/bin/bash',['-c',command],{cwd:root+'/apps/web',env,stdio:['ignore',fd,fd]});const rp=out+'runtime.json';fs.writeFileSync(rp,JSON.stringify({...JSON.parse(fs.readFileSync(rp)),step:name,pids:[process.pid,p.pid],updated_at:new Date().toISOString()},null,2)+'\n');
 const exit=await new Promise(r=>p.on('exit',r));fs.writeSync(fd,'\nEXIT_CODE='+exit+'\n');fs.closeSync(fd);return {exit,log};
}
try{
 const control=await run('viewport-smoke-control');
 const needle='expect(box?.width).toBe(initialViewport!.width);';if(!original.includes(needle))throw Error('selector missing');
 fs.writeFileSync(file,original.replace(needle,'expect(box?.width).toBe(1280);'));
 fs.writeFileSync(out+'mutations/viewport-smoke.diff',execFileSync('git',['diff','--','apps/web/e2e/smoke.spec.ts'],{cwd:root}));
 const mutant=await run('viewport-smoke-fixed-width');fs.writeFileSync(out+'viewport-mutant.json',JSON.stringify({name:'viewport-smoke-fixed-width',file:'apps/web/e2e/smoke.spec.ts',command,control,mutant},null,2)+'\n');
}finally{fs.writeFileSync(file,original);fs.rmdirSync(out+'e2e-4450-4454.lock');}
