// Actual renderer acceptance probes; existing fixture/seek and readback APIs.
// LEARN/A4.md and measured colour/foot-origin experiment; no recorder changes.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/v4-mochi/raw/runtime-check';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const result=await page.evaluate(async()=>{
   const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
   const actor=s.actors.get('mochi').actor,layer=actor.mesh.drawing,W=s.width,H=s.height;
   const target=new T.WebGLRenderTarget(W,H,{depthBuffer:false});target.texture.colorSpace=T.SRGBColorSpace;
   const savedTarget=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha();
   const read=root=>{s.renderer.setRenderTarget(target);s.renderer.setClearColor(0,0);s.renderer.clear();s.renderer.render(root,s.camera);const a=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(target,0,0,W,H,a);return a;};
   const png=a=>{const c=document.createElement('canvas');c.width=W;c.height=H;const b=new Uint8ClampedArray(a.length);for(let y=0;y<H;y++)b.set(a.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(b,W,H),0,0);return c.toDataURL();};
   const bounds=a=>{let left=W,right=-1,bottom=H,top=-1,count=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(a[(y*W+x)*4+3]>=128){left=Math.min(left,x);right=Math.max(right,x);bottom=Math.min(bottom,y);top=Math.max(top,y);count++;}return{left,right,bottom,top,height:top-bottom+1,count};};
   const rows=[],images={};
   for(const [clip,duration,times]of [['idle',3600,[0,900,1800,2700]],['attack',800,[0,50,150,270,330,350,400,500,600,800]],['ult',2200,[0,300,600,1000,1100,1200,1800,2200]],['hurt',400,[0,75,150,180,300,400]]]){
    for(const ms of times){
     s.render({...s.view(),model:{clip},modelProgress:ms/duration,fixedTime:10,paused:true},0);
     const pixels=read(actor.root),box=bounds(pixels),foot=s.screen(actor.root.localToWorld(new T.Vector3(...[...layer.origin,0])));
     rows.push({clip,ms,key:layer.key,box,foot:{x:foot.x,y:foot.y},face:s.sizeAudit().units.find(u=>u.id==='mochi').faceBox});
     if((clip==='attack'&&[0,150,350].includes(ms))||(clip==='hurt'&&ms===0)||(clip==='ult'&&ms===600))void 0;
    }
   }
   s.renderer.setRenderTarget(savedTarget);s.renderer.setClearColor(clear,alpha);target.dispose();return{rows,images};
  });
  for(const [key,data]of Object.entries(result.images))writeFileSync(`${out}/${width}-${key}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
  results.push({width,height,errors,...result});await page.close();
  console.log(JSON.stringify({width,errors,poseFrames:result.rows.length,footDrift:Math.max(...result.rows.map(r=>Math.hypot(r.foot.x-result.rows[0].foot.x,r.foot.y-result.rows[0].foot.y)))}));
 }
 writeFileSync('reports/v4-art/REVIEW/A4/runtime-check.json',JSON.stringify({at:new Date().toISOString(),scope:'Actual visible-paint footprint, footprint anchor and pose samples; not film/blind/contrast/FPS acceptance',results},null,2)+'\n');
}finally{await browser.close();}
