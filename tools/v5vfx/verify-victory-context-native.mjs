/** Verify source/artifact provenance and measure native outcome captures before review. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash,victoryModule} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'work/v5/CXV/films/V7-E-victory-context-native-production');
const output=resolve(root,'reports/v5/CXV/V7-E-victory-context-native-verified.json');assert(!existsSync(output));
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const production=await read(resolve(root,'reports/v5/CXV/V7-E-victory-context-native-production.json'));
const build=await read(production.buildManifest.path);assert(production.pass);assert.equal(hash(await readFile(production.buildManifest.path)),production.buildManifest.sha256);
const artifact=build.artifacts[0];assert.equal(build.artifacts.length,1);assert.equal(artifact.mode,'native');assert.equal(artifact.transformed,0);assert.equal(build.runtimePatchSha256,hash(''));assert.equal(build.envDir,false);
assert.equal(production.source,build.source);assert.equal(production.indexSha256,artifact.indexSha256);assert.equal(build.victoryContextSha256,production.victoryContextSha256);
assert.equal(hash(execFileSync('git',['show',build.source+':'+victoryModule],{cwd:root})),production.victoryContextSha256);
for(const file of artifact.files)assert.equal(hash(await readFile(resolve(artifact.dist,file.path))),file.sha256);
for(const s of production.snapshots)assert.equal(hash(await readFile(resolve(dir,s.name))),s.sha256);
for(const ref of [production.context,production.density,production.raw])assert.equal(hash(await readFile(ref.path)),ref.sha256);
const context=await read(production.context.path),probe=await read(production.density.path),raw=await read(production.raw.path);assert(probe.pass&&probe.native&&raw.pass);
for(const d of [context,probe,raw]){assert.equal(d.indexSha256,artifact.indexSha256);assert.equal(d.buildSource,build.source);assert.equal(d.buildRuntimePatchSha256,hash(''));assert.equal(d.url,production.url);assert.deepEqual(d.viewport,{width:1280,height:720});}
assert.equal(raw.runs.length,4);assert.equal(probe.runs.length,2);assert.equal(raw.deviceScaleFactor,2);
for(const run of probe.runs){
 assert.deepEqual(run.errors,[]);assert.deepEqual(run.blockedRequests,[]);assert.equal(run.transitions.length,3);
 for(const t of run.transitions){assert.equal(t.stale,false);assert.deepEqual(t.after.canvas,t.expected);assert.deepEqual(t.after.drawingBuffer,t.expected);assert.equal(t.after.contextLost,false);assert.equal(t.after.ready,'true');assert.equal(t.after.drawn,'4');}
 if(run.mode==='reduced'){assert.equal(run.idleDraws,0);assert.deepEqual(run.transitions.map(t=>t.after.draws-t.beforeRedraw.draws),[4,0,4]);}
 else{assert(run.idleDraws>0);for(const t of run.transitions)assert.deepEqual(t.beforeRedraw.canvas,t.expected,'Normal RAF must synchronize before synthetic media event');}
 assert.equal(run.cleanup.connected,false);
}
assert(context.pass&&!context.hideLost&&!context.reproduced);assert.equal(context.runs.length,2);
for(const row of context.runs){
 assert.deepEqual(row.errors,[]);assert.deepEqual(row.blockedRequests,[]);
 assert(row.lost.contextLost&&row.lost.fallbackVisible&&row.lost.canvasVisibility==='hidden');
 assert(row.lost.images.length===4&&row.lost.images.every(i=>i.complete&&i.width>100));
 assert(row.restored.ready==='true'&&!row.restored.contextLost&&!row.restored.fallbackVisible&&row.restored.canvasVisibility==='visible');
 assert.equal(row.lost.lostEvents,1);assert.equal(row.restored.restoredEvents,1);
}
const reduced=context.captures.filter(c=>c.mode==='reduced'),rgb=p=>execFileSync('ffmpeg',['-v','error','-i',p,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:4*1024*1024});
assert.equal(hash(rgb(reduced.find(c=>c.name==='loaded').path)),hash(rgb(reduced.find(c=>c.name==='restored').path)),'Native reduced context restoration must be full-frame RGB exact');
const full=[...context.captures,...probe.captures].map(c=>({mode:c.mode,name:c.name,path:c.path,utc:c.utc}));const crew=[];
for(const r of raw.runs){
 assert.deepEqual(r.errors,[]);assert.deepEqual(r.blockedRequests,[]);assert(r.elapsedMs>=32000&&r.elapsedMs<36000);assert.equal(r.crew.ready,'true');assert.equal(r.crew.drawn,'4');assert(!r.crew.loadError);
 assert.equal(r.crew.confetti,r.reduced?0:1);if(r.reduced){assert.equal(r.counters.draws,0);assert.equal(r.counters.uploads,0);}else assert(r.counters.draws>200);
 full.push({mode:r.reduced?'reduced':'normal',name:r.rate+'x-32s',path:r.path,utc:r.utc});
 const bytes=await readFile(r.crewPath);crew.push({path:r.crewPath,width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),sha256:hash(bytes)});
}
const report={utc:new Date().toISOString(),source:build.source,indexSha256:artifact.indexSha256,runtimePatchSha256:hash(''),componentSha256:production.victoryContextSha256,
 url:production.url,viewport:production.viewport,started:production.started,ended:production.ended,artifactFilesVerified:artifact.files.length,toolSnapshotsVerified:production.snapshots.length,
 buildManifest:production.buildManifest,context:production.context,contextRows:context.runs,reducedRestoredRgbExact:true,probe:production.density,raw:production.raw,transitions:probe.runs,runs:raw.runs,fullCaptures:[],crewCaptures:crew,sheets:[],reviewedUtc:null,visualReview:null,pass:true,limits:production.limits};
for(const c of full){
 const bytes=await readFile(c.path);assert.equal(bytes.readUInt32BE(16),1280);assert.equal(bytes.readUInt32BE(20),720);
 const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-vf','scale=160:90','-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1']);
 const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
 report.fullCaptures.push({...c,width:1280,height:720,sha256:hash(bytes),mean,stdDev});
}
const review=resolve(dir,'review');await mkdir(review,{recursive:true});
const groups=[[0,1,2],[3,4,5],[6,7,8,9],[10,11,12,13],[14,15,16,17]];
for(const [i,group]of groups.entries()){
 const rows=group.map(n=>report.fullCaptures[n]),path=resolve(review,'native-'+i+'.jpg');assert(!existsSync(path));assert(rows.every(Boolean));
 const graph=rows.length===3?'[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[a][b][c]xstack=inputs=3:layout=0_0|w0_0|0_h0:fill=black[v]':'[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]';
 execFileSync('ffmpeg',['-v','error',...rows.flatMap(c=>['-i',c.path]),'-filter_complex',graph,'-map','[v]','-frames:v','1','-q:v','3',path]);
 const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
 report.sheets.push({path,...dimensions,sha256:hash(await readFile(path)),frames:rows.map(r=>({name:r.name,mode:r.mode}))});
}
await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,pass:true,files:artifact.files.length,captures:report.fullCaptures.length,crewCaptures:crew.length,sheets:report.sheets.map(s=>s.path),runs:raw.runs.map(r=>({rate:r.rate,reduced:r.reduced,counters:r.counters}))}));
