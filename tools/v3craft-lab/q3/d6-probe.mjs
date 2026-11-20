// Existing exact-time alpha and seek method; independent movie review is still required.
import {chromium} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const revision=Number(process.argv[2]??0),out=`tools/v3craft-lab/q3/raw/D6-r${revision}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:5990/@fs/Users/bao/taskbar-hero-cardrpg-a6/tools/v3craft-drills/index.html?drill=D6&revision=${revision}`);await page.waitForFunction(()=>window.__drill?.ready,null,{timeout:8000});
 const result=await page.evaluate(async()=>{
  const p=window.__drill,T=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/apps/web/node_modules/three/build/three.module.js');
  const W=1280,H=720,target=new T.WebGLRenderTarget(W,H),bytes=new Uint8Array(W*H*4);
  const pixels=(actor)=>{const vis=p.scene.children.map(o=>[o,o.visible]);vis.forEach(([o])=>o.visible=o===actor.root);p.renderer.setClearColor(0,0);p.renderer.setRenderTarget(target);p.renderer.render(p.scene,p.camera);p.renderer.readRenderTargetPixels(target,0,0,W,H,bytes);vis.forEach(([o,v])=>o.visible=v);p.renderer.setRenderTarget(null);p.renderer.setClearColor('#242336',1);return Uint8Array.from({length:W*H},(_,i)=>bytes[i*4+3]>=128?1:0);};
  const stat=a=>{let n=0,sx=0,sy=0;for(let i=0;i<a.length;i++)if(a[i]){n++;sx+=i%W;sy+=Math.floor(i/W);}return {n,cx:sx/n,cy:sy/n};};
  const iou=(a,b,dx=0,dy=0)=>{let union=0,intersection=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const xx=x+dx,yy=y+dy,bb=xx>=0&&xx<W&&yy>=0&&yy<H?b[yy*W+xx]:0,aa=a[y*W+x];if(aa||bb)union++;if(aa&&bb)intersection++;}return intersection/union;};
  p.draw(0);const baseline=pixels(p.actor),baselineStat=stat(baseline),rows=[];
  const positions=m=>m.children.flatMap(c=>Array.from(c.geometry.attributes.position.array));
  for(let i=0;i<=24;i++){
   const ms=i*800/24,state=p.draw(ms),a=pixels(p.actor),s=stat(a);
   rows.push({ms,state,rawIou:iou(baseline,a),translationAlignedIou:iou(baseline,a,Math.round(s.cx-baselineStat.cx),Math.round(s.cy-baselineStat.cy))});
  }
  p.draw(350);const held={actor:positions(p.drill.poseMesh),target:positions(p.drill.targetMesh),targetTransform:p.recipient.root.matrixWorld.toArray(),meshTransform:p.drill.targetMesh.matrixWorld.toArray()};
  const holds=[];for(const ms of[350,360,375,400,424.9]){p.draw(ms);const current={actor:positions(p.drill.poseMesh),target:positions(p.drill.targetMesh),targetTransform:p.recipient.root.matrixWorld.toArray(),meshTransform:p.drill.targetMesh.matrixWorld.toArray()};holds.push({ms,maxDifference:Math.max(...Object.keys(held).flatMap(k=>current[k].map((v,i)=>Math.abs(v-held[k][i]))))});}
  const events=[249.9,250,283.32,283.34,349.9,350,399.9,400,424.9,425,799.9,800].map(ms=>({ms,...p.draw(ms)}));
  p.draw(200);const expected=positions(p.drill.poseMesh),seek=[];
  for(const ms of[0,800,430,2000,120]){p.draw(ms);p.draw(200);const value=positions(p.drill.poseMesh);seek.push({intermediateMs:ms,maxDifference:Math.max(...value.map((v,i)=>Math.abs(v-expected[i])))});}
  p.draw(800);const end=pixels(p.actor);target.dispose();return{samples:rows,holds,events,seek,returnIou:iou(baseline,end),baselinePixels:baselineStat.n};
 });
 const receipt={at:new Date().toISOString(),revision,errors,sourceSha256:createHash('sha256').update(readFileSync('tools/v3craft-drills/d6.ts')).digest('hex'),method:'Exact-time opaque GPU masks and local pose/matrix equality; no movie timing inference.',...result};
 writeFileSync(out+'/gpu-probe.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({revision,errors,windup:result.samples.filter(x=>x.ms>=100&&x.ms<=250).map(x=>({ms:x.ms,alignedIou:x.translationAlignedIou})),holds:result.holds,seek:result.seek,returnIou:result.returnIou}));
}finally{await browser.close();}
