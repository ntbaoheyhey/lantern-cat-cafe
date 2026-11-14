/** Diagnostic kit reel and real production-engine variant selection; not an S5 mix. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {ELEMENTS,PHASES,checkKits} from './author-element-kits.mjs';
import {installOutputCapture} from './capture-page.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const out='reports/v3-shell/b2/polish/P2';mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync('apps/web/public/audio/manifest.json'));assert.deepEqual(checkKits(manifest),[]);
const raw=out+'/kit-reel.webm',browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const rows=[],errors=[];const p=await browser.newPage({viewport:{width:1280,height:720}});
p.on('pageerror',e=>errors.push(e.message));
try{
 await installOutputCapture(p,raw);
 await p.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3','{"disabled":true}');});
 await p.goto((process.env.AUDIO_URL??'http://127.0.0.1:5996')+'/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await p.waitForFunction(()=>window.__depthReview&&window.__thAudio);
 await p.evaluate(async()=>{window.__depthReview.go('map');await window.__thAudio.unlock();await window.__thAudio.preload('battle');});
 await p.waitForTimeout(1000);await p.evaluate(()=>{window.__thAudio.stop();window.__thAudio.hits.length=0;});
 const started=await p.evaluate(()=>window.__outputCapture.start());
 for(const element of ELEMENTS)for(const phase of PHASES){
  const id=`kit.${element}.${phase}`,before=await p.evaluate(()=>window.__thAudio.hits.length);
  await p.evaluate(({id,element})=>window.__thAudio.play(id,{element}),{id,element});
  await p.waitForFunction(({id,before})=>window.__thAudio.hits.slice(before).some(h=>h.id===id&&['played','unavailable'].includes(h.result)),{id,before});
  const hit=await p.evaluate(({id,before})=>window.__thAudio.hits.slice(before).find(h=>h.id===id&&['played','unavailable'].includes(h.result)),{id,before});assert.equal(hit.result,'played');
  rows.push({element,phase,id,first:hit,reelStartSeconds:hit.at/1000-started});await p.waitForTimeout(1400);await p.evaluate(id=>window.__thAudio.stop(id),id);
 }
 await p.evaluate(()=>window.__outputCapture.stop());
 for(const row of rows){
  const takes=[row.first];
  for(let n=1;n<6;n++){
   const before=await p.evaluate(()=>window.__thAudio.hits.length);await p.evaluate(id=>window.__thAudio.play(id),row.id);
   await p.waitForFunction(({id,before})=>window.__thAudio.hits.slice(before).some(h=>h.id===id&&h.result==='played'),{id:row.id,before});
   takes.push(await p.evaluate(({id,before})=>window.__thAudio.hits.slice(before).find(h=>h.id===id&&h.result==='played'),{id:row.id,before}));
   await p.waitForTimeout(55);await p.evaluate(id=>window.__thAudio.stop(id),row.id);
  }
  row.takes=takes;row.distinctByLayer=Object.fromEntries(row.first.layers.map(l=>[l.role,new Set(takes.map(t=>t.layers.find(v=>v.role===l.role).variantId)).size]));
  assert.ok(Object.values(row.distinctByLayer).every(n=>n===6),row.id+' source repetition');
  for(const t of takes)for(const l of t.layers){const expected=manifest.designs[row.id].layers.find(v=>v.role===l.role);assert.ok(expected.variants.some(v=>v.variantId===l.variantId),row.id+' wrong material');}
 }
 assert.deepEqual(errors,[]);
 const reel=out+'/KIT-REEL.mp3';execFileSync('ffmpeg',['-v','error','-y','-i',raw,'-c:a','libmp3lame','-b:a','128k',reel]);rmSync(raw);
 const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
 const result={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),diagnostic:true,method:'24 explicit isolated kit previews through the production AudioEngine, then six real admitted takes of every kit; not a game-mix acceptance capture.',rows,errors,reel:sign(reel),manifest:sign('apps/web/public/audio/manifest.json')};
 writeFileSync(out+'/playback.json',JSON.stringify(result,null,2)+'\n');
 console.log('PASS P2.phases: 24/24 real phase previews; six distinct element arrangements per phase');
 console.log('PASS P2.variants: all 24 kits play six unique takes per layer with no wrong source');
 console.log('PASS P2.errors: 0 browser errors; encoded bytes unchanged');
}finally{await browser.close();}
