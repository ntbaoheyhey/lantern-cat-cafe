/** Actual browser output and source starts. Never replace the mixer or normalize output. */
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
import {openAudioScreen} from '../../../scripts/audio/ui-fixtures.mjs';

const root=resolve(import.meta.dirname,'../../..');
const args=Object.fromEntries(process.argv.slice(2).map(s=>s.replace(/^--/,'').split('=')));
const trial=args.trial??'pilot-1',seconds=Number(args.seconds??90),names=(args.scenes??'wave1,boss,home').split(',');
if(!/^[a-z0-9-]+$/.test(trial)||!Number.isFinite(seconds)||seconds<15||seconds>1800)throw Error('Invalid capture parameters');
const out=resolve(root,'reports/v4-ship/S5',trial),raw=resolve(root,'work/v4ship-audio',trial);
if(existsSync(out))throw Error('Preserve previous evidence; choose a new trial');
mkdirSync(out,{recursive:true});mkdirSync(raw,{recursive:true});
const signed=path=>({path:relative(root,path),bytes:readFileSync(path).length,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const harness=signed(import.meta.filename);
const signature=runtimeSignature(root),rows=[];
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});

// Browser-only telemetry wraps the original calls and records the real source.start arguments.
async function instrument(page){
 await page.evaluate(()=>{
  const a=window.__thAudio,stats=window.__audioStats={requests:[],starts:[],samples:[],restarts:0};
  const requests=new Map(),start=a.start,play=a.play;
  a.play=function(id,options){const request={id,performanceMs:performance.now(),audioTime:a.ctx?.currentTime??null,wallMs:Date.now()};requests.set(id,request);stats.requests.push(request);return play.call(this,id,options);};
  a.start=function(id,buffer,sample,priority,rate,volume,delay,eq,group){
   const record={id,bus:sample.bus,group,pack:sample.pack,variantId:sample.variantId,delay,priority,volume,request:requests.get(id),callPerformanceMs:performance.now(),callAudioTime:this.ctx.currentTime};
   const create=this.ctx.createBufferSource;
   this.ctx.createBufferSource=function(){
    const source=create.call(this),sourceStart=source.start;
    source.start=function(when=0,offset=0,duration){
     Object.assign(record,{when,offset,bufferDuration:duration??sample.duration,rate:this.playbackRate.value,loop:this.loop,outputTimestamp:this.context.getOutputTimestamp(),baseLatency:this.context.baseLatency,outputLatency:this.context.outputLatency});
     const result=sourceStart.call(this,when,offset,duration);
     this.addEventListener('ended',()=>{record.endedAudioTime=this.context.currentTime;record.endedPerformanceMs=performance.now();});
     stats.starts.push(record);return result;
    };return source;
   };
   try{const playing=start.apply(this,arguments);record.ducking=playing.ducking;return playing;}finally{this.ctx.createBufferSource=create;}
  };
  window.__audioMeter=setInterval(()=>stats.samples.push({audioTime:a.ctx?.currentTime,wallMs:Date.now(),duck:a.duck?.gain.value,...a.diagnostics,packs:undefined}),25);
 });
}
async function setupCapture(page,path){
 await page.addInitScript(()=>performance.setResourceTimingBufferSize(10000));
 await installOutputCapture(page,path);
}
function rolling(starts){
 const sorted=starts.slice().sort((a,b)=>a.when-b.when);let left=0,max=0,worst=[];
 for(let right=0;right<sorted.length;right++){
  while(sorted[right].when-sorted[left].when>=.1-1e-9)left++;
  if(right-left+1>max){max=right-left+1;worst=sorted.slice(left,right+1).map(({id,bus,when,group})=>({id,bus,when,group}));}
 }return {max,worst};
}
try{for(const name of names){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 const path=resolve(raw,name+'.webm'),fixture=config.fixtures.find(f=>f.id===name),actions=[];
 let page,errors=[];
 if(fixture){
  ({page,errors}=await openFixture(browser,fixture,{url:'http://127.0.0.1:5995',fixedClock:false,setupPage:p=>setupCapture(p,path)}));
  await instrument(page);
  await page.evaluate(async({name,preload})=>{const a=window.__thAudio;await a.unlock();if(preload)await a.preload('battle');a.music(name==='boss'?'boss':'battle');},{name,preload:args.preload==='true'});
 }else{
  page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
  await setupCapture(page,path);
  await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
  await openAudioScreen(page,({home:'cafe-hub',bag:'bag-main',forge:'forge-enhance',gacha:'invitations-main'})[name],'http://127.0.0.1:5995');
  await instrument(page);
 }
 page.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
 await page.waitForTimeout(900);
 const started=await page.evaluate(()=>window.__outputCapture.start());
 if(fixture)await page.evaluate(()=>{
  const s=window.__depthScene,m=window.__depthReview;s.last=0;s.raf=requestAnimationFrame(s.loop);m.nextStepAt=0;m.paused=false;m.notify(false);
  window.__audioRestart=setInterval(()=>{
   if(m.screen!=='result')return;
   const c=window.__v3a2,b=c.R.createBattle(c.initial.initial);b.v4.committed=true;
   Object.assign(m,{tutorialBattle:b,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:false,sceneStarted:true,screen:'map',nextStepAt:0});
   m.notify(false);window.__audioStats.restarts++;
  },100);
 });
 for(let elapsed=0;elapsed<seconds;elapsed+=5){
  if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
  if(!fixture){
   if(name==='home'){const buttons=page.getByRole('navigation',{name:'Cafe dock'}).getByRole('button');const count=await buttons.count();if(count)await buttons.nth((elapsed/5)%count).hover();}
   if(name==='bag'){const buttons=page.locator('.b2-bag-grid button');const count=await buttons.count();if(count)await buttons.nth((elapsed/5)%count).click();}
   if(name==='forge'&&elapsed%Math.max(5,Math.floor(seconds/5/5)*5)===0){const confirm=page.getByRole('button',{name:/^Confirm enhance \+/});if(await confirm.isEnabled().catch(()=>false))await confirm.click();}
   actions.push({atSeconds:elapsed,screen:name});
  }
  await page.waitForTimeout(Math.min(5,seconds-elapsed)*1000);
  if((elapsed+5)%30===0){
   const live=await page.evaluate(()=>({context:window.__thAudio.ctx.state,active:window.__thAudio.diagnostics.active,voice:window.__thAudio.diagnostics.voice,starts:window.__audioStats.starts.length,restarts:window.__audioStats.restarts}));
   console.log(JSON.stringify({trial,name,elapsed:elapsed+5,seconds,errors:errors.length,...live}));
  }
 }
 const data=await page.evaluate(async()=>{
  clearInterval(window.__audioRestart);clearInterval(window.__audioMeter);window.__depthReview.paused=true;
  const ended=await window.__outputCapture.stop();
  return {...window.__audioStats,ended,hits:window.__thAudio.hits,settings:window.__thAudio.settings,resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('/audio/')).map(r=>({path:new URL(r.name).pathname,bytes:r.encodedBodySize,ms:r.duration}))};
 });
 await page.close();assertUnchanged(root,signature);
 const events=resolve(out,name+'-events.json.gz');writeFileSync(events,gzipSync(JSON.stringify({name,started,seconds,actions,errors,...data})));
 const result=spawnSync('ffmpeg',['-hide_banner','-i',path,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-'],{encoding:'utf8'});
 if(result.status!==0)throw Error('Loudness analysis failed');
 const levels=JSON.parse(result.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
 const transient=data.starts.filter(s=>!s.loop),requested=transient.filter(s=>s.request),latencies=requested.map(s=>(s.when-s.delay-s.request.audioTime)*1000).sort((a,b)=>a-b);
 const ui=transient.filter(s=>/^(ui|tx)\./.test(s.id)),sources=rolling(data.starts),transients=rolling(transient);
 const row={name,seconds,actualSeconds:data.ended-started,integratedLufs:+levels.input_i,lra:+levels.input_lra,truePeakDbTP:+levels.input_tp,sourceStarts:data.starts.length,rollingAll:sources,rollingTransients:transients,requestToScheduleMs:{p50:latencies[Math.floor(latencies.length*.5)]??null,p95:latencies[Math.floor(latencies.length*.95)]??null,max:latencies.at(-1)??null},maxUiDurationMs:ui.length?Math.max(...ui.map(s=>(s.delay+s.bufferDuration/s.rate)*1000)):null,voiceLines:[...new Set(transient.filter(s=>s.bus==='voice').map(s=>s.id))],restarts:data.restarts,errors,settings:data.settings,capture:signed(path),events:signed(events)};
 rows.push(row);console.log(JSON.stringify(row));
 writeFileSync(resolve(out,'check.json'),JSON.stringify({at:new Date().toISOString(),trial,harness,signature,method:'Actual unnormalized browser output; real source.start arguments, request times and duck samples. Local seeded rules fixtures restart on completion; menus use UI actions. No output-mix changes. getOutputTimestamp is a device-time estimate, not physical loopback proof. Short runs are diagnostic; 1800 seconds required for duration gate.',preload:args.preload==='true',rows},null,2)+'\n');
}}finally{await browser.close();}
