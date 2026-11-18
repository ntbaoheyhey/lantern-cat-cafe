/** Bounded synthetic whole-deformer timing, after exact offline parity. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {hash} from './panko-offhand-cache-source.mjs';
const root=resolve(import.meta.dirname,'../..'),base=resolve(process.argv[2]??''),prePath=resolve(root,'reports/v5/CXV/M-panko-offhand-timing-R1-preregistration.json');
assert(base.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(!existsSync(resolve(base,'timing.json')));
const pre=JSON.parse(await readFile(prePath)),parity=JSON.parse(await readFile(resolve(base,'report.json')));assert(parity.pass);assert.equal(hash(await readFile(import.meta.filename)),pre.harnessSha256);assert.equal(hash(await readFile(resolve(base,'layers.mjs'))),parity.bundleSha256);
const stop=()=>{assert(Date.now()<Date.parse(process.env.CXV_HOST_TIMING_UNTIL),'Host timing lease expired');for(const n of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n),n);};stop();
const {Original,Candidate,Texture}=await import(pathToFileURL(resolve(base,'layers.mjs')).href),classes={A:Original,B:Candidate};
const manifests=Object.fromEntries(await Promise.all(pre.fixtures.map(async id=>[id,JSON.parse(await readFile(resolve(root,'apps/web/public/units',id,'poses/manifest.json')))])));
const sets=Object.fromEntries(Object.entries(manifests).map(([id,manifest])=>[id,{manifest,textures:Object.fromEntries(Object.keys(manifest.poses).map(k=>[k,new Texture()]))}]));
const make=(id,arm)=>new classes[arm](sets[id],[17,23],.7);
const work=(layers,count)=>{for(let i=0;i<count;i++){const skill=i%4===3,t=skill?(i%61)/60:(i%601)/60;for(const layer of layers)layer.sample(skill?'skill':'idle',t,false,undefined,30+t,.7,-1);}};
const report={utc:new Date().toISOString(),preregistration:{path:prePath,sha256:hash(await readFile(prePath))},parity:{path:resolve(base,'report.json'),sha256:hash(await readFile(resolve(base,'report.json')))},harnessSha256:pre.harnessSha256,hostLeaseUntil:process.env.CXV_HOST_TIMING_UNTIL,cold:[],blocks:[],pass:false,productionAcceptance:false,limit:'Synthetic complete-deformer work with warm code and cold per-instance caches;not browser FPS,first-load cost or ordinary laptop acceptance.'};
try{
 for(const [pair,order] of pre.coldPairs.entries())for(const arm of order){stop();const start=performance.now(),layer=make('panko',arm),elapsed=performance.now()-start;report.cold.push({pair,arm,milliseconds:elapsed,weightsBytes:[...layer.vertexWeights.values()].reduce((n,w)=>n+w.data.byteLength,0)});layer.dispose();}
 for(const group of pre.groups){
  const layers={A:group.fixtures.map(id=>make(id,'A')),B:group.fixtures.map(id=>make(id,'B'))};
  try{for(const arm of ['A','B'])work(layers[arm],pre.warmupSamples);
   for(const [block,arm] of pre.order.entries()){stop();const start=performance.now();work(layers[arm],pre.samplesPerBlock);const milliseconds=performance.now()-start;stop();report.blocks.push({group:group.name,block,arm,milliseconds,frames:pre.samplesPerBlock,deformerCalls:pre.samplesPerBlock*layers[arm].length,millisecondsPerSyntheticFrame:milliseconds/pre.samplesPerBlock});}
  }finally{for(const arm of ['A','B'])for(const layer of layers[arm])layer.dispose();}
 }
 report.pass=true;
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{for(const set of Object.values(sets))for(const t of Object.values(set.textures))t.dispose();report.finishedUTC=new Date().toISOString();await writeFile(resolve(base,'timing.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({base,pass:report.pass,cold:report.cold.length,blocks:report.blocks.length,failure:report.failure}));}
