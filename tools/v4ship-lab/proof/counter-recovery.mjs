/** Read-only Fuji recovery exercise. Only this fresh browser's network is interrupted. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),keys=['burned','deeds','fused','transactions'];
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}});
const report={at:new Date().toISOString(),mode:'read-only Fuji; fresh browser; injected external-network outage',complete:false,pass:false,blockedRequests:0,pageErrors:[]};
const save=()=>writeFileSync(resolve(root,'reports/v4-ship/S4/counter-recovery.json'),JSON.stringify(report,null,2)+'\n');
const read=force=>page.evaluate(async force=>{const {readCounters}=await import('/src/game/cardrpg/shell/LiveCounters.tsx');return readCounters({force});},force);
page.on('pageerror',error=>report.pageErrors.push(error.message.slice(0,180)));
try{
 await page.goto('http://127.0.0.1:5995/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 report.verified=await read(true);
 for(const key of keys){assert.notEqual(report.verified[key],undefined);assert(!report.verified.stale?.[key]);assert(Number.isFinite(report.verified.asOf?.[key]));}
 save();console.log('Verified all four Fuji counters.');
 await page.reload();report.reloaded=await read(false);
 for(const key of keys){assert.equal(report.reloaded[key],report.verified[key]);assert.equal(report.reloaded.asOf[key],report.verified.asOf[key]);}
 save();console.log('Reload retained original verification timestamps.');
 await page.route('**/*',route=>{
  if(['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname))return route.continue();
  report.blockedRequests++;return route.abort('internetdisconnected');
 });
 report.offline=await read(true);
 for(const key of keys){assert.equal(report.offline[key],report.verified[key]);assert.equal(report.offline.asOf[key],report.verified.asOf[key]);assert.equal(report.offline.stale[key],true);}
 await page.waitForFunction(()=>[...document.querySelectorAll('.b-live-counter')].length===4&&[...document.querySelectorAll('.b-live-counter')].every(e=>e.textContent.includes('Last verified')),null,{timeout:100000});
 report.offlineUi=await page.locator('.b-live-counter').allTextContents();save();console.log('All four rendered counters show aged cached values during the outage.');
 await page.unroute('**/*');report.recovered=await read(true);
 for(const key of keys){assert.notEqual(report.recovered[key],undefined);assert(!report.recovered.stale?.[key]);assert(report.recovered.asOf[key]>report.verified.asOf[key]);}
 await page.waitForFunction(()=>[...document.querySelectorAll('.b-live-counter')].length===4&&[...document.querySelectorAll('.b-live-counter')].every(e=>!e.textContent.includes('Last verified')&&!e.textContent.includes('Offline')),null,{timeout:80000});
 report.recoveredUi=await page.locator('.b-live-counter').allTextContents();
 assert(report.blockedRequests>0);assert.deepEqual(report.pageErrors,[]);report.complete=true;report.pass=true;console.log('Fresh verified values returned after network recovery.');
}catch(error){report.failure=String(error.message).slice(0,240);process.exitCode=1;console.log('Counter recovery failed; details recorded without credentials.');}
finally{save();await browser.close();}
