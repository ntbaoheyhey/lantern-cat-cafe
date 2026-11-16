/** Read original rendered alpha once for a bounded spatial choreography drill. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width:1440,height:900});
 const data=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  m.paused=false;for(let i=0;i<160;i++){if(!m.plan)m.step();if(m.plan?.actorId==='panko'&&!m.plan.ultimate)break;while(m.plan)m.tick(100);}m.paused=true;
  const renderer=s.renderer,rt=new T.WebGLRenderTarget(s.width,s.height),result=[];
  for(const ms of [100,250,300]){
   m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   const clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha(),units=s.sizeAudit().units,rows=[];
   for(const u of units){
    if(ms!==100&&u.id!=='panko')continue;
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(s.actors.get(u.id).actor.root,s.camera);const rgba=new Uint8Array(s.width*s.height*4);renderer.readRenderTargetPixels(rt,0,0,s.width,s.height,rgba);
    const runs=[];for(let y=0;y<s.height;y++){let start=-1;for(let x=0;x<=s.width;x++){const on=x<s.width&&rgba[((s.height-y-1)*s.width+x)*4+3]>=128;if(on&&start<0)start=x;if(!on&&start>=0){runs.push([y,start,x]);start=-1;}}}
    rows.push({id:u.id,order:u.drawOrder,box:u.box,runs});
   }
   renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);result.push({ms,role:s.motionAudit.find(u=>u.id==='panko'),rows});
  }
  rt.dispose();return{width:s.width,height:s.height,result};
 });
 await writeFile('reports/v4-art/REVIEW/A6/raw/path-masks.json',JSON.stringify({errors,...data})+'\n');console.log('Saved wave3/900 actual alpha for static units and Panko100/250/300ms.');
}finally{await browser.close();}
