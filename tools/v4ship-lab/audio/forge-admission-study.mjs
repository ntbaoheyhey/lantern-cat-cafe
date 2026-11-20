/** Compare unchanged admission with complete forge composites; no playback claim. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/forge-admission-study-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const signature=runtimeSignature(root),input='reports/v4-ship/S5/palette-coverage-1/forge-events.json.gz';
const data=JSON.parse(gunzipSync(readFileSync(resolve(root,input)))),manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json')));
const anchors=data.requests.filter(r=>r.id==='ui.forge.hammer');assert.equal(anchors.length,6);
const windows=anchors.map((anchor,index)=>{
 const requests=data.requests.filter(r=>Math.abs(r.performanceMs-anchor.performanceMs)<150);
 const operations=requests.map((request,sequence)=>{
  const starts=data.starts.filter(s=>s.request?.id===request.id&&s.request?.performanceMs===request.performanceMs);
  const matches=data.hits.filter(h=>h.id===request.id&&h.at>=request.wallMs&&h.at-request.wallMs<=50);
  const results=[...new Set(matches.filter(h=>h.result!=='played').map(h=>h.result))];
  assert(starts.length||results.length===1,'Missing or ambiguous result');
  const observed=starts.length?'played':results[0],design=manifest.designs[manifest.bindings?.[request.id]??request.id];
  const offsets=design?.baked?[0]:design?.layers.map(l=>l.offsetMs/1000)??[0];
  const at=starts.length?starts[0].when-starts[0].delay:request.audioTime;
  if(starts.length){assert.equal(starts.length,offsets.length);starts.forEach((s,i)=>assert(Math.abs(s.when-at-offsets[i])<1e-8));}
  return {sequence,id:request.id,performanceMs:request.performanceMs,at,offsets,observed,actualStarts:starts.length};
 });
 const lower=Math.min(...operations.map(r=>r.at));
 const leading=data.starts.filter(s=>s.when>=lower-.1&&s.when<lower&&!requests.some(r=>r.performanceMs===s.request?.performanceMs));
 assert.equal(leading.length,0,'Unexpected preceding starts require explicit replay');
 return {index,operations};
});
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.route('**/*',route=>{
  const u=new URL(route.request().url());if(u.pathname==='/__forge-admission')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Forge admission study</title>'});
  return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();
 });await page.goto('http://127.0.0.1:5995/__forge-admission');
 const methods=await page.evaluate(async windows=>{
  const {AudioEngine}=await import('/src/audio/engine.ts');
  const definitions=[['current',[]],['hammer-composite',['ui.forge.hammer']],['success-composite',['ui.forge.success']],['both-composites',['ui.forge.hammer','ui.forge.success']]];
  function peak(times){let max=0;for(const t of times)max=Math.max(max,times.filter(x=>x>=t&&x-t<.1-1e-9).length);return max;}
  return definitions.map(([name,baked])=>{
   const rows=windows.map(window=>{
    let now=0;const e=new AudioEngine(()=>.5);e.ctx={get currentTime(){return now;}};const starts=[],operations=[];
    for(const op of window.operations){
     now=op.at;if(!['played','rate-limit'].includes(op.observed)){operations.push({...op,result:op.observed,heldFixed:true});continue;}
     const offsets=baked.includes(op.id)?[0]:op.offsets,at=e.reserveStarts(offsets),pass=at!==undefined;
     const independent=peak([...starts,...offsets.map(o=>now+o)])<=6;if(pass!==independent)throw Error('Independent window enumeration disagrees');
     if(pass){if(at!==now)throw Error('Cue delayed');starts.push(...offsets.map(o=>at+o));}
     operations.push({...op,offsets,result:pass?'played':'rate-limit',delayMs:pass?(at-op.at)*1000:null});
    }
    return {index:window.index,operations,maxStartsPer100ms:peak(starts),allAdmitted:operations.every(o=>o.heldFixed||o.result==='played')};
   });
   const operations=rows.flatMap(r=>r.operations),count=id=>({requests:operations.filter(o=>o.id===id).length,played:operations.filter(o=>o.id===id&&o.result==='played').length});
   return {name,completeWindows:rows.filter(r=>r.allAdmitted).length,windows:rows.length,voice:count('voice.mochi.forge'),success:count('ui.forge.success'),hammer:count('ui.forge.hammer'),maxStartsPer100ms:Math.max(...rows.map(r=>r.maxStartsPer100ms)),baselineMismatches:operations.filter(o=>o.result!==o.observed).length,rows};
  });
 },windows);
 assert.equal(methods[0].baselineMismatches,0);assert.equal(methods[0].voice.played,1);assert.equal(methods[0].success.played,5);
 assert(methods.every(m=>m.maxStartsPer100ms<=6));assertUnchanged(root,signature);
 const report={at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),inputs:[signed(input),signed('apps/web/public/audio/manifest.json')],signature,methods,
  scope:'Actual unchanged reserveStarts with controlled observed operation clocks; independent exhaustive window enumeration. Cooldown results remain fixed. Composites are source-count alternatives only, not rendered or played.',
  baselineAllObservedAdmissionResultsReproduced:true,runtimeChanged:false,actualSourceStartsMeasured:false,physicalOnsetVerified:false,overallAudioGatePass:false};
 writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),methods:methods.map(({rows,...m})=>m)}));
}catch(error){writeFileSync(output,JSON.stringify({at:new Date().toISOString(),failure:error.message,harness:signed(relative(root,import.meta.filename)),runtimeChanged:false},null,2)+'\n');throw error;}
finally{await browser.close();}
