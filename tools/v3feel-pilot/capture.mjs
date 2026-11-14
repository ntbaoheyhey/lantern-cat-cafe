import {chromium} from '../../scripts/v3feel/browser-fixture.mjs';
import {installOutputCapture} from '../../scripts/audio/capture-page.mjs';
import {mkdirSync,writeFileSync,readFileSync,rmSync,linkSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../..'),pilot=process.argv[2]??'QR-P1';
if(!/^QR-P[123]$/.test(pilot))throw Error('Invalid pilot');
const out=resolve(root,'reports/v3-feel/REVIEW',pilot),raw=resolve(out,'raw/record');mkdirSync(raw,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await installOutputCapture(page,raw+'/audio.webm');
 await page.goto('http://127.0.0.1:5990/@fs'+root+'/tools/v3feel-pilot/index.html');await page.waitForFunction(()=>window.__pilot?.ready,null,{timeout:60000});
 await page.evaluate(async()=>{await window.__pilot.prepare();document.querySelector('#play').style.display='none';});
 const cdp=await page.context().newCDPSession(page),pictures=[];let zero=Infinity;
 cdp.on('Page.screencastFrame',e=>{void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});const t=e.metadata.timestamp-zero;if(t<0||t>30.1)return;const name=`shot-${String(pictures.length).padStart(5,'0')}.jpg`;writeFileSync(resolve(raw,name),Buffer.from(e.data,'base64'));pictures.push({t,name});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1280,maxHeight:720,everyNthFrame:1});
 const clocks=await page.evaluate(async()=>{const captureZero=await window.__outputCapture.start();const play=await window.__pilot.play(60);return {captureZero,...play};});zero=clocks.captureZero;
 for(let i=0;i<4;i++){await page.waitForTimeout(15000);console.log(`${pilot}: ${(i+1)*15}/60 seconds`);}
 await cdp.send('Page.stopScreencast');
 const trace=await page.evaluate(async()=>{window.__pilot.stop();await window.__outputCapture.stop();return {frames:window.__pilot.trace,events:window.__pilot.sound.events};});
 await page.close();if(!pictures.length)throw Error('No compositor frames');
 // Select the latest actually displayed picture at each output timestamp. Never use future frames.
 const selections=[];let j=0;for(let frame=0;frame<900;frame++){const t=frame/30;while(j+1<pictures.length&&pictures[j+1].t<=t)j++;const p=pictures[j];linkSync(resolve(raw,p.name),resolve(raw,`video-${String(frame).padStart(5,'0')}.jpg`));selections.push({frame,t,sourceTime:p.t,source:p.name});}
 writeFileSync(out+'/frame-selections.json',JSON.stringify(selections));
 execFileSync('ffmpeg',['-v','error','-y','-framerate','30','-i',raw+'/video-%05d.jpg','-i',raw+'/audio.webm','-t','30','-c:v','libvpx-vp9','-crf','35','-b:v','1400k','-row-mt','1','-c:a','libopus','-b:a','96k',out+'/pilot.webm']);
 execFileSync('ffmpeg',['-v','error','-y','-i',raw+'/audio.webm','-t','60','-ar','48000','-c:a','pcm_s16le',out+'/mix.wav']);
 const stderr=spawnSync('ffmpeg',['-hide_banner','-i',out+'/mix.wav','-af','loudnorm=I=-20:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'}).stderr;
 const loudness=JSON.parse(stderr.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]??'{}');
 writeFileSync(out+'/capture.json.gz',gzipSync(JSON.stringify({at:new Date().toISOString(),clocks,pictures,...trace,errors,loudness,method:'Actual compositor capture and unmodified WebAudio output. Isolated two-actor pilot; four repeated 15-second craft sequences, not fixture coverage.'})));
 writeFileSync(out+'/capture-summary.json',JSON.stringify({clocks,errors,compositorFrames:pictures.length,maxCompositorGap:Math.max(...pictures.slice(1).map((p,i)=>p.t-pictures[i].t)),videoBytes:readFileSync(out+'/pilot.webm').length,loudness,simultaneousVoicesMax:Math.max(...Array.from({length:600},(_,i)=>trace.events.filter(e=>i/10>=e.contextAt-clocks.audioZero&&i/10<e.contextAt-clocks.audioZero+e.actualBufferDuration).length))},null,2));
 rmSync(raw,{recursive:true});console.log(pilot+' capture complete '+JSON.stringify(loudness));
}finally{await browser.close();}
