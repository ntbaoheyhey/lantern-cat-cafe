/** Real browser playback through the judge route at 1x, without clock or combat overrides. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const origin=process.env.DEMO_ORIGIN??'http://127.0.0.1:6301';
const out=resolve(process.env.DEMO_OUTPUT??'work/v9/CXI/browser');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`);
 const play=page.getByRole('button',{name:'Play free',exact:true});
 await play.or(page.getByRole('button',{name:'Guard the café',exact:true})).waitFor({timeout:45000});
 if(await play.isVisible())await play.click();
 await page.getByRole('button',{name:'Guard the café',exact:true}).waitFor({timeout:45000});
 await page.screenshot({path:resolve(out,'intro.png')});
 await page.getByRole('button',{name:'Collection',exact:true}).click();
 assert.equal(await page.locator('.judge-collection figure').count(),12);
 await page.getByRole('button',{name:'Back to café',exact:true}).click();
 await page.getByRole('button',{name:'Guard the café',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview?.battle?.initial.enemies.includes('needle-moth'));
 assert.deepEqual(await page.evaluate(()=>window.__depthReview.battle.actors.filter(a=>a.side==='party').map(a=>a.catalogId)),['mochi','clover','soot']);
 await page.waitForFunction(()=>window.__depthReview?.sceneReady===true);
 await page.screenshot({path:resolve(out,'wave.png')});
 await page.getByRole('button',{name:'Face the Yarn Giant',exact:true}).waitFor({timeout:90000});
 console.log('PASS street wave: three cats, needle-moth + teacup-healer + button-guard.');
 // Observe presentations as they run; do not drive the simulation from the test.
 await page.evaluate(()=>{
  window.__demoSeen=[];window.__demoLastPlan=null;
  window.__demoObserver=setInterval(()=>{
   const m=window.__depthReview,p=m?.plan;
   if(p&&p!==window.__demoLastPlan){window.__demoLastPlan=p;if(p.ultimate&&['mochi','clover','soot'].includes(p.actorId))window.__demoSeen.push({id:p.skillId,at:performance.now()});}
  },10);
 });
 const started=Date.now();
 await page.getByRole('button',{name:'Face the Yarn Giant',exact:true}).click();
 await page.waitForFunction(()=>window.__demoSeen.length===1,{},{timeout:45000});
 await page.screenshot({path:resolve(out,'boss.png')});
 await page.getByRole('heading',{name:'The last lantern stays lit',exact:true}).waitFor({timeout:75000});
 const elapsed=Date.now()-started,ults=await page.evaluate(()=>{clearInterval(window.__demoObserver);return window.__demoSeen;});
 assert.deepEqual(ults.map(u=>u.id),['mochi-4','clover-4','soot-4']);
 assert(elapsed<75000,`Boss playback exceeded 75s: ${elapsed}ms`);
 await page.screenshot({path:resolve(out,'victory.png')});
 console.log(`PASS boss in ${(elapsed/1000).toFixed(1)}s: Mochi → Clover → Soot; victory.`);
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&legacy=1`);
 const begin=page.getByRole('button',{name:'Start playing',exact:true});
 await begin.or(page.getByRole('heading',{name:'Taskbar Hero',exact:true})).waitFor({timeout:30000});
 if(await begin.isVisible())await begin.click();
 await page.getByRole('heading',{name:'Taskbar Hero',exact:true}).waitFor({timeout:30000});
 assert.equal(await page.locator('.judge-demo-v9').count(),0);
 assert.deepEqual(errors,[]);
 console.log(`PASS boss in ${(elapsed/1000).toFixed(1)}s: Mochi → Clover → Soot; victory, Collection and legacy route passed.`);
}finally{await browser.close();}
