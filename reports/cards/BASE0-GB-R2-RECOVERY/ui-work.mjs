import fs from 'node:fs';import {spawn,execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
const out=new URL('.',import.meta.url).pathname,root='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-280ff4b/taskbar-hero',scratch='/Users/bao/.codex/worktrees/mega-base0-grade-b-recovery-mutants-280ff4b/taskbar-hero';
function control(){if(/^(STOP|PAUSE)/im.test(fs.readFileSync(out+'CONTROL.md','utf8')))throw Error('paused');}
const update=step=>{const p=out+'runtime.json';fs.writeFileSync(p,JSON.stringify({...JSON.parse(fs.readFileSync(p)),step,ui_pid:process.pid,updated_at:new Date().toISOString()},null,2)+'\n');};
while(!fs.existsSync(out+'BROWSER-DONE')){control();await new Promise(r=>setTimeout(r,5000));}
const require=createRequire(root+'/apps/web/package.json');const {chromium,expect}=require('@playwright/test');const {createServer,preview}=require('vite');
const manifest=JSON.parse(fs.readFileSync(root+'/apps/web/tools/screen-manifest.json'));
process.env.VITE_GAME_V2='1';process.env.VITE_SUPABASE_URL='';process.env.VITE_SUPABASE_ANON_KEY='';
const key=fs.readFileSync(root+'/apps/web/src/api/MockGameApiV2.ts','utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
const captures=scratch+'/.grade-local-captures';fs.mkdirSync(captures,{recursive:true});
let server,browser;const records=[],keyboard=[];
try{
 control();update('personally observing app/reference and keyboard');
 server=await createServer({root:root+'/apps/web',envDir:false,server:{port:4454,strictPort:true}});await server.listen();
 browser=await chromium.launch();const setup=await browser.newPage();await setup.goto('http://localhost:4454');
 const save=await setup.evaluate(async()=>{const f=await import('/src/api/mockV2Fixtures.ts');return f.mockV2SaveJson('midGame',{nowMs:Date.now(),chapter:2});});await setup.close();await server.close();
 server=await preview({root:root+'/apps/web',envDir:false,build:{outDir:'dist-v2/e2e-4451'},preview:{port:4454,strictPort:true}});
 const map={home:'stage',bag:'bag',map:'map','forge-craft':'forge','forge-salvage':'forge','forge-relic':'forge',market:'market',hero:'char',help:'help'};
 for(const viewport of manifest.viewports){
  const app=await browser.newPage({viewport,reducedMotion:'reduce'}),ref=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
  app.on('pageerror',e=>errors.push(e.message));app.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await app.addInitScript(({key,save})=>{localStorage.setItem(key,save);localStorage.setItem('taskbar-hero.howToPlaySeen','1');},{key,save});
  await app.goto('http://localhost:4454');await app.getByTestId('nav-home').waitFor();await app.evaluate(()=>document.fonts.ready);
  await ref.goto('file://'+root+'/reports/ui-redesign/index.html#stage');await ref.locator('[data-w="'+viewport.width+'"]').click();
  await ref.addStyleTag({content:'html,body{padding:0!important;margin:0!important}.bar,.note{display:none!important}.vp{border:0!important}.app{transform:none!important}'});
  for(const s of manifest.screens){
   await app.getByTestId(s.navTestId).click();await expect(app.getByTestId(s.navTestId)).toHaveAttribute('aria-selected','true');
   if(s.subnavTestId)await app.getByTestId(s.subnavTestId).click();
   for(const selector of s.required)await expect(app.getByTestId('screen').locator(selector).filter({visible:true}).first()).toBeVisible();
   await ref.locator('[data-k="'+map[s.id]+'"]').evaluate(e=>e.click());
   await ref.evaluate(v=>{Object.assign(document.querySelector('.vp').style,{width:v.width+'px',height:v.height+'px'});},viewport);
   expect(await ref.locator('.app').boundingBox()).toEqual({x:0,y:0,...viewport});
   const measure=p=>p.evaluate(()=>({nav:[...document.querySelectorAll('.shell-rail [role=tab],.rail .nav')].map(e=>e.textContent.trim()),headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>e.getBoundingClientRect().width).map(e=>e.textContent.trim()),boxes:[...document.querySelectorAll('.shell-hud,.shell-context,.hud-xp-track,.hud-power-hint,.hud,.screen-grid')].map(e=>({name:e.className,rect:e.getBoundingClientRect().toJSON(),color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})),scroll:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth}));
   const row={screen:s.id,viewport,app:await measure(app),reference:await measure(ref)};
   if(['home','bag'].includes(s.id)){for(const [label,page] of [['app',app],['reference',ref]]){const bytes=await page.screenshot({animations:'disabled'});expect(bytes.length).toBeLessThan(200*1024);const path=captures+'/'+label+'-'+s.id+'-'+viewport.width+'.png';fs.writeFileSync(path,bytes);row[label+'Capture']={path,bytes:bytes.length,delivery:'LOCAL ONLY, not published'};}}
   records.push(row);
  }
  await app.getByTestId('nav-home').focus();await app.keyboard.press('Home');const k=[];
  for(const id of ['home','bag','map','forge','market','hero','help']){
   const tab=app.getByTestId('nav-'+id);await expect(tab).toBeFocused();
   const focus=await tab.evaluate(e=>({outline:getComputedStyle(e).outlineStyle,width:parseFloat(getComputedStyle(e).outlineWidth)}));expect(focus.outline).not.toBe('none');expect(focus.width).toBeGreaterThanOrEqual(2);
   await app.keyboard.press('Enter');await expect(tab).toHaveAttribute('aria-selected','true');await expect.poll(()=>app.getByTestId('screen').evaluate(e=>e.contains(document.activeElement))).toBe(true);const entered=true;await app.keyboard.press('Escape');await expect(tab).toBeFocused();k.push({id,focus,entered,escape:true});await app.keyboard.press('ArrowDown');
  }
  expect(errors).toEqual([]);keyboard.push({viewport,screens:k,errors});await app.close();await ref.close();
 }
 fs.writeFileSync(out+'reference-observations.json',JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),records},null,2)+'\n');
 fs.writeFileSync(out+'keyboard.json',JSON.stringify(keyboard,null,2)+'\n');
}finally{await browser?.close();if(server?.close)await server.close();else if(server?.httpServer)await new Promise(r=>server.httpServer.close(r));}
async function run(name,command,cwd){
 control();update(name);const fd=fs.openSync(out+'logs/'+name+'.log','wx');fs.writeSync(fd,JSON.stringify({name,command,cwd,start:new Date().toISOString()})+'\n');
 const p=spawn('/bin/bash',['-c',command],{cwd,env:{...process.env,SCREENSHOTS:'0'},stdio:['ignore',fd,fd]});
 const exit=await new Promise(r=>p.on('exit',r));fs.writeSync(fd,'\nEXIT_CODE='+exit+'\n');fs.closeSync(fd);
 fs.appendFileSync(out+'ui-results.jsonl',JSON.stringify({name,command,exit})+'\n');return exit;
}
const helper=scratch+'/apps/web/tools/.grade-b-audit.mjs';
fs.writeFileSync(helper,fs.readFileSync(scratch+'/apps/web/tools/ui-audit.mjs','utf8').replace('const port = signedIn ? 4175 : 5199, apiPort = 4176','const port = signedIn ? 4451 : 4454, apiPort = 4453'));
try{
 await run('audit-guest','node tools/.grade-b-audit.mjs '+out+'audit-guest bossReadyStrong --strict',scratch+'/apps/web');
 await run('audit-signed-in','node tools/.grade-b-audit.mjs '+out+'audit-signed-in stocked --signed-in --strict',scratch+'/apps/web');
 await run('contrast','pnpm exec vitest run src/theme.contrast.test.ts',root+'/apps/web');
}finally{fs.unlinkSync(helper);}
fs.writeFileSync(out+'UI-DONE','complete\n');update('UI checks complete');
