import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
 await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
 await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
 console.log('initial',await page.evaluate(()=>({screen:window.__depthReview.screen,methods:Object.getOwnPropertyNames(Object.getPrototypeOf(window.__depthReview)).filter(k=>/battle|tutorial|fight|practice/i.test(k))})));
 await page.evaluate(async()=>{await window.__thAudio.unlock();await window.__thAudio.preload('battle');window.__thAudio.music('battle');window.__depthReview.watchNow();});
 await page.waitForTimeout(8000);
 console.log('battle',await page.evaluate(()=>({screen:window.__depthReview.screen,watching:window.__depthReview.watching,show:window.__depthReview.showBattle,result:window.__depthReview.battle?.result,paused:window.__depthReview.paused,log:window.__thAudio.hits.slice(-15),stats:window.__thAudio.diagnostics,scene:window.__depthReview.sceneError})),errors);
 mkdirSync('reports/v3-shell/b2/shots',{recursive:true});await page.screenshot({path:'reports/v3-shell/b2/shots/s3-battle.png'});
}finally{await browser.close();}
