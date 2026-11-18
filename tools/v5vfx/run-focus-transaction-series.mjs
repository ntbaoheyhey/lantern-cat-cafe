/** Matched production artifacts; two-module geometry transaction is the only application difference. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildProductionComparison,root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-focus-transaction-production');assert(existsSync(out));
const built=JSON.parse(await readFile(resolve(out,'build.json'))),snapshots=built.snapshots;assert(built.staticAssetsExact);
const prototype=JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-F-focus-transaction/report.json')));assert(prototype.pass);
for(const file of snapshots)assert.equal(hash(await readFile(resolve(out,file.name))),file.sha256);
const {preview}=await import(require.resolve('vite')),servers=[];
const report={utc:new Date().toISOString(),buildManifest:resolve(out,'build.json'),buildManifestSha256:hash(await readFile(resolve(out,'build.json'))),snapshots,order:['baseline','transaction','transaction','baseline','baseline','transaction'],runs:[],pass:false};
try{
 for(const [index,mode]of ['baseline','transaction'].entries())servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:resolve(out,mode)},preview:{host:'127.0.0.1',port:6311+index,strictPort:true}}));
 for(const [index,mode]of report.order.entries()){
  const dir=resolve(out,'trials',index+'-'+mode),log=await open(resolve(out,index+'-'+mode+'.log'),'w');
  const env={...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir,CXV_LAYOUT_PROFILE:'1',CXV_FOCUS_PROFILE:'1'};
  for(const key of ['CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PRODUCTION','CXV_HUD_MODE','CXV_PROFILE','CXV_STRESS_ONLY','CXV_PENDING_BATCH','CXV_FACE_PROTOTYPE','CXV_OUTER_PROTOTYPE','CXV_NUMBER_METRICS','CXV_OFFLINE_NUMBER','CXV_CLOVER_LEAF','CXV_DRAWING_RESET','CXV_TRANSPARENT_WORK'])delete env[key];
  let code;
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[resolve(root,'tools/v5vfx/benchmark-boss-play.mjs')],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0,'Trial failed; retained '+resolve(out,index+'-'+mode+'.log'));
  const bytes=await readFile(resolve(dir,'report.json')),trial=JSON.parse(bytes);assert(trial.pass&&trial.localProduction&&!trial.hudMode);
  report.runs.push({index,mode,raw:resolve(dir,'report.json'),sha256:hash(bytes),pass:true});
  await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2)+'\n');console.log(new Date().toISOString()+' trial '+index+' '+mode+' passed');
 }
 report.pass=report.runs.length===6;
}finally{await Promise.all(servers.map(server=>new Promise(done=>server.httpServer.close(done))));report.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2)+'\n');}
