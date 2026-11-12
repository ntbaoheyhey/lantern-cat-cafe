import {createRequire} from 'node:module';import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),out=resolve(root,'reports/v3-battle/A3');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,500));});
try{
 await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000}).catch(async e=>{console.log(JSON.stringify({errors,body:(await page.locator('body').innerText()).slice(0,1000)}));throw e;});
 for(const id of ['mochi','soot','clover']){
  await page.evaluate(id=>window.__depthReview.inspect(id+'-4',0),id);await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  for(const [name,t] of [['cutin',400],['plate',1900],['impact',3200]]){
   await page.evaluate(t=>{const m=window.__depthReview;m.animationAt=t;m.paused=true;m.notify(false);window.__depthScene.render({...window.__depthScene.view(),frame:m.frame,fixedTime:t/1000},0);},t);
   await page.waitForTimeout(200);await page.screenshot({path:resolve(out,id+'-'+name+'.png')});
  }
 }
 const perf=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview;const start=performance.now();let frames=0,long=0,prev=start;
  await new Promise(resolve=>{const tick=now=>{m.animationAt=(now-start)%3600;s.render({...s.view(),frame:m.frame,fixedTime:10+(now-start)/1000,quality:'high'},1/60);frames++;if(now-prev>25)long++;prev=now;if(now-start<10000)requestAnimationFrame(tick);else resolve();};requestAnimationFrame(tick);});
  return {frames,seconds:(performance.now()-start)/1000,fps:frames/((performance.now()-start)/1000),longFrames:long};
 });
 const timing=await page.evaluate(()=>{const m=window.__depthReview,s=window.__depthScene,result=[];for(const t of [3166.6667,3200,3233.3333]){m.animationAt=t;s.render({...s.view(),frame:m.frame,fixedTime:t/1000},0);result.push({t,impact:m.impactVisible,...s.cinema.audit});}return result;});
 await writeFile(resolve(out,'browser-review.json'),JSON.stringify({errors,perf,timing},null,2));console.log(JSON.stringify({errors,perf,timing}));if(errors.length||perf.fps<50)process.exitCode=1;
}finally{await browser.close();}
