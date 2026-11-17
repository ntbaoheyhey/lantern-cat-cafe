/** Static facial projection weights inside actual drawing sampling, tool-only. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {runtimeEvidence} from './runtime-evidence.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-face-projection-weights');await mkdir(out,{recursive:true});
const slots=Number(process.env.CXV_FACE_CACHE_SLOTS??4);assert([2,4].includes(slots));
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),...runtimeEvidence(),toolSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),viewport:{width:1280,height:720},method:'Tool-only4Float64 static face projection values per vertex. Both baseline/candidate point functions are cloned from the same current browser method and share dispatch.910 real pose cases compare every vertex byte, arbitrary sockets, feet and face corners.7 alternating warmed blocks/mode/fixture at4x CPU, no renderer timing. Prototype retains baseline+extended arrays for comparison; report incremental cache and cold rebuild costs. This is not ordinary FPS, GPU parity, or runtime integration.',fixtures:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
report.slots=slots;report.method=report.method.replace('4Float64',`${slots}Float64`);
try{
 for(const id of ['wave3','boss']){
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id===id),{fixedClock:false});report.url=page.url();
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  const result=await page.evaluate(async ({id,slots})=>{
   const s=window.__depthScene;cancelAnimationFrame(s.raf);
   const drawings=[...s.actors].filter(([,e])=>e.craftPose?.drawing).map(([actorId,e])=>({actorId,d:e.craftPose.drawing}));
   const original=drawings[0].d.point,source=String(original);
   const anchor='const projected = depth.offset(x, y, frame.face, this.faceOffset);';
   if(!source.includes(anchor))throw Error('Current face projection anchor changed');
   const shape=slots===4?'weights[shapeOffset],weights[shapeOffset+1],weights[shapeOffset+2],weights[shapeOffset+3]':'x-fx-fw*.55,y-fy-fh*.52,weights[shapeOffset],weights[shapeOffset+1]';
   const candidate=source.replace(anchor,`const shapeOffset=offset+7+overlaps.length; const projected=weights?depth.__cxvProject(${shape},this.faceOffset):depth.offset(x,y,frame.face,this.faceOffset);`);
   const compile=body=>new Function('smooth','NO_OVERLAP','return ({'+body+'}).point;')(t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);},[]);
   const implementations=[compile(source),compile(candidate)];let active=0;
   const dispatch=function(...args){return implementations[active].apply(this,args);};
   const originalWeights=drawings[0].d.weightsFor,faceCaches=new Map(drawings.map(({d})=>[d,new Map()]));
   const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
   const project=function(dx,dy,dome,depth,out){out.x=out.y=0;if(this.yaw===0&&this.pitch===0)return out;if(dome===0&&depth===0)return out;out.x=dx*(this.yawCos-1)*dome+depth*this.yawSin;out.y=dy*(this.pitchCos-1)*dome-depth*this.pitchSin;return out;};
   const extended=function(key){
    const base=originalWeights.call(this,key);if(active===0)return base;
    const cache=faceCaches.get(this),cached=cache.get(key);if(cached)return cached;
    const stride=base.stride+slots,count=this.source.length/3,data=new Float64Array(count*stride),m=this.set.manifest;
    const [fx,fy,w,h]=m.poses[key].face;
    for(let i=0;i<count;i++){
     data.set(base.data.subarray(i*base.stride,(i+1)*base.stride),i*stride);
     const x=this.source[i*3]+m.canvas[0]/2,y=m.canvas[1]/2-this.source[i*3+1],dx=x-fx-w*.55,dy=y-fy-h*.52;
     const dome=smooth(1-(dx/(w*.62))**2-(dy/(h*.78))**2),muzzle=smooth(1-((x-fx-w*.60)/(w*.22))**2-((y-fy-h*.64)/(h*.28))**2);
     const at=i*stride+base.stride;if(slots===4){data[at]=dx;data[at+1]=dy;}data[at+slots-2]=dome;data[at+slots-1]=w*(.22*dome+.06*muzzle);
    }
    const result={data,stride};cache.set(key,result);return result;
   };
   const cases={idle:[0,.3,.6,1.003106305,2.4,8.2],attack:[0,.05,.27,.3,.329,.33,.35,.439,.44,.56,.799],ult:[.29,.3,.6,1.1,1.189,1.19,1.759,1.76,1.8,2.199],hurt:[0,.089,.09,.179,.18,.399],ko:[.3],victory:[1]};
   const hash=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),b=>b.toString(16).padStart(2,'0')).join('');
   const rows=[],differences=[];
   try{
    for(const {d}of drawings){d.point=dispatch;d.weightsFor=extended;d.faceDepth.__cxvProject=project;d.seekFaceDepth.__cxvProject=project;}
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
     return {mode:mode?'face-cache':'original',ms:performance.now()-start,samples:cycles*benchCases.length*drawings.length};
    };
    run(0,3);run(1,3);const timing=[];
    for(let block=0;block<7;block++)for(const mode of block%2?[1,0]:[0,1])timing.push({...run(mode),block});
    const memory=drawings.map(({actorId,d})=>{const base=[...d.vertexWeights.values()].reduce((sum,v)=>sum+v.data.byteLength,0),candidate=[...faceCaches.get(d).values()].reduce((sum,v)=>sum+v.data.byteLength,0);return{actorId,poses:d.vertexWeights.size,baseBytes:base,candidateBytes:candidate,extraBytes:candidate-base};});
    const cold=[];
    for(let block=0;block<3;block++)for(const mode of block%2?[1,0]:[0,1]){
     for(const {d}of drawings){d.vertexWeights.clear();faceCaches.get(d).clear();}
     cold.push({...run(mode,1),block});
    }
    const median=mode=>timing.filter(r=>r.mode===mode).map(r=>r.ms).sort((a,b)=>a-b)[3];
    return{id,rows,differences,timing,memory,cold,originalMedianMs:median('original'),faceCacheMedianMs:median('face-cache'),prototype: `${slots===4?'dx,dy,dome,depth':'dome,depth'} in${slots}Float64 slots appended after existing weights;preserve projection arithmetic`};
   }finally{for(const {d}of drawings){d.point=original;d.weightsFor=originalWeights;delete d.faceDepth.__cxvProject;delete d.seekFaceDepth.__cxvProject;}}
  },{id,slots});
  report.fixtures.push(result);report.errors.push(...errors);await page.close();
  await writeFile(resolve(out,'report.partial.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({id,rows:result.rows.length,differences:result.differences.length,extraBytes:result.memory.reduce((sum,v)=>sum+v.extraBytes,0),originalMedianMs:result.originalMedianMs,faceCacheMedianMs:result.faceCacheMedianMs,errors}));
 }
 report.pass=!report.errors.length&&report.fixtures.every(f=>!f.differences.length);report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));assert(report.pass);
}catch(error){report.errors.push(String(error.stack??error));report.pass=false;await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));throw error;}finally{await browser.close();}
