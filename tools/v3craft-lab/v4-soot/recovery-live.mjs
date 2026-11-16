/** A3 single recovery diagnosis: fresh live frames, unchanged production source. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A3/raw/recovery-live';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const rows=[];
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 await page.evaluate(()=>{
  const m=window.__depthReview;m.paused=false;
  for(let i=0;i<100;i++){if(!m.plan)m.step();if(m.plan?.id===154)break;while(m.plan)m.tick(100);}
  if(m.plan?.id!==154)throw Error('Expected wave3 action154');m.paused=true;
 });
 for(const ms of [1233.2,1316.6,1433.2]){
  const row=await page.evaluate(ms=>{
   const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;
   s.render({...s.view(),paused:true,fixedTime:32.1413+ms/1000},0);
   const e=s.actors.get('soot'),meshes=[];
   e.actor.root.traverse(o=>{if(o.isMesh)meshes.push({name:o.name,visible:o.visible,map:o.material.map?.image?.src?.split('/').pop()});});
   return{ms,key:e.craftPose.drawing.key,box:s.bounds(e),meshes,light:e.craftLight.audit};
  },ms);
  await page.screenshot({path:`${out}/${ms}.png`});rows.push(row);
 }
 await writeFile('reports/v4-art/REVIEW/A3/recovery-live.json',JSON.stringify({at:new Date().toISOString(),errors,rows},null,2)+'\n');
 console.log(JSON.stringify({errors,rows:rows.map(({ms,key,box})=>({ms,key,box}))}));
}finally{await browser.close();}
