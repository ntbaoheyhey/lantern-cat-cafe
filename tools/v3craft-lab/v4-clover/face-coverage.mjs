/** Exact foreground alpha on face regions; rear effect is occluded by opaque actors. */
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const rows=[];
try{for(const [width,height]of[[1280,720],[1440,900]])for(const fixture of config.fixtures){const {page,errors}=await openFixture(browser,fixture,{width,height});
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');m.paused=false;
  for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='clover'&&m.plan.ultimate)break;while(m.plan)m.tick(100);}if(m.plan?.actorId!=='clover')throw Error('No Clover ultimate');m.paused=true;m.animationAt=1100;s.render({...s.view(),fixedTime:21.1,paused:true},0);
  const W=s.width,H=s.height,target=new T.WebGLRenderTarget(W,H,{depthBuffer:false});target.texture.colorSpace=T.SRGBColorSpace;
  const oldTarget=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha(),art=s.craftHeal;
  const read=()=>{s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(s.scene,s.camera);const pixels=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(target,0,0,W,H,pixels);return pixels;};
  const full=read(),roots=[art.front,art.rear,art.ground],visible=roots.map(r=>r.visible);roots.forEach(r=>r.visible=false);const baseline=read();roots.forEach((r,i)=>r.visible=visible[i]);
  const frontVisibility=s.scene.children.map(o=>[o,o.visible]);for(const [o]of frontVisibility)if(o!==art.front)o.visible=false;const front=read();for(const [o,v]of frontVisibility)o.visible=v;
  const affected=new Set(m.plan.events.filter(e=>e.actorId==='clover'&&e.type==='heal').flatMap(e=>e.targetIds));affected.add('clover');const faces=[];
  for(const id of affected){const entry=s.actors.get(id);if(!entry)continue;const b=s.faceBounds(entry);let count=0,covered=0,changed=0;
   for(let y=Math.max(0,Math.floor(b.y));y<Math.min(H,Math.ceil(b.y+b.height));y++)for(let x=Math.max(0,Math.floor(b.x));x<Math.min(W,Math.ceil(b.x+b.width));x++){
    if(((x-b.x-b.width/2)/(b.width/2))**2+((y-b.y-b.height/2)/(b.height/2))**2>1)continue;
    const k=((H-1-y)*W+x)*4;count++;if(front[k+3]>=128)covered++;if(Math.max(...[0,1,2].map(c=>Math.abs(full[k+c]-baseline[k+c])))>32)changed++;
   }faces.push({id,face:b,pixels:count,foregroundAlphaCoverage:covered/Math.max(1,count),compositeChangedFraction:changed/Math.max(1,count)});
  }
  s.renderer.setRenderTarget(oldTarget);s.renderer.setClearColor(clear,alpha);target.dispose();return faces;
 });rows.push({fixture:fixture.id,width,height,errors,faces:result});await page.close();}}
finally{await browser.close();}
await writeFile('reports/v4-art/REVIEW/A5/face-coverage.json',JSON.stringify({method:'Live1100ms current renderer; face ellipse, foreground alpha>=128 coverage; composite delta>32 audit includes rear edge. Paired with inspected encoded films; not recovered film alpha.',rows},null,2)+'\n');console.log(JSON.stringify(rows.map(r=>({fixture:r.fixture,errors:r.errors,maxCoverage:Math.max(...r.faces.map(f=>f.foregroundAlphaCoverage)),maxCompositeChanged:Math.max(...r.faces.map(f=>f.compositeChangedFraction))}))));
