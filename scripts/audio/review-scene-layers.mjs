/** Real chapter encounters and a boss, through the shell's normal audio routing. */
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {installOutputCapture} from './capture-page.mjs';
import {runtimeSignature,assertUnchanged} from './runtime-signature.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const root=process.env.AUDIO_RUNTIME_ROOT,url=process.env.AUDIO_URL;
if(!root||!url)throw Error('Set runtime root and URL');
const base='reports/v3-shell/b2/polish/P3';mkdirSync(base,{recursive:true});
const sign=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
const sources=runtimeSignature(root),browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const rows=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(e.message));
 const raw=base+'/scene-reel.webm';await installOutputCapture(page,raw,{});
 await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
 await page.goto(url+'/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
 await page.getByRole('button',{name:'Play free',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview);
 await page.evaluate(async()=>{await window.__thAudio.unlock();window.__depthReview.watchNow();});
 await page.evaluate(()=>window.__outputCapture.start());
 for(const chapter of [1,2,3,0]){
  await page.evaluate(async({chapter,root})=>{
   const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
   m.plan=null;m.roundPlan=null;m.tutorialBattle=R.createBattle({...m.battle.initial,chapter:chapter||1,
    enemies:chapter?['teacup-healer','sock-skipper']:['yarn-giant'],tutorial:false});m.fight();
  },{chapter,root});
  const cue=chapter?`ambience.chapter-${chapter}`:'music.boss.dawn';
  await page.waitForFunction(cue=>window.__thAudio.hits.some(h=>h.id===cue&&h.result==='played'),cue);
  const samples=[];
  for(const wait of chapter?[1000,6000]:[1000,15000,16000]){
   await page.waitForTimeout(wait);
   samples.push(await page.evaluate(()=>({at:Date.now(),beds:window.__thAudio.bedIds,active:[...window.__thAudio.active].filter(p=>p.bus==='music'||p.bus==='ambience').map(p=>({id:p.id,gain:p.gain.gain.value,rate:p.source.playbackRate.value,start:p.source.loopStart,end:p.source.loopEnd})),diagnostics:window.__thAudio.diagnostics})));
  }
  rows.push({chapter,boss:!chapter,cue,samples});
 }
 // Leave an unfinished encounter through the same retreat flow as the HUD.
 await page.evaluate(()=>window.__depthReview.leave());
 await page.waitForFunction(()=>!window.__depthReview.showBattle&&window.__thAudio.bedIds.music==='music.home');
 await page.waitForTimeout(1200);
 const cleanup=await page.evaluate(()=>({active:[...window.__thAudio.active].map(p=>p.id),hits:window.__thAudio.hits}));
 await page.evaluate(()=>window.__outputCapture.stop());
 execFileSync('ffmpeg',['-v','error','-y','-i',raw,'-c:a','libmp3lame','-b:a','128k',base+'/SCENE-REEL.mp3']);rmSync(raw);
 assertUnchanged(root,sources);
 writeFileSync(base+'/playback.json',JSON.stringify({at:new Date().toISOString(),sources,rows,cleanup,errors,reel:sign(base+'/SCENE-REEL.mp3'),method:'Real rules-built chapter encounters and boss routed by ShellV3; no direct playback cue injection.'},null,2)+'\n');
 console.log(JSON.stringify({chapters:rows.filter(r=>r.chapter).map(r=>r.cue),dawn:rows.at(-1).samples.map(s=>s.active.find(p=>p.id==='music.boss.dawn')?.gain),leftover:cleanup.active.filter(id=>id==='music.boss.dawn'),errors}));
}finally{await browser.close();}
