/** Real menu operations, browser output audio, screencast timestamps and Chrome trace. */
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {installOutputCapture} from '../audio/capture-page.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const B='reports/v3-shell/b2',tmp='tmp/b2-motion',capture=process.env.MOTION_CAPTURE!=='0',quick=process.env.MOTION_QUICK==='1',trial=process.env.MOTION_TRIAL||'u4';
mkdirSync(tmp,{recursive:true});mkdirSync(`${B}/tests`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'no-preference'}),p=await context.newPage(),errors=[],frames=[];
p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const cdp=await context.newCDPSession(p);
const audioFile=`${tmp}/${trial}-audio.webm`;
await installOutputCapture(p,audioFile);
await p.addInitScript(()=>{
 localStorage.setItem('lantern.coach.v3','{"disabled":true}');
 window.__motion={frames:[],shifts:[],steps:[],active:false};
 new PerformanceObserver(list=>{for(const e of list.getEntries())if(window.__motion.active)window.__motion.shifts.push({at:e.startTime,value:e.value,hadRecentInput:e.hadRecentInput,sources:e.sources.map(s=>({tag:s.node?.tagName,cls:s.node?.className,from:s.previousRect,to:s.currentRect}))});}).observe({type:'layout-shift',buffered:true});
 const frame=t=>{if(window.__motion.active)window.__motion.frames.push(t);requestAnimationFrame(frame);};requestAnimationFrame(frame);
});
const mark=async name=>{await p.evaluate(name=>{performance.mark('menu:'+name);window.__motion.steps.push({name,at:performance.now()});},name);console.log(trial,name);};
const rest=async seconds=>p.waitForTimeout(quick?200:seconds*1000);
const close=async()=>{await p.locator('.uv-sheet-heading').getByRole('button',{name:'Close',exact:true}).click();await p.locator('.uv-sheet').waitFor({state:'detached'});};
const dock=label=>p.getByRole('navigation',{name:'Cafe dock'}).getByRole('button',{name:label,exact:true}).click();
let recording=false,complete;
try{
 await p.goto('http://127.0.0.1:5996/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1');
 await p.getByRole('button',{name:'Play free',exact:true}).click();await p.locator('.uv-shell').waitFor();
 await p.evaluate(async()=>{
  const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state.tutorial=5;m.state.freeInvite=true;m.state.economyV3=true;m.state.settings.reducedMotion=false;m.state.account.currencies={...m.state.account.currencies,fish:20000,threads:5000,stamps:6000};
  m.state.materials=500;m.state.seals=10;m.state.account.cards.forEach(c=>{c.shards=100;});
  for(const i of R.itemCatalogueV4())m.state.account.inventory.stacks[i.id]=10;
  m.notify(false);await window.__thAudio.unlock();await window.__thAudio.preload('home');window.__thAudio.music('home');
 });
 await p.waitForTimeout(2500);await p.evaluate(()=>document.fonts.ready);
 for(let n=0;n<10;n++){const dismiss=p.getByRole('button',{name:/^(Dismiss celebration|Skip celebration)$/}).first();if(!await dismiss.isVisible().catch(()=>false))break;await dismiss.click();}
 complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));
 await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.frame',transferMode:'ReturnAsStream'});
 if(capture){cdp.on('Page.screencastFrame',event=>{const path=`${tmp}/${trial}-${String(frames.length).padStart(5,'0')}.jpg`;writeFileSync(path,Buffer.from(event.data,'base64'));frames.push({path,time:event.metadata.timestamp});void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId});});await cdp.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:1280,maxHeight:720,everyNthFrame:2});}
 const audioStart=await p.evaluate(()=>window.__outputCapture.start());recording=true;
 await p.evaluate(()=>{window.__thAudio.hits.length=0;window.__motion.active=true;window.__motion.start=performance.now();});
 await mark('home');await rest(3);
 await mark('daily-gift');await p.getByRole('button',{name:'Daily quests',exact:true}).click();await p.locator('.a6-login .cr-primary').click();await rest(1.5);await close();await rest(1);
 await mark('team');await dock('Team');await p.locator('.b2-formation').waitFor();await rest(4);
 await p.getByRole('button',{name:/Saved/}).click();await rest(.7);await p.getByRole('button',{name:'Close dialog',exact:true}).click();await p.locator('.b2-dialog').waitFor({state:'detached'});await close();
 await mark('hero');await dock('Cats');await rest(3);await p.locator('.a6-cat-tabs').getByRole('button',{name:'Skills',exact:true}).click();await rest(1.8);await close();
 await mark('bag');await dock('Bag');await rest(3);
 await mark('forge');await p.getByRole('button',{name:'Enhance +1',exact:true}).click();await rest(1);await p.getByRole('button',{name:'Confirm enhance +1',exact:true}).click();await rest(2.5);
 await p.getByRole('button',{name:'Close dialog',exact:true}).click();await p.locator('.b2-dialog').waitFor({state:'detached'});await close();
 await mark('invitations');await p.getByRole('button',{name:'Invitations',exact:true}).click();await rest(1.5);
 await p.getByRole('button',{name:/Recruit ×10/}).click();await p.locator('[aria-label="Invitation results"]').waitFor();await rest(3);await close();
 await mark('market');await dock('Market');await p.locator('.chain-room').waitFor();await p.getByRole('button',{name:'Buy',exact:true}).first().waitFor();await rest(4);
 await p.getByRole('button',{name:'Buy',exact:true}).first().click();await p.getByRole('dialog',{name:'Buy',exact:true}).waitFor();await rest(1.2);await p.getByRole('button',{name:'Close dialog',exact:true}).click();await p.getByRole('dialog',{name:'Buy',exact:true}).waitFor({state:'detached'});
 await p.getByRole('button',{name:'Close market',exact:true}).click();await p.locator('.chain-room').waitFor({state:'detached'});
 await mark('season');await dock('Season');await p.getByRole('dialog',{name:'season',exact:true}).waitFor();await rest(4);await p.getByRole('button',{name:'Close page',exact:true}).click();await p.getByRole('dialog',{name:'season',exact:true}).waitFor({state:'detached'});
 await mark('wallet');await p.getByRole('button',{name:'Open menu',exact:true}).click();await p.getByRole('button',{name:'Open Fuji wallet',exact:true}).click();await p.getByRole('dialog',{name:'Fuji panel',exact:true}).waitFor();await rest(4);
 await p.getByRole('button',{name:'Close Fuji',exact:true}).click();await p.getByRole('dialog',{name:'Fuji panel',exact:true}).waitFor({state:'detached'});
 const elapsed=await p.evaluate(()=>(performance.now()-window.__motion.start)/1000);if(!quick&&elapsed<62)await rest(62-elapsed);
 const audioEnd=await p.evaluate(()=>window.__outputCapture.stop());recording=false;
 const data=await p.evaluate(()=>{window.__motion.active=false;return {...window.__motion,hits:window.__thAudio.hits};});
 if(capture)await cdp.send('Page.stopScreencast');await cdp.send('Tracing.end');const {stream}=await complete,parts=[];
 while(true){const chunk=await cdp.send('IO.read',{handle:stream});parts.push(chunk.data);if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
 const tracePath=`${B}/tests/${trial}-trace.json.gz`;writeFileSync(tracePath,gzipSync(parts.join('')));
 writeFileSync(`${B}/tests/${trial}-measurements.json`,JSON.stringify({...data,audioStart,audioEnd,errors},null,2)+'\n');
 // Count frames in one-second windows following each actual screen change.
 // Raw rAF times and the Chrome trace remain available; no FPS extrapolation.
 const windows=data.steps.map(s=>({name:s.name,frames:data.frames.filter(t=>t>=s.at&&t<s.at+1000).length}));
 const values=windows.map(s=>s.frames).sort((a,b)=>a-b),fps=values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2;
 let tour;
 if(capture){
  const selected=frames.filter(f=>f.time>=audioStart&&f.time<=audioEnd);if(!selected.length)throw Error('Screencast produced no frames.');
  const offset=selected[0].time-audioStart,rows=[];
  selected.forEach((f,i)=>{rows.push(`file '${f.path.split('/').at(-1)}'`,`duration ${Math.max(.001,(selected[i+1]?.time??audioEnd)-f.time)}`);});rows.push(`file '${selected.at(-1).path.split('/').at(-1)}'`);
  const list=`${tmp}/${trial}-frames.txt`;writeFileSync(list,rows.join('\n')+'\n');
  const output=`${B}/${quick?'UI-TOUR-PROBE':'UI-TOUR'}.webm`;
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',list,'-ss',String(offset),'-i',audioFile,'-t',String(audioEnd-selected[0].time),'-vf','fps=30,format=yuv420p','-c:v','libvpx-vp9','-b:v','0','-crf','36','-deadline','realtime','-cpu-used','6','-c:a','libopus','-b:a','128k',output],{stdio:'pipe',maxBuffer:1024*1024});
  const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',output],{encoding:'utf8'}));
  tour={...signed(output),durationSeconds:Number(meta.format.duration),hasAudio:meta.streams.some(s=>s.codec_type==='audio')};
  for(const f of frames)rmSync(f.path);rmSync(list);rmSync(audioFile);
 }
 const result={tour,trace:signed(tracePath),screenChanges:data.steps.length,layoutShifts:data.shifts.map(s=>s.value),transitionMedianFps:fps,transitionWindows:windows,method:'Real UI operations; browser audio output and timestamped CDP screencast. FPS counts rAF frames in each one-second screen-change window, backed by Chrome trace. All layout-shift entries, including recent input, are retained.',errors};
 writeFileSync(`${B}/${quick?'UI-MOTION-PROBE':capture?'UI-MOTION-CAPTURE':'UI-MOTION-PERF'}.json`,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({tourSeconds:tour?.durationSeconds,fps,maxShift:Math.max(0,...result.layoutShifts),errors}));
}finally{
 if(recording)await p.evaluate(()=>window.__outputCapture.stop()).catch(()=>{});
 await browser.close();
}
