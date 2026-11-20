// Uninterrupted legal A6 replay, recorded at x1 without synthetic animation ticks.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(process.env.PUPPET_PREVIEW_ROOT||process.cwd());
const require=createRequire(root+'/apps/web/package.json');
const {chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.ART_ARTIFACT),out=resolve(process.env.ART_OUT);
const name=process.env.ART_FILM_NAME||'battle',seconds=Number(process.env.ART_SECONDS||75);
const complete=process.env.ART_COMPLETE==='1',previewRate=process.env.ART_PREVIEW_RATE||'180k';
const replay=JSON.parse(await readFile(process.env.ART_SETUP,'utf8'));
const master=resolve('/Users/bao/art/look-v3/films',name);
await mkdir(out,{recursive:true});
async function encodeCapture(capture){
 const full=capture.master,proxy=capture.preview,raw=capture.raw;
 if(!existsSync(full)){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',raw+'/frames.txt','-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart',full+'.encoding.mp4']);await rename(full+'.encoding.mp4',full);}
 if(!existsSync(proxy)){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',full,'-vf','scale=960:600','-c:v','libx264','-preset','slow','-crf','31','-maxrate',previewRate,'-bufsize','360k','-movflags','+faststart',proxy+'.encoding.mp4']);await rename(proxy+'.encoding.mp4',proxy);}
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height,nb_frames:format=duration,size','-of','json',full],{encoding:'utf8'}));
 const result={...capture,method:'Continuous x1 playback of a legal seeded A6 rules replay. No tick injection, compositing or speed changes. Excerpt stops at the requested duration or battle result. Recording is not a performance sample.',completeBattle:capture.ended,expectedResult:replay.expectedResult,probe};
 await writeFile(out+'/'+name+'.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({name,seconds:capture.observation.seconds,ultimates:capture.observation.events.filter(e=>e.ultimate).length,errors:capture.errors,ended:capture.ended,result:capture.observation.result,master:full,preview:proxy}));
 if(capture.errors.length||capture.observation.faceHpOverlap||capture.observation.events.filter(e=>e.ultimate).length<3||capture.observation.seconds<60||complete&&(!capture.ended||capture.observation.result!==replay.expectedResult||!capture.resultView?.visible))process.exitCode=1;
 }
const capturePath=out+'/'+name+'-capture.json';
if(existsSync(capturePath)){
 await encodeCapture(JSON.parse(await readFile(capturePath,'utf8')));
 process.exit(process.exitCode??0);
}
// A terminated capture cannot resume the clock exactly. Preserve its frames and
// put any new attempt in a distinct folder; completed captures resume encoding.
const raw=master+'/frames-'+Date.now();await mkdir(raw,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const frames=[],writes=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('file://'+artifact+'?a6=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 await page.evaluate(({setup,choices,account})=>{
  const m=window.__depthReview;m.galleryBattle=null;m.tutorialBattle=null;
  if(account)m.state=account;
  m.screen='hub';
  m.state.lastBattle=setup;m.state.lastChoices=choices;m.replayLast();m.paused=true;
  m.state.settings.speed=1;m.state.settings.reducedMotion=false;m.autoContinue=false;m.camera='wide';m.notify(false);
 },replay);
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady,null,{timeout:120000});
 await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
 const initial=await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;return{a6:m.a6Mode,setup:m.battle.initial,levels:m.state.account.cards.map(c=>({id:c.cardId,level:c.level})),actors:[...s.puppets.values()].map(p=>({id:p.asset,puppet:!!p.model.userData.lookPuppet}))};});
 if(!initial.a6||initial.actors.some(a=>!a.puppet))throw Error('Film requires the A6 shell and every illustrated actor');
 await sharp(await page.screenshot()).webp({quality:88}).toFile(out+'/'+name+'-start.webp');
 const cdp=await page.context().newCDPSession(page);
 cdp.on('Page.screencastFrame',e=>{
  const path=raw+'/'+String(frames.length).padStart(6,'0')+'.jpg';frames.push({path,at:e.metadata.timestamp});
  writes.push(writeFile(path,Buffer.from(e.data,'base64')));
  void cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1440,maxHeight:900,everyNthFrame:2});
 await page.evaluate(()=>{
  const m=window.__depthReview,seen=new Set(),formations=new Set();window.__filmEvents=[];window.__filmFormation=[];window.__filmStart=performance.now();
  const tick=()=>{
   const p=m.plan,s=window.__depthScene;
   if(p){const key=p.id+':'+p.skillId;
    if(!seen.has(key)){seen.add(key);window.__filmEvents.push({at:(performance.now()-window.__filmStart)/1000,id:p.presentationId??p.skillId,ultimate:p.ultimate&&/-4$/.test(p.presentationId??p.skillId),targets:p.targetIds});}
   }
   if(s)window.__filmOverlap=Math.max(window.__filmOverlap??0,s.labelAudit.overlaps);
   const helpers=m.battle.actors.filter(a=>a.hp>0&&a.catalogId==='binding-thread');
   const key=helpers.map(a=>a.id).sort().join(',');
   if(s&&helpers.length>=3&&!formations.has(key)&&helpers.every(a=>s.puppetBossAddLanes.has(a.id)&&s.puppets.get(a.id)?.asset==='binding-thread')){
    const bases=helpers.map(a=>({id:a.id,lane:s.puppetBossAddLanes.get(a.id),base:s.puppets.get(a.id).base.toArray()}));
    if(new Set(bases.map(a=>a.base.join(','))).size===helpers.length){formations.add(key);window.__filmFormation.push({at:(performance.now()-window.__filmStart)/1000,round:m.battle.round,bases});}
   }
   window.__filmRaf=requestAnimationFrame(tick);
  };
  m.paused=false;m.notify(false);window.__filmRaf=requestAnimationFrame(tick);
 });
 const start=Date.now();let ended=false;
 while(Date.now()-start<seconds*1000){
  await page.waitForTimeout(500);
  ended=await page.evaluate(()=>window.__depthReview.screen==='result'&&!window.__depthReview.plan);
  if(ended)break;
 }
 let resultView=null;
 if(ended){
  // The model reaches result before the lazy result panel is painted. Keep the
  // same uninterrupted screencast running until that real panel is readable.
  const heading=page.locator('.uv-result-title h2');
  await heading.waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>[...document.querySelectorAll('.uv-result img')].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:15000});
  const title=(await heading.innerText()).trim(),expected=replay.expectedResult==='party'?'Victory':replay.expectedResult==='enemy'?'Defeat':'Replay complete';
  if(title!==expected)throw Error('Unexpected visible result: '+title);
  await page.waitForTimeout(1800);
  resultView={title,heldMs:1800,visible:true};
 }
 await cdp.send('Page.stopScreencast');await Promise.all(writes);
 const observation=await page.evaluate(()=>{
  cancelAnimationFrame(window.__filmRaf);const m=window.__depthReview;m.paused=true;
  return{events:window.__filmEvents,formations:window.__filmFormation,ruleUltimates:m.battle?.v4?.events.filter(e=>e.kind==='ultimate.cast'),seconds:(performance.now()-window.__filmStart)/1000,result:m.battle?.result,round:m.battle?.round,faceHpOverlap:window.__filmOverlap??0,speed:m.state.settings.speed,reducedMotion:m.state.settings.reducedMotion,modelError:m.error,notice:m.notice};
 });
 await sharp(await page.screenshot()).webp({quality:88}).toFile(out+'/'+name+'-end.webp');
 if(frames.length<2)throw Error('No usable screencast frames');
 await writeFile(raw+'/frames.txt',frames.map((f,i)=>`file '${f.path}'\nduration ${Math.max(.001,i+1<frames.length?frames[i+1].at-f.at:.034)}`).join('\n')+`\nfile '${frames.at(-1).path}'\n`);
 const checkpoint={artifact,initial,observation,ended,resultView,frames:frames.length,master:master+'/'+name+'-1440.mp4',preview:out+'/'+name+'-preview.mp4',raw,errors};
 await writeFile(capturePath,JSON.stringify(checkpoint,null,2)+'\n');
 await encodeCapture(checkpoint);
}finally{await browser.close();}
