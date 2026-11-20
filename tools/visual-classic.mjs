// Supplemental actual classic Upgrade capture. The v2 redesign does not replace this UI.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { root, web, requireWeb, chromium, now, pinExistingFonts } from './visual-support.mjs';
const { preview }=await import(requireWeb.resolve('vite'));
const server=await preview({root:web,envDir:false,build:{outDir:process.argv[2]??'/tmp/tbh-visual-classic-before'},preview:{host:'127.0.0.1',port:5396,strictPort:true}});
const candidate=await preview({root:web,envDir:false,build:{outDir:'dist/e2e-5370'},preview:{host:'127.0.0.1',port:5397,strictPort:true}});
const browser=await chromium.launch(), records=[];
try {
 for(const [phase,base] of [['before','http://127.0.0.1:5396'],['after','http://127.0.0.1:5397']])for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],writes=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push(r.method())});
  await page.route('**/*',r=>['localhost','127.0.0.1'].includes(new URL(r.request().url()).hostname)?r.continue():r.abort());
  await pinExistingFonts(page);await page.clock.install({time:now});await page.clock.pauseAt(now);
  await page.addInitScript(()=>{localStorage.setItem('taskbar-hero.howToPlaySeen','1');let seed=1404;Math.random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296)});
  await page.goto(base+'/?demo');await page.waitForTimeout(300);await page.clock.runFor(10000);await page.evaluate(()=>document.fonts.ready);
  await page.getByRole('button',{name:'Menu',exact:true}).click();await page.getByRole('tab',{name:'Inventory',exact:true}).click();
  const upgrade=page.getByRole('button',{name:'Upgrade (25 Fish): Common Feather Wand, level 1',exact:true});await upgrade.waitFor();await upgrade.scrollIntoViewIfNeeded();
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  const file=`${phase}-classic-upgrade-${width}.png`,bytes=await page.screenshot({path:resolve(root,'docs/visual/img',file),animations:'disabled'});
  records.push({phase,width,height,file,sha256:createHash('sha256').update(bytes).digest('hex'),errors,writes});
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);await page.close();
 }
}finally{await browser.close();await new Promise(ok=>server.httpServer.close(ok));await new Promise(ok=>candidate.httpServer.close(ok));}
writeFileSync(resolve(root,'reports/visual/classic-captures.json'),'[\n'+records.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n');console.log(JSON.stringify(records));
