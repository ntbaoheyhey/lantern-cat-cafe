// REFERENCE: turn3d/audio.ts; card-audio-score.ts. Run under the shared timing lock.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const artifact=resolve(process.env.BIG_ARTIFACT||'/tmp/cardrpg-big2-b4-index.html');
// macOS resolves /tmp to /private/tmp before Vite checks the serving allow-list.
const source=await realpath(resolve(process.env.BIG_AUDIO_SOURCE||'/tmp/cardrpg-big2-b4-validation'));
const out=process.env.BIG_AUDIO_OUT||'reports/cardrpg-big2/audio';await mkdir(out,{recursive:true});
const require=createRequire(resolve(source,'apps/web/package.json')),{createServer}=await import(require.resolve('vite'));
const server=await createServer({configFile:false,appType:'custom',root:resolve(source,'apps/web'),envDir:false,server:{host:'127.0.0.1',port:5920,strictPort:true,fs:{allow:[source]},watch:null,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}});
server.middlewares.use((req,res,next)=>{if(req.url==='/__audio'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Original audio analysis</title>');}else next()});
await server.listen();
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[],scores=[],playback=[];let complete=false;
try{
 const analysis=await browser.newPage();analysis.on('pageerror',e=>errors.push(String(e)));await analysis.goto('http://127.0.0.1:5920/__audio');
 const ids=await analysis.evaluate(async()=>{const a=await import('/src/game/squad/turn3d/audio.ts'),r=await import('/src/game/squad/turn3d/card-effect-data.ts'),l=await import('/src/game/squad/turn3d/card-lab-effects.ts');window.__audioModule=a;return [...Object.keys(r.CARD_EFFECT_RECIPES),...Object.keys(l.LAB_EFFECT_RECIPES),'kill'];});
 for(const id of ids){
  const row=await analysis.evaluate(async id=>{
   const {synthCardCue,synthCardKill,AUDIO_SETTINGS}=window.__audioModule,ctx=new OfflineAudioContext(1,44100*2,44100),master=ctx.createGain();master.gain.value=AUDIO_SETTINGS.master;master.connect(ctx.destination);
   if(id==='kill')synthCardKill(ctx,master,'mochi-4',.2);else{for(const [beat,t]of [[0,.1],[2,.6],[4,1.1]])synthCardCue(ctx,master,id,beat,t);}
   const buffer=await ctx.startRendering(),samples=buffer.getChannelData(0),pcm=new Int16Array(samples.length),envelope=[];let peak=0,sum=0,finite=true;
   for(let i=0;i<samples.length;i++){const s=samples[i];finite&&=Number.isFinite(s);peak=Math.max(peak,Math.abs(s));sum+=s*s;pcm[i]=Math.max(-32768,Math.min(32767,Math.round(s*32767)));}
   for(let start=0;start<samples.length;start+=256){let energy=0;for(let i=start;i<Math.min(samples.length,start+256);i++)energy+=samples[i]**2;envelope.push(Math.sqrt(energy/256));}
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',pcm.buffer))].map(v=>v.toString(16).padStart(2,'0')).join('');
   const keep=['panko-4','mallow-2','sorrel-1','velvet-4','auto-extra:tea-cloud','auto-extra:front-relay','kill'].includes(id);
   let base64;if(keep){let text='';for(const byte of new Uint8Array(pcm.buffer))text+=String.fromCharCode(byte);base64=btoa(text);}
   return{id,peak,rms:Math.sqrt(sum/samples.length),finite,envelope,sha256:hash,pcm:base64};
  },id);
  assert.ok(row.finite&&row.peak>0&&row.peak<.72,id);
  if(row.pcm){const pcm=Buffer.from(row.pcm,'base64'),header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(44100,24);header.writeUInt32LE(88200,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);await writeFile(`${out}/${id.replaceAll(':','-')}.wav`,Buffer.concat([header,pcm]));delete row.pcm;}
  scores.push(row);
 }
 assert.equal(new Set(scores.map(r=>r.sha256)).size,scores.length);await analysis.close();
 for(const [width,height,cpu]of [[1280,720,1],[1440,900,1],[1024,600,1],[1280,720,4]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  await page.goto('file://'+artifact);await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await page.evaluate(()=>{window.__audioPerf={frames:[],last:0,active:true};requestAnimationFrame(function sample(t){const d=window.__audioPerf;if(!d.active)return;if(d.last)d.frames.push(t-d.last);d.last=t;requestAnimationFrame(sample)});});
  await page.getByRole('button',{name:'Sound off',exact:true}).click();await page.getByRole('button',{name:'Sound on',exact:true}).waitFor();
  const volume=page.getByRole('slider',{name:'Sound volume',exact:true});await volume.focus();await volume.press('Home');for(let n=0;n<7;n++)await volume.press('ArrowRight');assert.equal(await page.evaluate(()=>window.__depthReview.audio.volume),.35);
  await page.getByRole('button',{name:'Resume',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('4');
  await page.waitForFunction(()=>window.__depthReview.screen==='result',null,{timeout:120000});
  const result=await page.evaluate(()=>{const d=window.__audioPerf;d.active=false;return{frames:d.frames,enabled:window.__depthReview.audio.enabled,volume:window.__depthReview.audio.volume,overflow:document.documentElement.scrollWidth>innerWidth}});
  assert.equal(result.enabled,true);assert.equal(result.overflow,false);const times=[...result.frames].sort((a,b)=>a-b);playback.push({width,height,cpu,...result,max:times.at(-1),p95:times[Math.floor(times.length*.95)]});await page.close();
 }
 assert.deepEqual(errors,[]);
 complete=true;
 console.log(JSON.stringify({scores:scores.length,peak:Math.max(...scores.map(r=>r.peak)),playback:playback.map(({frames,...r})=>({...r,frames:frames.length})),errors}));
}finally{
 await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),source,complete,method:'Native OfflineAudioContext PCM hashes and 256-sample RMS envelopes; 7 audible WAV examples. Unique waveforms are not a perceptual similarity test. Real sound/volume/playback clicks with RAF intervals at three sizes and CPU4.',scores,playback,errors},null,2));
 await browser.close();await server.close();
}
