/** Independent production glyph/pixel equivalence and readback attribution. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture,runtimeEvidence} from './production-fixture.mjs';
const label=process.argv[2];assert(/^[a-z0-9-]+$/.test(label??''));
const out=resolve('work/v5/CXI/number-atlas',label);
try{await access(out);throw Error('Use fresh evidence label');}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),harnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),viewport:{width:1280,height:720},method:'Actual production BattleNumbers constructor from the live scene, loaded font, nine palettes including transparency, interleaved cold atlas builds at4xCPU. Only the disabled arm clears the glyph-metric cache between colors. Compare every glyph rectangle, digit height and complete RGBA SHA256. Diagnostic CPU attribution, not gameplay FPS.',errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 report.measurement=await page.evaluate(async()=>{
  const live=window.__depthScene.numbers,host=document.createElement('div');host.style.visibility='hidden';live.canvas.parentElement.appendChild(host);
  const numbers=new live.constructor(host),read=CanvasRenderingContext2D.prototype.getImageData;await document.fonts.ready;await Promise.resolve();
  let readCalls=0;CanvasRenderingContext2D.prototype.getImageData=function(...args){readCalls++;return read.apply(this,args);};
  const colors=['#55eb9b','#83ddff','rgba(70,140,200,.4)','#c1bfd1','#ff903e','#ffc86a','#c9adf3','#ffe0a2','#ffad55'],rows=[];
  const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
  try{
   for(const enabled of [false,true,true,false,false,true]){
    numbers.atlases.clear();numbers.glyphMetrics=undefined;const reads=readCalls,start=performance.now();
    const atlases=colors.map(color=>{if(!enabled)numbers.glyphMetrics=undefined;return numbers.atlas(color);});
    const elapsedMs=performance.now()-start,readbacks=readCalls-reads,fingerprints=[];
    for(let i=0;i<atlases.length;i++){
     const a=atlases[i],pixels=read.call(a.canvas.getContext('2d'),0,0,a.canvas.width,a.canvas.height).data;
     fingerprints.push({color:colors[i],hash:await hash(pixels),glyphs:Object.fromEntries(a.glyphs),digitHeight:a.digitHeight});
    }
    rows.push({enabled,elapsedMs,readbacks,fingerprints});
   }
   const cachedMetrics=!!numbers.glyphMetrics,font=getComputedStyle(host).getPropertyValue('--font-num');
   numbers.dispose();return{colors,font,rows,cachedMetrics,disposed:{canvasRemoved:!numbers.canvas.isConnected,atlasesCleared:numbers.atlases.size===0,metricsCleared:numbers.glyphMetrics===undefined}};
  }finally{CanvasRenderingContext2D.prototype.getImageData=read;numbers.dispose();host.remove();}
 });
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});report.errors=[...errors,...blockedRequests];
 const rows=report.measurement.rows,first=JSON.stringify(rows[0].fingerprints),median=v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)];
 report.exact=rows.every(r=>JSON.stringify(r.fingerprints)===first);report.glyphComparisons=rows[0].fingerprints.reduce((n,r)=>n+Object.keys(r.glyphs).length,0);report.atlasComparisons=rows[0].fingerprints.length;
 report.disabledMedianMs=median(rows.filter(r=>!r.enabled).map(r=>r.elapsedMs));report.enabledMedianMs=median(rows.filter(r=>r.enabled).map(r=>r.elapsedMs));report.identityAfter=runtimeEvidence();
 report.pass=report.exact&&!report.errors.length&&report.indexSha256===report.identityAfter.indexSha256&&Object.values(report.measurement.disposed).every(Boolean);report.ended=new Date().toISOString();
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out,pass:report.pass,glyphComparisons:report.glyphComparisons,atlasComparisons:report.atlasComparisons,disabledMedianMs:report.disabledMedianMs,enabledMedianMs:report.enabledMedianMs,rows:rows.map(({fingerprints,...r})=>r),errors:report.errors}));assert(report.pass);
}finally{await browser.close();}
