// Resolve conservative AABB candidates with original alpha pixels, LEARN/Q2.md.
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
const measurements=JSON.parse(await readFile('tools/v3craft-lab/q2/film-measurements.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),results=[];
try{for(const fixture of config.fixtures){
 const row=measurements.fixtures.find(x=>x.fixture===fixture.id);
 const d=JSON.parse(gunzipSync(await readFile(`reports/v3-feel/REVIEW/Q2/${fixture.id}/capture.json.gz`)));
 const candidates=[...row.faceCandidates.map(c=>({...c,type:'face',unit:c.occluder})),...row.defects.filter(c=>c.type==='clip')].map(c=>({...c,frame:d.frames[c.ordinal]})).sort((a,b)=>a.ordinal-b.ordinal);
 if(!candidates.length)continue;
 const {page,errors}=await openFixture(browser,fixture);
 const rows=await page.evaluate(async({candidates,plans})=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const {opaqueWorldBounds}=await import('/src/game/cardrpg/stage/opaque-pose-bounds.ts');
  const m=window.__depthReview,s=window.__depthScene,renderer=s.renderer,isolated=new T.Scene(),margin=32;
  const target=new T.WebGLRenderTarget(s.width+margin*2,s.height+margin*2),camera=s.camera.clone(),worldPerPixel=s.worldWidth/s.width;
  camera.left-=margin*worldPerPixel;camera.right+=margin*worldPerPixel;camera.top+=margin*worldPerPixel;camera.bottom-=margin*worldPerPixel;camera.updateProjectionMatrix();
  const pixels=new Uint8Array((s.width+margin*2)*(s.height+margin*2)*4),rows=[];let key=0;
  m.paused=false;m.sceneReady=true;if(!m.plan)m.step();
  for(const c of candidates){
   while(key<c.frame.action.key){m.paused=false;const p=m.plan;while(m.plan===p)m.tick(100);if(!m.plan)m.step();key++;}
   const expected=plans[key];if(m.plan.id!==expected.id||m.plan.actorId!==expected.actorId)throw Error('Seek diverged at '+key);
   m.paused=true;m.animationAt=c.frame.action.elapsed;s.render({...s.view(),paused:true,fixedTime:10+c.frame.frameAt},0);
   const actor=s.actors.get(c.unit).actor,parent=actor.root.parent,p=c.frame.rootPoses.find(p=>p.id===c.unit),recorded=c.frame.units.find(u=>u.id===c.unit);
   actor.root.position.set(p.x,p.y,0);actor.root.scale.set(p.scaleX,p.scaleY,1);actor.root.rotation.z=p.angle;actor.root.updateMatrixWorld(true);
   const hull=opaqueWorldBounds(actor.root),predicted={x:(hull.x+s.worldWidth/2)/worldPerPixel,y:(s.camera.top-hull.y-hull.height)/worldPerPixel,width:hull.width/worldPerPixel,height:hull.height/worldPerPixel};
   const hullDelta=Math.max(...Object.keys(predicted).map(k=>Math.abs(predicted[k]-recorded.box[k])));
   isolated.add(actor.root);renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();renderer.render(isolated,camera);renderer.readRenderTargetPixels(target,0,0,target.width,target.height,pixels);parent.add(actor.root);
   let outside=0,facePixels=0,nearFacePixels=0;const face=c.type==='face'?c.frame.units.find(u=>u.id===c.face).faceBox:null;
   for(let y=0;y<target.height;y++)for(let x=0;x<target.width;x++)if(pixels[(y*target.width+x)*4+3]>=128){const sx=x-margin,sy=target.height-1-y-margin;if(sx<0||sx>=s.width||sy<0||sy>=s.height)outside++;if(face&&sx+.5>=face.x&&sx+.5<face.x+face.width&&sy+.5>=face.y&&sy+.5<face.y+face.height)facePixels++;if(face&&sx+.5>=face.x-8&&sx+.5<face.x+face.width+8&&sy+.5>=face.y-8&&sy+.5<face.y+face.height+8)nearFacePixels++;}
   rows.push({type:c.type,ordinal:c.ordinal,time:c.frame.t,unit:c.unit,face:c.face??null,alphaPixelsOutsideViewport:outside,alphaPixelsOnFace:facePixels,alphaPixelsWithin8pxOfFace:nearFacePixels,replayedHullMaxDeltaPx:hullDelta});
  }
  renderer.setRenderTarget(null);target.dispose();return rows;
 },{candidates,plans:d.plans});
 results.push({fixture:fixture.id,rows,errors});await page.close();console.log(JSON.stringify({fixture:fixture.id,candidates:rows.length,outside:Math.max(...rows.map(x=>x.alphaPixelsOutsideViewport)),facePixels:Math.max(...rows.map(x=>x.alphaPixelsOnFace)),maxHullDelta:Math.max(...rows.map(x=>x.replayedHullMaxDeltaPx)),errors}));
}
await writeFile('tools/v3craft-lab/q2/replayed-candidates.json',JSON.stringify({at:new Date().toISOString(),method:'Chronological plan/elapsed seek, restore captured root transforms, render original actor alpha into a 32px extended viewport, count alpha>=128 outside original viewport or inside protected face. Record hull mismatch to qualify replay.',results},null,2)+'\n');
}finally{await browser.close();}
