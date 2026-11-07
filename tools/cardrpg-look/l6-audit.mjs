// Bind the delivered art, offline artifacts, source gates and phase measurements.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const out='reports/cardrpg-look/validation/l6';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=async path=>JSON.parse(await readFile(path));
const manifestBytes=await readFile('apps/web/src/game/cardrpg/look-assets.json');
const manifest=JSON.parse(manifestBytes),delivery=await json('reports/cardrpg-look/rounds/art/delivery.json');
assert.equal(manifest.complete,true);assert.equal(manifest.version,2);assert.equal(manifest.phase,'L6');
assert.equal(hash(manifestBytes),delivery.manifestSha256);
assert.equal(Object.keys(manifest.portraits).length,12);assert.equal(Object.keys(manifest.skills).length,48);assert.equal(Object.keys(manifest.frames).length,4);
for(const [path,info] of Object.entries(delivery.files)){const bytes=await readFile(path);assert.equal(hash(bytes),info.sha256,path);assert.equal(bytes.length,info.bytes,path)}
for(const entry of Object.values(manifest.atlases))assert.equal(hash(await readFile(entry.file)),entry.sha256);
for(const row of Object.values(manifest.portraits))assert.equal(hash(await readFile(row.portrait.renderSource)),row.portrait.modelSha256);
const gallery=await json('reports/cardrpg-look/rounds/art/gallery-build.json');
assert.equal(hash(await readFile('docs/cardrpg-look/art.html')),gallery.sha256);assert.equal(gallery.manifestSha256,hash(manifestBytes));
const browser=await json(`${out}/art-browser/checks.json`);
assert.equal(browser.artifact,gallery.sha256);assert.equal(browser.manifest,hash(manifestBytes));assert.equal(browser.rows.length,3);
for(const row of browser.rows){assert.equal(row.images.length,72);assert.equal(row.before,true);assert.equal(row.restored,true);assert.equal(row.overflow,false);assert.deepEqual(row.errors,[]);assert.deepEqual(row.requests,[])}
const build=await json('docs/cardrpg-look/build.json'),bytes=await readFile('docs/cardrpg-look/index.html');
assert.equal(hash(bytes),build.sha256);assert.equal(bytes.length,build.bytes);assert.equal(build.runtimeDirty,false);
const runtimePortraits=[];
for(const width of [1024,1280,1440])for(const dpr of [1,2]){
 const row=await json(`${out}/portraits-${width}-dpr${dpr}/checks.json`);
 assert.equal(row.artifactSha256,build.sha256);assert.equal(row.manifestSha256,hash(manifestBytes));
 assert.equal(row.passed,true);assert.deepEqual(row.errors,[]);assert.deepEqual(row.remote,[]);
 for(const mode of ['off','on'])assert.equal(row.portraits.filter(p=>p.screen==='collection'&&p.mode===mode).length,12);
 assert.equal(row.toggles.length,4);assert(row.toggles.every(r=>r.preservedState));
 runtimePortraits.push({width,dpr,images:row.portraits.length});
}
for(const [path,expected] of Object.entries(build.sourceHashes))assert.equal(hash(await readFile(path)),expected,path);
assert(bytes.length<=32000000);
if(bytes.length>24000000){
 const justification=await json(`${out}/size-justification.json`);
 assert.equal(justification.artifact,build.sha256);assert.equal(justification.bytes,bytes.length);
 assert.equal(justification.maximumAuthorizedBytes,32000000);assert(justification.visualEvidence.length>=3);
 for(const path of justification.visualEvidence)assert((await readFile(path)).length>0,path);
}
const gates=await json(`${out}/source-gates.json`);assert.deepEqual(gates.map(r=>r.name),['typecheck','lint','unit','build','e2e']);
for(const row of gates){assert.equal(row.code,0,row.name);row.logSha256=hash(await readFile(row.log))}
const performance=await json(`${out}/measurement-summary.json`);
assert.equal(performance.artifact,build.sha256);assert.equal(performance.coldRuns,7);assert.equal(performance.castWindows,24);assert.deepEqual(performance.errors,[]);
const flag=await json(`${out}/flag-off/checks.json`),baseline=await json('reports/cardrpg-look/validation/flag-off/checks.json');
for(const key of ['prohibitedModules','modelRequests','errors'])assert.deepEqual(flag[key],[]);
const modules=data=>[...new Set(data.chunks.flatMap(row=>row.modules))].sort();assert.deepEqual(modules(flag),modules(baseline));
const startup={bytes:flag.chunks.reduce((n,r)=>n+r.bytes,0),baselineBytes:baseline.chunks.reduce((n,r)=>n+r.bytes,0),scripts:flag.chunks.length,threeAndModelModules:0};
startup.byteDelta=startup.bytes-startup.baselineBytes;
const misses=[];
if(bytes.length>24000000)misses.push('Original24MB target exceeded; explicit up-to32MB visual justification recorded.');
if(startup.byteDelta)misses.push(`Exact startup byte parity: ${startup.byteDelta>=0?'+':''}${startup.byteDelta} bytes.`);
if(performance.coldMaxMs>50)misses.push(`Cold-open max ${performance.coldMaxMs}ms exceeds50ms; inspect phase cold traces.`);
if(performance.castMaxMs>50)misses.push(`First/repeat cast max ${performance.castMaxMs}ms exceeds50ms.`);
if(performance.castWithin20Min<.99)misses.push(`Cast frame share<=20ms ${performance.castWithin20Min} below.99.`);
const result={source:build.head,artifact:build.sha256,bytes:bytes.length,sourceInputs:Object.keys(build.sourceHashes).length,
 artCounts:{portraits:12,skills:48,frames:4},individualArtBytes:delivery.individualBytes,
 browserArtifact:browser.artifact,runtimePortraits,startup,performance,gates,misses,
 inheritedLimits:['L4 strict effect-pair numeric regressions remain open.','Nine model sculptures awaitL5.'],
 unrun:['Final L7 matrix','20-battle lifecycle on final artifact','4x CPU Balanced/Low final timing']};
await writeFile(`${out}/audit.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
