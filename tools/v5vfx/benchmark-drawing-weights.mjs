/** Interleaved cached/uncached geometry work inside one unchanged browser build. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-drawing-weights');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),viewport:{width:1280,height:720},method:'Same loaded boss drawings and original point method; one shared dispatch forwards or omits cached weights. Warmed interleaved CPU-only sample work, 4x Chromium CPU throttle. Geometry fingerprints must match. No rendering/FPS/startup inference from this microbenchmark.',errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'),{fixedClock:false});report.url=page.url();
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 report.measurement=await page.evaluate(()=>{
  const drawings=[...window.__depthScene.actors].filter(([,e])=>e.craftPose?.drawing).map(([id,e])=>({id,d:e.craftPose.drawing}));
  const original=drawings[0].d.point,cases=[['idle',.6],['attack',.1],['attack',.3],['attack',.35],['attack',.6],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['victory',1]];
  let enabled=true;
  const dispatch=function(p,key,at,out,weights,offset){return original.call(this,p,key,at,out,enabled?weights:undefined,offset);};
  const run=(cached,cycles=6)=>{
   enabled=cached;const start=performance.now();
   for(let cycle=0;cycle<cycles;cycle++)for(const [clip,at]of cases)for(const {d}of drawings)d.sample(clip,at,false,undefined,30+cycle*5+at,.7);
   const elapsedMs=performance.now()-start;
   const fingerprints=drawings.map(({id,d})=>{const a=d.geometry.attributes.position.array,u=new Uint32Array(a.buffer,a.byteOffset,a.length);let hash=2166136261;for(const word of u)hash=Math.imul(hash^word,16777619);return{id,hash};});
   return{cached,elapsedMs,samples:cycles*cases.length*drawings.length,fingerprints};
  };
  try{
   for(const {d}of drawings)d.point=dispatch;
   run(false,3);run(true,3);
   return{drawings:drawings.length,rows:[false,true,true,false,false,true].map(cached=>run(cached))};
  }finally{for(const {d}of drawings)d.point=original;}
 });
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 const rows=report.measurement.rows,reference=JSON.stringify(rows[0].fingerprints);
 report.errors=errors;report.exact=rows.every(row=>JSON.stringify(row.fingerprints)===reference);
 const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
 report.cachedMedianMs=median(rows.filter(r=>r.cached).map(r=>r.elapsedMs));report.uncachedMedianMs=median(rows.filter(r=>!r.cached).map(r=>r.elapsedMs));
 report.pass=report.exact&&!errors.length;report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({out,pass:report.pass,exact:report.exact,cachedMedianMs:report.cachedMedianMs,uncachedMedianMs:report.uncachedMedianMs,rows:rows.map(({fingerprints,...r})=>r),errors}));assert(report.pass);
}finally{await browser.close();}
