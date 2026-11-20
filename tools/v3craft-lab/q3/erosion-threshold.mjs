// Compare threshold schedules on the same original-paint GPU alpha; not a recorder.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html');await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),p=window.__drill,d=p.drill;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.drawImage(d.paint.image,0,0,256,256);const rgba=ctx.getImageData(0,0,256,256).data,noise=d.noise.image.data,hist=new Array(256).fill(0);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++)if(rgba[(y*256+x)*4+3]>20)hist[noise[((255-y)*256+x)*4]]++;
  const count=hist.reduce((a,b)=>a+b,0),occupied=hist.map((n,i)=>n?i:-1).filter(i=>i>=0),cdf=(fraction)=>{if(fraction<=0)return occupied[0]/255-.07;if(fraction>=1)return occupied.at(-1)/255+.07;let sum=0;for(let i=0;i<256;i++){if(sum+hist[i]>=fraction*count)return (i+(fraction*count-sum)/hist[i]-.5)/255;sum+=hist[i];}return 1.1;};
  const target=new T.WebGLRenderTarget(1280,720),pixels=new Uint8Array(1280*720*4);p.scene.children.forEach(o=>o.visible=o===d.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);d.material.uniforms.uOpacity.value=1;
  const rows=[];for(const method of ['linear-threshold','paint-percentiles']){const samples=[];for(let i=0;i<=30;i++){const age=i/30;d.material.uniforms.uThreshold.value=method==='linear-threshold'?age:cdf(age);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);let visible=0;for(let j=3;j<pixels.length;j+=4)visible+=pixels[j]>20?1:0;samples.push({age,threshold:d.material.uniforms.uThreshold.value,visible});}const first=samples[0].visible;rows.push({method,samples,retainedAtHalf:samples[15].visible/first,largestLossFraction:Math.max(...samples.slice(1).map((s,i)=>(samples[i].visible-s.visible)/first)),maxDeviationFromLinearArea:Math.max(...samples.map(s=>Math.abs(s.visible/first-(1-s.age))))});}
  target.dispose();return {histogram:hist,paintPixels:count,rows};
 });
 const receipt={at:new Date().toISOString(),method:'Same shader/paint/world geometry; alpha>20/255; no opacity fade; 31 samples each. Percentiles use painted-support pixels with texture Y orientation accounted for.',...result};writeFileSync('tools/v3craft-lab/q3/erosion-threshold.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(result.rows.map(({samples,...rest})=>rest)));
}finally{await browser.close();}
