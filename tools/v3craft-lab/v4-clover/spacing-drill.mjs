/** A5 two spacing variants on actual painted alpha; prior A2/A4 layout method. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture,{width:1440,height:900});
 const rows=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),{SLOTS_C2}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/src/game/cardrpg/stage/layout-c2.ts');
  m.paused=false;for(let i=0;i<160;i++){if(!m.plan)m.step();if(m.plan?.actorId==='clover'&&m.plan.ultimate)break;while(m.plan)m.tick(100);}m.paused=true;
  const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H),renderer=s.renderer,rows=[];
  for(const x of [.28,.30,.32]){
   for(const slots of [SLOTS_C2.slots,SLOTS_C2.partySix])Object.assign(slots.find(p=>p.id==='FRONT-DOWN'),{x,y:.91});
   for(const ms of [600,1100,1400,1800]){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
    const units=s.sizeAudit().units,union=new Uint8Array(W*H),occlusion=[],clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
    for(const u of [...units].sort((a,b)=>b.drawOrder-a.drawOrder)){
     renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(s.actors.get(u.id).actor.root,s.camera);const a=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,a);let total=0,hidden=0;
     for(let i=0;i<union.length;i++)if(a[i*4+3]>=128){total++;if(union[i])hidden++;union[i]=1;}
     occlusion.push({id:u.id,fraction:total?hidden/total:0});
    }
    renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);rows.push({x,y:.91,ms,occlusion,units});
   }
  }
  rt.dispose();return rows;
 });results.push({fixture:fixture.id,errors,rows});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,errors,variants:[.28,.30,.32].map(x=>({x,worst:Math.max(...rows.filter(r=>r.x===x).flatMap(r=>r.occlusion.map(o=>o.fraction)))}))}));
}await writeFile('tools/v3craft-lab/v4-clover/spacing-drill.json',JSON.stringify(results,null,2)+'\n');}finally{await browser.close();}
