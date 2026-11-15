// Q2 learning experiment; see reports/v3-feel/LEARN/Q2.md. No production mutation.
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {chromium,openFixture,config} from '../../../scripts/v3feel/browser-fixture.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(import.meta.dirname,'raw');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 const results=await page.evaluate(async(root)=>{
  const T=await import('/@fs'+root+'/apps/web/node_modules/three/build/three.module.js');
  const {loadSpineActor}=await import('/src/game/cardrpg/spine/assets.ts');
  const {SPINE_UNITS}=await import('/src/game/cardrpg/spine/config.ts');
  const {unitCore}=await import('/src/game/cardrpg/stage/core.ts');
  const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
  renderer.setSize(1024,1024);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(),rows=[];
  for(const unit of SPINE_UNITS){
   const actor=await loadSpineActor(unit.id),b=actor.bounds,size=Math.max(b.width,b.height)*1.25,cx=b.x+b.width/2,cy=b.y+b.height/2;
   const camera=new T.OrthographicCamera(cx-size/2,cx+size/2,cy+size/2,cy-size/2,-1000,1000);
   camera.position.z=100;camera.updateProjectionMatrix();scene.add(actor.root);
   actor.sample('idle','q2',0,0,camera,false);renderer.render(scene,camera);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
   const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(renderer.domElement,0,0);
   const pixels=c.getImageData(0,0,1024,1024).data,thresholds={};
   for(const threshold of [17,128]){
    let left=1024,top=1024,right=-1,bottom=-1,count=0;
    for(let y=0;y<1024;y++)for(let x=0;x<1024;x++)if(pixels[(y*1024+x)*4+3]>=threshold){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);count++;}
    thresholds[threshold]={pixels:{x:left,y:top,width:right-left+1,height:bottom-top+1},world:{x:cx-size/2+left/1024*size,y:cy+size/2-(bottom+1)/1024*size,width:(right-left+1)/1024*size,height:(bottom-top+1)/1024*size},count,clipped:left===0||right===1023||top===0||bottom===1023};
   }
   const sockets=Object.fromEntries(['head','feet','mainHand','offHand'].map(k=>{const p=actor.socket(k,new T.Vector3());return[k,{x:p.x,y:p.y}];}));
   rows.push({id:unit.id,side:unit.side,tier:unit.tier,combatTier:unit.combatTier,source:actor.source,configuredFacing:unit.facing,flipInGame:unit.flipInGame,bounds:{...b},core:unitCore(unit.id,b),thresholds,sockets,png:canvas.toDataURL('image/png').split(',')[1]});
   actor.dispose();
  }
  renderer.dispose();renderer.forceContextLoss();return rows;
 },root);
 const panels=[];
 for(const row of results){
  const png=Buffer.from(row.png,'base64');delete row.png;await writeFile(resolve(out,row.id+'.png'),png);
  const r=row.thresholds[17].pixels;
  const body=await sharp(png).extract({left:r.x,top:r.y,width:r.width,height:r.height}).resize(220,226,{fit:'inside'}).png().toBuffer();
  const metadata=await sharp(body).metadata();
  const label=Buffer.from(`<svg width="240" height="36"><text x="120" y="18" text-anchor="middle" font-family="sans-serif" font-size="16" fill="white">${row.id}</text><text x="120" y="33" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#a9b9cd">native • ${row.source}</text></svg>`);
  panels.push(await sharp({create:{width:240,height:270,channels:4,background:'#292d38'}}).composite([{input:body,left:Math.round((240-metadata.width)/2),top:Math.round(4+(226-metadata.height)/2)},{input:label,left:0,top:232}]).png().toBuffer());
 }
 for(let start=0;start<panels.length;start+=15){const subset=panels.slice(start,start+15);await sharp({create:{width:1200,height:270*Math.ceil(subset.length/5),channels:3,background:'#1d2028'}}).composite(subset.map((input,i)=>({input,left:i%5*240,top:Math.floor(i/5)*270}))).jpeg({quality:88}).toFile(resolve(import.meta.dirname,`roster-${start/15+1}.jpg`));}
 await writeFile(resolve(import.meta.dirname,'alpha-results.json'),JSON.stringify({at:new Date().toISOString(),method:'Actual loadSpineActor setup pose, transparent WebGL render, 1024 square, threshold 17 and 128',errors,units:results},null,2)+'\n');
 console.log(JSON.stringify({units:results.length,cats:results.filter(r=>r.side==='party').length,errors,clipped:results.filter(r=>r.thresholds[17].clipped).map(r=>r.id)}));
}finally{await browser.close();}
