/** Current BOARD production capture: only fixture DTOs cross into the browser. */
import {chromium} from './browser-fixture.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const root=process.cwd(),integration='/Users/bao/taskbar-hero-chain';
const out=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-C-judge');
const board=await readFile('/Users/bao/taskbar-hero-mailbox/BOARD.md','utf8');
const url=board.match(/Judge URL:\s*(\S+)/)?.[1];
if(!url?.includes('ui=v3'))throw Error('BOARD judge route missing');
const compiled=resolve(out,'fixture');await mkdir(compiled,{recursive:true});
const entry=resolve(compiled,'entry.ts');
await writeFile(entry,`export {pilotFixture} from '${integration}/apps/web/src/game/cardrpg/vfx-layered/fixture.ts';\nexport {configureSequence} from '${integration}/apps/web/src/game/cardrpg/battle-v3/sequence.ts';`);
const require=createRequire(resolve(root,'apps/web/package.json'));
const {build}=await import(require.resolve('vite'));
await build({root,configFile:false,envDir:false,publicDir:false,logLevel:'silent',build:{emptyOutDir:false,outDir:compiled,minify:false,lib:{entry,formats:['es'],fileName:()=> 'fixture.mjs'}}});
const {pilotFixture,configureSequence}=await import(pathToFileURL(resolve(compiled,'fixture.mjs')).href);
const hash=data=>createHash('sha256').update(data).digest('hex');
const served=await(await fetch(url)).text(),built=await readFile(resolve(integration,'apps/web/dist/index.html'),'utf8');
if(hash(served)!==hash(built))throw Error('BOARD host differs from integration dist');
const report={utc:new Date().toISOString(),url,boardTag:board.match(/Latest green milestone:(.*)/)?.[1]?.trim(),indexSha256:hash(served),harnessSha256:hash(await readFile(import.meta.filename)),fixtureSource:execFileSync('git',['-C',integration,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidateSource:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Fresh 1280x720 BOARD production scene; existing fixture DTOs, exact presentation clock. Production pixels; not a normal-play or FPS claim.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.goto(url+'&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:60000});
 await page.evaluate(url=>history.replaceState(null,'',url),url);
 for(const id of (process.env.CXV_SKILLS??'boss-arrival,enemy:binding-thread,enemy:yarn-giant:basic,enemy:yarn-giant').split(',')){
  const arrival=id.startsWith('boss-arrival'),arrivalMode=arrival?id.slice('boss-arrival'.length)||'-normal':null;
  if(arrival&&!['-normal','-reduced','-acting','-incoming'].includes(arrivalMode))throw Error('Unknown arrival mode '+id);
  const reducedMotion=arrivalMode==='-reduced',earlyAction=arrivalMode==='-acting'||arrivalMode==='-incoming';
  const fixture=pilotFixture(arrival?(arrivalMode==='-acting'?'enemy:yarn-giant:basic':'mochi-1'):id),plan=arrival&&!earlyAction?null:configureSequence(fixture.plan),frames=[],audit=[];
  await page.evaluate(({battle,plan,id,reducedMotion})=>{const m=window.__depthReview;m.state.tutorial=4;Object.assign(m.state.settings,{quality:'high',speed:1,reducedMotion});Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,galleryId:plan?id:'',animationAt:0,paused:true,sceneStarted:true,labOpen:false,screen:'map'});m.notify(false);},{battle:fixture.battle,plan,id,reducedMotion});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  // The DOM wave banner follows real time, not our explicit scene clock. Let it
  // finish naturally before restarting the measured entrance presentation.
  await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  if(arrival)await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;for(const e of s.actors.values()){e.entered=e.asset==='yarn-giant'?20:-100;e.entranceDone=e.asset!=='yarn-giant';e.hurtAt=-100;}});
  const impact=plan?.beats[2].start??0;
  const sample=ms=>page.evaluate(({ms,arrival})=>{
   const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=arrival?Math.max(0,ms-80):ms;
   const view=s.view(),renderView={...view,frame:arrival&&ms<80?null:view.frame,fixedTime:20+ms/1000,paused:true,galleryPreview:false};s.render(renderView,0);
   const boss=[...s.actors].find(([,e])=>e.asset==='yarn-giant');
   const effects=Object.fromEntries(['craftThread','craftYarn','craftShield','craftHeal','craftOven','craft'].filter(k=>s[k]?.audit).map(k=>[k,structuredClone(s[k].audit)]));
   const net=s.craftThread?.rear;
   // One render per sample: repeating with altered entrance age would trigger
   // arrival accents and change reaction state in this stateful scene.
   return{ms,actionAt:m.animationAt,bossFeet:boss?s.socket(boss[0],'feet'):null,bossHome:boss?s.homes.get(boss[0])?.point:null,bossRoot:boss?s.motionAudit.find(a=>a.id===boss[0]):null,cinematic:{...s.cinematic},effects,netActive:net?.visible?net.children.filter(c=>c.visible).length:0,targets:m.plan?[...new Set(m.plan.events.flatMap(e=>e.targetIds??[]))]:[]};
  },{ms,arrival});
  const frameTimes=arrival?(earlyAction?[79,80,arrivalMode==='-acting'?160:280,430]:[0,80,240,620]):[impact-1,impact,impact+180,impact+540];
  const sampleTimes=earlyAction?[...new Set([...frameTimes,81,120,160,240,429,620])].sort((a,b)=>a-b):frameTimes;
  for(const ms of sampleTimes){
   audit.push(await sample(ms));
   const i=frameTimes.indexOf(ms);if(i<0)continue;
   const path=resolve(out,id.replaceAll(':','-')+'-'+i+'.png');await page.screenshot({path});frames.push(path);
  }
  const sheet=resolve(out,id.replaceAll(':','-')+'.jpg');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...frames.flatMap(path=>['-i',path]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',sheet]);
  if(!arrival&&plan.ultimate)for(const ms of [1760,2199])audit.push(await sample(ms));
  report.rows.push({id,arrivalMode,reducedMotion,impact,plan:plan?{duration:plan.duration,fixedTiming:plan.fixedTiming,speechLeadInMs:plan.speechLeadInMs,voiceWindows:plan.voiceWindows}:null,frames,sheet,audit});
 }
}catch(error){
 report.errors.push(error instanceof Error?error.message:String(error));
}finally{
 await browser.close();report.ended=new Date().toISOString();report.indexSha256After=hash(await(await fetch(url)).text());
 if(report.indexSha256After!==report.indexSha256)report.errors.push('Production index changed during capture');
 await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify({out,rows:report.rows.length,errors:report.errors}));
if(report.errors.length)process.exitCode=1;
