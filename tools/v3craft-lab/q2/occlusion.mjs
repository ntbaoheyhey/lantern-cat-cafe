import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),captures=[];
const intersects=(a,b)=>Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)&&Math.min(a.y+a.height,b.y+b.height)>Math.max(a.y,b.y);
for(const fixture of config.fixtures){
 const data=JSON.parse(gunzipSync(await readFile(resolve(root,'reports/v3-feel/REVIEW/Q2',fixture.id,'capture.json.gz'))));
 for(const frame of data.frames)for(const u of frame.units)for(const v of frame.units){
  if(v.drawOrder<=u.drawOrder||!intersects(u.faceBox,v.box))continue;
  captures.push({fixture,frame,face:u,occluder:v,plan:data.plans.find(p=>p.key===frame.action.key)});
 }
}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{for(const c of captures){
 const {page,errors}=await openFixture(browser,c.fixture);
 const pixels=await page.evaluate(async(c)=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const m=window.__depthReview,s=window.__depthScene;m.paused=false;m.sceneReady=true;
  for(let key=0;key<=c.plan.key;key++){
   if(!m.plan)m.step();if(key===c.plan.key)break;
   const p=m.plan;while(m.plan===p)m.tick(100);
  }
  if(m.plan.id!==c.plan.id||m.plan.actorId!==c.plan.actorId)throw Error('Seek diverged');
  m.paused=true;m.animationAt=c.frame.action.elapsed;s.render({...s.view(),paused:true,fixedTime:10+c.frame.t},0);
  const isolated=new T.Scene(),entry=s.actors.get(c.occluder.id),actor=entry.actor,parent=actor.root.parent;
  const pose=c.frame.rootPoses.find(p=>p.id===c.occluder.id);actor.root.position.set(pose.x,pose.y,0);actor.root.scale.set(pose.scaleX,pose.scaleY,1);actor.root.rotation.z=pose.angle;actor.root.updateMatrixWorld(true);
  const target=new T.WebGLRenderTarget(s.width,s.height),renderer=s.renderer,b=c.face.faceBox;
  const x=Math.floor(b.x),y=Math.floor(b.y),w=Math.ceil(b.width)+1,h=Math.ceil(b.height)+1,p=new Uint8Array(w*h*4);
  isolated.add(actor.root);renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();renderer.render(isolated,s.camera);renderer.readRenderTargetPixels(target,x,s.height-y-h,w,h,p);
  let opaque=0;for(let i=3;i<p.length;i+=4)if(p[i]>=128)opaque++;
  parent.add(actor.root);renderer.setRenderTarget(null);target.dispose();return{opaquePixelsOnFace:opaque,region:{x,y,w,h},alphaThreshold:128};
 },c);
 results.push({fixture:c.fixture.id,time:c.frame.t,ordinal:c.frame.ordinal,face:c.face.asset,occluder:c.occluder.asset,plan:c.plan.id,...pixels,errors});await page.close();
}
await writeFile(resolve(import.meta.dirname,'occlusion.json'),JSON.stringify({at:new Date().toISOString(),method:'Conservative recorded face/body AABB candidates checked against isolated rendered occluder alpha at matching plan, elapsed time and recorded root transform.',results},null,2)+'\n');console.log(results);
}finally{await browser.close();}
