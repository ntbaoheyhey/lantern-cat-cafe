/** Real-time production gameplay and its actual mixed audio; no presentation clock. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {waitForBattleReady} from '../v4ship-lab/rehearsal/battle-ready.mjs';
import {installOutputCapture} from '../../scripts/audio/capture-page.mjs';

const root=resolve(import.meta.dirname,'../..'),label=process.argv[2],scenario=process.argv[3]??'all',seconds=Number(process.argv[4]??30);
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a fresh evidence label');
assert(['all','wave1','wave3','boss'].includes(scenario)&&[5,30].includes(seconds),'Use official scenario and 5-second pilot or 30-second film');
const stop=()=>{for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);};stop();
const out=resolve(root,'work/v5/CXI/films',label);assert(!existsSync(out),'Preserve previous films');mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3',setupUrl=url+'&dev=1',hash=data=>createHash('sha256').update(data).digest('hex');
const index=readFileSync(resolve(root,'apps/web/dist/index.html'));assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),hash(index),'Preview differs from built artifact');
const req=createRequire(resolve(root,'apps/web/package.json')),{chromium}=req('@playwright/test');
const config=JSON.parse(readFileSync(resolve(root,'scripts/v3a2/fixtures.json'))),modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
const report={utc:new Date().toISOString(),url,setupUrl,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),indexSha256:hash(index),viewport:{width:1280,height:720},seconds,method:'Real-time 1x browser gameplay. Official seed71 level6 squad fixtures selected through existing review API, then dev query removed before recording; no injected HP, damage, rage, result, frame stepping or generated footage. Actual browser audio output tee; native viewport video, trimmed at approximate wall-clock playback start (not frame-exact sync). Fixtures are not the ordinary guest journey or real Fuji proof.',rows:[],complete:false};
const save=()=>writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of config.fixtures.filter(f=>scenario==='all'||f.id===scenario)){
  stop();const dir=resolve(out,fixture.id);mkdirSync(dir);
  const row={fixture:fixture.id,errors:[],httpFailures:[],blocked:[],complete:false};report.rows.push(row);save();
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block',recordVideo:{dir,size:report.viewport}});
  const pageCreated=performance.now(),page=await context.newPage(),video=page.video(),audio=resolve(dir,'actual-audio.webm');
  await installOutputCapture(page,audio);
  page.on('pageerror',error=>row.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')row.errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)row.httpFailures.push({url:response.url(),status:response.status()});});
  await page.route('**/*',route=>{
   const request=route.request(),target=new URL(request.url());if(request.method()!=='POST')return route.continue();
   let body;try{body=request.postDataJSON();}catch{row.blocked.push(target.pathname);return route.abort();}
   const calls=Array.isArray(body)?body:[body];
   if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
   row.blocked.push(target.origin+target.pathname);return route.abort();
  });
  await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
  try{
   await page.goto(setupUrl);await page.getByRole('button',{name:'Play free',exact:true}).click();await page.waitForFunction(()=>window.__depthReview);
   const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
   Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
   for(const card of state.account.cards){card.level=6;state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(skill=>skill.id);}
   const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});battle.v4.committed=true;
   await page.evaluate(({state,battle,url})=>{history.replaceState(null,'',url);const m=window.__depthReview;m.state=state;Object.assign(m,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});m.notify(false);},{state,battle,url});
   await waitForBattleReady(page,90000);await page.evaluate(()=>document.fonts.ready);
   row.captureUrl=page.url();assert.equal(row.captureUrl,url);row.captureUtc=new Date().toISOString();row.videoTrimSeconds=(performance.now()-pageCreated)/1000;
   row.start=await page.evaluate(async()=>{await window.__outputCapture.start();const m=window.__depthReview;m.paused=false;m.notify(false);return {at:performance.now(),round:m.battle.round,hp:m.battle.actors.map(a=>({id:a.id,hp:a.hp}))};});
   await page.waitForTimeout(seconds*1000);stop();
   row.end=await page.evaluate(async()=>{const m=window.__depthReview;const result={at:performance.now(),round:m.battle?.round,result:m.battle?.result,hp:m.battle?.actors.map(a=>({id:a.id,hp:a.hp}))};await window.__outputCapture.stop();return result;});
   assert(row.end.round>row.start.round||JSON.stringify(row.start.hp)!==JSON.stringify(row.end.hp),'Gameplay must really progress during recording');
  }catch(error){row.failure=String(error.message).slice(0,1000);}
  finally{await context.close();}
  if(!row.failure){
   const raw=await video.path(),film=resolve(dir,fixture.id+'-'+seconds+'s.mp4');assert(statSync(audio).size>1000,'Actual browser audio was not recorded');
   execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-ss',String(row.videoTrimSeconds),'-i',raw,'-i',audio,'-map','0:v:0','-map','1:a:0','-t',String(seconds),'-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-r','30','-af','apad','-c:a','aac','-b:a','160k','-movflags','+faststart',film]);
   const probe=JSON.parse(execFileSync('ffprobe',['-v','quiet','-show_entries','format=duration:stream=codec_type,width,height','-of','json',film],{encoding:'utf8'}));
   assert(probe.streams.some(s=>s.codec_type==='audio')&&probe.streams.some(s=>s.codec_type==='video'&&s.width===1280&&s.height===720),'Film must include full desktop and actual audio');
   assert(Math.abs(Number(probe.format.duration)-seconds)<.15,'Film duration must match requested duration');
   const volume=spawnSync('ffmpeg',['-hide_banner','-i',film,'-af','volumedetect','-vn','-f','null','-'],{encoding:'utf8'});assert.equal(volume.status,0);
   row.audioMeanDb=Number(volume.stderr.match(/mean_volume: ([-\d.]+) dB/)?.[1]);row.audioPeakDb=Number(volume.stderr.match(/max_volume: ([-\d.]+) dB/)?.[1]);
   assert(Number.isFinite(row.audioPeakDb)&&row.audioPeakDb>-60,'Recorded game audio must have an audible signal');
   const sheet=resolve(dir,'contact-1024.jpg');execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-i',film,'-vf',`fps=1/${seconds/4},scale=512:288,tile=2x2`,'-frames:v','1','-q:v','3',sheet]);
   Object.assign(row,{film,rawVideo:raw,audio,sheet,probe,bytes:statSync(film).size,sha256:hash(readFileSync(film)),complete:!row.errors.length&&!row.httpFailures.length&&!row.blocked.length});
  }
  save();console.log(JSON.stringify({fixture:row.fixture,complete:row.complete,errors:row.errors,failure:row.failure,film:row.film}));if(!row.complete)break;
 }
}finally{await browser.close();report.complete=report.rows.length===(scenario==='all'?3:1)&&report.rows.every(row=>row.complete);save();}
process.exitCode=report.complete?0:1;
