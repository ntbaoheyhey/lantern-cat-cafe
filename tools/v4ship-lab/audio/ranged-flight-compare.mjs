/** Compare bounded flight palettes on identical published samples before runtime installation. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {rangedFlightDesigns} from './ranged-flight-designs.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-flight-compare-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-flight-compare-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path))),signature=runtimeSignature(root);
const bakePath='reports/v4-ship/S11/ranged-class-bake-1.json',bake=read(bakePath),inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),manifest=read('apps/web/public/audio/manifest.json'),patch=read(bake.manifest.path);assert(bake.reconstructionPass);
for(const file of [...bake.files,bake.manifest])assert.equal(hash(readFileSync(resolve(root,file.path))),file.sha256);
const methods=['common-travel','palette-phases','palette-pitch'],designs=Object.fromEntries(methods.map(method=>[method,rangedFlightDesigns(manifest,patch,method)]));
const packs=[...new Set(Object.values(designs).flatMap(ds=>Object.values(ds).flatMap(d=>d.baked?d.baked.map(b=>b.sample.pack):d.layers.flatMap(l=>l.variants.map(v=>v.pack)))))];
const packInputs=packs.map(pack=>{const file=bake.files.find(f=>f.format==='webm'&&f.path.endsWith('/'+pack+'.webm'));return {pack,...signed(file?.path??`apps/web/public/audio/${pack}.webm`)};});
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true});let result;
try{
 const page=await browser.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995')return route.abort();if(u.pathname==='/__ranged-flight-compare')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Ranged flight comparison</title>'});return route.continue();});await page.goto('http://127.0.0.1:5995/__ranged-flight-compare');
 result=await page.evaluate(async({designs,inputs,cases})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),rate=48000,decode=new OfflineAudioContext(1,1,rate),buffers={};for(const [pack,base64]of Object.entries(inputs))buffers[pack]=await decode.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);
  const rows=[],signals=new Map(),previews=[];
  const level=pcm=>{let peak=0,energy=0,first=-1;for(let i=0;i<pcm.length;i++){const a=Math.abs(pcm[i]);peak=Math.max(peak,a);energy+=pcm[i]**2;if(first<0&&a>=1e-4)first=i;}return {rmsDb:10*Math.log10(energy/pcm.length),peakDb:20*Math.log10(peak),firstAboveMinus80DbMs:first<0?null:first/rate*1000};};
  for(const [method,ds]of Object.entries(designs))for(const c of cases)for(const speed of [1,2,3])for(let take=0;take<6;take++){
   const duration=2.3/speed,ctx=new OfflineAudioContext(1,Math.ceil(duration*rate),rate),e=new AudioEngine(()=>.5);e.ctx=ctx;e.rate=speed;e.buses.set('sfx',ctx.destination);const phases=[];
   for(const [phase,t]of [['release',c.launchMs],['travel',c.travelMs],['impact',c.impactMs]]){
    const d=ds[`kit.ranged-${c.element}.${phase}`],pitch=(d.pitchRange[0]+d.pitchRange[1])/2,layer=d.baked?null:d.layers[0],sample=d.baked?d.baked[take*6+take].sample:layer.variants[take%layer.variants.length],gainDb=-4+(layer?layer.gainDb+1:0);
    const start=t/speed/1000;e.start(`kit.ranged-${c.element}.${phase}`,buffers[sample.pack],sample,d.priority,pitch,10**(gainDb/20),0,layer?.eq??'flat',phases.length+1,start);
    phases.push({phase,startMs:start*1000,durationMs:sample.duration/pitch/speed*1000,pitch,variantId:sample.variantId,pack:sample.pack});
   }
   const pcm=(await ctx.startRendering()).getChannelData(0),key=[method,c.owner,speed,take].join(':');signals.set(key,pcm);rows.push({method,owner:c.owner,element:c.element,speed,take,phases,...level(pcm)});
   if(take===0&&speed===1){const bytes=new Uint8Array(pcm.buffer),chunks=[];for(let i=0;i<bytes.length;i+=32768)chunks.push(String.fromCharCode(...bytes.subarray(i,i+32768)));previews.push({method,owner:c.owner,pcmBase64:btoa(chunks.join(''))});}
  }
  const pairs=[];for(const method of Object.keys(designs))for(const speed of [1,2,3])for(let take=0;take<6;take++)for(let i=0;i<cases.length;i++)for(let j=i+1;j<cases.length;j++){
   const a=signals.get([method,cases[i].owner,speed,take].join(':')),b=signals.get([method,cases[j].owner,speed,take].join(':'));let aa=0,bb=0,ab=0;for(let k=0;k<a.length;k++){aa+=a[k]**2;bb+=b[k]**2;ab+=a[k]*b[k];}pairs.push({method,speed,take,owners:[cases[i].owner,cases[j].owner],correlation:ab/Math.sqrt(aa*bb)});
  }
  return {rows,pairs,previews};
 },{designs,inputs:Object.fromEntries(packInputs.map(p=>[p.pack,readFileSync(resolve(root,p.path)).toString('base64')])),cases:inventory.rows.filter(r=>r.side==='party'&&!r.ultimate)});
}finally{await browser.close();}
assert.equal(result.rows.length,216);assert.equal(result.pairs.length,324);
const summaries=methods.map(method=>{const rows=result.rows.filter(r=>r.method===method),pairs=result.pairs.filter(r=>r.method===method);return {method,cases:rows.length,heroPairs:pairs.length,maxAbsolutePairCorrelation:Math.max(...pairs.map(p=>Math.abs(p.correlation))),sorrelVelvetMaxCorrelation:Math.max(...pairs.filter(p=>p.owners.includes('sorrel')&&p.owners.includes('velvet')).map(p=>p.correlation)),maxPeakDb:Math.max(...rows.map(r=>r.peakDb)),finiteNonSilent:rows.every(r=>Number.isFinite(r.rmsDb)&&r.peakDb>-80),signalDistinction:pairs.every(p=>Math.abs(p.correlation)<.95)};});
const selected=summaries.find(s=>s.finiteNonSilent&&s.signalDistinction)?.method??null;
const previews=result.previews.map(p=>{const path=resolve(folder,`${p.method}-${p.owner}.f32`);writeFileSync(path,Buffer.from(p.pcmBase64,'base64'));return {method:p.method,owner:p.owner,...signed(relative(root,path))};});
if(selected)writeFileSync(resolve(folder,'manifest-patch.json'),JSON.stringify({...patch,designs:designs[selected]},null,2)+'\n');
writeFileSync(raw,gzipSync(JSON.stringify({rows:result.rows,pairs:result.pairs})));assertUnchanged(root,signature);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,inputs:[signed(bakePath),signed(inventoryPath),...packInputs],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/ranged-flight-designs.mjs')],summaries,selectedMethod:selected,candidate:selected?signed(relative(root,resolve(folder,'manifest-patch.json'))):null,previews,raw:signed(relative(root,raw)),
 scope:'216 deterministic pre-mix OfflineAudioContext renders via unchanged AudioEngine.start: four hero basics, six balanced takes, three speeds and three proposed flight palettes. Same published buffers and impact times. Compare paired whole signals at identical action-clock alignment; no output normalization.',
 selectionCriterion:'Finite non-silent output and absolute zero-lag paired whole-basic correlation below.95 across all six takes and three speeds. This is only a signal-distinction diagnostic, not a perceptual acceptance gate.',
 methods:['common-travel retains shared cloth travel with palette launch; tide/ice impact pitch is unchanged.','palette-phases differentiates tide glass and ice interface-glass travel; all impact pitch is unchanged.','palette-pitch additionally moves only the proposed ice attack pitch range to1.34–1.42; existing voices, rules and published impact samples are unchanged.'],
 limits:['Direct start-graph rendering bypasses realtime source admission and the scene mix; live playback/output and paint checks are still required.','Low waveform correlation does not prove listeners recognize a hero or prefer the sound.','Nominal take coverage is six of36combinations; random pitch extremes and real neighbouring actions need later coverage.'],runtimeChanged:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),summaries,selectedMethod:selected}));if(!selected)process.exitCode=1;
