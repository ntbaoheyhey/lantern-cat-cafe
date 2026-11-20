import {chromium,config,openFixture} from './browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='reports/v3-feel/REVIEW/Q1-inspect';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{const {page,errors}=await openFixture(browser,config.fixtures[0]);
 for(const type of ['basic','ultimate']){
  await page.evaluate(type=>{
   const m=window.__depthReview;m.paused=false;m.sceneReady=true;
   for(let i=0;i<500;i++){
    if(!m.plan)m.step();
    if(!!m.plan?.ultimate===(type==='ultimate')&&m.plan?.actorId==='mochi')break;
    while(m.plan)m.tick(100,undefined);
   }
   m.paused=true;
  },type);
  for(const at of type==='basic'?[0,200,350,600]:[0,300,600,1100,1600]){
   const audit=await page.evaluate(at=>{const m=window.__depthReview,s=window.__depthScene;m.animationAt=at;s.render({...s.view(),fixedTime:10+at/1000,paused:true},0);return s.audit();},at);
   await page.screenshot({path:`${out}/${type}-${at}.png`});writeFileSync(`${out}/${type}-${at}.json`,JSON.stringify(audit));
  }
  await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;while(m.plan)m.tick(100,undefined);m.paused=true;});
 }
 console.log(JSON.stringify({errors}));
}finally{await browser.close();}
