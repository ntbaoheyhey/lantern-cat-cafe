/** Build the current source once, then validate its complete natural battle at4x. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {buildProductionComparison,root,appRoot,require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-full-battle-native-4x-build'),capture=resolve(root,'work/v5/CXV/films/V7-F-full-battle-native-4x');assert(!existsSync(out)&&!existsSync(capture));await mkdir(out,{recursive:true});
const modulePath='apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx',currentSource=await readFile(resolve(root,modulePath),'utf8');
const provenance=[];for(const name of ['run-full-battle-native.mjs','build-hud-production.mjs','capture-full-battle-production.mjs','production-candidate-fixture.mjs']){const data=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),data);provenance.push({name,sha256:hash(data)});}await writeFile(resolve(out,'tool-provenance.json'),JSON.stringify(provenance,null,2));
const built=await buildProductionComparison(out,{modulePath,currentSource,variants:{baseline:currentSource},metadata:{experiment:'current-native-complete-battle-4x',candidateIsApplicationSource:true,componentSha256:hash(currentSource)}});assert.equal(built.artifacts.length,1);assert.equal(built.artifacts[0].transformed,0);
const {preview}=await import(require.resolve('vite'));const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:resolve(out,'baseline')},preview:{host:'127.0.0.1',port:6311,strictPort:true}});
try{const log=await open(resolve(out,'capture.log'),'w');let code;try{code=await new Promise((done,reject)=>{const child=spawn(process.execPath,['tools/v5vfx/capture-full-battle-production.mjs'],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'baseline',CXV_FULL_LOCAL:'1',CXV_FULL_CPU_RATE:'4',CXV_CAPTURE_OUT:capture},stdio:['ignore',log.fd,log.fd]});child.once('error',reject);child.once('exit',done);});}finally{await log.close();}assert.equal(code,0);const r=JSON.parse(await readFile(resolve(capture,'report.json'),'utf8'));assert(r.pass);console.log(JSON.stringify({utc:new Date().toISOString(),capture,pass:r.pass,source:r.servedSource,index:r.indexSha256}));}finally{await new Promise(done=>server.httpServer.close(done));}
