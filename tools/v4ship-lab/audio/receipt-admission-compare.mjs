/** Counterfactual replay of measured admission attempts; never acceptance evidence. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const input=process.argv[3]??'reports/v4-ship/S11/audio-journey-1.events.json.gz';
const output=resolve(root,`reports/v4-ship/S11/audio-receipt-admission-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const bytes=readFileSync(resolve(root,input)),data=JSON.parse(gunzipSync(bytes));
const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json')));
const receiptRequests=data.requests.filter(r=>r.id==='tx.confirmed'&&r.receipt!==null);
const lower=Math.min(...receiptRequests.map(r=>r.audioTime))-.2,upper=Math.max(...receiptRequests.map(r=>r.audioTime))+.2;
const operations=[];
for(const request of data.requests){
 const result=data.results.find(r=>r.request===request.sequence&&(['played','rate-limit'].includes(r.result)||request.id==='tx.confirmed'&&r.result==='cooldown'));
 if(!result||result.audioTime<lower||result.audioTime>upper)continue;
 const starts=data.starts.filter(s=>s.request===request.sequence),first=Math.min(...starts.map(s=>s.when));
 const at=Number.isFinite(first)?first:result.audioTime;
 const design=manifest.designs[request.id];
 const offsets=starts.length?starts.map(s=>s.when-at):design?.baked?[0]:design?.layers.map(l=>l.offsetMs/1000)??[0];
 operations.push({sequence:request.sequence,id:request.id,receipt:request.receipt,at,offsets,observed:result.result});
}
// Any bed starts in this small transaction window retain their observed times.
for(const start of data.starts)if(start.request===null&&start.when>=lower-.1&&start.when<=upper)
 operations.push({sequence:null,id:start.id,receipt:null,at:start.when,offsets:[0],observed:'played',fixed:true});
operations.sort((a,b)=>a.at-b.at||(a.sequence??-1)-(b.sequence??-1));
function peak(times){
 const sorted=times.slice().sort((a,b)=>a-b);let left=0,max=0;
 for(let right=0;right<sorted.length;right++){
  while(sorted[right]-sorted[left]>=.1-1e-9)left++;
  max=Math.max(max,right-left+1);
 }return max;
}
function run(name,{bake=false,guestWallet=false,queue=false,distinctReceipts=false}={}){
 let admitted=[];const rows=[];
 for(const op of operations){
  if(guestWallet&&op.id==='tx.wallet'){rows.push({...op,result:'no-external-wallet-prompt',delayMs:0});continue;}
  if(op.observed==='cooldown'&&!distinctReceipts){rows.push({...op,result:'cooldown',delayMs:0});continue;}
  const offsets=bake&&op.id==='tx.confirmed'?[0]:op.offsets;
  let at=op.at;admitted=admitted.filter(t=>t>at-.1);
  let pass=peak([...admitted,...offsets.map(o=>at+o)])<=6;
  if(!pass&&queue&&op.id==='tx.confirmed'){
   // Counterfactual minimum availability, with the runtime's one-ms margin.
   for(let i=0;i<100&&!pass;i++){
    at=Math.min(...admitted.filter(t=>t+.101>at))+.101;
    admitted=admitted.filter(t=>t>at-.1);
    pass=peak([...admitted,...offsets.map(o=>at+o)])<=6;
   }
  }
  if(pass)admitted.push(...offsets.map(o=>at+o));
  rows.push({...op,result:pass?'played':'rate-limit',offsets,delayMs:(at-op.at)*1000,at});
 }
 const receipts=rows.filter(r=>r.id==='tx.confirmed'),played=receipts.filter(r=>r.result==='played');
 const times=rows.filter(r=>r.result==='played').flatMap(r=>r.offsets.map(o=>r.at+o));
 return {name,receipts:receipts.length,played:played.length,dropped:receipts.filter(r=>r.result!=='played').map(r=>r.receipt),maxStartsPer100ms:peak(times),maximumReceiptSchedulingDelayMs:Math.max(0,...played.map(r=>r.delayMs)),mismatches:rows.filter(r=>r.result!==r.observed).map(r=>({request:r.sequence,id:r.id,observed:r.observed,replay:r.result})),rows};
}
const baseline=run('observed layered confirmation');
assert.equal(baseline.mismatches.length,0,'Baseline must reproduce every observed admission outcome in the transaction window');
const methods=[baseline,run('single-source pre-rendered confirmation',{bake:true}),run('wallet prompt only for external signing',{guestWallet:true}),run('both pre-rendered confirmation and external-wallet semantics',{bake:true,guestWallet:true}),run('composite and external wallet; each distinct receipt eligible',{bake:true,guestWallet:true,distinctReceipts:true}),run('queue confirmation until budget permits',{queue:true,distinctReceipts:true})];
const report={at:new Date().toISOString(),input,inputSha256:createHash('sha256').update(bytes).digest('hex'),scope:'Counterfactual source-admission replay of measured transaction attempts. Includes confirmed receipts suppressed by cue cooldown; the distinct-receipt method admits each of these subject to the unchanged six-source ceiling. Other cooldown/locked/priority outcomes are held fixed. Method selection only, not runtime, onset, mix or coverage proof.',intervalSeconds:[lower,upper],operations:operations.length,methods,productionChanged:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:relative(root,output),methods:methods.map(({rows,mismatches,...m})=>({...m,mismatches:mismatches.length}))}));
