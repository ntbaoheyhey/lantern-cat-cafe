/** Yarn boss poses/effects in unchanged real fixtures. No synthetic game events. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A7/yarn-giant';await mkdir(`${out}/raw/live`,{recursive:true});
const attempt=process.argv[2]??'r1';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{for(const [width,height]of [[1280,720],[1440,900]])for(const fixture of config.fixtures.filter(f=>f.id==='boss')){
 const {page,errors}=await openFixture(browser,fixture,{width,height});
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const pair=[...s.actors.entries()].filter(([,e])=>e.asset==='yarn-giant')[0];if(!pair)return{present:false,rows:[]};
  const [id,entry]=pair,rows=[],missing=[],plans=[],W=s.width,H=s.height,renderer=s.renderer,rt=new T.WebGLRenderTarget(W,H);
  for(const ultimate of [false,true]){
   m.paused=false;
   for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId===id&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!==id||m.plan.ultimate!==ultimate){missing.push(ultimate?'ultimate':'basic');continue;}plans.push(structuredClone(m.plan));m.paused=true;
   const times=ultimate?[0,100,300,599,600,800,1000,1100,1150,1250,1400,1800,2199,2200]:[0,50,100,200,250,300,350,400,500,700,799,800];
   for(const ms of times){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);s.scene.updateMatrixWorld(true);
    const fx=s.craftYarn,source=s.socket(id,'vfxOrigin'),faces=[...s.actors.values()].filter(e=>e.actor.root.visible).map(e=>s.faceBounds(e));
    const scene=new T.Scene();for(const root of [fx.ground,fx.rear,fx.front])scene.add(root.clone(true));
    const color=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,s.camera);
    const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)count++;
    const coverage=faces.map(f=>{let n=0,c=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){n++;if(pixels[((H-1-y)*W+x)*4+3]>=128)c++;}return n?c/n:0;});
    const paint=fx.cut.localToWorld(new T.Vector3(.99609375-.5,.5-.6085365853658536,0)).project(s.camera),head={x:(paint.x*.5+.5)*W,y:(.5-paint.y*.5)*H};
    const occlusion=[];
    if([0,250,350,1100,1250].includes(ms)){
     const union=new Uint8Array(W*H);
     for(const unit of [...s.sizeAudit().units].sort((a,b)=>b.drawOrder-a.drawOrder)){
      renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(s.actors.get(unit.id).actor.root,s.camera);
      renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);let opaque=0,hidden=0;
      for(let i=0;i<union.length;i++)if(pixels[i*4+3]>=128){opaque++;if(union[i])hidden++;union[i]=1;}
      occlusion.push({id:unit.id,opaque,hidden,fraction:opaque?hidden/opaque:0});
     }
     renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    }
    rows.push({ultimate,ms,key:entry.craftPose.drawing.key,source,role:s.motionAudit.find(a=>a.id===id),fx:structuredClone(fx.audit),areaFraction:count/(W*H),maxFaceCoverage:Math.max(0,...coverage),paintedTipError:fx.cut.visible?Math.hypot(head.x-source.x,head.y-source.y):null,units:s.sizeAudit().units,targets:[...new Set(m.plan.events.filter(e=>e.type==='damage'&&e.actorId===id).flatMap(e=>e.targetIds))],cameraPixels:Math.hypot(s.camera.position.x,s.camera.position.y)*W/s.worldWidth,occlusion});
    s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   }
  }
  rt.dispose();return{present:true,id,missing,plans,rows};
 });
 results.push({fixture:fixture.id,width,height,errors,...result});
 await page.screenshot({path:`${out}/raw/live/${fixture.id}-${height}-${attempt}-end.png`});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,width,height,present:result.present,missing:result.missing,errors,peakUltimate:Math.max(0,...result.rows.filter(r=>r.ultimate).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(0,...result.rows.map(r=>r.maxFaceCoverage)),maxPaintedTipError:Math.max(0,...result.rows.map(r=>r.paintedTipError??0)),maxUnitOcclusion:Math.max(0,...result.rows.flatMap(r=>r.occlusion.map(o=>o.fraction)))}));
}
await writeFile(`${out}/live-probe-${attempt}.json`,JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
