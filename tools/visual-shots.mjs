// Deterministic, read-only local visual evidence. Never connects a wallet.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root = process.cwd(), web = resolve(root, 'apps/web');
const require = createRequire(resolve(web, 'package.json'));
const { chromium } = require('@playwright/test');
const { createServer } = await import(require.resolve('vite'));
const vite = await createServer({ root: web, envDir: false, server: { middlewareMode: true }, appType: 'custom' });
const { mockV2Save } = await vite.ssrLoadModule('/src/api/mockV2Fixtures.ts');
const { sampleStateV2 } = await vite.ssrLoadModule('/src/layout/sampleState.ts');
const now = Date.UTC(2026,10,4,11,30);
const saves = Object.fromEntries(['midGame','forgeRich','bossReadyStrong'].map(k=>[k, JSON.stringify(mockV2Save(k,{nowMs:now,classId:'warrior'}))]));
const sample=sampleStateV2(), bag=JSON.parse(saves.midGame);
bag.state.items=sample.inventory.map(i=>({...i,itemId:i.itemKey,bonusLines:i.bonus,source:'drop'}));
saves.bag=JSON.stringify(bag);
const home=JSON.parse(saves.midGame);Object.assign(home.state,{chapter:1,round:3,kills:2});saves.home=JSON.stringify(home);
await vite.close();
const key = readFileSync(resolve(web,'src/api/MockGameApiV2.ts'),'utf8').match(/MOCK_V2_STORAGE_KEY = '([^']+)'/)[1];
const phase = process.argv[2] ?? 'before', base = process.argv[3] ?? 'http://127.0.0.1:5380';
const out = resolve(root, 'docs/visual/img'); mkdirSync(out,{recursive:true});
const browser = await chromium.launch();
const receipt=[];
try {
 for (const [width,height] of [[1280,720],[1920,1080]]) {
  for (const screen of ['home','inventory','boss','forge','market','upgrade','relic','forge-reveal']) {
   const page = await browser.newPage({viewport:{width,height}, reducedMotion:screen==='boss'?'no-preference':'reduce'}); page.setDefaultTimeout(10000);
   const errors=[], writes=[]; page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.url());});
   await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'||new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
   await page.clock.install({time:now}); await page.clock.pauseAt(now);
   await page.addInitScript(({key,save})=>{localStorage.setItem(key,save);localStorage.setItem('taskbar-hero.howToPlaySeen','1');let s=1404;Math.random=()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);},{key,save:saves[screen==='home'?'home':screen==='boss'?'bossReadyStrong':['forge','forge-reveal'].includes(screen)?'forgeRich':'bag']});
   const hash={home:'home',inventory:'bag',boss:'boss',forge:'forge',market:'market',upgrade:'bag',relic:'forge','forge-reveal':'forge'}[screen];
   await page.goto(['market','relic'].includes(screen)?`${base}/e2e/fixtures/market-view.html`:`${base}/?demo#${hash}`); await page.waitForTimeout(800); await page.clock.runFor(1500); await page.evaluate(()=>document.fonts.ready); if(screen==='home') { await page.waitForSelector('.v2-stage-canvas canvas'); await page.waitForTimeout(500); await page.clock.runFor(3100); }
   if(screen==='upgrade') { const item=page.getByRole('list',{name:'Bag items'}).getByRole('button').first(); if(await item.count())await item.click(); }
   if(screen==='relic')await page.locator('[data-testid=listing-11] button').first().click();
   if(screen==='boss') { const b=page.getByRole('button',{name:'Fight',exact:true}); if(await b.count() && await b.isEnabled()) { await b.click(); await page.waitForTimeout(600); await page.clock.runFor(400); } }
   if(screen==='forge-reveal') { const b=page.getByTestId('craft-btn');if(await b.count() && await b.isEnabled()) {await b.click(); const confirm=page.getByTestId('craft-confirm-btn'); if(await confirm.count())await confirm.click({force:true}); await page.clock.runFor(200);} }
   await page.clock.runFor(250); await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
   await page.screenshot({path:resolve(out,`${phase}-${screen}-${width}.png`),animations:'disabled'});
   receipt.push({screen,width,height,errors,writes,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}); await page.close();
  }
 }
} finally {await browser.close();}
writeFileSync(resolve(root,`reports/visual/${phase}-captures.json`),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
