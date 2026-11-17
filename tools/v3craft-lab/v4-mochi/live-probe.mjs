/** A4 live contact/coverage/layout drill; uses established fixture and alpha readback. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const out='reports/v4-art/REVIEW/A4';await mkdir(out+'/raw/live',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
const selected=process.argv[2]??'wave3',sizes=process.argv.includes('--all')?[[1280,720],[1440,900]]:[[1280,720]];
try{for(const [width,height]of sizes)for(const fixture of config.fixtures.filter(f=>selected==='all'||f.id===selected)){
 const {page,errors}=await openFixture(browser,fixture,{width,height});
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H),renderer=s.renderer,rows=[];
  const read=(root)=>{renderer.setRenderTarget(rt);renderer.setClearColor(0,0);renderer.clear();renderer.render(root,s.camera);const pixels=new Uint8Array(W*H*4);renderer.readRenderTargetPixels(rt,0,0,W,H,pixels);return pixels;};
  for(const ultimate of [false,true]){
   m.paused=false;
   for(let i=0;i<160;i++){if(!m.plan)m.step();if(m.plan?.actorId==='mochi'&&m.plan.ultimate===ultimate)break;while(m.plan)m.tick(100);}
   if(m.plan?.actorId!=='mochi')throw Error('No Mochi action');m.paused=true;
   for(const ms of ultimate?[0,300,599,800,1000,1100,1189,1400,1800,2199,2200]:[0,100,250,300,350,439,560,700,799,800]){
    m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);
    const units=s.sizeAudit().units,entry=s.actors.get('mochi'),key=entry.craftPose.drawing.key,source=s.socket('mochi','vfxOrigin'),fx=s.craftShield;
    const targetIds=[...new Set(m.plan.events.filter(e=>e.actorId==='mochi'&&e.type==='damage').flatMap(e=>e.targetIds))],targets=targetIds.flatMap(id=>units.find(u=>u.id===id)??[]);
    const self=units.find(u=>u.id==='mochi'),role=s.motionAudit.find(u=>u.id==='mochi'),impact=ultimate?1100:350;
    const row={ultimate,ms,key,role,source,fx:{...fx.audit},units,targets:targetIds,contactGap:targets[0]?targets[0].box.x-self.box.x-self.box.width:null};
    if([0,250,300,350,700,1000,1100,1400,1800].includes(ms)){
     const clear=renderer.getClearColor(new T.Color()).clone(),alpha=renderer.getClearAlpha(),union=new Uint8Array(W*H),occlusion=[];
     for(const u of [...units].sort((a,b)=>b.drawOrder-a.drawOrder)){
      const pixels=read(s.actors.get(u.id).actor.root);let count=0,hidden=0;
      for(let k=0;k<union.length;k++)if(pixels[k*4+3]>=128){count++;if(union[k])hidden++;union[k]=1;}
      occlusion.push({id:u.id,fraction:count?hidden/count:0,count,hidden});
     }
     const roots=[fx.rear,fx.front,fx.ground],visibility=s.scene.children.map(o=>[o,o.visible]);for(const [o]of visibility)if(!roots.includes(o))o.visible=false;
     const paint=read(s.scene);let count=0;for(let k=3;k<paint.length;k+=4)if(paint[k]>=128)count++;
     for(const [o,v]of visibility)o.visible=v;
     renderer.setRenderTarget(null);renderer.setClearColor(clear,alpha);row.occlusion=occlusion;row.effectArea=count/(W*H);
    }
    rows.push(row);
   }
   if(!ultimate){m.paused=false;while(m.plan)m.tick(100);}
  }
  rt.dispose();return{rows};
 });
 results.push({fixture:fixture.id,width,height,errors,...result});
 await writeFile(out+'/live-probe.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
 console.log(JSON.stringify({fixture:fixture.id,width,height,errors,impact:result.rows.filter(r=>r.ms===(r.ultimate?1100:350)).map(r=>({ultimate:r.ultimate,gap:r.contactGap,key:r.key,area:r.effectArea,sourceError:Math.hypot(r.source.x-r.fx.source.x,r.source.y-r.fx.source.y),role:r.role})),maxOcclusion:Math.max(...result.rows.flatMap(r=>r.occlusion?.map(o=>o.fraction)??[])),maxArea:Math.max(...result.rows.map(r=>r.effectArea??0))}));
 for(const ms of [800,1100,1400,1800])if(width===1280&&fixture.id==='wave3'){
  await page.evaluate(ms=>{const s=window.__depthScene,m=window.__depthReview;m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true},0);},ms);
  await page.screenshot({path:`${out}/raw/live/ultimate-${ms}.png`});
 }
 await page.close();
}}finally{await browser.close();}
