/** Browser study only; one PNG palette and original dynamic fallback. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
export async function installOfflineNumberPrototype(page,{active=false}={}){
 const path=resolve('work/v5/CXV/films/V7-F-offline-number-atlas-png-deflate/manifest.json'),bytes=await readFile(path),manifest=JSON.parse(bytes),asset=manifest.assets.find(a=>a.color==='#ffc86a');assert(asset);
 const pixels=await readFile(asset.path);assert.equal(hash(pixels),asset.sha256);
 await page.route('**/__cxv_number_atlas__/damage.png',route=>route.fulfill({status:200,contentType:'image/png',body:pixels}));
 const details=await page.evaluate(async({active,asset,font})=>{
  const s=window.__depthScene;cancelAnimationFrame(s.raf);const n=s.numbers,original=n.atlas;
  const probe={active,calls:[],seeded:0,served:0,decodeElapsedMs:0,restoreElapsedMs:0,font,restore(){n.atlas=original;delete window.__cxvOfflineNumber;}};
  let prepared;
  if(active){const image=new Image(),begin=performance.now();image.src='/__cxv_number_atlas__/damage.png';await image.decode();probe.decodeElapsedMs=performance.now()-begin;
   if(image.naturalWidth!==asset.width||image.naturalHeight!==asset.height)throw Error('Study atlas dimensions changed');
   const at=performance.now(),canvas=document.createElement('canvas');canvas.width=asset.width;canvas.height=asset.height;canvas.getContext('2d',{willReadFrequently:true}).drawImage(image,0,0);probe.restoreElapsedMs=performance.now()-at;
   prepared={canvas,glyphs:new Map(asset.glyphs),digitHeight:asset.digitHeight};
  }
  n.atlas=function(color){
   if(this.atlases.has(color))return original.call(this,color);
   const current=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
   const valid=probe.active&&prepared&&current===font&&document.fonts.check('800 96px "Baloo 2"');
   probe.calls.push({color,font:current,baked:!!valid&&color===asset.color});
   if(valid){
    if(!this.glyphMetrics||this.glyphMetrics.font!==font){this.glyphMetrics={font,glyphs:prepared.glyphs,digitHeight:prepared.digitHeight};probe.seeded++;}
    if(color===asset.color){this.atlases.set(color,prepared);probe.served++;return prepared;}
   }
   return original.call(this,color);
  };
  window.__cxvOfflineNumber=probe;return{decodeElapsedMs:probe.decodeElapsedMs,restoreElapsedMs:probe.restoreElapsedMs};
 },{active,asset,font:manifest.font});
 return{active,manifest:path,manifestSha256:hash(bytes),asset:asset.path,assetSha256:asset.sha256,bytes:active?asset.bytes:0,font:manifest.font,fontSha256:manifest.fontSha256,...details};
}
