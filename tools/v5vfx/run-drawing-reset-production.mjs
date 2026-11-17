/** Balanced natural-play trials on an unchanged preserved production artifact. */
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const production=resolve(root,'work/v5/CXV/films/V7-F-victory-demand-production'),out=resolve(root,'work/v5/CXV/films/V7-F-drawing-reset-production');
assert(!existsSync(resolve(out,'series.json')));await mkdir(out,{recursive:true});
const parity=JSON.parse(await readFile(resolve(root,'work/v5/CXV/films/V7-F-drawing-reset-parity-r2/report.json'),'utf8'));assert(parity.pass,'Frozen parity must pass first');
const buildBytes=await readFile(resolve(production,'build.json')),build=JSON.parse(buildBytes),artifact=build.artifacts.find(a=>a.mode==='baseline');
assert.equal(execFileSync('git',['diff',build.source,'--','apps/web/src','apps/web/public'],{cwd:root,encoding:'utf8'}),'','Current runtime must match the preserved baseline');
assert.equal(hash(await readFile(resolve(artifact.dist,'index.html'))),artifact.indexSha256);
const series={utc:new Date().toISOString(),source:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),buildManifest:resolve(production,'build.json'),buildManifestSha256:hash(buildBytes),order:['baseline','coalesced','coalesced','baseline','baseline','coalesced'],snapshots:[],runs:[],pass:false};
for(const name of ['run-drawing-reset-production.mjs','benchmark-boss-play.mjs','drawing-reset-prototype.mjs','production-candidate-fixture.mjs']){const bytes=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),bytes);series.snapshots.push({name,sha256:hash(bytes)});}
const {preview}=await import(require.resolve('vite')),server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6311,strictPort:true}});
try{
 for(const [index,mode]of series.order.entries()){
  for(const name of ['STOP-ALL','STOP-CXV'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP '+name);
  const dir=resolve(out,'trials',`${index}-${mode}`),log=await open(resolve(out,`${index}-${mode}.log`),'w');let code;
  try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/benchmark-boss-play.mjs'],{cwd:root,env:{...process.env,CXV_LOCAL_PRODUCTION:'1',CXV_PRODUCTION_OUT:production,CXV_ARTIFACT_MODE:'baseline',CXV_DRAWING_RESET:mode,CXV_CAPTURE_OUT:dir},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}
  assert.equal(code,0);const raw=resolve(dir,'report.json'),trial=JSON.parse(await readFile(raw,'utf8'));assert(trial.pass);assert(trial.runs.every(r=>!r.blockedRequests.length));
  series.runs.push({index,mode,raw,sha256:hash(await readFile(raw)),pass:trial.pass});await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));console.log(new Date().toISOString()+` drawing reset ${index} ${mode} passed`);
 }
 series.pass=series.runs.length===6;
}finally{series.ended=new Date().toISOString();await writeFile(resolve(out,'series.json'),JSON.stringify(series,null,2));await new Promise(done=>server.httpServer.close(done));}
