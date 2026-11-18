/** Build and measure native scheduling, without browser/source substitutions. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile,open} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildProductionComparison,root,appRoot,require} from './build-hud-production.mjs';
import {victoryModule,hash} from './victory-demand-source.mjs';
const out=resolve(root,'work/v5/CXV/films/V7-F-victory-native-production');assert(!existsSync(out));await mkdir(out,{recursive:true});
const current=await readFile(resolve(root,victoryModule),'utf8');assert(current.includes('const requestDraw='));
const snapshots=[];for(const name of ['run-victory-native-production.mjs','benchmark-victory-production.mjs','build-hud-production.mjs','production-candidate-fixture.mjs']){const b=await readFile(resolve(root,'tools/v5vfx',name));await writeFile(resolve(out,name),b);snapshots.push({name,sha256:hash(b)});}
await writeFile(resolve(out,'native-VictoryCrew.tsx'),current);
const build=await buildProductionComparison(out,{modulePath:victoryModule,currentSource:current,variants:{native:current},metadata:{experiment:'native-victory-demand-validation',candidateModuleSha256:hash(current),candidateIsApplicationSource:true}});const artifact=build.artifacts.find(a=>a.mode==='native');assert(artifact);
const {preview}=await import(require.resolve('vite'));const server=await preview({root:appRoot,configFile:false,envDir:false,logLevel:'error',build:{outDir:artifact.dist},preview:{host:'127.0.0.1',port:6312,strictPort:true}});
const report={utc:new Date().toISOString(),buildManifest:resolve(out,'build.json'),buildManifestSha256:hash(await readFile(resolve(out,'build.json'))),snapshots,pass:false};
try{
 const log=await open(resolve(out,'native.log'),'w');let code;
 try{code=await new Promise((done,reject)=>{const p=spawn(process.execPath,[resolve(root,'tools/v5vfx/benchmark-victory-production.mjs')],{cwd:root,env:{...process.env,CXV_PRODUCTION_OUT:out,CXV_ARTIFACT_MODE:'native',CXV_CAPTURE_OUT:resolve(out,'trial')},stdio:['ignore',log.fd,log.fd]});p.once('error',reject);p.once('exit',done);});}finally{await log.close();}
 assert.equal(code,0);report.raw=resolve(out,'trial/report.json');const raw=JSON.parse(await readFile(report.raw,'utf8'));assert(raw.pass);report.pass=true;
}finally{await new Promise(done=>server.httpServer.close(done));report.ended=new Date().toISOString();await writeFile(resolve(out,'native-series.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
