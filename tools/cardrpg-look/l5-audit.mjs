// Audit evidence bindings; an audit pass never turns an aesthetic self-review
// or a missed performance target into an acceptance claim.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const out='reports/cardrpg-look/validation/l5';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const phase=await json(`${out}/phase-source.json`),build=phase.build;
const artifact=await readFile('docs/cardrpg-look/index.html');
assert.equal(hash(artifact),build.sha256);assert.equal(artifact.length,build.bytes);assert.equal(build.runtimeDirty,false);
for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
const selection=await json(`${out}/selection.json`);
assert.equal(hash(await readFile(`${out}/selection.json`)),phase.selectionSha256);
assert.equal(selection.rows.length,22);
const modelRows=[];
for(const row of selection.rows){
 assert.equal(row.reviewed,true);assert.equal(hash(await readFile(row.raw)),row.rawSha256);
 assert.equal(hash(await readFile(row.packed)),row.packedSha256);
 const turn=await json(row.turntable);
 assert.equal(turn.modelHash,row.rawSha256);assert.equal(turn.frames,48);
 const video=row.turntable.replace(/receipt\.json$/,'turntable.mp4');
 assert.equal(hash(await readFile(video)),turn.videoSha256);
 const turnAudit=await json(row.turntable.replace(/receipt\.json$/,'frame-audit.json'));
 assert.equal(turnAudit.modelHash,row.rawSha256);assert.equal(turnAudit.frames,48);
 assert.deepEqual(turnAudit.framingFailures,[]);
 assert.equal(hash(await readFile(row.turntable.replace(/receipt\.json$/,'six-angle-sheet.png'))),turnAudit.sheetSha256);
 assert(row.reviews.length>=2);for(const path of row.reviews)assert((await readFile(path,'utf8')).length>100);
 // Fresh phase poses bind all selected models to the committed artifact.
 // Pilot reviews explain corrections but do not substitute for this check.
 const motion=await json(`${out}/phase-${row.kind==='cat'?'cat':'opponent'}-poses/poses.json`);
 assert.equal(motion.sha256,build.sha256);
 assert.equal(build.sourceHashes[row.packed],row.packedSha256);
 const samples=motion.rows.filter(r=>r.cat===row.owner),ids=[...new Set(samples.map(r=>r.id))];
 assert.equal(ids.length,row.kind==='cat'?4:2);
 for(const id of ids){assert.equal(samples.filter(r=>r.id===id).length,6);}
 for(const sample of samples){
  assert.deepEqual(sample.errors,[]);
  assert.equal(sample.actualClip,sample.id,`${row.owner}: actual animation`);
  assert.equal(sample.model.lookV2,true,`${row.owner}: Look model`);
  assert.equal(sample.framingPass,true,`${sample.id}@${sample.progress}: mesh outside one-percent frame margin`);
  assert(sample.projectedVertices>0&&sample.projectedBounds.every(Number.isFinite));
 }
 modelRows.push({owner:row.owner,tier:row.tier,raw:row.rawSha256,packed:row.packedSha256,motionSamples:samples.length,turntableFrames:turn.frames});
}
for(const kind of ['raw','packed']){
 const rows=await json(`${out}/phase-rig-${kind}.json`);assert.equal(rows.length,22);
 for(const row of rows){assert.deepEqual(row.errors,[]);assert(row.triangles<=row.triangleLimit);}
}
const stills=await json(`${out}/phase-stills/captures.json`);
assert.equal(stills.sha256,build.sha256);assert.equal(stills.rows.length,66);
for(const row of stills.rows){assert.deepEqual(row.errors,[]);assert.equal(hash(await readFile(`${out}/phase-stills/${row.file}`)),row.sha256);}
const manifestBytes=await readFile('apps/web/src/game/cardrpg/look-assets.json'),manifest=JSON.parse(manifestBytes);
assert.equal(manifest.phase,'L5');assert.equal(manifest.complete,true);
assert.equal(Object.keys(manifest.portraits).length,12);assert.equal(Object.keys(manifest.skills).length,48);assert.equal(Object.keys(manifest.frames).length,4);
for(const row of Object.values(manifest.portraits)){
 assert.equal(hash(await readFile(row.portrait.renderSource)),row.portrait.modelSha256);
 for(const scale of ['1x','2x'])assert.equal(hash(await readFile(row.portrait[scale])),row.provenance.deliveredSha256[scale]);
}
const gallery=await json('reports/cardrpg-look/rounds/art/gallery-build.json'),browser=await json(`${out}/art-browser/checks.json`);
assert.equal(hash(await readFile('docs/cardrpg-look/art.html')),gallery.sha256);assert.equal(gallery.manifestSha256,hash(manifestBytes));
assert.equal(browser.artifact,gallery.sha256);assert.equal(browser.manifest,hash(manifestBytes));assert.equal(browser.rows.length,3);
for(const row of browser.rows){assert.equal(row.images.length,72);assert.equal(row.before,true);assert.equal(row.restored,true);assert.equal(row.overflow,false);assert.deepEqual(row.errors,[]);assert.deepEqual(row.requests,[]);}
for(const width of [1024,1280,1440])for(const dpr of [1,2]){
 const r=await json(`${out}/portraits-${width}-dpr${dpr}/checks.json`);
 assert.equal(r.artifactSha256,build.sha256);assert.equal(r.manifestSha256,hash(manifestBytes));
 assert.equal(r.passed,true);assert.deepEqual(r.errors,[]);assert.deepEqual(r.remote,[]);
 assert.equal(r.toggles.length,4);assert(r.toggles.every(t=>t.preservedState));
}
const gates=await json(`${out}/source-gates.json`);assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','unit','build','e2e']);
for(const row of gates){assert.equal(row.code,0,row.name);row.logSha256=hash(await readFile(row.log));}
const performance=await json(`${out}/measurement-summary.json`);
assert.equal(performance.artifact,build.sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);
const flag=await json(`${out}/flag-off/checks.json`),baseline=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const key of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[key],[]);
const modules=r=>[...new Set(r.chunks.flatMap(c=>c.modules))].sort();assert.deepEqual(modules(flag),modules(baseline));
const startup={bytes:flag.chunks.reduce((n,r)=>n+r.bytes,0),baselineBytes:baseline.chunks.reduce((n,r)=>n+r.bytes,0),threeAndModelModules:0};startup.byteDelta=startup.bytes-startup.baselineBytes;
const protectedChanges=execFileSync('git',['diff','--name-only','cac2276b','--','packages/game-rules','contracts','supabase','package.json','pnpm-lock.yaml'],{encoding:'utf8'}).trim();assert.equal(protectedChanges,'');
const misses=[];
if(build.bytes>24000000){
 const size=await json(`${out}/size-justification.json`);assert.equal(size.artifact,build.sha256);assert.equal(size.bytes,build.bytes);assert.equal(size.maximumAuthorizedBytes,32000000);
 assert(size.visualEvidence.length>=3);for(const path of size.visualEvidence)assert((await readFile(path)).length>0);
 misses.push('Original 24MB target exceeded; visual justification for up to32MB recorded.');
}
if(build.bytes>32000000)misses.push(`32MB ceiling exceeded: ${build.bytes} bytes.`);
if(startup.byteDelta)misses.push(`Exact startup byte parity: ${startup.byteDelta>=0?'+':''}${startup.byteDelta} bytes.`);
if(performance.coldMaxMs>117)misses.push(`Cold-open max ${performance.coldMaxMs}ms exceeds historical117ms ceiling.`);
if(performance.castMaxMs>50)misses.push(`First/repeat cast max ${performance.castMaxMs}ms exceeds50ms.`);
if(performance.castWithin20Min<.99)misses.push(`Cast frame share<=20ms ${performance.castWithin20Min} below.99.`);
const result={at:new Date().toISOString(),source:build.head,artifact:build.sha256,bytes:build.bytes,sourceInputs:Object.keys(build.sourceHashes).length,modelRows,gates,performance,startup,protectedChanges:[],misses,
 inheritedLimits:['L4 strict effect-pair numeric regressions remain open.'],
 unrun:['Final L7 matrix','20-battle lifecycle on final artifact','4x CPU Balanced/Low final timing']};
await writeFile(`${out}/audit.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
