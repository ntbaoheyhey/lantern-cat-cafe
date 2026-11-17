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
const report={utc:new Date().toISOString(),url,boardTag:board.match(/Latest green milestone:(.*)/)?.[1]?.trim(),indexSha256:hash(served),fixtureSource:execFileSync('git',['-C',integration,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),candidateSource:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),method:'Fresh 1280x720 BOARD production scene; existing fixture DTOs, exact presentation clock. Production pixels; not a normal-play or FPS claim.',rows:[],errors:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
 await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
 await page.goto(url+'&dev=1');
 await page.waitForFunction(()=>window.__depthReview,null,{timeout:60000});
 for(const id of (process.env.CXV_SKILLS??'boss-arrival,enemy:binding-thread,enemy:yarn-giant:basic,enemy:yarn-giant').split(',')){
  const arrival=id==='boss-arrival',fixture=pilotFixture(arrival?'mochi-1':id),plan=arrival?null:configureSequence(fixture.plan),frames=[],audit=[];
  await page.evaluate(({battle,plan,id})=>{const m=window.__depthReview;m.state.tutorial=4;Object.assign(m.state.settings,{quality:'high',speed:1,reducedMotion:false});Object.assign(m,{galleryBattle:battle,tutorialBattle:null,plan,galleryId:plan?id:'',animationAt:0,paused:true,sceneStarted:true,labOpen:false,screen:'map'});m.notify(false);},{battle:fixture.battle,plan,id});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  if(arrival)await page.evaluate(()=>{const s=window.__depthScene;cancelAnimationFrame(s.raf);s.render({...s.view(),frame:null,fixedTime:20,paused:true,galleryPreview:true},0);s.phaseNoticeAt=-100;for(const e of s.actors.values()){e.entered=e.asset==='yarn-giant'?20:-100;e.entranceDone=e.asset!=='yarn-giant';e.hurtAt=-100;}});
  const impact=plan?.beats[2].start??0;
  for(const [i,ms]of (arrival?[0,80,240,620]:[impact-1,impact,impact+90,impact+540]).entries()){
   audit.push(await page.evaluate(ms=>{const m=window.__depthReview,s=window.__depthScene;cancelAnimationFrame(s.raf);m.animationAt=ms;s.render({...s.view(),fixedTime:20+ms/1000,paused:true,galleryPreview:false},0);const boss=[...s.actors].find(([,e])=>e.asset==='yarn-giant');return {ms,bossFeet:boss?s.socket(boss[0],'feet'):null};},ms));
   const path=resolve(out,id.replaceAll(':','-')+'-'+i+'.png');await page.screenshot({path});frames.push(path);
  }
  const sheet=resolve(out,id.replaceAll(':','-')+'.jpg');
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...frames.flatMap(path=>['-i',path]),'-filter_complex','[0:v]scale=512:-1[a];[1:v]scale=512:-1[b];[2:v]scale=512:-1[c];[3:v]scale=512:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','4',sheet]);
  report.rows.push({id,impact,frames,sheet,audit});
 }
}finally{await browser.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({out,rows:report.rows.length,errors:report.errors}));
