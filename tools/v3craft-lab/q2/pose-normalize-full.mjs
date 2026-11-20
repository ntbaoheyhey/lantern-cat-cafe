/** Q2 alpha confirmation through the unchanged production scene and seek API. */
import {writeFile} from 'node:fs/promises';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),cases=[];
try{for(const [width,height] of [[1280,720],[1440,900]])for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture,{width,height,fixedClock:false});
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {alphaWorldBounds}=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-lab/q2/alpha-hull.mjs');
  const m=window.__depthReview,s=window.__depthScene,renderer=s.renderer,isolated=new T.Scene();
  const target=new T.WebGLRenderTarget(s.width,s.height),oldColor=renderer.getClearColor(new T.Color()).clone(),oldAlpha=renderer.getClearAlpha();
  const samples=[];
  function measure(label,method){
   const audit=s.sizeAudit(),units=[];
   for(const u of audit.units){
    const actor=s.actors.get(u.id).actor,root=actor.root,parent=root.parent;
    const saved={scale:root.scale.clone(),position:root.position.clone()},pivot=root.localToWorld(new T.Vector3(actor.bounds.x+actor.bounds.width/2,actor.bounds.y,0));
    const before=performance.now();let prediction;
    if(method==='opaque'){prediction=alphaWorldBounds(root).height;}
    else if(method==='geometry'){
     const b=actor.framingBounds(),ys=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>root.localToWorld(new T.Vector3(x,y,0)).y);prediction=Math.max(...ys)-Math.min(...ys);
    }
    const cost=performance.now()-before,targetWorld=.27*(u.kind==='boss'?1.6:1)*(s.camera.top-s.camera.bottom)/s.camera.zoom;
    const factor=method==='none'?1:Math.max(targetWorld*.985,Math.min(targetWorld*1.015,prediction))/prediction;
    root.scale.multiplyScalar(factor);root.scale.z=1;
    const moved=root.localToWorld(new T.Vector3(actor.bounds.x+actor.bounds.width/2,actor.bounds.y,0));root.position.add(pivot.sub(moved));root.updateMatrixWorld(true);
    const b=u.box,left=0,top=0,right=s.width,bottom=s.height;
    const w=right-left,h=bottom-top,pixels=new Uint8Array(w*h*4);
    isolated.add(root);renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();renderer.render(isolated,s.camera);
    renderer.readRenderTargetPixels(target,left,s.height-bottom,w,h,pixels);parent.add(root);
    let x0=w,y0=h,x1=-1,y1=-1,count=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);count++;}
    units.push({id:u.id,asset:u.asset,side:u.side,kind:u.kind,height:y1-y0+1,width:x1-x0+1,count,boxHeight:b.height,facingSign:Math.sign(root.scale.x),nativeFacing:actor.unit.nativeFacing,factor,prediction,cost,clipped:x0===0||x1===w-1||y0===0||y1===h-1});root.scale.copy(saved.scale);root.position.copy(saved.position);root.updateMatrixWorld(true);
   }
   renderer.setRenderTarget(null);renderer.setClearColor(oldColor,oldAlpha);samples.push({label,method,units});
  }
  // Neutral geometry is compared separately from deliberate pose deformation.
  s.render({...s.view(),reducedMotion:true,model:{clip:'idle'},modelProgress:0,fixedTime:10,paused:true},0);for(const method of ['opaque'])measure('setup',method);
  m.paused=false;m.sceneReady=true;let basic=false,ultimate=false;
  for(let i=0;i<100&&(!basic||!ultimate);i++){
   if(!m.plan)m.step();const plan=m.plan;if(!plan)throw Error('Missing plan');
   const take=plan.actorId&&(plan.ultimate?!ultimate:!basic);
   if(take){
    m.paused=true;
    for(const at of plan.ultimate?[0,600,1100,1450,2100]:[0,200,350,600,790]){
     m.animationAt=at;s.render({...s.view(),fixedTime:10+at/1000,paused:true},0);for(const method of ['opaque'])measure(`${plan.skillId}:${at}`,method);
    }
    if(plan.ultimate)ultimate=true;else basic=true;
    m.paused=false;m.animationAt=0;
   }
   while(m.plan)m.tick(100);
  }
  m.paused=true;target.dispose();return samples;
 });
 cases.push({fixture:fixture.id,width,height,errors,samples:result});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,width,methods:['opaque'].map(method=>{const rs=result.filter(r=>r.method===method);return {method,maxCatRatio:Math.max(...rs.map(r=>{const hs=r.units.filter(u=>u.side==='party').map(u=>u.height);return Math.max(...hs)/Math.min(...hs);})),minCatHeight:Math.min(...rs.flatMap(r=>r.units.filter(u=>u.side==='party').map(u=>u.height)))};}),errors}));
}
await writeFile(new URL('./pose-normalize-full.json',import.meta.url),JSON.stringify({at:new Date().toISOString(),method:'Production scene, original actors temporarily isolated in transparent render target, alpha>=128; setup and sampled action poses are reported separately.',cases},null,2)+'\n');
}finally{await browser.close();}
