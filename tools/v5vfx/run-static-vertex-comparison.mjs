/** Matched-clone, alternating ordinary-play comparison; application source stays unchanged. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {runtimeEvidence} from './runtime-evidence.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'work/v5/CXV/films/V7-F-static-vertex-play');
await mkdir(out,{recursive:true});
const report={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),...runtimeEvidence(),prototypeSha256:createHash('sha256').update(await readFile(resolve(root,'tools/v5vfx/transparent-vertex-prototype.mjs'))).digest('hex'),order:['baseline','static','static','baseline','baseline','static'],runs:[],pass:false,method:'Both modes install identical fresh full-geometry clones initialized at idle0. Baseline retains the original sample method; static updates only nonstationary original indices. Same materials, full positions/UVs/indices, caches and fixture. Setup is outside measurement; startup GPU/bounds costs remain in whole-run. This is a Vite browser prototype, not native integration or judge acceptance.'};
try{
 for(const [index,mode]of report.order.entries()){
  const dir=resolve(out,index+'-'+mode),log=await open(resolve(out,index+'-'+mode+'.log'),'w');
  const env={...process.env,CXV_TRANSPARENT_WORK:'1',CXV_STATIC_VERTEX_WORK:'1',CXV_STATIC_VERTEX_BASELINE:mode==='baseline'?'1':'0',CXV_CAPTURE_OUT:dir};
  for(const k of ['CXV_LOCAL_PRODUCTION','CXV_PRODUCTION','CXV_OUTER_PROTOTYPE','CXV_FACE_PROTOTYPE','CXV_NUMBER_METRICS','CXV_PENDING_BATCH','CXV_HUD_MODE','CXV_LABEL_SEARCH','CXV_LABEL_SEARCH_PAIRED','CXV_PROFILE','CXV_STRESS_ONLY'])delete env[k];
  let code;
  try{code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{cwd:root,env,stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',resolve);});}finally{await log.close();}
  assert.equal(code,0,'Trial failed: '+index+'-'+mode);
  const raw=resolve(dir,'report.json'),trial=JSON.parse(await readFile(raw,'utf8'));
  assert(trial.pass&&trial.transparentWorkPrototype&&trial.transparentWorkDetails.every(d=>d.staticOnly&&d.baselineClone===(mode==='baseline')));
  assert.equal(trial.runtimePatchSha256,report.runtimePatchSha256);assert.deepEqual(trial.runtimeUntrackedSha256,report.runtimeUntrackedSha256);
  report.runs.push({index,mode,raw});await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));
  console.log(new Date().toISOString()+' trial '+index+' '+mode+' passed');
 }
 report.pass=report.runs.length===6;
}finally{report.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(report,null,2));}
