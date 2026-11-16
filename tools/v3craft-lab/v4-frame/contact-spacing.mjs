/** LEARN/A2: deterministic live alpha measurement; no recorder changes. */
import {writeFile} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const results=[];
try {
 for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures.filter(f=>f.id==='wave3')){
  const {page,errors}=await openFixture(browser,fixture,{width,height});
  await page.evaluate(async()=>{
   const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const s=window.__depthScene;
   const {SLOTS_C2}=await import('/src/game/cardrpg/stage/layout-c2.ts');
   window.__alphaProbe={T,slots:SLOTS_C2,variants:{wide:[.56,.55,.56,.88,.75,.37,.725,.69,.90,.55,.90,.88], high:[.56,.55,.56,.88,.75,.37,.73,.61,.90,.52,.90,.88], zigzag:[.55,.52,.56,.90,.74,.36,.72,.70,.90,.52,.90,.90]},target:new T.WebGLRenderTarget(s.width,s.height),rows:[]};
  });
  for(let block=0;block<30;block++)await page.evaluate(({block})=>{
   const s=window.__depthScene,m=window.__depthReview,p=window.__alphaProbe;
   for(let j=0;j<30;j++){
    const i=block*30+j;
    m.paused=false;if(!m.plan&&!m.battle.result)m.step();
    m.tick(i===0?0:1000/30,1000+i*1000/30);m.paused=true;
    if(i%3){s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);continue;}
    for(const [variant,coords] of Object.entries(p.variants)){
    p.slots.enemySix.forEach((slot,index)=>{slot.x=coords[index*2];slot.y=coords[index*2+1];});
    s.render({...s.view(),fixedTime:10+i/30,paused:true},1/30);
    const units=s.sizeAudit().units,renderer=s.renderer;
    const clear=renderer.getClearColor(new p.T.Color()).clone(),alpha=renderer.getClearAlpha();
    const union=new Uint8Array(s.width*s.height),occlusion=[];
    for(const u of [...units].sort((a,b)=>b.drawOrder-a.drawOrder)){
     const entry=s.actors.get(u.id),pixels=new Uint8Array(s.width*s.height*4);
     renderer.setRenderTarget(p.target);renderer.setClearColor(0,0);renderer.clear();
     renderer.render(entry.actor.root,s.camera);
     renderer.readRenderTargetPixels(p.target,0,0,s.width,s.height,pixels);
     let count=0,hidden=0;
     for(let k=0;k<union.length;k++)if(pixels[k*4+3]>=128){count++;if(union[k])hidden++;union[k]=1;}
     occlusion.push({id:u.id,count,hidden,fraction:count?hidden/count:0});
    }
    renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);
    p.rows.push({variant,t:i/30,action:m.plan?{actor:m.plan.actorId,ultimate:m.plan.ultimate,elapsed:m.animationAt}:null,
     units,occlusion,facings:units.map(u=>{const a=s.actors.get(u.id).actor;return{id:u.id,native:a.unit.nativeFacing,side:u.side,sign:Math.sign(a.root.scale.x)};})});
    }
   }
  },{block});
  const result=await page.evaluate(()=>{
   const p=window.__alphaProbe;
   const hud=[...document.querySelectorAll('.b3-bottom')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};});
   p.target.dispose();return{rows:p.rows,hud};
  });
  const variants=Object.fromEntries(['wide','high','zigzag'].map(v=>[v,result.rows.filter(f=>f.variant===v).flatMap(f=>f.occlusion.map(o=>({...o,t:f.t,action:f.action}))).sort((a,b)=>b.fraction-a.fraction)[0]]));
  const maximum=result.rows.flatMap(f=>f.occlusion.map(o=>({...o,t:f.t,action:f.action}))).sort((a,b)=>b.fraction-a.fraction)[0];
  results.push({fixture:fixture.id,width,height,errors,maximum,variants,...result});
  await writeFile('tools/v3craft-lab/v4-frame/contact-variants.json',JSON.stringify(results)+'\n');
  console.log(JSON.stringify({fixture:fixture.id,width,height,variants,hud:result.hud,errors}));
  await page.close();
 }
}finally{await browser.close();}
