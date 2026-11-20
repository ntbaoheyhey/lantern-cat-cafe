import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir} from 'node:fs/promises';
const attempt=process.argv[2]??'r1',out=`reports/v4-art/REVIEW/A7/yarn-giant/raw/contact-${attempt}`;
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{const {page}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));
for(const ultimate of [false,true]){
 await page.evaluate(ultimate=>{const m=window.__depthReview;m.paused=false;for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='foe-0-yarn-giant'&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}if(m.plan?.actorId!=='foe-0-yarn-giant'||m.plan.ultimate!==ultimate)throw Error('Missing Yarn action');m.paused=true;},ultimate);
 for(const ms of ultimate?[1000,1100]:[300,350]){
  await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);},ms);
  await page.screenshot({path:`${out}/${ultimate?'ult':'basic'}-${ms}.png`});
 }
}
console.log(out);
}finally{await browser.close();}
