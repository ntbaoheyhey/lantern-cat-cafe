/** Capture the displayed canvas and its actual audio output in one media stream.
 * Pilot 1/2 CDP evidence is retained; no old recording is rewritten. */
import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync,readFileSync,appendFileSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../..'),pilot=process.argv[2]??'QR-P3';
if(pilot!=='QR-P3')throw Error('Preserve the original recordings: this method is final pilot 3 only.');
const out=resolve(root,'reports/v3-feel/REVIEW',pilot),raw=resolve(out,'raw/record');mkdirSync(raw,{recursive:true});
const source=raw+'/stream.webm';writeFileSync(source,Buffer.alloc(0));
console.log(JSON.stringify({pid:process.pid,pilot,method:'canvas+direct audio stream'}));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.exposeFunction('__pilotSaveChunk',bytes=>appendFileSync(source,Buffer.from(bytes)));
 await page.goto('http://127.0.0.1:5990/@fs'+root+'/tools/v3feel-pilot/index.html');await page.waitForFunction(()=>window.__pilot?.ready,null,{timeout:60000});
 const clocks=await page.evaluate(async()=>{
  const p=window.__pilot;await p.prepare();document.querySelector('#play').style.display='none';
  const ctx=p.sound.context;await ctx.resume();
  const audio=ctx.createMediaStreamDestination();p.sound.gain.connect(audio);
  const silence=ctx.createConstantSource();silence.offset.value=0;silence.connect(audio);silence.start();
  const stream=p.canvas.captureStream(30);stream.addTrack(audio.stream.getAudioTracks()[0]);
  const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9,opus',videoBitsPerSecond:2000000,audioBitsPerSecond:128000});
  let pending=Promise.resolve();recorder.ondataavailable=e=>{pending=pending.then(async()=>{if(e.data.size)await window.__pilotSaveChunk(Array.from(new Uint8Array(await e.data.arrayBuffer())));});};
  const started=new Promise(resolve=>recorder.onstart=resolve);recorder.start(1000);
  const captureZero=Date.now()/1000,captureAudio=ctx.currentTime,play=await p.play(60);await started;
  window.__pilotRecordStop=async()=>{p.stop();await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});await pending;p.sound.gain.disconnect(audio);silence.stop();stream.getTracks().forEach(t=>t.stop());};
  return {captureZero,captureAudio,...play};
 });
 for(let i=0;i<4;i++){await page.waitForTimeout(15000);console.log(`${pilot}: ${(i+1)*15}/60 seconds`);}
 const trace=await page.evaluate(async()=>{await window.__pilotRecordStop();return {frames:window.__pilot.trace,events:window.__pilot.sound.events};});
 await page.close();
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',source],{encoding:'utf8'}));
 execFileSync('ffmpeg',['-v','error','-y','-i',source,'-t','30','-vf','fps=30','-c:v','libvpx-vp9','-crf','35','-b:v','1400k','-row-mt','1','-c:a','libopus','-b:a','96k',out+'/pilot.webm']);
 execFileSync('ffmpeg',['-v','error','-y','-i',source,'-t','60','-ar','48000','-c:a','pcm_s16le',out+'/mix.wav']);
 const stderr=spawnSync('ffmpeg',['-hide_banner','-i',out+'/mix.wav','-af','loudnorm=I=-20:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'}).stderr;
 const loudness=JSON.parse(stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]??'{}');
 const durations=trace.frames.slice(1).map((f,i)=>f.elapsedWall-trace.frames[i].elapsedWall);
 const summary={at:new Date().toISOString(),clocks,errors,renderedFrames:trace.frames.length,maxRenderGapMs:Math.max(...durations),videoBytes:readFileSync(out+'/pilot.webm').length,loudness,simultaneousVoicesMax:Math.max(...Array.from({length:600},(_,i)=>trace.events.filter(e=>i/10>=e.contextAt-clocks.audioZero&&i/10<e.contextAt-clocks.audioZero+e.actualBufferDuration).length)),method:'Actual canvas.captureStream(30) and direct gain-output audio in one MediaRecorder. Frame clock encoded in pilot-only HUD; no replay or postmix normalization.'};
 writeFileSync(out+'/capture.json.gz',gzipSync(JSON.stringify({...summary,...trace,sourceProbe:probe})));
 writeFileSync(out+'/capture-summary.json',JSON.stringify(summary,null,2)+'\n');
 rmSync(raw,{recursive:true});console.log(pilot+' capture complete '+JSON.stringify(loudness));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
