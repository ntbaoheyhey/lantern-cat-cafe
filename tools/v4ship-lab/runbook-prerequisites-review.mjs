/** Bind the names-only QA fix to source, its historical runbook and the regression. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature} from '../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'reports/v4-ship/S11/qa-prerequisites-review-1.json');
assert(!existsSync(out)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(resolve(root,p))),signed=p=>({path:p,sha256:hash(readFileSync(resolve(root,p)))});
const verify=r=>assert.equal(hash(readFileSync(resolve(root,r.path))),r.sha256);
const beforePath='reports/v4-ship/S11/qa-prerequisites-1.json',afterPath='reports/v4-ship/S11/qa-prerequisites-2.json';
const before=read(beforePath),after=read(afterPath);
for(const report of [before,after]){verify(report.harness);report.inputs.forEach(verify);assert(report.pass);assert.equal(report.comparison.lexical.calls,60);assert.equal(report.comparison.ast.calls,60);assert(report.comparison.identicalLocations);}
assert.equal(hash(execFileSync('git',['show',`${before.sourceCommit}:${before.book.path}`],{cwd:root})),before.book.sha256);
verify(after.book);assert.equal(before.checks.qaNames,0);assert.equal(after.checks.qaNames,4);
assert(after.checks.allNinePrerequisitesInTable&&after.checks.allLocalLinksResolve&&after.checks.classified&&after.checks.exactFallbacksVerified);
assert.deepEqual(before.inputs,after.inputs);assert.deepEqual(before.fallbacks,after.fallbacks);
const signature=runtimeSignature(root);assert.deepEqual(signature,read('reports/v4-ship/S11/forge-native-replay-1.json').signature);
const regPath='reports/v4-ship/S11/qa-prerequisites-regression-1/check.json',reg=read(regPath);verify(reg.log);assert(reg.complete);
assert.deepEqual(Object.fromEntries(reg.rows.map(r=>[r.name,r.exitCode])),{server:0,rules:0,web:1,typecheck:0,'parity-probe':0,build:0});
const log=path=>gunzipSync(readFileSync(resolve(root,path))).toString().trim().split('\n').map(JSON.parse);
const lines=(rows,name)=>rows.filter(r=>r.name===name).map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n');
const failures=rows=>lines(rows,'web').filter(l=>l.includes(' FAIL ')).map(l=>l.trim());
const current=log(reg.log.path),previous=log('reports/v4-ship/S11/forge-admission-regression-1/log.jsonl.gz');
assert.equal(failures(current).length,7);assert.deepEqual(failures(current),failures(previous));
const parityPath='reports/v4-ship/S11/qa-prerequisites-regression-1/parity-probe.json';
assert.deepEqual(read(parityPath).rows,read('reports/v4-ship/S11/forge-admission-regression-1/parity-probe.json').rows);
const testSummaries=['server','rules','web'].map(name=>({name,lines:lines(current,name).filter(l=>/\bTests\s/.test(l)).map(l=>l.trim())}));
const report={at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[beforePath,afterPath,regPath,parityPath].map(signed),
 qaFinding:'QA-1',historicalBeforeBound:true,currentAfterBound:true,sourceFallbacksUnchanged:true,missingNamesBefore:4,missingNamesAfter:0,prerequisitesDocumented:9,
 runtimeUnchanged:true,runtimeFiles:signature.length,regression:{sameSevenArtFailures:true,threeParityRowsIdentical:true,testSummaries,gRegPass:false,officialClassParityPass:false},
 sourceDocumentationFixVerified:true,independentQaRetestPending:true,hostedConfigurationVerified:false,secretValuesRead:false,deploymentPerformed:false};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,out),sourceDocumentationFixVerified:true,testSummaries,independentQaRetestPending:true}));
