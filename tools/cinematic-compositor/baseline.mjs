import {returningGuest} from './review-guest.mjs';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'), require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await returningGuest(page);await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
 await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.start(1,'campaign',1);m.enter('0-0');m.watching=true;m.paused=true;m.sceneStarted=true;m.notify(false);});
 await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});
 await page.waitForTimeout(600);
 await page.screenshot({path:resolve(root,'reports/v3-battle/A1/before-wave1.png')});
 const timing=await page.evaluate(()=>{const s=window.__depthScene;s.view=(()=>{const old=s.view.bind(s);return ()=>({...old(),paused:true,fixedTime:3,frame:null});})();return s.audit();});
 const start=performance.now();
 for(let i=0;i<60;i++){await page.evaluate(i=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3+i/30},1/30);},i);await page.screenshot();}
 const report={frames:60,width:1280,height:720,seconds:(performance.now()-start)/1000,renderer:timing.renderer,errors};
 await writeFile(resolve(root,'reports/v3-battle/render-benchmark.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
