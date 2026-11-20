/** Independently bind stored bytes, original Git objects and exact restoration. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..'),mode=process.argv[2],attempt=process.argv[3];
assert(['prepared','installed'].includes(mode)&&/^\d+$/.test(attempt));
assert(!existsSync(resolve(root,'STOP-V4SHIP')));
const output=resolve(root,`reports/v4-ship/S11/evidence-archive-review-${attempt}.json`);
assert(!existsSync(output));
const sha=data=>createHash('sha256').update(data).digest('hex');
const ref=path=>({path,sha256:sha(readFileSync(resolve(root,path)))});
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const manifestPath='reports/v4-ship/S11/evidence-archive-1.json',manifest=read(manifestPath);
assert.equal(manifest.sourceCommit,'1ff998a8d28562ac58c0bf5b2104066088cda22a');
assert.equal(manifest.codec,'gzip');assert.equal(manifest.files.length,37);
const study=read(manifest.study.path);assert.equal(sha(readFileSync(resolve(root,manifest.study.path))),manifest.study.sha256);
assert(study.allExact);assert.equal(study.rows.length,37);
const restored=resolve(root,`work/v4ship-prep/evidence-archive-restore-${attempt}`);assert(!existsSync(restored));
const args=['tools/v4ship-lab/evidence-archive.py','restore','--destination',restored];if(mode==='prepared')args.push('--prepared');
const restoreResult=JSON.parse(execFileSync('/opt/homebrew/bin/python3.12',args,{cwd:root,encoding:'utf8'}));
assert.equal(restoreResult.files,37);assert.equal(restoreResult.bytes,5558103);
const identities=new Set(),rows=[];
for(const row of manifest.files){
 const name=row.original.path;assert.match(name,/^reports\/v4-ship\/S11\/[a-z0-9-]*regression[a-z0-9-]*\/parity-probe\.json$/);
 assert(!identities.has(name));identities.add(name);
 assert.equal(row.stored.path,name+'.gz');
 const selected=mode==='prepared'?row.candidate:row.stored,path=resolve(root,selected.path),encoded=readFileSync(path);
 assert.equal(encoded.length,selected.bytes);assert.equal(sha(encoded),selected.sha256);
 const decoded=gunzipSync(encoded);assert.equal(decoded.length,row.original.bytes);assert.equal(sha(decoded),row.original.sha256);
 const external=execFileSync('gzip',['-dc',path],{maxBuffer:1024*1024});assert(external.equals(decoded),'System gzip differs');
 const blob=execFileSync('git',['rev-parse',manifest.sourceCommit+':'+name],{cwd:root,encoding:'utf8'}).trim();assert.equal(blob,row.gitBlob);
 assert(execFileSync('git',['cat-file','blob',blob],{cwd:root,maxBuffer:1024*1024}).equals(decoded),'Original Git bytes differ');
 assert(readFileSync(resolve(restored,name)).equals(decoded),'Restored bytes differ');
 if(mode==='prepared')assert(readFileSync(resolve(root,name)).equals(decoded),'Current original differs');
 else assert(!existsSync(resolve(root,name)),'Raw duplicate remains');
 const measured=study.rows.find(r=>r.path===name);assert(measured);assert.equal(measured.sha256,row.original.sha256);
 for(const method of measured.methods){
  const data=readFileSync(resolve(root,method.path));assert.equal(data.length,method.bytes);assert.equal(sha(data),method.sha256);
 }
 const parity=JSON.parse(decoded);assert(parity.probePass&&!parity.newBaseline&&!parity.officialClassBaselineApproved);
 rows.push({path:name,bytes:decoded.length,storedBytes:encoded.length,originalGitBytesMatch:true,systemGzipMatches:true,restoredBytesMatch:true});
}
assert.deepEqual([...identities].sort(),study.rows.map(r=>r.path).sort());
assert.equal(rows.reduce((s,r)=>s+r.bytes,0),manifest.rawBytes);assert.equal(rows.reduce((s,r)=>s+r.storedBytes,0),manifest.storedBytes);
const controls=JSON.parse(execFileSync('/opt/homebrew/bin/python3.12',['tools/v4ship-lab/evidence-archive-controls.py',mode],{cwd:root,encoding:'utf8'}));
assert(controls.pass&&controls.count===19);
const report={at:new Date().toISOString(),mode,pass:true,files:rows.length,rawBytes:manifest.rawBytes,storedBytes:manifest.storedBytes,savedBytes:manifest.rawBytes-manifest.storedBytes,
 manifest:ref(manifestPath),archiveTool:ref('tools/v4ship-lab/evidence-archive.py'),harness:ref(relative(root,import.meta.filename)),controlHarness:ref('tools/v4ship-lab/evidence-archive-controls.py'),
 study:ref(manifest.study.path),restore:{path:relative(root,restored),...restoreResult},controls,rows,
 historicalSignaturesRewritten:false,officialClassBaselineApproved:false,gateAcceptanceChanged:false,
 limits:['Original references identify decoded bytes; archived paths require catalogue lookup or explicit restoration.','Historical verifier inputs can be restored into a separate replay checkout; no source or failure result is rewritten.','G-REG and other shipping gates retain their existing failures.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,files:rows.length,savedBytes:report.savedBytes,controls:controls.count,pass:true}));
