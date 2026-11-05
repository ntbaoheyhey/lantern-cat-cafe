import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const browser=await chromium.launch(),page=await browser.newPage();await page.goto('http://127.0.0.1:5512/?demo&squad=1&squad3d=1');
const data=await page.evaluate(async()=>{
 const {synthCue,AUDIO_SETTINGS}=await import('/src/game/squad/turn3d/audio.ts');const families=['swish','thud','chime','flame','glass','whoosh'],rows=[];
 for(const family of [...families,'mixed-stinger']){const ctx=new OfflineAudioContext(1,44100*3,44100),master=ctx.createGain();master.gain.value=AUDIO_SETTINGS.master;master.connect(ctx.destination);
  for(let beat=0;beat<5;beat++)synthCue(ctx,master,family==='mixed-stinger'?families[beat]:family,beat,.15+beat*.3,beat*17);
  if(family==='mixed-stinger')for(let i=0;i<4;i++)synthCue(ctx,master,'chime',0,.15+i*.16,i*13);
  const pcm=(await ctx.startRendering()).getChannelData(0);let peak=0,sum=0,nonzero=0;for(const x of pcm){peak=Math.max(peak,Math.abs(x));sum+=x*x;if(x!==0)nonzero++}const rms=Math.sqrt(sum/pcm.length);rows.push({family,peak,rms,peakDbFS:20*Math.log10(peak),rmsDbFS:20*Math.log10(rms),nonzeroSamples:nonzero,samples:pcm.length});
 }
 return {date:new Date().toISOString(),settings:AUDIO_SETTINGS,rows,method:'Browser OfflineAudioContext, 44.1 kHz, final master gain. Five cues per family and overlapped victory-style chimes. PCM peak/RMS only; no perceptual quality or listening-test claim.'};
});assert(data.rows.every(r=>r.peak<1&&r.nonzeroSamples>0));await fs.writeFile('reports/turn3d-polish/audio.json',JSON.stringify(data,null,2));await browser.close();console.log(JSON.stringify(data));
