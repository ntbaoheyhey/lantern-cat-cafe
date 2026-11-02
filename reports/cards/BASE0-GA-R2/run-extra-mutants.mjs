import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const card='/Users/bao/.codex/worktrees/mega-ledger/taskbar-hero/reports/cards/BASE0-GA-R2',root='/Users/bao/.codex/worktrees/mega-base0-ga-r2-mutants-280ff4b/taskbar-hero';
function control(){if(!fs.readFileSync(card+'/CONTROL.md','utf8').startsWith('ACTIVE'))throw new Error('Stopped')}
while(!fs.existsSync(card+'/MUTATIONS-DONE')){control();await new Promise(r=>setTimeout(r,2000));}
const env={...process.env,CI:'true',VITE_SUPABASE_URL:'',VITE_SUPABASE_ANON_KEY:'',SCREENSHOTS:'0',E2E_VIEWPORT:'1600x900',E2E_PORT_CLASSIC:'4420',E2E_PORT_V2:'4421',E2E_PORT_SERVER:'4422',E2E_PORT_API:'4423'};
const out=card+'/mutations',results=[];
function run(name,command){control();const row={name,command,cwd:root+'/apps/web',head:'280ff4bed495fd28bd489eb5f2dcfd1910f21fc0',viewport:env.E2E_VIEWPORT,started:new Date().toISOString()};const fd=fs.openSync(out+'/'+name+'.log','wx');fs.writeSync(fd,JSON.stringify(row)+'\n');const r=spawnSync(command,{cwd:row.cwd,shell:'/bin/bash',env,stdio:['ignore',fd,fd]});Object.assign(row,{exit:r.status,signal:r.signal,ended:new Date().toISOString()});fs.writeSync(fd,'\n'+JSON.stringify(row)+'\n');fs.closeSync(fd);results.push(row);fs.writeFileSync(out+'/extra-results.json',JSON.stringify(results,null,2));console.log(name+': '+r.status);return r.status;}
const probe=root+'/apps/web/e2e/ga-r2-viewport.spec.ts';fs.writeFileSync(probe,"import {test,expect} from '@playwright/test';\ntest('grader effective viewport follows requested mission size',async({page})=>{expect(page.viewportSize()).toEqual({width:1600,height:900});});\n");
try{
 const base="pnpm test:e2e e2e/smoke.spec.ts e2e/ga-r2-viewport.spec.ts e2e/ui/baseline-hud.spec.ts --workers=1 -g 'strip renders|grader effective viewport|shared HUD keeps XP and every status chip visible at 1600x900$'";
 if(run('control-extra',base)!==0)throw new Error('Red extra control');
 for(const [name,file,from,to,command] of [
 ['hud-xp-color-exact-selector','apps/web/src/shell/shell.css','.shell-hud .hud-xp-fill { background: var(--good, #6be08a); }','.shell-hud .hud-xp-fill { background: var(--accent, #6be08a); }',"pnpm test:e2e e2e/ui/baseline-hud.spec.ts --workers=1 -g 'shared HUD keeps XP and every status chip visible at 1600x900$'"],
 ['smoke-hardcoded-width','apps/web/e2e/smoke.spec.ts','expect(box?.width).toBe(initialViewport!.width);','expect(box?.width).toBe(1280);','pnpm test:e2e e2e/smoke.spec.ts --workers=1'],
 ['configured-viewport-ignored','apps/web/playwright.config.ts',"const desktopViewport = viewportName === '1600x900'",'const desktopViewport = false','pnpm test:e2e e2e/ga-r2-viewport.spec.ts --workers=1']
 ]){const target=root+'/'+file,original=fs.readFileSync(target,'utf8');if(!original.includes(from))throw new Error('missing '+name);try{fs.writeFileSync(target,original.replace(from,to));fs.writeFileSync(out+'/'+name+'.diff',spawnSync('git',['diff','--',file],{cwd:root,encoding:'utf8'}).stdout);run(name,command);}finally{fs.writeFileSync(target,original);}}
}finally{fs.unlinkSync(probe);}
fs.writeFileSync(out+'/extra-clean-status.txt',spawnSync('git',['status','--porcelain','--untracked-files=no'],{cwd:root,encoding:'utf8'}).stdout);fs.writeFileSync(card+'/EXTRA-DONE',new Date().toISOString());
