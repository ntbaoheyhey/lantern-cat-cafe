// Same GPU alpha measurement as Q3-X02, sampled along each authored lifetime.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??1),mode=process.argv[3]??'released',browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage();await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?revision=${revision}`);await page.waitForFunction(()=>window.__drill?.ready);
 const samples=await page.evaluate(async mode=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),p=window.__drill,d=p.drill,target=new T.WebGLRenderTarget(1280,720),pixels=new Uint8Array(1280*720*4);
  d.setMotionMode(mode);p.scene.children.forEach(o=>o.visible=o===d.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);const samples=[];
  for(let i=0;i<=60;i++){const ms=i*1000/30;p.draw(ms);p.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);let count=0,alphaSum=0,xsum=0,ysum=0;for(let j=3;j<pixels.length;j+=4){alphaSum+=pixels[j]/255;if(pixels[j]>20){count++;const index=(j-3)/4;xsum+=index%1280;ysum+=Math.floor(index/1280);}}samples.push({ms,visible:count,alphaSum,centroid:count?[xsum/count,ysum/count]:null});}
  target.dispose();return samples;
 },mode);
 const peak=Math.max(...samples.map(s=>s.visible)),peakIndex=samples.findIndex(s=>s.visible===peak),maxChange=Math.max(...samples.slice(1).map((s,i)=>Math.abs(s.visible-samples[i].visible)))/peak;
 const summary={revision,mode,peak,peakMs:samples[peakIndex].ms,maxStepFraction:maxChange,firstVisibleMs:samples.find(s=>s.visible>0)?.ms,lastVisibleMs:samples.findLast(s=>s.visible>0)?.ms,endVisible:samples.at(-1).visible,sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d1.ts')).digest('hex')};
 writeFileSync(`tools/v3craft-lab/q3/raw/D1-r${revision}/alpha-${mode}.json`,JSON.stringify({at:new Date().toISOString(),method:'61 exact-time GPU alpha samples, threshold >20/255; not video clock evidence',...summary,samples},null,2)+'\n');console.log(JSON.stringify(summary));
}finally{await browser.close();}
