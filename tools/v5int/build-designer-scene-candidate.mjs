/** Build an ignored, explicitly overridden scene candidate. Never edit the production registry/public assets. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {build}=await import(req.resolve('vite')),sha=b=>createHash('sha256').update(b).digest('hex');
const label=process.argv[2]??'mochi-scene-q22-r1';assert(/^[a-z0-9-]+$/.test(label));
const out=resolve(root,'work/v5/CXI/batch-m',label);await mkdir(out);const dist=resolve(out,'dist');
const native=resolve(root,'work/v5/CXI/batch-m/four-plane-local-vslow-q22-r1/runtime-native-r1');
const m=JSON.parse(await readFile(resolve(native,'manifest.json'))),poster=await readFile(resolve(native,'poster.webp'));
assert.equal(sha(poster),m.posterSha256);
const offline=JSON.parse(await readFile(resolve(root,'work/v5/CXI/batch-m/four-plane-local-vslow-q22-r1/report.json')));
const trial=offline.trials.find(t=>t.mode==='ycrcb'),video=await readFile(trial.video);assert.equal(sha(video),m.videoSha256);
const payloadPath='/Users/bao/taskbar-hero-cardrpg-a6/reports/v5/CXV/M-mochi-socket-delivery-R3.json';
const payloadBytes=await readFile(payloadPath),payload=JSON.parse(payloadBytes);
assert.equal(sha(await readFile(payload.sourceReport)),payload.sourceReportSha256);assert.equal(payload.sourceSha256,m.sourceSha256);
const ratio=m.width/payload.deliverySize[0];assert.equal(m.height/payload.deliverySize[1],ratio);
assert.equal(m.opaqueHeight/payload.opaqueHeight,ratio);const scaled=xy=>xy.map(v=>v*ratio);
m.sockets={...m.sockets,...Object.fromEntries(Object.entries(payload.partialManifest.sockets).map(([k,v])=>[k,scaled(v)]))};
m.socketTracks=Object.fromEntries(Object.entries(payload.partialManifest.socketTracks).map(([k,v])=>[k,v.map(scaled)]));
m.socketChannels=payload.partialManifest.socketChannels;
assert.deepEqual(m.socketChannels,{hip:'hip','main-hand':'shieldWrist','vfx-origin':'lantern'});
const manifestBytes=Buffer.from(JSON.stringify(m)+'\n'),manifestPath=`/units/mochi/designer-idle-${sha(manifestBytes).slice(0,16)}.json`;
const registryOverride={mochi:manifestPath},registryPath=resolve(app,'src/game/cardrpg/spine/designer-idle-registry.json');
const registryBefore=await readFile(registryPath);assert.deepEqual(JSON.parse(registryBefore),{});
const source=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();let injected=0;
await build({root:app,configFile:resolve(app,'vite.config.ts'),envFile:false,plugins:[{name:'explicit-designer-scene-study',enforce:'pre',load(id){if(id.split('?')[0]===registryPath){injected++;return JSON.stringify(registryOverride);}}}],build:{outDir:dist,emptyOutDir:false}});
assert(injected>0,'Registry override was not included');assert.equal(sha(await readFile(registryPath)),sha(registryBefore));
const files=[];
for(const [url,data] of [[manifestPath,manifestBytes],[m.video,video],[m.poster,poster]]){
 const path=resolve(dist,url.slice(1));await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,data);files.push({url,path,bytes:data.length,sha256:sha(data)});
}
const report={utc:new Date().toISOString(),sourceCommit:source,sourceKind:'Committed application source plus explicit ignored scene registry override',toolSha256:sha(await readFile(import.meta.filename)),dist,indexSha256:sha(await readFile(resolve(dist,'index.html'))),registryOverride,productionRegistrySha256:sha(registryBefore),productionRegistryChanged:false,socketPayload:{path:payloadPath,sha256:sha(payloadBytes),scale:ratio,unresolved:payload.unresolved},files,productionInstalled:false,accepted:false};
await writeFile(resolve(out,'build.json'),JSON.stringify(report,null,2)+'\n');await writeFile(resolve(root,`reports/v5/CXI/evidence/v8-${label}-build.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({dist,source,indexSha256:report.indexSha256,registryOverride,bytes:files.reduce((s,x)=>s+x.bytes,0)}));
