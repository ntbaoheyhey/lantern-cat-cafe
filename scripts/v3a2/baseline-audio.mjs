/** Records the real B engine without changing any audio-owned source. */
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,evidenceMeta} from './check-gates.mjs';
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const config=JSON.parse(await readFile(resolve(root,'scripts/v3a2/fixtures.json'),'utf8'));
const browser=await chromium.launch({headless:true,args:['--use-angle=metal','--autoplay-policy=no-user-gesture-required']});
try{for(const fixture of config.fixtures){
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 await page.addInitScript(()=>{
  localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));
  const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(...args){
   if(args[0] instanceof AudioDestinationNode){
    window.__audioStream??=this.context.createMediaStreamDestination();
    connect.call(this,window.__audioStream);
   }
   return connect.apply(this,args);
  };
 });
 await page.goto('http://127.0.0.1:5990/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
 await page.waitForFunction(()=>window.__depthReview&&window.__thAudio,null,{timeout:90000});
 await page.evaluate(async({fixture,seed,root})=>{
  const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(seed),true));m.state.tutorial=4;
  m.state.settings.speed=1;m.state.settings.quality='high';m.state.settings.reducedMotion=false;
  for(const c of m.state.account.cards){c.level=6;m.state.skills[c.cardId]=R.CAT_BY_ID[c.cardId].skills.map(s=>s.id);}
  const b=R.createBattle({seed,chapter:fixture.chapter,cats:R.battleCats(m.state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});b.v4.committed=true;
  m.tutorialBattle=b;m.galleryBattle=null;m.replay=null;m.plan=null;m.roundPlan=null;m.watching=true;m.paused=true;m.sceneStarted=true;m.screen='map';m.notify(false);
  await window.__thAudio.unlock();await window.__thAudio.preload('battle');window.__thAudio.music(fixture.id==='boss'?'boss':'battle');
 },{fixture,seed:config.seed,root});
 await page.waitForFunction(()=>window.__depthScene?.ready&&window.__audioStream,null,{timeout:90000});
 const recorded=await page.evaluate(async()=>{
  const audio=window.__thAudio,chunks=[],rec=new MediaRecorder(window.__audioStream.stream,{mimeType:'audio/webm;codecs=opus'});
  audio.hits.length=0;rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
  const stopped=new Promise(r=>rec.onstop=r);rec.start();const m=window.__depthReview;m.paused=false;m.nextStepAt=0;m.notify(false);
  await new Promise(r=>setTimeout(r,10000));m.paused=true;rec.stop();await stopped;
  const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());return {bytes:[...bytes],hits:audio.hits};
 });
 const folder=resolve(root,'reports/v3-battle/a2/R/baseline',fixture.id);await mkdir(folder,{recursive:true});
 await writeFile(resolve(folder,'audio.webm'),Buffer.from(recorded.bytes));
 await writeFile(resolve(folder,'audio.json'),JSON.stringify({_meta:evidenceMeta(),seconds:10,hits:recorded.hits},null,2)+'\n');
 console.log(`${fixture.id}: ${recorded.bytes.length} audio bytes; ${recorded.hits.length} real cue events`);await page.close();
}}finally{await browser.close();}
