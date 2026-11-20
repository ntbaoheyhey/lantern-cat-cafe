/** Bind the forge preparation checkpoint and retain its unsuccessful methods. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),output=resolve(root,'reports/v4-ship/S11/forge-preparation-review-1.json');assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(resolve(root,p))),signed=p=>({path:p,sha256:hash(readFileSync(resolve(root,p)))});
const verify=r=>{const b=readFileSync(resolve(root,r.path));assert.equal(hash(b),r.sha256);if(r.bytes!==undefined)assert.equal(b.length,r.bytes);return b;};
const paths=['forge-admission-study-1.json','forge-composite-bake-1.json','forge-native-study-1.json','forge-native-replay-1.json'].map(n=>'reports/v4-ship/S11/'+n),[admission,bake,native,replay]=paths.map(read),signature=runtimeSignature(root);
for(const report of [admission,bake,native,replay]){verify(report.harness);for(const r of report.inputs??[])verify(r);assert.deepEqual(report.signature,signature);if(report.raw)verify(report.raw);}
verify(bake.source);verify(bake.patch);verify(bake.licenses);for(const c of bake.comparisons)verify(c.artifact);
assert.equal(admission.methods[0].baselineMismatches,0);assert.deepEqual(admission.methods.map(m=>[m.completeWindows,m.voice.played,m.success.played]),[[3,1,5],[5,2,6],[5,2,6],[6,3,6]]);
assert.equal(bake.pass,false);assert.equal(native.pass,false);assert.equal(replay.replayPass,true);
const rows=JSON.parse(gunzipSync(verify(replay.raw)));let exact=0,repeatFailures=0;
for(const row of rows){assert.equal(row.inputBytes,bake.source.bytes);assert.equal(row.rows.length,72);for(const r of row.rows){assert(r.durationMs<=300);if(r.repeatGraphError>1e-7)repeatFailures++;for(const p of r.outputs){assert.equal(p.maxAbsoluteError,0);exact++;}}}
assert.equal(exact,576);assert(repeatFailures>0);
const regPath='reports/v4-ship/S11/forge-admission-regression-1/check.json',reg=read(regPath);verify(reg.log);assert(reg.complete);
assert.deepEqual(Object.fromEntries(reg.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
const text=path=>gunzipSync(readFileSync(resolve(root,path))).toString().split('\n').filter(Boolean).map(JSON.parse);
const failures=rows=>rows.filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n').filter(l=>l.includes(' FAIL ')).map(l=>l.trim());
const current=text(reg.log.path),previous=text('reports/v4-ship/S11/palette-coverage-regression-1/log.jsonl.gz');assert.equal(failures(current).length,7);assert.deepEqual(failures(current),failures(previous));
const parity='reports/v4-ship/S11/forge-admission-regression-1/parity-probe.json';assert.deepEqual(read(parity).rows,read('reports/v4-ship/S11/palette-coverage-regression-1/parity-probe.json').rows);
const testSummaries=['server','rules','web'].map(name=>({name,lines:current.filter(r=>r.name===name).map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n').filter(l=>/\bTests\s/.test(l)).map(l=>l.trim())}));
const report={at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[...paths,regPath,parity].map(signed),runtimeFiles:signature.length,runtimeUnchanged:true,admissionObservedBaselineReproduced:true,proposedBothCompositeWindows:6,
 rejectedEncodingRetained:true,originalNativeRepeatFailureRetained:true,nativeExactReplayComparisons:exact,repeatGraphThresholdFailures:repeatFailures,
 regression:{sameSevenArtFailures:true,threeParityRowsIdentical:true,testSummaries,gRegPass:false,officialClassParityPass:false},qaPriority:'QA-1 MAJOR runbook prerequisites next; native forge runtime not installed.',integrityPass:true,runtimeInstalled:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),integrityPass:true,testSummaries,exactReplayComparisons:exact,repeatGraphThresholdFailures:repeatFailures}));
