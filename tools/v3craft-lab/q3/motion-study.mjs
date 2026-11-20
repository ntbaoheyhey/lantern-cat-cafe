import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='tools/v3craft-lab/q3/raw/D1-r2';mkdirSync(dir,{recursive:true});
const receiptName=process.argv[2];if(!receiptName)throw new Error('Supply a new receipt name; never overwrite an earlier method result.');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto('http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?revision=2');await page.waitForFunction(()=>window.__drill?.ready);
 for(const mode of ['rigid','released'])for(const ms of [800,1100,1400,1750]){await page.evaluate(({mode,ms})=>{window.__drill.drill.setMotionMode(mode);window.__drill.draw(ms);},{mode,ms});await page.locator('#stage').screenshot({path:`${dir}/${mode}-${ms}.png`});}
 const pixels=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js'),p=window.__drill,d=p.drill,target=new T.WebGLRenderTarget(1280,720),rgba=new Uint8Array(1280*720*4),results=[];
  p.scene.children.forEach(o=>o.visible=o===d.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);d.setMotionMode('released');
  for(let k=1;k<=8;k++){
   const birth=d.fragments[k-1].birth,samples=[];
   for(const age of [100,300]){p.draw(birth+age);d.root.children.forEach((child,index)=>child.visible=index===k);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(target,0,0,1280,720,rgba);let n=0,x=0,y=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]>20){n++;x+=((i-3)/4)%1280;y+=Math.floor(((i-3)/4)/1280);}samples.push({age,pixels:n,centroid:n?[x/n,y/n]:null});}
   results.push({band:k,samples,centroidTravelPx:samples.every(s=>s.centroid)?Math.hypot(samples[1].centroid[0]-samples[0].centroid[0],samples[1].centroid[1]-samples[0].centroid[1]):null});
  }
  target.dispose();return results;
 });
 writeFileSync(`tools/v3craft-lab/q3/${receiptName}.json`,JSON.stringify({at:new Date().toISOString(),methods:['rigid whole-picture drift','staggered filled original-paint chips'],sheet:dir+'/motion-comparison.jpg',pixels},null,2)+'\n');console.log(JSON.stringify(pixels.map(p=>({chip:p.band,travel:p.centroidTravelPx}))));
}finally{await browser.close();}
