// Reuses X02/D1 exact-time GPU readback, not the production recorder.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??2),out=`tools/v3craft-lab/q3/raw/D2-r${revision}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D2&revision=${revision}`);
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,d=p.drill,target=new T.WebGLRenderTarget(1280,720),pixels=new Uint8Array(1280*720*4);
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d');
  p.scene.children.forEach(o=>o.visible=o===d.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);
  const read=()=>{p.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);return pixels;};
  const png=()=>{const rgba=new Uint8ClampedArray(pixels.length);for(let y=0;y<720;y++)rgba.set(pixels.subarray((719-y)*5120,(720-y)*5120),y*5120);ctx.putImageData(new ImageData(rgba,1280,720),0,0);return canvas.toDataURL();};
  const samples=[];
  for(let i=0;i<=60;i++){p.draw(i*1000/30);read();let count=0;for(let j=3;j<pixels.length;j+=4)if(pixels[j]>20)count++;samples.push({ms:i*1000/30,visible:count});}
  const peak=samples.reduce((a,b)=>a.visible>b.visible?a:b),images=[];
  for(const role of ['union',...d.layers.map(l=>l.role)]){d.layers.forEach(l=>l.mesh.visible=role==='union'||l.role===role);p.draw(peak.ms);read();images.push({name:`peak-${role}`,png:png()});}
  const flow=[];
  for(const method of ['static-UV','panned-UV']){
   const frames=[];d.layers.forEach((l,i)=>l.mesh.visible=i===0);
   for(const time of [.6,.8]){
    p.draw(600);d.layers[0].uniforms.uTime.value=method==='static-UV'?.6:time;
    p.renderer.render(p.scene,p.camera);read();frames.push(pixels.slice());images.push({name:`flow-${method}-${time}`,png:png()});
   }
   let count=0,sum=0,changed=0;
   for(let j=0;j<pixels.length;j+=4)if(frames[0][j+3]>20&&frames[1][j+3]>20){const delta=(Math.abs(frames[0][j]-frames[1][j])+Math.abs(frames[0][j+1]-frames[1][j+1])+Math.abs(frames[0][j+2]-frames[1][j+2]))/3;count++;sum+=delta;if(delta>4)changed++;}
   flow.push({method,commonSupportPixels:count,meanRgbDifference255:sum/count,fractionChangedOver4:changed/count});
  }
  target.dispose();return{samples,peak,flow,images};
 });
 for(const entry of result.images)writeFileSync(`${out}/${entry.name}.png`,Buffer.from(entry.png.split(',')[1],'base64'));
 delete result.images;
 const record={at:new Date().toISOString(),revision,method:'61 exact-time isolated GPU samples alpha>20/255; not movie timing. Flow compares two UV times on geometry/lifetime frozen at600ms.',sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d2.ts')).digest('hex'),...result};
 writeFileSync(`${out}/alpha-flow.json`,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({peak:result.peak,lastVisible:result.samples.findLast(s=>s.visible),end:result.samples.at(-1),flow:result.flow}));
}finally{await browser.close();}
