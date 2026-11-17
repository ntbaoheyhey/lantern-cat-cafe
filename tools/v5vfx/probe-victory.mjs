/** Isolate the actual result canvas before changing the victory presentation. */
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const out=resolve('work/v5/CXV/films/V7-E-victory-diagnostic');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave1'),{fixedClock:false});
 const report={utc:new Date().toISOString(),url:page.url(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),errors};
 report.battle=await page.evaluate(()=>[...window.__depthScene.actors].map(([id,e])=>({id,source:e.actor.source,drawing:!!e.craftPose,asset:e.asset})));
 await page.evaluate(()=>{const m=window.__depthReview;window.__v3a2.R.playBattle(m.battle,'auto');m.showResult();});
 await page.waitForSelector('.b3-victory-crew[data-ready=true]',{timeout:60000});
 await page.screenshot({path:resolve(out,'actual.png')});
 report.crew=await page.locator('.b3-victory-crew').evaluate(e=>e.getBoundingClientRect().toJSON());
 await page.locator('.b3-victory-crew>canvas').evaluate(e=>e.style.visibility='hidden');
 await page.screenshot({path:resolve(out,'without-canvas.png')});
 await page.locator('.b3-victory-crew').evaluate(e=>{e.style.background='radial-gradient(ellipse at 50% 60%,#211e36ed 10%,#211e36bd 48%,#211e3633 80%)';e.querySelector('canvas').style.visibility='visible';});
 await page.screenshot({path:resolve(out,'quiet-backing.png')});
 report.native=await page.evaluate(async()=>{
  const {loadSpineActor}=await import('/src/game/cardrpg/spine/assets.ts');
  const rows=[];for(const id of ['mochi','soot','clover','panko']){const a=await loadSpineActor(id);rows.push({id,source:a.source,bounds:a.bounds,meshes:a.root.children.map(c=>({type:c.type,name:c.name,children:c.children.length}))});a.dispose();}return rows;
 });
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,errors,crew:report.crew,native:report.native.map(a=>({id:a.id,source:a.source}))}));
}finally{await browser.close();}
