/** Both local preview servers share this runner; benchmark children remain strictly sequential. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile,open} from 'node:fs/promises';
import {resolve} from 'node:path';
import {buildHudArtifacts,root,appRoot,require} from './build-hud-production.mjs';
const out=resolve(process.env.CXV_PRODUCTION_OUT??resolve(root,'work/v5/CXV/films/V7-F-hud-production'));
await mkdir(out,{recursive:true});
const built=process.env.CXV_REUSE_BUILD==='1'?JSON.parse(await readFile(resolve(out,'build.json'),'utf8')):await buildHudArtifacts(out);
assert(built.staticAssetsExact);
const {preview}=await import(require.resolve('vite')),servers=[];
const report={utc:new Date().toISOString(),buildManifest:resolve(out,'build.json'),order:['baseline','text','text','baseline','baseline','text'],runs:[],pass:false};
try{
 for(const [index,mode]of ['baseline','text'].entries())servers.push(await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:resolve(out,mode)},preview:{host:'127.0.0.1',port:6311+index,strictPort:true}}));
 for(const [index,mode]of report.order.entries()){
  const dir=resolve(out,'trials',index+'-'+mode),log=await open(resolve(out,index+'-'+mode+'.log'),'w');
  const env={...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:mode,CXV_CAPTURE_OUT:dir,CXV_LAYOUT_PROFILE:'1',CXV_FOCUS_PROFILE:'1'};
  for(const key of ['CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PRODUCTION','CXV_HUD_MODE','CXV_PROFILE','CXV_STRESS_ONLY','CXV_PENDING_BATCH','CXV_FACE_PROTOTYPE','CXV_OUTER_PROTOTYPE','CXV_NUMBER_METRICS'])delete env[key];
  let code;
  try{code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',resolve);});}finally{await log.close();}
  assert.equal(code,0,'Production trial failed;see '+resolve(out,index+'-'+mode+'.log'));
  const trial=JSON.parse(await readFile(resolve(dir,'report.json'),'utf8'));
  assert(trial.pass&&trial.localProduction&&!trial.hudMode);
  report.runs.push({index,mode,raw:resolve(dir,'report.json'),pass:true});
  await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
  console.log(new Date().toISOString()+' production trial '+index+' '+mode+' passed');
 }
 report.pass=report.runs.length===6;
}finally{await Promise.all(servers.map(server=>new Promise(resolve=>server.httpServer.close(resolve))));report.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));}
