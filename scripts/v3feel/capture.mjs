/** Observe a real-time production battle. CDP pictures and WebAudio share wall time.
 * Video is resampled from actual compositor timestamps; audio is never replayed or normalized. */
import {mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {chromium,config,openFixture} from './browser-fixture.mjs';
import {installOutputCapture} from '../audio/capture-page.mjs';
const root=resolve(import.meta.dirname,'../..');
const arg=(name,fallback)=>{const n=process.argv.indexOf('--'+name);return n<0?fallback:process.argv[n+1];};
const item=arg('item','Q0'),selected=arg('fixture','all'),seconds=Number(arg('seconds','60'));
if(!/^[A-Z0-9-]+$/.test(item))throw Error('Invalid item');
const out=resolve(root,'reports/v3-feel/REVIEW',item);mkdirSync(out,{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try {for(const fixture of config.fixtures.filter(f=>selected==='all'||f.id===selected)){
 const raw=resolve(out,fixture.id,'raw');rmSync(raw,{recursive:true,force:true});mkdirSync(raw,{recursive:true});
 const {page,errors}=await openFixture(browser,fixture,{fixedClock:false,setupPage:p=>installOutputCapture(p,resolve(raw,'audio.webm'))});
 await page.evaluate(async()=>{const a=window.__thAudio;await a.unlock();await a.preload('battle');a.music(window.__depthReview.battle.actors.some(x=>x.catalogId==='yarn-giant')?'boss':'battle');});
 // Let the real score reach its steady state before marking capture zero.
 await page.waitForTimeout(500);
 const cdp=await page.context().newCDPSession(page),pictures=[];
 let zero=Infinity;
 cdp.on('Page.screencastFrame',event=>{
  void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  const t=event.metadata.timestamp-zero;if(t<0||t>30.1)return;
  const name=`shot-${String(pictures.length).padStart(5,'0')}.jpg`;
  writeFileSync(resolve(raw,name),Buffer.from(event.data,'base64'));pictures.push({t,name});
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1280,maxHeight:720,everyNthFrame:1});
 zero=await page.evaluate(async()=>{
  const m=window.__depthReview,s=window.__depthScene,a=window.__thAudio;
  const start=await window.__outputCapture.start();a.hits.length=0;
  const c=window.__feelCapture={start,frames:[],plans:[],lastPlan:null,lastSample:-1,voiceWindows:[],finishedAt:null};
  const render=s.render.bind(s);
  s.render=(view,dt)=>{
   render(view,dt);const t=Date.now()/1000-start,plan=view.frame?.plan;
   // A round-status presentation can share a rules action ID with the prior
   // strike. Identify the rendered plan by its own ordinal, not that rules ID.
   if(plan&&c.lastPlan!==plan){c.lastPlan=plan;c.plans.push({key:c.plans.length,id:plan.id,at:t,clockStart:t-view.frame.elapsed/1000,actorId:plan.actorId,skillId:plan.presentationId??plan.skillId,ultimate:plan.ultimate,tier:plan.sequence?.tier??(plan.ultimate?'ultimate':'basic'),duration:plan.duration,impact:plan.beats[2].start,events:structuredClone(plan.events),beats:structuredClone(plan.beats)});}
   if(m.battle?.result&&!c.finishedAt)c.finishedAt=t;
   // Keep every rendered frame. A >=33 ms throttle aliases 60 Hz into 20 Hz,
   // which cannot establish one-frame contact timing or 100% camera coverage.
   c.lastSample=t;
   // The renderer reuses its motion/sequence arrays. Snapshot now, otherwise
   // every historical sample silently becomes the final rendered frame.
   const audit=structuredClone(s.audit()),rect=s.renderer.domElement.getBoundingClientRect();
   c.frames.push({t,units:audit.units,motion:audit.motion,sequence:audit.sequence,numbers:structuredClone(s.numbers?.drawn??[]),focus:audit.focus,renderCamera:audit.camera,rootPoses:[...s.actors].map(([id,e])=>({id,x:e.actor.root.position.x,y:e.actor.root.position.y,scaleX:e.actor.root.scale.x,scaleY:e.actor.root.scale.y,angle:e.actor.root.rotation.z})),camera:{zoom:s.camera.zoom,position:s.camera.position.toArray(),root:s.stage.root.matrix.toArray()},field:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},action:view.frame?{key:c.plans.length-1,id:view.frame.plan.id,elapsed:view.frame.elapsed}:null});
   const d=a.diagnostics;c.voiceWindows.push({t,sfx:d.sfx,voice:d.voice,active:d.active});
  };
  s.last=0;s.raf=requestAnimationFrame(s.loop);m.nextStepAt=0;m.paused=false;m.notify(false);return start;
 });
 for(let elapsed=0;elapsed<seconds;elapsed+=15){await page.waitForTimeout(Math.min(15,seconds-elapsed)*1000);console.log(`${item} ${fixture.id}: ${Math.min(elapsed+15,seconds)}/${seconds}s`);}
 await cdp.send('Page.stopScreencast');
 const capture=await page.evaluate(async()=>{
  if(!window.__feelCapture)throw Error('Page reloaded during capture. Do not edit browser source during a recording.');
  window.__depthReview.paused=true;await window.__outputCapture.stop();
  const c=window.__feelCapture,m=window.__depthReview,a=window.__thAudio,r=window.__v3a2;
  const expected=structuredClone(r.initial),actual=structuredClone(m.battle);r.R.playBattle(expected,'auto');r.R.playBattle(actual,'auto');
  return {...c,lastPlan:undefined,initial:r.initial,combatLog:m.battle.log,result:expected.result,parity:JSON.stringify(expected)===JSON.stringify(actual),hits:a.hits,battleAudio:window.__depthScene.audio.events,settings:a.settings};
 });
 await page.close();
 if(!pictures.length)throw Error('No compositor frames');
 // Resample by actual timestamps. The concat demuxer's implicit 25 fps JPEG
 // timebase rounded each gap and could make a smooth battle appear to stall.
 const resampled=[];let shot=0;
 for(let frame=0;frame<900;frame++){
  const t=frame/30;while(shot+1<pictures.length&&pictures[shot+1].t<=t)shot++;
  symlinkSync(pictures[shot].name,resolve(raw,`frame-${String(frame).padStart(5,'0')}.jpg`));
  resampled.push({frame,t,source:pictures[shot].name,sourceTime:pictures[shot].t});
 }
 const video=resolve(out,fixture.id+'.webm');
 execFileSync('ffmpeg',['-v','error','-y','-framerate','30','-i',resolve(raw,'frame-%05d.jpg'),'-i',resolve(raw,'audio.webm'),'-t','30','-vf','fps=30','-c:v','libvpx-vp9','-crf','36','-b:v','1400k','-row-mt','1','-c:a','libopus','-b:a','96k',video]);
 const wav=resolve(out,fixture.id+'-mix.wav');
 execFileSync('ffmpeg',['-v','error','-y','-i',resolve(raw,'audio.webm'),'-t',String(seconds),'-ar','48000','-c:a','pcm_s16le',wav]);
 const loudness=spawnSync('ffmpeg',['-hide_banner','-i',wav,'-af','loudnorm=I=-20:TP=-1:LRA=11:print_format=json','-f','null','-'],{encoding:'utf8'}).stderr;
 const loudnessJson=JSON.parse(loudness.match(/\{\s*"input_i"[\s\S]*?\}/)?.[0]??'{}');
 const gaps=pictures.slice(1).map((p,i)=>p.t-pictures[i].t);
 const data={sourceCommit,recorded:new Date().toISOString(),fixture:fixture.id,seconds,fps:30,width:1280,height:720,errors,video:relative(root,video),videoBytes:readFileSync(video).length,videoSha256:createHash('sha256').update(readFileSync(video)).digest('hex'),actualCompositorFrames:pictures.length,maxCompositorGapSeconds:Math.max(...gaps),audio:{path:relative(root,wav),integratedLufs:Number(loudnessJson.input_i),truePeakDbTP:Number(loudnessJson.input_tp),maxTransientVoices:Math.max(...capture.voiceWindows.map(v=>v.active)),method:'Unmodified production WebAudio output; actual timestamps; no postmix normalization.'},...capture,pictures,resampled};
 writeFileSync(resolve(out,fixture.id,'capture.json.gz'),gzipSync(JSON.stringify(data)));
 writeFileSync(resolve(out,fixture.id,'summary.json'),JSON.stringify({sourceCommit,fixture:fixture.id,recorded:data.recorded,seconds,fps:30,videoBytes:data.videoBytes,actualCompositorFrames:pictures.length,maxCompositorGapSeconds:data.maxCompositorGapSeconds,audio:data.audio,plans:capture.plans,result:capture.result,parity:capture.parity,errors},null,2)+'\n');
 rmSync(raw,{recursive:true});console.log(`${fixture.id}: ${pictures.length} compositor frames; ${capture.plans.length} actions; parity=${capture.parity}; ${data.audio.integratedLufs} LUFS`);
 if(errors.length||!capture.parity)throw Error('Capture failed; inspect summary');
}}finally{await browser.close();}
