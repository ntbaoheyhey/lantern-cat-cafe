/** Per-sample lift/lean invariants inside actual drawing sampling, tool-only. */
import assert from 'node:assert/strict';
import {installDrawingFramePrototype} from './drawing-frame-prototype.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-drawing-frame');await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Tool-only sample-invariant lift/lean prototype; shared point dispatch and sample invalidation in both modes.910 exact motion/vertex/socket cases;7alternating warmed4x blocks. No extra pervertex storage, allocation perframe, renderer timing, FPS or runtime claim',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  report.prototype=await page.evaluate(installDrawingFramePrototype,{extended:process.env.CXV_FRAME_EXTENDED==='1'});
  const result=await page.evaluate(async id=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);
   const drawings=[...s.actors].filter(([,e])=>e.craftPose?.drawing).map(([actorId,e])=>({actorId,d:e.craftPose.drawing}));
   const controller=window.__cxvDrawingFrame;let active=0;
   const cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
   const rows=[],differences=[];
   try{

    for(const {actorId,d}of drawings)for(const reduced of [false,true])for(const [clip,times]of Object.entries(cases))for(const at of times){
     const pair=[];
     for(active=0;active<2;active++){controller.active=active;
      d.sample(clip,at,reduced,undefined,30+at,.7);
      const a=d.geometry.attributes.position.array;
      pair.push({vertexSha256:await hash(new Uint8Array(a.buffer,a.byteOffset,a.byteLength)),sockets:Object.fromEntries(Object.entries(d.frame.sockets).map(([name,p])=>[name,d.point(p)])),face:d.faceCorners(),feet:d.contactPoints()});
     }
     const equal=JSON.stringify(pair[0])===JSON.stringify(pair[1]);rows.push({actorId,reduced,clip,at,equal});if(!equal)differences.push({actorId,reduced,clip,at,pair});
    }
    const benchCases=[['idle',.6],['attack',.1],['attack',.3],['attack',.35],['attack',.6],['ult',.6],['ult',1.1],['ult',1.8],['hurt',.06],['victory',1]];
    const run=(mode,cycles=6)=>{
     active=mode;controller.active=mode;const start=performance.now();
     for(let cycle=0;cycle<cycles;cycle++)for(const [clip,at]of benchCases)for(const {d}of drawings)d.sample(clip,at,false,undefined,30+cycle*5+at,.7);
     return {mode:mode?'shortcut':'original',ms:performance.now()-start,samples:cycles*benchCases.length*drawings.length};
    };
    run(0,3);run(1,3);const timing=[];
    for(let block=0;block<7;block++)for(const mode of block%2?[1,0]:[0,1])timing.push({...run(mode),block});
    const median=mode=>timing.filter(r=>r.mode===mode).map(r=>r.ms).sort((a,b)=>a-b)[3];
    return{id,rows,differences,timing,originalMedianMs:median('original'),shortcutMedianMs:median('shortcut'),prototype: 'once-per-sample lift/lean'};
   }finally{for(const restore of controller.restores)restore();delete window.__cxvDrawingFrame;}
  },id);
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({id,rows:result.rows.length,differences:result.differences.length,originalMedianMs:result.originalMedianMs,shortcutMedianMs:result.shortcutMedianMs,errors}));
 }
 report.pass=!report.errors.length&&report.fixtures.every(f=>!f.differences.length);report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));assert(report.pass);
}catch(error){report.errors.push(String(error.stack??error));report.pass=false;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
