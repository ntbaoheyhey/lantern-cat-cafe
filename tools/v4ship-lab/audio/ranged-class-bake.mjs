/** Prepare all ranged impact palettes from their actual published source packs. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {measureSprites} from './ranged-codec-measure.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-class-bake-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-class-bake-${attempt}.json`),raw=output.replace('.json','.rows.json.gz');
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path))),signature=runtimeSignature(root);
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),manifest=read('apps/web/public/audio/manifest.json'),licenses=read('apps/web/public/audio/LICENSES.json');
const elements=['ember','heavy','shadow','tide','ice'];assert.deepEqual(new Set(inventory.impacts.map(r=>r.element)),new Set(elements));
const designs=Object.fromEntries(elements.map(e=>[e,manifest.designs[`kit.${e}.impact`]]));
for(const d of Object.values(designs))assert(!d.baked&&d.layers.length===4&&d.layers.every(l=>l.variants.length===6));
const unique={},aliases={};for(const [element,design]of Object.entries(designs)){const equal=Object.keys(unique).find(e=>JSON.stringify(unique[e])===JSON.stringify(design));if(equal)aliases[element]=equal;else unique[element]=design;}
assert.deepEqual(aliases,{ice:'tide'});
const packs=[...new Set(Object.values(unique).flatMap(d=>d.layers.flatMap(l=>l.variants.map(v=>v.pack))))],sources=packs.map(pack=>signed(`apps/web/public/audio/${pack}.webm`));
const sourceLicenses=sources.map(source=>{const entry=licenses.files.find(f=>f.path===source.path);assert(entry&&entry.sha256===source.sha256&&entry.license==='CC0-1.0');return entry;});
const rate=48000,pack='v4-ranged-impacts',ffmpeg=process.env.V4_FFMPEG??'/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
const run=(command,args)=>{const r=spawnSync(command,args,{encoding:'utf8'});assert.equal(r.status,0,`${command} failed; no output installed`);return r;};
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test');let rendered;
const renderer=await playwright.chromium.launch({headless:true});
try{
 const page=await renderer.newPage();await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'||u.port!=='5995')return route.abort();if(u.pathname==='/__ranged-class-bake')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>All ranged impact preparation</title>'});return route.continue();});
 await page.goto('http://127.0.0.1:5995/__ranged-class-bake');
 rendered=await page.evaluate(async({designs,inputs,rate,pack})=>{
  const {AudioEngine}=await import('/src/audio/engine.ts'),decode=new OfflineAudioContext(1,1,rate),buffers={};
  for(const [id,base64]of Object.entries(inputs)){const buffer=await decode.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);if(buffer.numberOfChannels!==1)throw Error('No implicit downmix: '+id);buffers[id]=buffer;}
  const rows=[],parts=[];let cursor=0;
  for(const [element,design]of Object.entries(designs))for(let a=0;a<6;a++)for(let b=0;b<6;b++){
   const indices=[a,b,(a+b)%6,(a+5*b)%6],samples=design.layers.map((l,i)=>l.variants[indices[i]]);
   for(const sample of samples)if(!buffers[sample.pack]||sample.start<0||sample.start+sample.duration>buffers[sample.pack].duration)throw Error('Invalid published sprite '+sample.variantId);
   const length=Math.ceil((Math.max(...samples.map((s,i)=>s.duration+design.layers[i].offsetMs/1000))+.012)*rate),ctx=new OfflineAudioContext(1,length,rate),engine=new AudioEngine(()=>.5);engine.ctx=ctx;engine.buses.set('sfx',ctx.destination);
   for(const [i,layer]of design.layers.entries()){const trim=layer.role==='transient'?-9:layer.role==='sweetener'?-7:layer.role==='body'?3:1;engine.start(`kit.${element}.impact`,buffers[samples[i].pack],samples[i],design.priority,1,10**((layer.gainDb+trim)/20),layer.offsetMs/1000,layer.eq,1,0);}
   const buffer=await ctx.startRendering(),pcm=buffer.getChannelData(0);if(!pcm.every(Number.isFinite))throw Error('Non-finite render');parts.push({start:cursor,pcm});
   rows.push({element,indices,sample:{pack,start:cursor/rate,duration:length/rate,bus:'sfx',variantId:`ranged.${element}.impact/${a}-${b}`,enveloped:true},layers:design.layers.map((l,i)=>({role:l.role,variantId:samples[i].variantId,offsetMs:l.offsetMs}))});cursor+=length+Math.round(.08*rate);
  }
  const pcm=new Float32Array(cursor);for(const part of parts)pcm.set(part.pcm,part.start);const bytes=new Uint8Array(pcm.buffer),chunks=[];for(let i=0;i<bytes.length;i+=32768)chunks.push(String.fromCharCode(...bytes.subarray(i,i+32768)));
  return {rows,samples:cursor,pcmBase64:btoa(chunks.join(''))};
 },{designs:unique,inputs:Object.fromEntries(packs.map((p,i)=>[p,readFileSync(resolve(root,sources[i].path)).toString('base64')])),rate,pack});
}finally{await renderer.close();}
assert.equal(rendered.rows.length,144);const pcm=Buffer.from(rendered.pcmBase64,'base64');assert.equal(pcm.length,rendered.samples*4);delete rendered.pcmBase64;
const pcmPath=resolve(folder,'impacts.f32'),wavPath=resolve(folder,'original.wav'),paddedPath=resolve(folder,'vorbis-input.f32');writeFileSync(pcmPath,pcm);writeFileSync(paddedPath,Buffer.concat([Buffer.alloc(128*4),pcm]));
run(ffmpeg,['-v','error','-f','f32le','-ar',String(rate),'-ac','1','-i',pcmPath,'-c:a','pcm_f32le',wavPath]);
run(ffmpeg,['-v','error','-f','f32le','-ar',String(rate),'-ac','1','-i',paddedPath,'-c:a','libvorbis','-q:a','7',resolve(folder,pack+'.webm')]);
const encoded=run('lame',['--verbose','--noreplaygain','--scale',String(1/.97),'-b','192','-m','m',wavPath,resolve(folder,pack+'.mp3')]),reportedScaling=Number(encoded.stderr.match(/\n\s*scaling:\s*([\d.]+)/)?.[1]);assert.equal(reportedScaling,1);
const files=['webm','mp3'].map(format=>({format,...signed(relative(root,resolve(folder,`${pack}.${format}`))),bytes:readFileSync(resolve(folder,`${pack}.${format}`)).length})),rows=[];
for(const browserName of ['chromium','webkit']){
 const browser=await playwright[browserName].launch({headless:true});
 try{const page=await browser.newPage();for(const rate of [48000,44100]){
  await page.evaluate(async({base64,rate})=>{const ctx=new OfflineAudioContext(1,1,rate),reference=await ctx.decodeAudioData(Uint8Array.from(atob(base64),c=>c.charCodeAt(0)).buffer);window.__originalPCM=reference.getChannelData(0);},{base64:readFileSync(wavPath).toString('base64'),rate});
  for(const file of files){assert(!existsSync(resolve(root,'STOP-V4SHIP')));const row={browser:browserName,version:browser.version(),rate,format:file.format,...await measureSprites(page,readFileSync(resolve(root,file.path)),rendered.rows,rate)};rows.push(row);console.log(JSON.stringify({browser:browserName,rate,format:file.format,lagSamples:row.lagSamples,minCorrelation:row.minimumCanonicalCorrelation,maxRmsDeltaDb:row.maximumAlignedRmsDeltaDb,complete:row.allComplete}));}
 }}finally{await browser.close();}
}
const reconstructionPass=rows.length===8&&rows.every(r=>r.channels===1&&r.allComplete&&r.lagSamples.every(n=>n===0)&&r.minimumCanonicalCorrelation>=.99&&r.maximumAlignedRmsDeltaDb<=.1);
const patch={packs:{[pack]:{webm:`/audio/${pack}.webm`,mp3:`/audio/${pack}.mp3`}},designs:Object.fromEntries(elements.map(element=>[`kit.ranged-${element}.impact`,{...designs[element],baked:rendered.rows.filter(r=>r.element===(aliases[element]??element)).map(({sample,layers})=>({sample,layers}))}]))};
const sourceFiles=[...new Map(sourceLicenses.flatMap(l=>l.sourceFiles).map(s=>[s.path,s])).values()];
const entries=files.map(file=>({...sourceLicenses[0],path:`apps/web/public/audio/${pack}.${file.format}`,file:`${pack}.${file.format}`,sha256:file.sha256,date:new Date().toISOString().slice(0,10),sourceFiles,derivedFrom:sources,buildScript:signed(relative(root,import.meta.filename)),processing:'Four original AudioEngine.start layers per impact rendered from each named published pack at48kHz, original filters/gains/offsets/envelopes,80ms guards;36balanced combinations per palette. Identical ice/tide impact designs share36verified mappings;144unique sprites serve180palette combinations. Common composite pitch/gain replaces independent layer randomization. Vorbis128leading zeros; nativeLAME192k requested1/0.97 reports effective1.0. No new recording or normalization.'}));
writeFileSync(resolve(folder,'manifest-patch.json'),JSON.stringify(patch,null,2)+'\n');writeFileSync(resolve(folder,'license-entries.json'),JSON.stringify(entries,null,2)+'\n');writeFileSync(raw,gzipSync(JSON.stringify(rows)));assertUnchanged(root,signature);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',signature,inputs:[signed(inventoryPath),...sources],harness:[signed(relative(root,import.meta.filename)),signed('tools/v4ship-lab/audio/ranged-codec-measure.mjs')],output:relative(root,folder),files,pcm:signed(relative(root,pcmPath)),reference:signed(relative(root,wavPath)),manifest:signed(relative(root,resolve(folder,'manifest-patch.json'))),licenses:signed(relative(root,resolve(folder,'license-entries.json'))),variants:rendered.rows,aliases,uniqueSprites:144,paletteCombinations:180,rows:rows.map(({variants,...r})=>r),raw:signed(relative(root,raw)),reconstructionPass,encoder:{requestedScaling:1/.97,reportedScaling},criteria:'All144unique complete sprites in both formats, both browsers and48/44.1kHz: zero best lag, canonical correlation>=.99, absolute RMS difference<=.1dB. All36ice aliases require identical source design and exact sample mappings.',limits:['Preparation only; no runtime/public assets installed.','Nominal-pitch codec reconstruction does not prove whole-attack distinction, audible mix, physical onset or human listening.','No new independently randomized layer combinations:36balanced combinations per palette.'],runtimeChanged:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),uniqueSprites:144,paletteCombinations:180,reconstructionPass,files}));if(!reconstructionPass)process.exitCode=1;
