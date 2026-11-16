/** Observe selected healer samples through the unchanged real engine. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`reports/v4-ship/S11/healer-source-probe-${attempt}.json`),raw=out.replace('.json','.events.json.gz');
assert(!existsSync(out)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const signature=runtimeSignature(root),sha=b=>createHash('sha256').update(b).digest('hex');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});let data;
try{
 const page=await browser.newPage();
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__healer-source')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Healer source observation</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});
 await prepareJourneyAudio(page);await page.goto('http://127.0.0.1:5995/__healer-source');
 await page.evaluate(async()=>{const {AudioEngine}=await import('/src/audio/engine.ts');window.__thAudio=new AudioEngine(()=>.5);await window.__thAudio.unlock();await window.__thAudio.preload('battle');});
 await observeJourneyAudio(page);
 data=await page.evaluate(async()=>{
  const e=window.__thAudio,admissions=[];
  for(let i=0;i<12;i++){e.play('heal.medium');admissions.push(...[...e.active].filter(p=>p.id==='heal.medium').map(p=>({group:p.group,priority:p.priority})));await new Promise(r=>setTimeout(r,180));}
  const result={...window.__journeyAudio,hits:e.hits,settings:e.settings,admissions};e.stop();await e.ctx.close();return result;
 });
}finally{await browser.close();}
assertUnchanged(root,signature);
const requests=data.requests.filter(r=>r.id==='heal.medium'),rows=requests.map(r=>{
 const starts=data.starts.filter(s=>s.request===r.sequence&&!s.loop);
 const priorities=starts.map(s=>data.admissions.find(p=>p.group===s.group)?.priority);
 return {request:r.sequence,actualSources:starts.length,variants:starts.map(s=>s.variantId),priorities,
  durationsMs:starts.map(s=>s.duration/s.rate*1000),pass:starts.length===1&&starts.every(s=>/maximize_(001|003|005|006):/.test(s.variantId))&&priorities.every(p=>p===60)};
});
const bytes=gzipSync(JSON.stringify(data));writeFileSync(raw,bytes);
const report={at:new Date().toISOString(),scope:'Twelve isolated seeded playback requests through the real engine, existing published packs and actual source.start; no mix, physical-onset or human acceptance.',signature,
 harness:{path:relative(root,import.meta.filename),sha256:sha(readFileSync(import.meta.filename))},events:{path:relative(root,raw),sha256:sha(bytes)},
 rows,uniqueVariants:[...new Set(rows.flatMap(r=>r.variants))],pass:rows.length===12&&rows.every(r=>r.pass),physicalOnsetVerified:false,humanListeningVerified:false};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({requests:rows.length,variants:report.uniqueVariants.length,pass:report.pass}));if(!report.pass)process.exitCode=1;
