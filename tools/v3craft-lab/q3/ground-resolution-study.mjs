// X20 isolates target resampling from light. T36/T38, D8 r0 review.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D8-resolution';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D8&revision=0');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),W=1280,H=720;
  const rt=new T.WebGLRenderTarget(W,H);rt.texture.colorSpace=T.SRGBColorSpace;
  const bytes=new Uint8Array(W*H*4),rows=[],images={};p.renderer.setRenderTarget(rt);
  const render=()=>{p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);return bytes.slice();};
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const Y=(a,i)=>.2126*linear(a[i*4])+.7152*linear(a[i*4+1])+.0722*linear(a[i*4+2]);
  const png=bytes=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(bytes.length);for(let y=0;y<H;y++)a.set(bytes.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
  for(const ms of [0,225,350])for(const size of [320,280,560]){
   p.drill.paintTarget.setSize(size,size);p.drill.light.uTexel.value.set(1/size,1/size);p.draw(ms);
   p.drill.light.uLight.value=0;p.drill.light.uAmbient.value=0;p.drill.shadow.visible=false;p.drill.decal.visible=false;
   const composite=render();p.drill.root.visible=false;p.actor.root.visible=true;const base=render();
   const vis=p.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);const mask=render();
   vis.forEach(([o,v])=>o.visible=v);p.renderer.setClearColor('#242336',1);p.drill.root.visible=true;p.actor.root.visible=false;
   const face=p.drill.light.uFace.value.toArray(),metrics={};
   for(const region of ['face','body']){
    let aa=0,ab=0,count=0,delta=0;const selected=(x,y)=>mask[(y*W+x)*4+3]>204&&(region==='body'||(x>=face[0]&&x<face[0]+face[2]&&y>=face[1]&&y<face[1]+face[3]));
    for(let y=140;y<420;y++)for(let x=180;x<460;x++)if(selected(x,y)){
     const i=y*W+x,a=Y(base,i),b=Y(composite,i);count++;for(let c=0;c<3;c++)delta+=Math.abs(composite[i*4+c]-base[i*4+c]);
     for(const [dx,dy]of[[1,0],[0,1]])if(selected(x+dx,y+dy)){const j=i+dx+dy*W,aj=Y(base,j),bj=Y(composite,j),d=aj-a;if(Math.abs(d)>.006){const ca=d/Math.max(1e-4,aj+a),cb=(bj-b)/Math.max(1e-4,bj+b);aa+=ca*ca;ab+=ca*cb;}}
    }metrics[region]={normalizedContrastRetention:ab/aa,meanAbsoluteRGBDelta:delta/(count*3)};
   }
   rows.push({ms,size,metrics});images[`size-${size}-${ms}`]=png(composite);if(size===320)images['base-'+ms]=png(base);
  }
  p.renderer.setRenderTarget(null);rt.dispose();return{rows,images};
 });
 for(const[name,data]of Object.entries(result.images))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));delete result.images;
 writeFileSync('tools/v3craft-lab/q3/ground-resolution-study.json',JSON.stringify({at:new Date().toISOString(),errors,method:'Three target sizes on the identical280world-pixel crop with all colour/shadow effects disabled; original direct paint at the same pose is baseline; signed1px local contrast and RGB error.',...result},null,2)+'\n');console.log(JSON.stringify({errors,...result}));
}finally{await browser.close();}
