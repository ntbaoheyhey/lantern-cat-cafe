/**
 * Frame-stepped recording of the judge path, for machines whose GPU (or a
 * software renderer) cannot hold 30 fps in real time. Page time is virtual:
 * requestAnimationFrame, timers, performance.now/Date.now, CSS/Web animations
 * and media playback advance exactly 1/FPS per captured frame, so the video
 * plays at true speed however slowly each frame renders.
 *
 *   node tools/v5int/run-chain-mode.mjs --fixture
 *   DEMO_ANGLE=swiftshader DEMO_OUTPUT=work/demo node tools/v5int/v9-demo-record-stepped.mjs
 *
 * Writes demo.mp4 and stills (still-*.jpg) to DEMO_OUTPUT. Needs ffmpeg on PATH.
 */
import {createRequire} from 'node:module';
import {mkdir,writeFile,rm,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const origin=process.env.DEMO_ORIGIN??'http://127.0.0.1:6301';
const out=resolve(process.env.DEMO_OUTPUT??'work/v9/demo-stepped');
const angle=process.env.DEMO_ANGLE??'metal';
const FPS=Number(process.env.DEMO_FPS??30),DT=1000/FPS;
const framesDir=resolve(out,'frames');
await rm(framesDir,{recursive:true,force:true});await mkdir(framesDir,{recursive:true});

const virtualTime=()=>{
 const W=window,P=performance,M=HTMLMediaElement.prototype;
 const realRaf=W.requestAnimationFrame.bind(W),realNow=P.now.bind(P),realDateNow=Date.now,realTimeout=W.setTimeout.bind(W);
 const realPlay=M.play,realPause=M.pause,pausedGet=Object.getOwnPropertyDescriptor(M,'paused').get;
 let t=realNow(),step=false,rafId=0,timerId=1e6;const epoch=realDateNow()-t;
 const rafs=new Map(),timers=new Map(),media=new Set();
 // Without requestVideoFrameCallback three.js refreshes VideoTextures every frame,
 // which keeps seeked (virtually played) designer idles visible.
 delete HTMLVideoElement.prototype.requestVideoFrameCallback;
 P.now=()=>t;Date.now=()=>Math.floor(epoch+t);
 W.requestAnimationFrame=cb=>{const id=++rafId;rafs.set(id,cb);return id;};
 W.cancelAnimationFrame=id=>{rafs.delete(id);};
 W.setTimeout=(fn,ms,...a)=>{const id=++timerId;timers.set(id,{at:t+Math.max(0,+ms||0),fn,a});return id;};
 W.setInterval=(fn,ms,...a)=>{const every=Math.max(4,+ms||0),id=++timerId;timers.set(id,{at:t+every,fn,a,every});return id;};
 W.clearTimeout=W.clearInterval=id=>{timers.delete(id);};
 M.play=function(){media.add(this);if(!step)return realPlay.call(this);this.__vPaused=false;realPause.call(this);return Promise.resolve();};
 M.pause=function(){media.add(this);this.__vPaused=true;return realPause.call(this);};
 Object.defineProperty(M,'paused',{configurable:true,get(){return step&&this.__vPaused!==undefined?this.__vPaused:pausedGet.call(this);}});
 const advance=dt=>{
  t+=dt;
  for(;;){
   let next;for(const [id,timer] of timers)if(timer.at<=t&&(!next||timer.at<next[1].at))next=[id,timer];
   if(!next)break;const [id,timer]=next;
   if(timer.every)timer.at+=timer.every;else timers.delete(id);
   try{typeof timer.fn==='function'?timer.fn(...timer.a):0;}catch(e){console.error(e);}
  }
  const due=[...rafs.values()];rafs.clear();
  for(const cb of due){try{cb(t);}catch(e){console.error(e);}}
 };
 // Until stepping starts the page runs on real time so it can boot and load.
 let last=realNow();
 const free=()=>{if(step)return;const now=realNow();advance(now-last);last=now;realRaf(free);};realRaf(free);
 W.__stepStart=()=>{
  step=true;
  for(const el of media){el.__vPaused=pausedGet.call(el);realPause.call(el);}
 };
 W.__stepFrame=async dt=>{
  const t0=realNow(),seeks=[];
  for(const el of media){
   if(el.__vPaused||!(el.duration>0))continue;
   let at=el.currentTime+dt/1000*(el.playbackRate||1);
   if(at>=el.duration){if(el.loop)at%=el.duration;else{at=el.duration;el.__vPaused=true;}}
   seeks.push(new Promise(done=>{const end=()=>done();el.addEventListener('seeked',end,{once:true});realTimeout(end,400);el.currentTime=at;}));
  }
  await Promise.all(seeks);const t1=realNow();
  for(const a of document.getAnimations()){
   if(!a.__virtual){a.__virtual=true;a.pause();}
   const end=a.effect?.getComputedTiming().endTime;
   const next=(a.currentTime??0)+dt*(a.playbackRate||1);
   a.currentTime=Number.isFinite(end)?Math.min(next,end):next;
   if(Number.isFinite(end)&&next>=end){a.finish?.();}
  }
  const t2=realNow();advance(dt);const t3=realNow();
  await new Promise(r=>realRaf(()=>realRaf(r)));
  return {seeks:seeks.length,seek:t1-t0,anim:t2-t1,tick:t3-t2,present:realNow()-t3};
 };
};

const init=`(${virtualTime})();`;

const browser=await chromium.launch({headless:true,args:[`--use-angle=${angle}`,'--mute-audio','--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:1280,height:720}});
await context.addInitScript({content:init});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const cdp=await context.newCDPSession(page);
let frame=0;const marks=[];
const capture=async()=>{
 const {data}=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88});
 await writeFile(resolve(framesDir,`${String(frame++).padStart(5,'0')}.jpg`),Buffer.from(data,'base64'));
};
const timing=[];
const step=async(capture_=true)=>{const a=Date.now(),r=await page.evaluate(dt=>window.__stepFrame(dt),DT),b=Date.now();if(capture_)await capture();
 timing.push({...r,evaluate:b-a,capture:Date.now()-b});
 if(timing.length===30){const avg=k=>(timing.reduce((s,x)=>s+(x[k]??0),0)/30).toFixed(0);console.error(`frame ${frame} seeks=${timing.at(-1).seeks} seek=${avg('seek')} anim=${avg('anim')} tick=${avg('tick')} present=${avg('present')} eval=${avg('evaluate')} capture=${avg('capture')}`);timing.length=0;}
};
const hold=async seconds=>{for(let i=0;i<Math.round(seconds*FPS);i++)await step();};
const until=async(predicate,{seconds=120,record=true,arg}={})=>{
 for(let i=0;i<seconds*FPS;i++){if(await page.evaluate(predicate,arg))return;await step(record);}
 throw new Error(`Timed out waiting for ${predicate}`);
};
const visible=name=>[...document.querySelectorAll('button,h1,h2,h3,[role=status]')].some(e=>e.offsetParent&&(e.getAttribute('aria-label')===name||e.textContent.trim()===name));
const click=name=>page.getByRole('button',{name,exact:true}).click();
const mark=label=>marks.push({label,frame});
try{
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`);
 const play=page.getByRole('button',{name:'Play free',exact:true}),guard=page.getByRole('button',{name:'Guard the café',exact:true});
 await play.or(guard).waitFor({timeout:60000});
 if(await play.isVisible())await play.click();
 await guard.waitFor({timeout:60000});
 await page.waitForTimeout(3000);
 await page.evaluate(()=>window.__stepStart());
 mark('cafe');await hold(3.5);
 await click('Collection');await hold(0.4);mark('collection');await hold(3);
 await click('Back to café');await hold(1);
 await click('Guard the café');
 await until(()=>window.__depthReview?.sceneReady===true,{record:false});
 await page.evaluate(()=>{
  window.__demoUlts=[];let last=null;
  window.__demoWatch=()=>{const p=window.__depthReview?.plan;if(p&&p!==last){last=p;if(p.ultimate)window.__demoUlts.push(p.skillId);}return window.__demoUlts.length;};
 });
 mark('wave');
 let seen=0;
 const watch=async()=>{const n=await page.evaluate(()=>window.__demoWatch());while(seen<n){seen++;marks.push({label:'ultimate-'+(await page.evaluate(k=>window.__demoUlts[k],seen-1)),frame});}};
 const playUntil=async(predicate,seconds,arg)=>{for(let i=0;i<seconds*FPS;i++){await watch();if(await page.evaluate(predicate,arg))return;await step();}throw new Error('timed out: '+predicate);};
 await playUntil(visible,150,'Face the Yarn Giant');
 mark('wave-clear');await hold(2);
 await click('Face the Yarn Giant');
 await until(()=>window.__depthReview?.sceneReady===true,{record:false});
 mark('boss');
 await playUntil(visible,150,'The last lantern stays lit');
 await hold(0.5);mark('victory');await hold(3);
 if(await page.getByRole('button',{name:'Preview receipt fixture',exact:true}).isVisible()){
  await click('Preview receipt fixture');await hold(0.6);mark('receipt');await hold(3);
  await click('Dismiss receipt');await hold(0.5);
 }
 await click('Collection');await hold(0.5);
 await page.getByLabel('Wallet address',{exact:true}).fill('0x0000000000000000000000000000000000000001');
 await click('Read Fuji Relics');
 await until(()=>[...document.querySelectorAll('*')].some(e=>e.childElementCount===0&&e.textContent==='Owned on Avalanche Fuji'),{record:false,seconds:90});
 await page.getByText('Owned on Avalanche Fuji',{exact:true}).scrollIntoViewIfNeeded();
 await hold(0.5);mark('fuji');await hold(3);
}finally{
 await context.close();await browser.close();
}
console.log(JSON.stringify({frames:frame,seconds:(frame/FPS).toFixed(1),marks,errors}));
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',resolve(framesDir,'%05d.jpg'),'-vf','format=yuv420p','-c:v','libx264','-crf','20','-preset','slow','-movflags','+faststart',resolve(out,'demo.mp4')]);
for(const {label,frame:f} of marks){
 const offsets=label.startsWith('ultimate')?[12,30]:[0];
 for(const o of offsets){const i=Math.min(frame-1,f+o);await copyFile(resolve(framesDir,`${String(i).padStart(5,'0')}.jpg`),resolve(out,`still-${String(i).padStart(5,'0')}-${label}${offsets.length>1?'-'+o:''}.jpg`));}
}
if(!process.env.DEMO_KEEP_FRAMES)await rm(framesDir,{recursive:true,force:true});
