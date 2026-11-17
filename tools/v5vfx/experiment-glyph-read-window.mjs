/** Test conservative glyph read windows against the current painted atlas. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-glyph-read-window');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Current runtime atlas versus conservative TextMetrics read windows, same-browser alternating builds at4xCPU. Five font families, eight opaque palette colors plus translucent fallback. Preserve glyph painting/order/cache and compare every glyph plus full atlas RGBA hash. Measurement only; no runtime edit or gameplay claim.',errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 report.measurements=await page.evaluate(async()=>{
  cancelAnimationFrame(window.__depthScene.raf);
  const {BattleNumbers}=await import('/src/game/cardrpg/battle-v3/numbers.ts');
  const liveHost=document.querySelector('canvas[data-puppet-numbers]').parentElement,host=document.createElement('div');
  host.style.cssText='position:absolute;left:-10000px;visibility:hidden';document.body.appendChild(host);
  const numbers=new BattleNumbers(host);await document.fonts.ready;
  const original=numbers.atlas,read=CanvasRenderingContext2D.prototype.getImageData;let calls=0,pixels=0;
  CanvasRenderingContext2D.prototype.getImageData=function(...args){calls++;pixels+=args[2]*args[3];return read.apply(this,args);};
  function windowed(color){
   const cached=this.atlases.get(color);if(cached)return cached;
   const canvas=document.createElement('canvas');canvas.width=96*this.chars.length;canvas.height=144;
   const c=canvas.getContext('2d',{willReadFrequently:true}),font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
   c.font=`800 96px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
   const g=c.createLinearGradient(0,35,0,112);g.addColorStop(0,'#fffef0');g.addColorStop(.38,'#fff1ac');g.addColorStop(.58,color);g.addColorStop(1,color);
   c.fillStyle=g;c.strokeStyle='#301b35';c.lineWidth=7;
   const solid=/^#[\da-f]{6}$/i.test(color),metrics=solid&&this.glyphMetrics?.font===font?this.glyphMetrics:undefined;
   const glyphs=metrics?.glyphs??new Map(),padding=c.lineWidth/2+2;
   const textMetrics=metrics?undefined:[...this.chars].map(ch=>c.measureText(ch));
   // A neighboring glyph that spills over a cell invalidates a narrow read.
   const safe=textMetrics?.every(m=>[m.actualBoundingBoxLeft,m.actualBoundingBoxRight,m.actualBoundingBoxAscent,m.actualBoundingBoxDescent].every(Number.isFinite)&&m.actualBoundingBoxLeft+padding<=48&&m.actualBoundingBoxRight+padding<=48);
   [...this.chars].forEach((ch,i)=>{
    c.strokeText(ch,i*96+48,76);c.fillText(ch,i*96+48,76);if(metrics)return;
    const m=textMetrics[i];let rx=0,ry=0,rw=96,rh=144;
    if(safe){
     rx=Math.max(0,Math.min(95,Math.floor(48-m.actualBoundingBoxLeft-padding)));
     ry=Math.max(0,Math.min(143,Math.floor(76-m.actualBoundingBoxAscent-padding)));
     rw=Math.max(1,Math.min(96,Math.ceil(48+m.actualBoundingBoxRight+padding))-rx);
     rh=Math.max(1,Math.min(144,Math.ceil(76+m.actualBoundingBoxDescent+padding))-ry);
    }
    const px=c.getImageData(i*96+rx,ry,rw,rh).data;let x0=96,y0=144,x1=0,y1=0;
    for(let y=0;y<rh;y++)for(let x=0;x<rw;x++)if(px[(y*rw+x)*4+3]>16){x0=Math.min(x0,x+rx);x1=Math.max(x1,x+rx);y0=Math.min(y0,y+ry);y1=Math.max(y1,y+ry);}
    glyphs.set(ch,{x:i*96+x0,y:y0,width:x1-x0+1,height:y1-y0+1});
   });
   const digitHeight=metrics?.digitHeight??Math.max(...[...'0123456789'].map(ch=>glyphs.get(ch).height)),atlas={canvas,glyphs,digitHeight};
   if(solid&&!metrics)this.glyphMetrics={font,glyphs,digitHeight};this.atlases.set(color,atlas);return atlas;
  }
  const colors=['#55eb9b','#83ddff','rgba(70,140,200,.4)','#c1bfd1','#ff903e','#ffc86a','#c9adf3','#ffe0a2','#ffad55'];
  const families=[getComputedStyle(liveHost).getPropertyValue('--font-num').trim()||'"Baloo 2"','monospace','serif','Arial','"Times New Roman"'],results=[];
  try{
   for(const family of families){
    host.style.setProperty('--font-num',family);const runs=[];
    for(let block=0;block<7;block++)for(const mode of block%2?['window','original']:['original','window']){
     numbers.atlas=mode==='original'?original:windowed;numbers.atlases.clear();numbers.glyphMetrics=undefined;
     const oldCalls=calls,oldPixels=pixels,start=performance.now(),atlases=colors.map(color=>numbers.atlas(color)),elapsedMs=performance.now()-start;
     const run={mode,block,elapsedMs,reads:calls-oldCalls,readPixels:pixels-oldPixels,fingerprints:[]};
     for(let i=0;i<atlases.length;i++){
      const a=atlases[i],rgba=read.call(a.canvas.getContext('2d'),0,0,a.canvas.width,a.canvas.height).data;
      const pixelSha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',rgba)),b=>b.toString(16).padStart(2,'0')).join('');
      run.fingerprints.push({color:colors[i],pixelSha256,glyphs:Object.fromEntries(a.glyphs),digitHeight:a.digitHeight});
     }
     runs.push(run);
    }
    const reference=JSON.stringify(runs[0].fingerprints),differences=runs.filter(r=>JSON.stringify(r.fingerprints)!==reference).map(r=>({mode:r.mode,block:r.block}));
    const median=mode=>runs.filter(r=>r.mode===mode).map(r=>r.elapsedMs).sort((a,b)=>a-b)[3];
    results.push({family,exact:!differences.length,differences,originalMedianMs:median('original'),windowMedianMs:median('window'),runs});
   }
   return results;
  }finally{CanvasRenderingContext2D.prototype.getImageData=read;numbers.dispose();host.remove();}
 });
 report.errors=errors;report.ended=new Date().toISOString();report.pass=!errors.length&&report.measurements.every(m=>m.exact);
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({out,pass:report.pass,errors,measurements:report.measurements.map(({runs,...m})=>({...m,reads:runs.slice(0,2).map(r=>({mode:r.mode,reads:r.reads,pixels:r.readPixels}))}))}));assert(report.pass);
}finally{await browser.close();}
