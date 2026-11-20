// Reuse D1-D3 exact-time GPU readback. This is not independent movie timing.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??2),out=`tools/v3craft-lab/q3/raw/D4-r${revision}`;
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D4&revision=${revision}`);await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const p=window.__drill,target=new T.WebGLRenderTarget(1280,720),pixels=new Uint8Array(1280*720*4);
  p.scene.children.forEach(o=>o.visible=o===p.drill.root);p.renderer.setRenderTarget(target);p.renderer.setClearColor(0,0);
  const sample=ms=>{const state=p.draw(ms);p.renderer.readRenderTargetPixels(target,0,0,1280,720,pixels);let support=0,alphaSum=0,minX=1280,maxX=-1,minY=720,maxY=-1;
   for(let i=3;i<pixels.length;i+=4){alphaSum+=pixels[i]/255;if(pixels[i]>20){support++;const x=((i-3)/4)%1280,y=719-Math.floor((i-3)/4/1280);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
   return{ms,support,alphaSum,bounds:support?[minX,minY,maxX,maxY]:null,frame:state.frame,next:state.next,blend:state.blend,pivot:state.pivot,visible:state.visible};};
  const samples=Array.from({length:61},(_,i)=>sample(i/30*1000)),peak=samples.reduce((a,b)=>a.support>b.support?a:b),entry=[],tail=[];
  for(let ms=200;ms<=400;ms+=1000/60)entry.push(sample(ms));for(let ms=1050;ms<=1250;ms+=1000/60)tail.push(sample(ms));
  sample(peak.ms);const baseline=pixels.slice(),seek=[];
  for(const ms of [0,1750,425,950,2000]){sample(ms);sample(peak.ms);let changedChannels=0;for(let i=0;i<pixels.length;i++)if(pixels[i]!==baseline[i])changedChannels++;seek.push({intermediateMs:ms,changedChannels});}
  const imagePixels=new Uint8ClampedArray(pixels.length);
  for(let y=0;y<720;y++)for(let x=0;x<1280;x++){const source=((719-y)*1280+x)*4,dst=(y*1280+x)*4;imagePixels[dst]=imagePixels[dst+1]=imagePixels[dst+2]=pixels[source+3];imagePixels[dst+3]=255;}
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;canvas.getContext('2d').putImageData(new ImageData(imagePixels,1280,720),0,0);
  target.dispose();return{samples,peak,entry,tail,seek,mask:canvas.toDataURL(),atlas:{width:p.drill.recipe.width,height:p.drill.recipe.height,cell:p.drill.recipe.cell,frames:p.drill.recipe.count,fps:p.drill.recipe.fps}};
 });
 writeFileSync(`${out}/peak-alpha.png`,Buffer.from(result.mask.split(',')[1],'base64'));delete result.mask;
 const receipt={at:new Date().toISOString(),revision,errors,method:'61 exact-time GPU samples(alpha>20/255),60Hz entry/tail detail and five seek round trips. Not movie onset proof.',playerSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d4.ts')).digest('hex'),sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d4-source.ts')).digest('hex'),...result};
 writeFileSync(`${out}/gpu-probe.json`,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({errors,peak:result.peak,lastVisible:result.samples.findLast(r=>r.support),endpoint:result.samples.at(-1),seek:result.seek}));
}finally{await browser.close();}
