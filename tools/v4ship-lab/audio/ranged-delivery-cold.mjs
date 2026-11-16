/** Compare fresh-process decode with and without monolith priming; no installed edits. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`reports/v4-ship/S11/ranged-delivery-cold-${attempt}.json`);assert(!existsSync(out)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),sign=p=>({path:relative(root,p),sha256:hash(readFileSync(p))});
const input=resolve(root,'reports/v4-ship/S11/ranged-delivery-comparison-2.json'),source=JSON.parse(readFileSync(input));
assert(source.reconstructionPass&&source.reusedCandidateAttempt);
const selected=source.packages.find(p=>p.id==='ember'),file=selected.files.find(f=>f.format==='webm');
const data=ref=>{const b=readFileSync(resolve(root,ref.path));assert.equal(hash(b),ref.sha256);return b.toString('base64');};
const target=data(file),reference=data(selected.reference),primers=source.inputs.filter(p=>p.path.startsWith('apps/web/public/audio/v4-ranged-impacts.')).map(data);
assert.equal(primers.length,2);
const signature=runtimeSignature(root),require=createRequire(resolve(root,'apps/web/package.json')),{webkit}=require('@playwright/test'),rows=[];
const sequence=['unprimed','monolith-prime','monolith-prime','unprimed','monolith-prime','unprimed','unprimed','monolith-prime'];
for(const rate of [48000,44100])for(const [index,method] of sequence.entries()){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));
 const browser=await webkit.launch({headless:true});
 try{
  const page=await browser.newPage(),result=await page.evaluate(async({target,reference,primers,method,rate})=>{
   const decode=async b=>{const context=new OfflineAudioContext(1,1,rate);return context.decodeAudioData(Uint8Array.from(atob(b),c=>c.charCodeAt(0)).buffer);};
   const start=performance.now(),steps=[];let stage='primer';
   try{
    if(method==='monolith-prime')for(const b of primers){await decode(b);steps.push('primer');}
    stage='reference';await decode(reference);steps.push('reference');stage='target';const buffer=await decode(target);steps.push('target');
    return {decoded:true,sampleRate:buffer.sampleRate,channels:buffer.numberOfChannels,frames:buffer.length,steps,elapsedMs:performance.now()-start};
   }catch(error){return {decoded:false,stage,errorName:error.name,errorMessage:String(error.message).slice(0,180),steps,elapsedMs:performance.now()-start};}
  },{target,reference,primers,method,rate});
  rows.push({browser:'webkit',version:browser.version(),rate,index,method,...result});
  writeFileSync(out,JSON.stringify({at:new Date().toISOString(),complete:false,rows},null,2)+'\n');
  console.log(JSON.stringify({rate,index,method,decoded:result.decoded,stage:result.stage}));
 }finally{await browser.close();}
}
assertUnchanged(root,signature);
const summary=['unprimed','monolith-prime'].map(method=>({method,cases:rows.filter(r=>r.method===method).length,decoded:rows.filter(r=>r.method===method&&r.decoded).length}));
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',harness:sign(import.meta.filename),input:sign(input),signature,target:file,reference:selected.reference,rows,summary,complete:true,allFreshProcessCasesDecode:rows.length===16&&rows.every(r=>r.decoded),runtimeChanged:false,overallAudioGatePass:false,limits:['Fresh WebKit browser processes on one shared host; operating-system decoder caches are not reset.','Each condition decodes the same reference WAV and exact failed WebM bytes; only monolith priming differs.','Decode timing is not acoustic onset, network readiness or human listening; the first failed comparison remains preserved.']};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,out),summary,allFreshProcessCasesDecode:report.allFreshProcessCasesDecode}));
