/** Teacup healing in unchanged real fixtures; old damaging basics remain an explicit class limitation. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A7/teacup-healer';await mkdir(`${out}/raw/live`,{recursive:true});
const unitIndex=Number(process.argv[2]??0),round=process.env.ART_PROBE_ROUND||'r1';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{for(const fixture of config.fixtures.filter(f=>!unitIndex||f.id==='boss')){
 const {page,errors}=await openFixture(browser,fixture);
 const result=await page.evaluate(async unitIndex=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const pair=[...s.actors.entries()].filter(([,e])=>e.asset==='teacup-healer')[unitIndex];if(!pair)return{present:false,rows:[]};
  const [id,entry]=pair,rows=[],missing=[],W=s.width,H=s.height,renderer=s.renderer,rt=new T.WebGLRenderTarget(W,H);
  for(const ultimate of [false,true]){
   m.paused=false;
   for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId===id&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!==id||m.plan.ultimate!==ultimate){missing.push(ultimate?'ultimate':'basic');continue;}m.paused=true;
   const times=ultimate?[0,300,600,900,950,983.333,1016.667,1050,1083.333,1100,1150,1250,1400,1799,2199,2200]:[0,50,100,166.667,200,233.333,266.667,300,333.333,350,366.667,400,500,700,800];
   const expectedHealIds=[...new Set(m.plan.events.filter(e=>e.actorId===id&&e.type==='heal').flatMap(e=>e.targetIds))].filter(target=>s.view().actors.find(a=>a.id===target)?.side===s.view().actors.find(a=>a.id===id)?.side);
   const damageEvents=m.plan.events.filter(e=>e.actorId===id&&e.type==='damage');
   for(const ms of times){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);s.scene.updateMatrixWorld(true);
    const fx=s.craftTea,source=s.socket(id,'vfxOrigin'),faces=[...s.actors.values()].filter(e=>e.actor.root.visible).map(e=>s.faceBounds(e));
    const scene=new T.Scene();for(const root of [fx.ground,fx.rear,fx.front])scene.add(root.clone(true));
    const color=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha();
    renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(scene,s.camera);
    const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>=128)count++;
    const coverage=faces.map(f=>{let n=0,c=0;for(let y=Math.max(0,Math.floor(f.y));y<Math.min(H,Math.ceil(f.y+f.height));y++)for(let x=Math.max(0,Math.floor(f.x));x<Math.min(W,Math.ceil(f.x+f.width));x++){n++;if(pixels[((H-1-y)*W+x)*4+3]>=128)c++;}return n?c/n:0;});
    const paint=fx.glint.localToWorld(new T.Vector3(.42732919254658386-.5,.5-.998046875,0)).project(s.camera),head={x:(paint.x*.5+.5)*W,y:(.5-paint.y*.5)*H};
    const occlusion=[];
    if([200,350,1250].includes(ms)){
     const union=new Uint8Array(W*H);
     for(const unit of [...s.sizeAudit().units].sort((a,b)=>b.drawOrder-a.drawOrder)){
      renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(s.actors.get(unit.id).actor.root,s.camera);
      renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);let opaque=0,hidden=0;
      for(let i=0;i<union.length;i++)if(pixels[i*4+3]>=128){opaque++;if(union[i])hidden++;union[i]=1;}
      occlusion.push({id:unit.id,opaque,hidden,fraction:opaque?hidden/opaque:0});
     }
     renderer.setRenderTarget(null);renderer.setClearColor(color,alpha);
    }
    rows.push({ultimate,ms,key:entry.craftPose.drawing.key,source,role:s.motionAudit.find(a=>a.id===id),fx:structuredClone(fx.audit),areaFraction:count/(W*H),maxFaceCoverage:Math.max(0,...coverage),paintedSocketError:fx.glint.visible?Math.hypot(head.x-source.x,head.y-source.y):null,expectedHealIds,damageEvents,actualRecipientIds:fx.audit.recipients.map(p=>[...s.homes].find(([,h])=>Math.hypot(p.x-h.point.x,p.y-h.point.y)<.001)?.[0]??'unmatched'),recipientKeys:expectedHealIds.map(target=>({id:target,key:s.actors.get(target)?.craftPose?.drawing.key??null})),cameraPixels:Math.hypot(s.camera.position.x,s.camera.position.y)*W/s.worldWidth,occlusion});
    s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
   }
  }
  rt.dispose();return{present:true,id,missing,rows};
 },unitIndex);
 results.push({fixture:fixture.id,errors,...result});
 await page.screenshot({path:`${out}/raw/live/${fixture.id}-end.png`});await page.close();
 console.log(JSON.stringify({fixture:fixture.id,present:result.present,missing:result.missing,errors,peakUltimate:Math.max(0,...result.rows.filter(r=>r.ultimate).map(r=>r.areaFraction)),maxFaceCoverage:Math.max(0,...result.rows.map(r=>r.maxFaceCoverage)),maxSocketError:Math.max(0,...result.rows.filter(r=>r.paintedSocketError!==null).map(r=>r.paintedSocketError)),maxUnitOcclusion:Math.max(0,...result.rows.flatMap(r=>r.occlusion.map(o=>o.fraction))),healTargets:[...new Set(result.rows.flatMap(r=>r.expectedHealIds))],oldBasicDamageEvents:Math.max(0,...result.rows.filter(r=>!r.ultimate).map(r=>r.damageEvents.length))}));
}
await writeFile(`${out}/live-probe-${round}${unitIndex?'-second':''}.json`,JSON.stringify(results,null,2)+'\n');
}finally{await browser.close();}
