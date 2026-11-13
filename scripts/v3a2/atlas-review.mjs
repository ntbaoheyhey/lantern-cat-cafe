import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {root,evidenceMeta} from './check-gates.mjs';
import {chromium,config,openFixture} from './browser-fixture.mjs';
const out=resolve(root,'reports/v3-battle/a2/P10');await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[1]);
 const result=await page.evaluate(async()=>{
  // Match the production GPU Canvas2D path. A CPU readback canvas differs by
  // one channel level when it premultiplies alpha, independently of packing.
  const images=window.__depthScene.effects.layered.images,canvas=document.createElement('canvas'),c=canvas.getContext('2d',{willReadFrequently:false}),rows=[];
  for(const [id,packed] of images){
   if(!packed.image)throw Error('Unpacked sheet: '+id);
   const source=new Image();source.src=packed.sourceUrl;await source.decode();
   canvas.width=packed.width;canvas.height=packed.height;c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(source,0,0);
   const before=c.getImageData(0,0,canvas.width,canvas.height).data;
   c.clearRect(0,0,canvas.width,canvas.height);c.drawImage(packed.image,packed.x,packed.y,packed.width,packed.height,0,0,packed.width,packed.height);
   const after=c.getImageData(0,0,canvas.width,canvas.height).data;
   let changed=0,maxDelta=0;for(let i=0;i<before.length;i++){const delta=Math.abs(before[i]-after[i]);if(delta)changed++;maxDelta=Math.max(maxDelta,delta);}
   rows.push({id,changedChannels:changed,maxDelta});
  }
  return {entries:images.size,pages:new Set([...images.values()].map(p=>p.image)).size,rows};
 });
 await writeFile(resolve(out,'atlas-pixels.json'),JSON.stringify({_meta:evidenceMeta(),...result,errors},null,2)+'\n');
 assert.equal(result.entries,86);assert.ok(result.pages<86);assert.equal(Math.max(...result.rows.map(r=>r.maxDelta)),0);assert.deepEqual(errors,[]);
 console.log(`PASS: ${result.entries} sheets on ${result.pages} packed pages; every RGBA channel matches the original`);
}finally{await browser.close();}
const shots=[];
for(const quality of ['high','low'])for(const phase of ['before','after'])shots.push(await sharp(resolve(out,`${phase}-${quality}.png`)).resize(640,360).png().toBuffer());
await sharp({create:{width:1280,height:748,channels:3,background:'#171620'}}).composite([
 {input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" font-size="17" fill="white">Before / after — High above, Low below — packed original art and bounded particles</text></svg>'),left:0,top:0},
 ...shots.map((input,i)=>({input,left:i%2*640,top:28+Math.floor(i/2)*360}))
]).png().toFile(resolve(out,'compare-performance.png'));
