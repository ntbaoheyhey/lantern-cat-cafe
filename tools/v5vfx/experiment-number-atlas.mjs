/** Compare existing and batched glyph readback before changing the runtime. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-number-atlas-experiment');await mkdir(out,{recursive:true});
const variant=process.env.CXV_ATLAS_VARIANT??'batch';
const report={variant,utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),method:'Same loaded font/browser at4x CPU; original runtime atlas versus batched-read prototype, interleaved fresh palette builds. Compare every glyph rectangle and whole-atlas RGBA SHA256. This is CPU attribution, not FPS or production acceptance.',errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 report.measurement=await page.evaluate(async variant=>{
  const {BattleNumbers}=await import('/src/game/cardrpg/battle-v3/numbers.ts');
  const host=document.querySelector('canvas[data-puppet-numbers]').parentElement,numbers=new BattleNumbers(host);numbers.canvas.style.visibility='hidden';await document.fonts.ready;
  const original=numbers.atlas,read=CanvasRenderingContext2D.prototype.getImageData;let readCalls=0;
  CanvasRenderingContext2D.prototype.getImageData=function(...args){readCalls++;return read.apply(this,args);};
  function batched(color){
   const canvas=document.createElement('canvas');canvas.width=96*this.chars.length;canvas.height=144;
   const c=canvas.getContext('2d',{willReadFrequently:true}),font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
   c.font=`800 96px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   const g=c.createLinearGradient(0,35,0,112);g.addColorStop(0,'#fffef0');g.addColorStop(.38,'#fff1ac');g.addColorStop(.58,color);g.addColorStop(1,color);c.fillStyle=g;c.strokeStyle='#301b35';c.lineWidth=7;
   [...this.chars].forEach((ch,i)=>{c.strokeText(ch,i*96+48,76);c.fillText(ch,i*96+48,76);});
   const px=c.getImageData(0,0,canvas.width,canvas.height).data,glyphs=new Map();
   [...this.chars].forEach((ch,i)=>{let x0=96,y0=144,x1=0,y1=0;for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(px[(y*canvas.width+i*96+x)*4+3]>16){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}glyphs.set(ch,{x:i*96+x0,y:y0,width:x1-x0+1,height:y1-y0+1});});
   const atlas={canvas,glyphs,digitHeight:Math.max(...[...'0123456789'].map(ch=>glyphs.get(ch).height))};this.atlases.set(color,atlas);return atlas;
  }
  function reuseMetrics(color){
   if(!this.__cxvMetrics){const a=original.call(this,color);this.__cxvMetrics={glyphs:a.glyphs,digitHeight:a.digitHeight};return a;}
   const canvas=document.createElement('canvas');canvas.width=96*this.chars.length;canvas.height=144;
   const c=canvas.getContext('2d',{willReadFrequently:true}),font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
   c.font=`800 96px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   const g=c.createLinearGradient(0,35,0,112);g.addColorStop(0,'#fffef0');g.addColorStop(.38,'#fff1ac');g.addColorStop(.58,color);g.addColorStop(1,color);c.fillStyle=g;c.strokeStyle='#301b35';c.lineWidth=7;
   [...this.chars].forEach((ch,i)=>{c.strokeText(ch,i*96+48,76);c.fillText(ch,i*96+48,76);});
   const atlas={canvas,...this.__cxvMetrics};this.atlases.set(color,atlas);return atlas;
  }
  const colors=variant==='runtime'?['#55eb9b','#83ddff','rgba(70,140,200,.4)','#c1bfd1','#ff903e','#ffc86a','#c9adf3','#ffe0a2','#ffad55']:['#55eb9b','#83ddff','#c1bfd1','#ff903e','#ffc86a'],rows=[];
  function unshared(color){this.glyphMetrics=undefined;return original.call(this,color);}
  try{
   for(const batch of [false,true,true,false,false,true]){
    numbers.atlas=variant==='runtime'?(batch?original:unshared):batch?(variant==='reuse'?reuseMetrics:batched):unshared;numbers.atlases.clear();numbers.__cxvMetrics=undefined;numbers.glyphMetrics=undefined;const reads=readCalls,start=performance.now(),atlases=colors.map(color=>numbers.atlas(color)),elapsedMs=performance.now()-start,readbacks=readCalls-reads;
    const fingerprints=[];for(let i=0;i<atlases.length;i++){const a=atlases[i],pixels=a.canvas.getContext('2d').getImageData(0,0,a.canvas.width,a.canvas.height).data;const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels)),b=>b.toString(16).padStart(2,'0')).join('');fingerprints.push({color:colors[i],hash,glyphs:Object.fromEntries(a.glyphs),digitHeight:a.digitHeight});}
    rows.push({batch,elapsedMs,readbacks,fingerprints});
   }
   return{rows,colors,font:getComputedStyle(host).getPropertyValue('--font-num')};
  }finally{CanvasRenderingContext2D.prototype.getImageData=read;numbers.canvas.remove();}
 },variant);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});report.errors=errors;
 const rows=report.measurement.rows,first=JSON.stringify(rows[0].fingerprints),median=v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)];report.exact=rows.every(r=>JSON.stringify(r.fingerprints)===first);report.originalMedianMs=median(rows.filter(r=>!r.batch).map(r=>r.elapsedMs));report.candidateMedianMs=median(rows.filter(r=>r.batch).map(r=>r.elapsedMs));
 report.pass=report.exact&&!errors.length;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,originalMedianMs:report.originalMedianMs,candidateMedianMs:report.candidateMedianMs,rows:rows.map(({fingerprints,...r})=>r),errors}));assert(report.pass);
}finally{await browser.close();}
