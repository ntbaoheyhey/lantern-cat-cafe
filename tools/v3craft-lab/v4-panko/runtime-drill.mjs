/** A6 production pose/effect observation using the unchanged fixture API. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A6/raw/runtime';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 await page.evaluate(()=>{const m=window.__depthReview;m.paused=false;for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='panko'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}m.paused=true;});
 const rows=[];
 for(const ms of [100,250,300,350,560,800]){
  const row=await page.evaluate(async ms=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const source=s.socket('panko','vfxOrigin'),art=s.craftOven,paint=art.cut.localToWorld(new T.Vector3(7/768-.5,.5-376/424,0)).project(s.camera),tip={x:(paint.x*.5+.5)*s.width,y:(.5-paint.y*.5)*s.height};
   return{ms,source,tip,tipError:Math.hypot(source.x-tip.x,source.y-tip.y),key:s.actors.get('panko').craftPose.drawing.key,role:s.motionAudit.find(r=>r.id==='panko')};
  },ms);rows.push(row);await page.screenshot({path:`${out}/basic-${ms}.png`});
 }
 await writeFile('reports/v4-art/REVIEW/A6/runtime-drill.json',JSON.stringify({errors,rows},null,2)+'\n');
 console.log(JSON.stringify({errors,visibleCutTipErrors:rows.filter(r=>r.ms>=300&&r.ms<=560).map(r=>({ms:r.ms,error:r.tipError})),return:rows.at(-1).role}));
}finally{await browser.close();}
