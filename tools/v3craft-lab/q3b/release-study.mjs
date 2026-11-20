// Q3B-X08: compare two release envelopes on the same actual R1 composition.
// Reuses X01 isolated GPU masks. No recorder, game clock or production edits.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/release';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'));
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,m=window.__depthReview,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  m.paused=false;m.sceneReady=true;
  for(let i=0;i<150;i++){if(!m.plan)m.step();if(m.plan?.actorId==='soot'&&m.plan.ultimate){m.paused=true;break;}while(m.plan)m.tick(100);}
  if(m.plan?.actorId!=='soot'||!m.plan.ultimate)throw Error('No Soot ultimate');
  const W=s.width,H=s.height,rt=new T.WebGLRenderTarget(W,H,{depthBuffer:false,stencilBuffer:false});rt.texture.colorSpace=T.SRGBColorSpace;
  const saved=s.renderer.getRenderTarget(),clear=s.renderer.getClearColor(new T.Color()).clone(),alpha=s.renderer.getClearAlpha(),images={},rows=[];
  const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
  const read=()=>{s.renderer.setRenderTarget(rt);s.renderer.clear();s.renderer.render(s.scene,s.camera);const p=new Uint8Array(W*H*4);s.renderer.readRenderTargetPixels(rt,0,0,W,H,p);return p;};
  const png=p=>{const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(p.length);for(let y=0;y<H;y++)a.set(p.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();};
  for(const method of ['long-hold','finite-release']){
   let peak=null;
   for(const ms of [900,1100,1175,1250,1400,1600,1800,2200]){
    m.animationAt=ms;s.render({...s.view(),fixedTime:10+ms/1000,paused:true},0);
    if(method==='finite-release')for(const l of s.craft.layers){
     const u=l.mesh.material.uniforms;
     if(['painted-canopy','hanging-lamps'].includes(l.role))u.uErode.value=-.1+1.25*smooth((ms-1175)/340);
     if(['released-light','canopy-ribbon','cast-strand'].includes(l.role)){u.uTail.value=-.12+1.35*smooth((ms-1175)/370);u.uErode.value=-.1+1.25*smooth((ms-1300)/400);}
    }
    const field=read();images[method+'-'+ms]=png(field);
    const visible=s.scene.children.map(o=>[o,o.visible]);visible.forEach(([o])=>o.visible=[s.craft.rear,s.craft.front,s.craft.ground].includes(o)&&o.visible);
    s.renderer.setClearColor(0,0);const p=read();visible.forEach(([o,v])=>o.visible=v);s.renderer.setClearColor(clear,alpha);
    const mask=new Uint8Array(W*H);let count=0,intersection=0,union=0;for(let i=0;i<mask.length;i++){mask[i]=p[i*4+3]>=20?1:0;count+=mask[i];if(peak){intersection+=mask[i]&&peak[i]?1:0;union+=mask[i]||peak[i]?1:0;}}
    if(ms===1100)peak=mask;rows.push({method,ms,pixels:count,fraction:count/(W*H),peakIoU:peak&&union?intersection/union:null});
   }
  }
  s.renderer.setRenderTarget(saved);s.renderer.setClearColor(clear,alpha);rt.dispose();return{rows,images};
 });
 for(const [name,data]of Object.entries(result.images))writeFileSync(`${out}/${name}.png`,Buffer.from(data.split(',')[1],'base64'));delete result.images;
 writeFileSync('tools/v3craft-lab/q3b/release-study.json',JSON.stringify({at:new Date().toISOString(),errors,scope:'Envelope comparison on R1 geometry only; unchanged peak, no new shape/contrast/timing acceptance.',...result},null,2)+'\n');
 console.log(JSON.stringify({errors,rows:result.rows}));
}finally{await browser.close();}
