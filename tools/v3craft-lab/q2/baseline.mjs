import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium,openFixture,config} from '../../../scripts/v3feel/browser-fixture.mjs';
const dir=import.meta.dirname,label=process.argv[2]??'before';await mkdir(resolve(dir,'raw'),{recursive:true});
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  const state=await page.evaluate(()=>{
   const s=window.__depthScene,v=s.view(),r=s.host.getBoundingClientRect(),hud=document.querySelector('.b3-bottom').getBoundingClientRect();
   return {stage:{x:r.x,y:r.y,width:r.width,height:r.height},hud:{x:hud.x,y:hud.y,width:hud.width,height:hud.height},actors:v.actors.map(u=>({id:u.id,asset:s.actors.get(u.id).asset,side:u.side,row:v.rows[u.id],seat:s.c2Seats.get(u.id),scale:s.actors.get(u.id).actor.root.scale.x})),audit:s.sizeAudit(),anchors:s.anchors};
  });
  await page.screenshot({path:resolve(dir,`raw/${fixture.id}-${width}-${label}.png`)});
  results.push({fixture:fixture.id,width,height,errors,...state});await page.close();
 }
 await writeFile(resolve(dir,label==='before'?'baseline.json':`snapshot-${label}.json`),JSON.stringify({at:new Date().toISOString(),cases:results},null,2)+'\n');
 console.log(results.map(r=>({fixture:r.fixture,size:[r.width,r.height],stage:r.stage,hud:r.hud.height,errors:r.errors})));
}finally{await browser.close();}
