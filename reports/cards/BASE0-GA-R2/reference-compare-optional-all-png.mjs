import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(process.argv[2]), out=resolve(process.argv[3]);
const require=createRequire(`${root}/apps/web/package.json`);
const {chromium,expect}=require('@playwright/test');
const {createServer,preview}=require('vite');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const manifest=JSON.parse(readFileSync(`${root}/apps/web/tools/screen-manifest.json`,'utf8'));
const key=readFileSync(`${root}/apps/web/src/api/MockGameApiV2.ts`,'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
process.env.VITE_GAME_V2='1';process.env.VITE_SUPABASE_URL='';process.env.VITE_SUPABASE_ANON_KEY='';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch();let server;const records=[];
try {
 server=await createServer({root:`${root}/apps/web`,envDir:false,server:{port:4424,strictPort:true}});await server.listen();
 const setup=await browser.newPage();await setup.goto('http://localhost:4424');
 const save=await setup.evaluate(async()=>{const m=await import('/src/api/mockV2Fixtures.ts');const s=m.mockV2Save('midGame',{nowMs:Date.now(),chapter:2});return JSON.stringify(s)});
 await setup.close();await server.close();server=null;
 server=await preview({root:`${root}/apps/web`,envDir:false,build:{outDir:'dist-v2/e2e-4421'},preview:{port:4424,strictPort:true}});
 const map={home:'stage',bag:'bag',map:'map','forge-craft':'forge','forge-salvage':'forge','forge-relic':'forge',market:'market',hero:'char',help:'help'};
 const capture=async(page,path)=>{const png=await page.screenshot({animations:'disabled'});if(png.length>=200*1024)throw new Error(`PNG budget exceeded: ${path} (${png.length})`);writeFileSync(path,png);return png.length;};
 for(const viewport of manifest.viewports){
  const app=await browser.newPage({viewport,reducedMotion:'reduce'}), reference=await browser.newPage({viewport,reducedMotion:'reduce'});
  const errors=[];app.on('pageerror',e=>errors.push(e.message));app.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await app.addInitScript(({key,save})=>{localStorage.setItem(key,save);localStorage.setItem('taskbar-hero.howToPlaySeen','1')},{key,save});
  await app.goto('http://localhost:4424');await app.getByTestId('nav-home').waitFor();await app.evaluate(()=>document.fonts.ready);
  await reference.goto(`file://${root}/reports/ui-redesign/index.html#stage`);
  await reference.locator(`[data-w="${viewport.width}"]`).click();
  await reference.addStyleTag({content:'html,body{padding:0!important;margin:0!important}.bar,.note{display:none!important}.vp{border:0!important}.app{transform:none!important}'});
  for(const screen of manifest.screens){
   await app.getByTestId(screen.navTestId).click();await expect(app.getByTestId(screen.navTestId)).toHaveAttribute('aria-selected','true');
   if(screen.subnavTestId)await app.getByTestId(screen.subnavTestId).click();
   for(const selector of screen.required)await expect(app.getByTestId('screen').locator(selector).filter({visible:true}).first()).toBeVisible();
   await reference.locator(`[data-k="${map[screen.id]}"]`).evaluate(b=>b.click());
   await reference.evaluate(({width,height})=>{const vp=document.querySelector('.vp');vp.style.width=`${width}px`;vp.style.height=`${height}px`;document.querySelector('.app').style.transform='none'},viewport);
   const referenceBox=await reference.locator('.app').boundingBox();
   expect(referenceBox).toEqual({x:0,y:0,width:viewport.width,height:viewport.height});
   const measure=page=>page.evaluate(()=>({viewport:{width:innerWidth,height:innerHeight},nav:[...document.querySelectorAll('.shell-rail [role=tab],.rail .nav')].map(e=>e.textContent.trim()),headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>e.getBoundingClientRect().width>0).map(e=>e.textContent.trim()),boxes:[...document.querySelectorAll('.shell-hud,.shell-context,.hud-xp-track,.hud-xp-fill,.hud-power-hint,.v2-hint-btn,.hud,.bar-t,.screen-grid')].map(e=>({selector:e.className,rect:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})),tokens:Object.fromEntries(['--bg','--surface','--surface-2','--text','--muted','--good','--accent'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue(k).trim()])),animations:document.getAnimations().map(a=>({state:a.playState,properties:a.effect?.getKeyframes().flatMap(Object.keys)}))}));
   const row={screen:screen.id,referenceScreen:map[screen.id],viewport,app:await measure(app),reference:await measure(reference)};
   const nav=app.getByTestId(screen.navTestId); const navStyle=()=>nav.evaluate(n=>{const s=getComputedStyle(n);return {selected:n.getAttribute('aria-selected'),border:s.borderColor,background:s.backgroundColor,color:s.color,outline:s.outlineStyle,outlineWidth:s.outlineWidth}});row.activeNav=await navStyle();await nav.hover();row.hoverNav=await navStyle();await app.mouse.move(0,0);
   if(true){row.appPngBytes=await capture(app,`${out}/app-${screen.id}-${viewport.width}.png`);row.referencePngBytes=await capture(reference,`${out}/reference-${screen.id}-${viewport.width}.png`);}
   records.push(row);
  }
  if(errors.length)throw new Error(JSON.stringify(errors));
  await app.close();await reference.close();
 }
 writeFileSync(`${out}/comparison.json`,JSON.stringify({head,builtApp:'apps/web/dist-v2/e2e-4421',records},null,2)+'\n');
 console.log(`Compared ${records.length} same-screen/size pairs; 36 local PNGs within budget; console/page errors 0.`);
}finally{await browser.close();if(server?.close)await server.close();else if(server?.httpServer)await new Promise(r=>server.httpServer.close(r));}
