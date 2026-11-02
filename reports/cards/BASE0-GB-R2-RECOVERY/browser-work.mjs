import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';
const out=new URL('.',import.meta.url).pathname,root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-mutants-280ff4b/taskbar-hero',web=root+'/apps/web';
const env={...process.env,CI:'true',SCREENSHOTS:'0',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',E2E_VIEWPORT:'1280x720',E2E_PORT_CLASSIC:'4450',E2E_PORT_V2:'4451',E2E_PORT_SERVER:'4452',E2E_PORT_API:'4453'};
const rows=[];fs.mkdirSync(out+'mutations',{recursive:true});
function update(step,child){const p=out+'runtime.json';fs.writeFileSync(p,JSON.stringify({...JSON.parse(fs.readFileSync(p)),step,browser_pid:process.pid,browser_child:child,updated_at:new Date().toISOString()},null,2)+'\n');}
function check(){if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8')))throw Error('paused');}
async function run(name,command,extra={}){
 check();const log=out+'mutations/'+name+'.log',fd=fs.openSync(log,'wx');
 fs.writeSync(fd,JSON.stringify({command,cwd:web,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),start:new Date().toISOString(),extra})+'\n');
 const p=spawn('/bin/bash',['-c',command],{cwd:web,env:{...env,...extra},stdio:['ignore',fd,fd]});update(name,p.pid);
 const code=await new Promise(r=>p.on('exit',r));fs.writeSync(fd,'\nEXIT_CODE='+code+'\n');fs.closeSync(fd);return {exit:code,log};
}
function replace(file,a,b){const old=fs.readFileSync(root+'/'+file,'utf8');if(!old.includes(a))throw Error('selector missing '+file);fs.writeFileSync(root+'/'+file,old.replace(a,b));return()=>fs.writeFileSync(root+'/'+file,old);}
const e2e=(spec,grep='')=>'pnpm test:e2e '+spec+' --workers=1'+(grep?" --grep '"+grep+"'":'');
async function mutant(name,file,a,b,cmd,control,extra={}){
 const restore=replace(file,a,b);try{fs.writeFileSync(out+'mutations/'+name+'.diff',execFileSync('git',['diff','--',file],{cwd:root}));const result=await run(name,cmd,extra);rows.push({name,file,command:cmd,control,mutant:result});}finally{restore();}
 fs.writeFileSync(out+'browser-mutants.json',JSON.stringify(rows,null,2)+'\n');
}
while(!fs.existsSync(out+'PIPELINE-DONE')){check();await new Promise(r=>setTimeout(r,5000));}
const clock=e2e('e2e/server/fixture-clock.spec.ts');
const clockControl=await run('clock-control',clock);
await mutant('clock-moving-origin','apps/web/e2e/support/server-fixture.ts','await page.clock.install({ time: new Date(0) });\n  await page.clock.pauseAt(new Date());','await page.clock.install();\n  await page.clock.pauseAt(await page.evaluate(() => Date.now()));',clock,clockControl);
const hud=e2e('e2e/ui/baseline-hud.spec.ts','shared HUD keeps XP and every status chip visible at 1280x720$');
const hudControl=await run('hud-control',hud);
await mutant('hud-shared-style','apps/web/src/shell/Hud.tsx',"import '../layout/hud/hud.css';",'',hud,hudControl);
await mutant('hud-xp-width','apps/web/src/shell/shell.css','grid-template-columns: auto 160px auto;','grid-template-columns: auto 8px auto;',hud,hudControl);
await mutant('hud-guidance-hidden','apps/web/src/shell/shell.css','.shell-context {\n  display: flex;','.shell-context {\n  display: none;',hud,hudControl);
const artifactCases=[
['f3-png','apps/web/e2e/ui/f3-art.spec.ts',"const writeScreenshots = process.env.SCREENSHOTS === '1';","const writeScreenshots = true;",'e2e/ui/f3-art.spec.ts','F3 chapter 1 roster'],
['error-png','apps/web/e2e/v2/errors-notice.spec.ts',"if (process.env.SCREENSHOTS === '1') {","if (true) {",'e2e/v2/errors-notice.spec.ts','T1-T5:'],
['f3-metrics','apps/web/e2e/ui/f3-art.spec.ts',"test.info().outputPath('bake-metrics.json')","resolve(process.env.SCREENSHOT_DIR!, 'bake-metrics.json')",'e2e/ui/f3-art.spec.ts','F3 canvas bake'],
['g1-metrics','apps/web/e2e/ui/g1-perf.spec.ts',"test.info().outputPath('metrics.json')","path.resolve(process.env.SCREENSHOT_DIR!, 'metrics.json')",'e2e/ui/g1-perf.spec.ts','G1 demo'],
['g3-metrics','apps/web/e2e/ui/g3-combat.spec.ts',"test.info().outputPath('frame-metrics.json')","resolve(process.env.SCREENSHOT_DIR!, 'frame-metrics.json')",'e2e/ui/g3-combat.spec.ts','G3 stage frame']
];
for(const [name,file,a,b,spec,grep] of artifactCases){
 const dir=out+'mutations/artifact-'+name;fs.mkdirSync(dir,{recursive:true});const cmd=e2e(spec,grep);
 const extra={SCREENSHOT_DIR:dir,REPORT_DIR:''};const control=await run(name+'-control',cmd,extra);control.contract_exit=fs.readdirSync(dir).length?1:0;
 const restore=replace(file,a,b);
 try{fs.writeFileSync(out+'mutations/'+name+'.diff',execFileSync('git',['diff','--',file],{cwd:root}));const result=await run(name,cmd,extra);result.files=fs.readdirSync(dir);result.contract_exit=result.files.length?1:0;rows.push({name,file,command:cmd,control,mutant:result,oracle:'No report artifact without opt-in. Browser exit and artifact contract exit are separate.'});}
 finally{restore();}
 fs.writeFileSync(out+'browser-mutants.json',JSON.stringify(rows,null,2)+'\n');
}
// The effects helper is candidate code with only the reserved listen port substituted.
const helper=web+'/tools/.grade-b-effects.mjs';
fs.writeFileSync(helper,fs.readFileSync(web+'/tools/effects-test.mjs','utf8').replace('const port = 5198','const port = 4454'));
const fx='node tools/.grade-b-effects.mjs ';
const effectControl=await run('effects-control-1280',fx+out+'effects-1280x720 --viewport=1280x720');
await mutant('effects-inert-help','apps/web/src/shell/Rail.tsx','onClick={() => onSelectScreen(id)}',"onClick={() => { if (id !== 'help') onSelectScreen(id); }}",fx+out+'mutations/effects-inert-help --viewport=1280x720',effectControl);
await run('effects-control-1600',fx+out+'effects-1600x900 --viewport=1600x900');
fs.unlinkSync(helper);
fs.writeFileSync(out+'mutations/browser-restored-status.txt',execFileSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root}));
fs.writeFileSync(out+'BROWSER-DONE','complete\n');update('browser mutants/effects complete',null);
