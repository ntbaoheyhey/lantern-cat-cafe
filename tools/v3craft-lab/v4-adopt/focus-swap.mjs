// LEARN/A0: prove source visibility/current mask on the real Soot actor.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(x=>x.id==='boss'));
 const rows=await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;m.paused=false;m.sceneReady=true;
  for(let i=0;i<150;i++){
   if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&m.plan.ultimate)break;
   while(m.plan)m.tick(100);
  }
  if(m.plan?.actorId!=='soot'||!m.plan.ultimate)throw Error('Soot ultimate missing');
  m.paused=true;
  return [200,400,599].map(ms=>{
   m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   const layer=s.actors.get('soot').actor.mesh.drawing;
   const root=s.scene.getObjectByName('caster-focus-outline');
   const visible=root.children.filter(x=>x.visible);
   return {ms,key:layer.key,visibleCopies:visible.length,currentMask:visible.every(x=>x.material.map===layer.material.map),currentGeometry:visible.every(x=>x.geometry===layer.geometry)};
  });
 });
 const pass=errors.length===0&&rows.every(x=>x.visibleCopies===8&&x.currentMask&&x.currentGeometry);
 writeFileSync('reports/v4-art/REVIEW/A0/focus-swap.json',JSON.stringify({rows,errors,pass},null,2)+'\n');
 console.log(JSON.stringify({rows,errors,pass}));if(!pass)process.exitCode=1;
}finally{await browser.close();}
