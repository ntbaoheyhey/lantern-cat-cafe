/** Conservative clamp shortcut inside actual drawing sampling, tool-only. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-drawing-clamp');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Tool-only conservative inner-square clamp shortcut. Both baseline/candidate point functions are cloned from the same current browser method and share dispatch.910 real pose cases compare every vertex byte, arbitrary sockets, feet and face corners.7 alternating warmed blocks/mode/fixture at4x CPU, no renderer timing. Exact IEEE numeric fallback oracle tested separately. This is not ordinary FPS, GPU parity, or runtime integration.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async id=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);
   const drawings=[...s.actors].filter(([,e])=>e.craftPose?.drawing).map(([actorId,e])=>({actorId,d:e.craftPose.drawing}));
   const original=drawings[0].d.point,source=String(original);
   const anchor=/const limit\s*=\s*m\.opaqueHeight\s*\*\s*0?\.025,\s*factor\s*=\s*Math.min\(1,\s*limit\s*\/\s*Math.max\(0?\.001,\s*Math.hypot\(ox,\s*oy\)\)\);/;
   if(!anchor.test(source))throw Error('Current clamp anchor changed');
   const candidate=source.replace(anchor,'const limit=m.opaqueHeight*.025,half=limit*.5,factor=Number.isFinite(limit)&&limit>=.001&&ox>=-half&&ox<=half&&oy>=-half&&oy<=half?1:Math.min(1,limit/Math.max(.001,Math.hypot(ox,oy)));');
   const compile=body=>new Function('smooth','NO_OVERLAP','return ({'+body+'}).point;')(t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);},[]);
   const implementations=[compile(source),compile(candidate)];let active=0;
   const dispatch=function(...args){return implementations[active].apply(this,args);};
   const cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
   const rows=[],differences=[];
   try{
    for(const {d}of drawings)d.point=dispatch;
    for(const {actorId,d}of drawings)for(const reduced of [false,true])for(const [clip,times]of Object.entries(cases))for(const at of times){
     const pair=[];
     for(active=0;active<2;active++){
      d.sample(clip,at,reduced,undefined,30+at,.7);
      const a=d.geometry.attributes.position.array;
      pair.push({vertexSha256:await hash(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)),sockets:Object.fromEntries(Object.entries(d.frame.sockets).map(([name,p])=>[name,d.point(p)])),face:d.faceCorners(),feet:d.contactPoints()});
     }
     const equal=JSON.stringify(pair[0])===JSON.stringify(pair[1]);rows.push({actorId,reduced,clip,at,equal});if(!equal)differences.push({actorId,reduced,clip,at,pair});
    }
    const benchCases=[['idle',.6],['attack',.1],['attack',.3],['attack',.35],['attack',.6],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['victory',1]];
    const run=(mode,cycles=6)=>{
     active=mode;const start=performance.now();
     for(let cycle=0;cycle<cycles;cycle++)for(const [clip,at]of benchCases)for(const {d}of drawings)d.sample(clip,at,false,undefined,30+cycle*5+at,.7);
     return {mode:mode?'shortcut':'original',ms:performance.now()-start,samples:cycles*benchCases.length*drawings.length};
    };
    run(0,3);run(1,3);const timing=[];
    for(let block=0;block<7;block++)for(const mode of block%2?[1,0]:[0,1])timing.push({...run(mode),block});
    const values=[-Infinity,-Number.MAX_VALUE,-1e200,-100,-1,-.001,-Number.MIN_VALUE,-0,0,Number.MIN_VALUE,1e-200,.0009,.001,.002,1,100,1e200,Number.MAX_VALUE,Infinity,NaN];
    const old=(limit,x,y)=>Math.min(1,limit/Math.max(.001,Math.hypot(x,y)));
    const fast=(limit,x,y)=>{const half=limit*.5;return Number.isFinite(limit)&&limit>=.001&&x>=-half&&x<=half&&y>=-half&&y<=half?1:old(limit,x,y);};
    let checked=0,seed=71;
    const check=(limit,x,y)=>{checked++;if(!Object.is(old(limit,x,y),fast(limit,x,y)))throw Error('Clamp mismatch '+[limit,x,y]);};
    for(const limit of values)for(const x of values)for(const y of values)check(limit,x,y);
    const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let n=0;n<20000;n++){const limit=10**(rand()*600-300);check(limit,(rand()*4-2)*limit,(rand()*4-2)*limit);}
    const median=mode=>timing.filter(r=>r.mode===mode).map(r=>r.ms).sort((a,b)=>a-b)[3];
    return{id,rows,differences,timing,oracleCases:checked,originalMedianMs:median('original'),shortcutMedianMs:median('shortcut'),prototype: candidate.match(/const limit=.*?;/)?.[0]};
   }finally{for(const {d}of drawings)d.point=original;}
  },id);
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({id,rows:result.rows.length,differences:result.differences.length,oracleCases:result.oracleCases,originalMedianMs:result.originalMedianMs,shortcutMedianMs:result.shortcutMedianMs,errors}));
 }
 report.pass=!report.errors.length&&report.fixtures.every(f=>!f.differences.length);report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));assert(report.pass);
}catch(error){report.errors.push(String(error.stack??error));report.pass=false;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
