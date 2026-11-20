/** Compare source designs with the real reservation method and a controlled clock; no playback claim. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-admission-comparison-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');
assert(!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),signature=runtimeSignature(root);
const source='reports/v4-ship/S11/ranged-timing-comparison-1.json',timing=JSON.parse(readFileSync(resolve(root,source)));
const manifest=JSON.parse(readFileSync(resolve(root,'apps/web/public/audio/manifest.json')));
const cases=[...new Map(timing.rows.map(r=>[r.owner+':'+r.ultimate,{owner:r.owner,ultimate:r.ultimate,launchMs:r.scheduleMs.retimedFlight,impactMs:r.unchangedImpactMs}])).values()];
assert.equal(cases.length,4);
const designs={};for(const element of ['ember','heavy'])for(const phase of ['charge','release','impact','tail'])designs[`${element}.${phase}`]=manifest.designs[`kit.${element}.${phase}`].layers.map(l=>l.offsetMs/1000);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});let rows;
try{
 const page=await browser.newPage();
 await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/__ranged-admission')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Ranged source admission comparison</title>'});return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();});
 await page.goto('http://127.0.0.1:5995/__ranged-admission');
 rows=await page.evaluate(async({cases,designs})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),rows=[];
  const methods=[
   {name:'existing-layered-release-and-single-travel',launch:3,travel:true,impact:4,tail:true},
   {name:'separate-single-source-launch-and-travel',launch:1,travel:true,impact:4,tail:true},
   {name:'single-source-flight-composite',launch:1,travel:false,impact:4,tail:true},
   {name:'separate-flight-with-baked-impact',launch:1,travel:true,impact:1,tail:true},
   {name:'separate-flight-baked-impact-with-contained-tail',launch:1,travel:true,impact:1,tail:false},
  ];
  for(const c of cases)for(const speed of [1,2,3])for(const death of [false,true])for(const framePhaseMs of [0,4,8,12])for(const method of methods){
   const engine=new AudioEngine(()=>.5);let now=10;
   // Exercise the actual engine function, with no AudioContext, source playback, or synthetic sound samples.
   engine.ctx={get currentTime(){return now;}};
   const element=c.owner==='soot'?'ember':'heavy',frame=ms=>Math.ceil((ms/speed+framePhaseMs)/(1000/60))*(1000/60)/1000;
   const operations=[],add=(role,at,offsets)=>operations.push({role,at:10+frame(at),offsets});
   if(c.ultimate){add('charge-voice',0,[0]);add('charge',600,designs[`${element}.charge`]);}
   add('launch',c.launchMs,method.launch===3?designs[`${element}.release`]:[0]);
   if(method.travel)add('travel',(c.launchMs+c.impactMs)/2,[0]);
   add('impact',c.impactMs,method.impact===4?designs[`${element}.impact`]:[0]);
   if(death)add('death',c.impactMs,[0]);
   if(c.ultimate&&method.tail)add('extra-tail',c.impactMs+200,designs[`${element}.tail`]);
   operations.sort((a,b)=>a.at-b.at);
   const starts=[];
   for(const op of operations){now=op.at;const at=engine.reserveStarts(op.offsets);op.admitted=at!==undefined;if(op.admitted)starts.push(...op.offsets.map(offset=>at+offset));}
   starts.sort((a,b)=>a-b);let peak=0,left=0;
   for(let right=0;right<starts.length;right++){while(starts[right]-starts[left]>=.1-1e-9)left++;peak=Math.max(peak,right-left+1);}
   rows.push({...c,speed,death,framePhaseMs,method:method.name,operations,peak,allAdmitted:operations.every(op=>op.admitted),dropped:operations.filter(op=>!op.admitted).map(op=>op.role)});
  }
  return rows;
 },{cases,designs});
}finally{await browser.close();}
assertUnchanged(root,signature);assert.equal(rows.length,480);assert(rows.every(r=>r.peak<=6));
const summary=[...new Set(rows.map(r=>r.method))].map(method=>({method,speeds:[1,2,3].map(speed=>{
 const selected=rows.filter(r=>r.method===method&&r.speed===speed),terminal=selected.filter(r=>r.death);
 return {speed,cases:selected.length,allAdmitted:selected.filter(r=>r.allAdmitted).length,terminalCases:terminal.length,terminalAllAdmitted:terminal.filter(r=>r.allAdmitted).length,
  droppedRoles:[...new Set(selected.flatMap(r=>r.dropped))],peak:Math.max(...selected.map(r=>r.peak))};
})}));
const bytes=gzipSync(JSON.stringify(rows));writeFileSync(raw,bytes);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,
 scope:'Actual AudioEngine.reserveStarts with a controlled clock and proposed source offsets. Four observed fixed actions, 1x/2x/3x, with/without terminal speech and four 60Hz frame phases. No AudioContext or samples are played. Composites are source-count designs only, not implemented audio.',
 inputs:[signed(source),signed('apps/web/public/audio/manifest.json')],harness:signed(relative(root,import.meta.filename)),rows:{path:relative(root,raw),sha256:hash(bytes)},cases,summary,
 limitations:['An isolated action omits neighbouring actions, scene-bed transitions, ambient UI, status cues and barks. Full battle admission must be measured after implementation.','Four-layer impact composites and their contained tails have not been rendered or heard. No timbre, duration, mix, coverage or physical-onset conclusion follows.','The measured paint times describe the current production layered renderer; scheduled ART integration may change them.'],runtimeChanged:false,actualSourceStartsMeasured:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),summary}));
