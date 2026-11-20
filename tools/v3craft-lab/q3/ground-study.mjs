// D8 original-paint inputs for X19. LEARN/Q3.md T34–T39; no reference input.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3/raw/D8-study';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D7&revision=2');
 await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const W=1280,H=720,rt=new T.WebGLRenderTarget(W,H);rt.texture.colorSpace=T.SRGBColorSpace;
  const bytes=new Uint8Array(W*H*4),images={};
  const png=()=>{
   p.renderer.setRenderTarget(rt);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);
   const c=document.createElement('canvas');c.width=W;c.height=H;const a=new Uint8ClampedArray(bytes.length);
   for(let y=0;y<H;y++)a.set(bytes.subarray(y*W*4,(y+1)*W*4),(H-1-y)*W*4);
   c.getContext('2d').putImageData(new ImageData(a,W,H),0,0);return c.toDataURL();
  };
  const visible=p.scene.children.map(o=>[o,o.visible]);
  for(const ms of [0,225,350]){
   p.renderer.setRenderTarget(null);p.draw(ms);images['baseline-'+ms]=png();
   visible.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);images['actor-'+ms]=png();
   visible.forEach(([o,v])=>o.visible=v);p.actor.root.visible=false;p.renderer.setClearColor('#242336',1);images['field-'+ms]=png();
   p.actor.root.visible=true;
  }
  p.renderer.setRenderTarget(null);rt.dispose();return images;
 });
 for(const [name,data] of Object.entries(result))writeFileSync(out+'/'+name+'.png',Buffer.from(data.split(',')[1],'base64'));
 writeFileSync(out+'/capture.json',JSON.stringify({at:new Date().toISOString(),errors,phases:[0,225,350],source:'D7 r2 original Soot, GPU current-alpha capture; sRGB target, source-over RGB premultiplication retained'},null,2)+'\n');
 console.log(JSON.stringify({errors,images:Object.keys(result)}));
}finally{await browser.close();}
