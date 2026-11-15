// Reuses X17/X18 exact-time GPU opacity, topology and independent-seek checks.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??0),out=`tools/v3craft-lab/q3/raw/D7-r${revision}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D7&revision=${revision}`);await page.waitForFunction(()=>window.__drill?.ready);
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const W=1280,H=720,rt=new T.WebGLRenderTarget(W,H),bytes=new Uint8Array(W*H*4);
  const pixels=()=>{const vis=p.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===p.actor.root);p.renderer.setClearColor(0,0);p.renderer.setRenderTarget(rt);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(rt,0,0,W,H,bytes);vis.forEach(([o,v])=>o.visible=v);p.renderer.setRenderTarget(null);p.renderer.setClearColor('#242336',1);return Uint8Array.from({length:W*H},(_,i)=>bytes[i*4+3]>=128?1:0);};
  const stat=a=>{let count=0,sx=0,sy=0,x0=W,y0=H,x1=0,y1=0;for(let i=0;i<a.length;i++)if(a[i]){const x=i%W,y=Math.floor(i/W);count++;sx+=x;sy+=y;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{count,cx:sx/count,cy:sy/count,bounds:[x0,y0,x1+1,y1+1]};};
  const iou=(a,b,dx=0,dy=0)=>{let un=0,inters=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const xx=x+dx,yy=y+dy,v=xx>=0&&xx<W&&yy>=0&&yy<H?b[yy*W+xx]:0,u=a[y*W+x];if(u||v)un++;if(u&&v)inters++;}return inters/un;};
  const positions=()=>p.drill.poseMesh.children.flatMap(c=>Array.from(c.geometry.attributes.position.array));
  const cross=(a,i,j,k)=>(a[j*3]-a[i*3])*(a[k*3+1]-a[i*3+1])-(a[j*3+1]-a[i*3+1])*(a[k*3]-a[i*3]);
  p.draw(0);const base=pixels(),baseStat=stat(base),samples=[];
  for(const ms of [...new Set([...Array.from({length:25},(_,i)=>i*800/24),225,250,280,350,425,510,680])].sort((a,b)=>a-b)){
   const state=p.draw(ms),a=pixels(),s=stat(a);let footChanged=0,minArea=Infinity,maxArea=0,flips=0,faceLocalDifference=0,feetVertexMove=0;
   for(let y=baseStat.bounds[1];y<baseStat.bounds[1]+20;y++)for(let x=baseStat.bounds[0]-20;x<baseStat.bounds[2]+20;x++)if(base[y*W+x]!==a[y*W+x])footChanged++;
   for(const b of p.drill.batches){const v=b.geometry.attributes.position.array,idx=b.geometry.index.array;
    const faceAnchor=b.partAt.findIndex((part,i)=>part.name==='head'&&b.setup[i*3+1]<=425),fa=faceAnchor*3;
    const faceDx=faceAnchor<0?0:v[fa]-b.setup[fa],faceDy=faceAnchor<0?0:v[fa+1]-b.setup[fa+1];
    for(let i=0;i<idx.length;i+=3){const r=cross(v,idx[i],idx[i+1],idx[i+2])/cross(b.setup,idx[i],idx[i+1],idx[i+2]);if(r<=0)flips++;minArea=Math.min(minArea,r);maxArea=Math.max(maxArea,r);}
    for(let i=0;i<v.length;i+=3){const name=b.partAt[i/3].name;
     if(name==='feet')feetVertexMove=Math.max(feetVertexMove,Math.hypot(v[i]-b.setup[i],v[i+1]-b.setup[i+1]));
     if(name==='head'&&b.setup[i+1]<=425)faceLocalDifference=Math.max(faceLocalDifference,Math.abs(v[i]-b.setup[i]-faceDx),Math.abs(v[i+1]-b.setup[i+1]-faceDy));
    }
   }
   samples.push({ms,state,bounds:s.bounds,opaquePixels:s.count,opaqueAreaRatio:s.count/baseStat.count,footChanged,feetVertexMove,faceLocalDifference,triangleFlips:flips,triangleAreaRatio:[minArea,maxArea],alignedIou:iou(base,a,Math.round(s.cx-baseStat.cx),Math.round(s.cy-baseStat.cy))});
  }
  p.draw(350);const held=positions(),holds=[350,360,375,400,424.9].map(ms=>{p.draw(ms);const a=positions();return{ms,maxDifference:Math.max(...a.map((v,i)=>Math.abs(v-held[i])))}});
  p.draw(225);const expected=positions(),seek=[0,800,480,2000,120].map(ms=>{p.draw(ms);p.draw(225);return{intermediateMs:ms,maxDifference:Math.max(...positions().map((v,i)=>Math.abs(v-expected[i])))}});
  p.draw(800);const returnIou=iou(base,pixels());rt.dispose();return{baseline:baseStat,samples,holds,seek,returnIou};
 });
 const receipt={at:new Date().toISOString(),revision,errors,sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d7.ts')).digest('hex'),method:'GPU alpha>=128, fixed bottom20px feet band, source geometry Jacobians, local face shape after actual anchor translation cancellation, arbitrary seeks; film reviewed separately.',...result};
 writeFileSync(out+'/gpu-probe.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({revision,errors,returnIou:result.returnIou,holds:result.holds,seek:result.seek,footMax:Math.max(...result.samples.map(s=>s.footChanged)),areaRange:[Math.min(...result.samples.map(s=>s.opaqueAreaRatio)),Math.max(...result.samples.map(s=>s.opaqueAreaRatio))],flips:Math.max(...result.samples.map(s=>s.triangleFlips)),compression:result.samples.find(s=>s.ms===225)}));
}finally{await browser.close();}
