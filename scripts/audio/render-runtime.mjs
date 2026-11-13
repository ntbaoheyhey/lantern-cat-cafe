/** Capture actual app output and UI actions. Fixtures seed local saves, never cues. */
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {installOutputCapture} from './capture-page.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const base='reports/v3-shell/b2',trial=process.env.MIX_TRIAL||'baseline';
const mutedBuses=(process.env.DIAGNOSTIC_MUTE_BUSES||'').split(',').filter(Boolean);
if(mutedBuses.length&&!trial.startsWith('diagnostic-'))throw Error('Stem isolation must be labelled diagnostic, never acceptance evidence.');
const names=(process.env.AUDIO_SCENES||'battle,boss,home,bag,gacha,forge').split(',');
const durations={battle:180,boss:120,home:60,bag:60,gacha:60,forge:60};
const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
mkdirSync(`${base}/renders`,{recursive:true});mkdirSync(`${base}/mix`,{recursive:true});mkdirSync('tmp/b2-mix',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
try{
 for(const name of names){
  const seconds=Number(process.env.AUDIO_SECONDS||durations[name]),errors=[],actions=[];
  const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
  p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='warning'&&m.text().startsWith('Audio unavailable'))errors.push(m.text());});
  const raw=`tmp/b2-mix/${trial}-${name}.webm`,output=`${base}/renders/${trial}-${name}.opus`;
  await installOutputCapture(p,raw);
  await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
  await p.goto('http://127.0.0.1:5994/?demo=1&squad=1&turn3d=1&cardrpg2=1&a6=1&formationc2=1');
  await p.getByRole('button',{name:'Play free',exact:true}).click();await p.locator('.uv-shell').waitFor();
  await p.evaluate(async()=>{
   const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
   m.state.tutorial=5;m.state.freeInvite=true;m.state.economyV3=true;m.state.settings.reducedMotion=false;
   m.state.account.currencies={...m.state.account.currencies,fish:200000,threads:50000,stamps:6000};m.state.materials=500;m.state.seals=10;
   for(const item of R.itemCatalogueV4())m.state.account.inventory.stacks[item.id]=10;
   for(let n=0;n<4;n++)m.state.gear.push(R.makeGear(m.state,'hearthloom-weapon-common',1));
   m.notify(false);await window.__thAudio.unlock();
  });
  await p.waitForTimeout(1800);
  for(let n=0;n<15;n++){const dismiss=p.getByRole('button',{name:/^(Dismiss celebration|Skip celebration)$/}).first();if(!await dismiss.isVisible().catch(()=>false))break;await dismiss.click();}
  if(['battle','boss'].includes(name)){
   await p.evaluate(async name=>{
    const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-chain/packages/game-rules/src/cardrpg/depth/index.ts');
    m.watchNow();
    // Rules-built encounter with a fixed seed for repeatable mix comparisons.
    // The seed changes randomness only; roster, stats and actions remain real.
    m.plan=null;m.tutorialBattle=R.createBattle({...m.battle.initial,seed:20261113,...(name==='boss'?{enemies:['yarn-giant']}:{enemies:['teacup-healer','sock-skipper']}),tutorial:false});m.fight();
    window.__mixStats={restarts:0,initial:m.battle.initial,start:Date.now()};
    window.__mixTimer=setInterval(()=>{
     if(m.screen!=='result')return;
     m.plan=null;m.tutorialBattle=R.createBattle(window.__mixStats.initial);m.fight();
     window.__mixStats.restarts++;
    },75);
   },name);
  }else if(name!=='home'){
   await p.evaluate(screen=>window.__depthReview.go(screen),name==='gacha'?'gacha':'inventory');
   await p.locator(name==='gacha'?'.uv-recruit':'.b2-bag').first().waitFor();
  }
  await p.waitForTimeout(500);
  if(mutedBuses.length)await p.evaluate(buses=>{for(const bus of buses)window.__thAudio.setBus(bus,0);},mutedBuses);
  await p.evaluate(()=>{window.__thAudio.hits.length=0;});
  const started=await p.evaluate(()=>window.__outputCapture.start());
  const waitUntil=async at=>{const remaining=started*1000+at*1000-Date.now();if(remaining>0)await p.waitForTimeout(remaining);};
  const action=async(label,fn)=>{await fn();actions.push({label,atSeconds:(Date.now()/1000-started)});};
  if(name==='home'){
   const dock=p.getByRole('navigation',{name:'Cafe dock'}).getByRole('button');
   const count=await dock.count();
   for(let i=0;i<6;i++){await waitUntil((i+1)*seconds/8);await action('hover home dock',()=>dock.nth(i%count).hover());}
  }else if(name==='bag'){
   for(let i=0;i<8;i++){
    await waitUntil((i+1)*seconds/10);
    await action('inspect gear',()=>p.locator('.b2-bag-grid button').nth(i%2).click());
    if(i===2||i===5){await action('inspect set',()=>p.getByRole('button',{name:'Set & affixes',exact:true}).click());await p.waitForTimeout(500);await action('close item',()=>p.getByRole('button',{name:'Close help',exact:true}).click());}
   }
  }else if(name==='gacha'){
   await waitUntil(2);await action('ten invitations',()=>p.getByRole('button',{name:/Recruit ×10/}).click());
   await p.locator('[aria-label="Invitation results"]').waitFor();
   await action('results',async()=>{});
  }else if(name==='forge'){
   await waitUntil(1);await action('open enhance',()=>p.getByRole('button',{name:/^Enhance \+/}).click());
   for(let i=0;i<5;i++){await waitUntil(2+i*seconds/12);await action('enhance',()=>p.getByRole('button',{name:/^Confirm enhance \+/}).click());}
   await p.waitForTimeout(1000);await action('close enhance',()=>p.getByRole('button',{name:'Close dialog',exact:true}).click());
   await waitUntil(seconds*.65);await action('open fusion',()=>p.getByRole('button',{name:'Gear workshop',exact:true}).click());
   const tiles=p.locator('.b2-fusion-grid button');
   for(let i=(await tiles.count())-4;i<await tiles.count();i++)await action('fusion input',()=>tiles.nth(i).click());
   await action('fuse',()=>p.getByRole('button',{name:/^Fuse 4\/4/}).click());
  }
  await waitUntil(seconds+1.25);
  const ended=await p.evaluate(()=>window.__outputCapture.stop());
  const runtime=await p.evaluate(()=>{clearInterval(window.__mixTimer);return {hits:window.__thAudio.hits,stats:window.__mixStats,settings:window.__thAudio.settings,diagnostics:window.__thAudio.diagnostics};});
  const log=`${base}/mix/${trial}-${name}-runtime.json.gz`;
  writeFileSync(log,gzipSync(JSON.stringify({name,started,ended,actions,errors,...runtime})));
  await p.close();
  execFileSync('ffmpeg',['-v','error','-y','-i',raw,'-c:a','copy',output]);rmSync(raw);
  const metrics=JSON.parse(execFileSync('python3',['scripts/audio/analyse.py',output,'--duration',String(seconds+.2)],{encoding:'utf8',maxBuffer:8e6}));
  const result={name,...signed(output),...metrics,algorithmSha256:signed('scripts/audio/analyse.py').sha256,runtime:signed(log),actions,errors,trial,...(mutedBuses.length?{diagnostic:true,mutedBuses}:{}),method:'Actual browser output, seeded local saves and real UI/rules actions; no test playback calls, output normalization or postmix effects.'};
  writeFileSync(`${base}/mix/${trial}-${name}.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({trial,name,seconds:metrics.durationSeconds,onsets:metrics.onsetsPerSecond,layers:metrics.layersPerOnset,ticks:metrics.tickTransientsPerSecond,voices:metrics.voiceContoursPerMinute,bed:metrics.musicBedFraction,lufs:metrics.integratedLufs,peak:metrics.truePeakDbTP,errors}));
  if(errors.length)process.exitCode=1;
 }
}finally{await browser.close();}
