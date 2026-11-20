// Reuse the D1/D2 exact-time GPU readback method. Not independent video timing.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??1),out=`tools/v3craft-lab/q3/raw/D3-r${revision}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D3&revision=${revision}`);
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,d=p.drill,target=new T.WebGLRenderTarget(1280,720),pixels=new Uint8Array(1280*720*4);
  p.scene.children.forEach(o=>o.visible=o===d.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);
  const read=()=>p.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);
  const count=()=>{let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>20)n++;return n;};
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;const ctx=canvas.getContext('2d');
  const png=()=>{const rgba=new Uint8ClampedArray(pixels.length);for(let y=0;y<720;y++)rgba.set(pixels.subarray((719-y)*5120,(720-y)*5120),y*5120);ctx.putImageData(new ImageData(rgba,1280,720),0,0);return canvas.toDataURL();};
  const samples=[];
  for(let i=0;i<=60;i++){p.draw(i*1000/30);read();samples.push({ms:i*1000/30,visible:count()});}
  const peak=samples.reduce((a,b)=>a.visible>b.visible?a:b),images=[],supports=[];
  for(const role of ['union',...d.layers.map(l=>l.role)]){
   d.layers.forEach(l=>l.mesh.visible=role==='union'||l.role===role);p.draw(peak.ms);read();
   images.push({name:`peak-${role}`,png:png()});supports.push({role,pixels:count()});
  }
  const rolePeaks=[];
  for(const layer of d.layers){
   d.layers.forEach(l=>l.mesh.visible=l===layer);
   let best={ms:0,visible:0};
   for(let i=0;i<=60;i++){p.draw(i*1000/30);read();const visible=count();if(visible>best.visible)best={ms:i*1000/30,visible};}
   p.draw(best.ms);read();images.push({name:`role-peak-${layer.role}`,png:png()});rolePeaks.push({role:layer.role,...best});
  }
  d.layers.forEach(l=>l.mesh.visible=true);
  p.draw(peak.ms);read();const baseline=pixels.slice();const seek=[];
  for(const time of [0,1750,425,950,2000]){p.draw(time);p.draw(peak.ms);read();let differences=0;for(let i=0;i<pixels.length;i++)if(pixels[i]!==baseline[i])differences++;seek.push({intermediateMs:time,changedChannels:differences});}
  const trajectories=[];
  for(const kind of [0,1,2])for(const id of [0,2]){
   const particle=d.particles.find(p=>p.kind===kind&&p.id===id),rows=[];
   for(const age of [0,.05,.1,.2,.4,.6,.8]){
    p.draw(particle.birth+age*1000);const s=d.state().particles.find(p=>p.kind===kind&&p.id===id);rows.push({sampleAgeSeconds:age,...s});
   }
   trajectories.push({kind,id,birth:particle.birth,life:particle.life,rows});
  }
  target.dispose();return{samples,peak,supports,rolePeaks,seek,trajectories,images};
 });
 for(const entry of result.images)writeFileSync(`${out}/${entry.name}.png`,Buffer.from(entry.png.split(',')[1],'base64'));
 delete result.images;
 const record={at:new Date().toISOString(),revision,method:'61 isolated exact-time GPU samples alpha>20/255; repeat seek pixel equality; not movie clock proof.',sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d3.ts')).digest('hex'),...result};
 writeFileSync(`${out}/gpu-probe.json`,JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({peak:result.peak,supports:result.supports,rolePeaks:result.rolePeaks,lastVisible:result.samples.findLast(s=>s.visible),end:result.samples.at(-1),seek:result.seek}));
}finally{await browser.close();}
