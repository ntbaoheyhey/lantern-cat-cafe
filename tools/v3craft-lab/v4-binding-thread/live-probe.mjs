/** Binding poses/effects in unchanged real fixtures. No synthetic game events. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A7/binding-thread';await mkdir(`${out}/raw/live`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{for(const fixture of config.fixtures){
 const {page,errors}=await openFixture(browser,fixture);
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const pair=[...s.actors.entries()].find(([,e])=>e.asset==='binding-thread');if(!pair)return{present:false,rows:[]};
  const [id,entry]=pair,rows=[],missing=[],W=s.width,H=s.height,renderer=s.renderer,rt=new T.WebGLRenderTarget(W,H);
  for(const ultimate of [false,true]){
   m.paused=false;
   for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId===id&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!==id||m.plan.ultimate!==ultimate){missing.push(ultimate?'ultimate':'basic');continue;}m.paused=true;
   const times=ultimate?[0,300,600,900,950,983.333,1016.667,1050,1083.333,1100,1150,1250,1400,1799,2199,2200]:[0,50,100,166.667,200,233.333,266.667,300,333.333,350,366.667,400,500,700,800];
   for(const ms of times){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);s.scene.updateMatrixWorld(true);
    const fx=s.craftThread,source=s.socket(id,'vfxOrigin'),faces=[...s.actors.values()].filter(e=>e.actor.root.visible).map(e=>s.faceBounds(e));
    const scene=new T.Scene();for(const root of [fx.ground,fx.rear,fx.front])scene.add(root.clone(true));
    const color=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,s.camera);
    const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)count++;
    const coverage=faces.map(f=>{let n=0,c=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){n++;if(pixels[((H-1-y)*W+x)*4+3]>=128)c++;}return n?c/n:0;});
    const paint=fx.knot.localToWorld(new T.Vector3(67/768-.5,.5-70/139,0)).project(s.camera),head={x:(paint.x*.5+.5)*W,y:(.5-paint.y*.5)*H};
    rows.push({ultimate,ms,key:entry.craftPose.drawing.key,source,role:s.motionAudit.find(a=>a.id===id),fx:structuredClone(fx.audit),areaFraction:count/(W*H),maxFaceCoverage:Math.max(0,...coverage),paintedHeadError:Math.hypot(head.x-fx.audit.head.x,head.y-fx.audit.head.y),launchSocketError:(ms===(ultimate?950:200))?Math.hypot(source.x-fx.audit.launch.x,source.y-fx.audit.launch.y):null,cameraPixels:Math.hypot(s.camera.position.x,s.camera.position.y)*W/s.worldWidth});
    s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   }
  }
  rt.dispose();return{present:true,id,missing,rows};
 });
 results.push({fixture:fixture.id,errors,...result});
 await page.screenshot({path:`${out}/raw/live/${fixture.id}-end.png`});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,present:result.present,missing:result.missing,errors,flightSamples:result.rows.filter(r=>r.fx.flight).length,peakUltimate:Math.max(0,...result.rows.filter(r=>r.ultimate).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(0,...result.rows.map(r=>r.maxFaceCoverage)),socketErrors:result.rows.filter(r=>r.launchSocketError!==null).map(r=>r.launchSocketError)}));
}
await writeFile(`${out}/live-probe.json`,JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
