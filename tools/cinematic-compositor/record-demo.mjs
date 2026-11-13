/** Local, audible integration review. No wallets, remote writes or deployed services. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const out=resolve(root,'reports/v3-battle/A6'),temp=resolve(root,'work/demo-v3-capture');
const desktop='/Users/bao/Desktop/TaskbarHero-REVIEW';
const base=process.env.DEMO_URL??'http://127.0.0.1:5990';
await mkdir(temp,{recursive:true});await mkdir(out,{recursive:true});await mkdir(desktop,{recursive:true});
const run=(command,args)=>new Promise((yes,no)=>{
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe']}),stdout=[],stderr=[];
  child.stdout.on('data',chunk=>stdout.push(chunk));child.stderr.on('data',chunk=>stderr.push(chunk));
  child.on('error',no);child.on('exit',code=>code===0?yes(Buffer.concat(stdout)):no(Error(Buffer.concat(stderr).toString().slice(-3000))));
});
const browser=await chromium.launch({headless:true,args:['--use-angle=metal'],ignoreDefaultArgs:['--mute-audio']});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:temp,size:{width:1280,height:720}}});
const page=await context.newPage(),errors=[],checkpoints=[];
page.on('pageerror',e=>errors.push(e.message));
let raw,start;
try{
  await page.addInitScript(()=>{
    localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));
    // Observe the existing master output; never create a second audio engine.
    const connect=AudioNode.prototype.connect;
    AudioNode.prototype.connect=function(...args){
      const result=connect.apply(this,args);
      if(args[0]===this.context.destination){
        const tap=this.context.createMediaStreamDestination();connect.call(this,tap);
        const chunks=[];const recorder=new MediaRecorder(tap.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:128000});
        recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
        window.__demoAudio={
          start(){recorder.start(250);},
          stop(){return new Promise(resolve=>{recorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.readAsDataURL(new Blob(chunks,{type:'audio/webm'}));};recorder.stop();});},
        };
      }
      return result;
    };
  });
  await page.goto(base+'/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
  await page.evaluate(()=>document.fonts.ready);
  await page.mouse.click(1200,90);
  await page.waitForFunction(()=>window.__demoAudio&&window.__thAudio?.ready);
  await page.evaluate(async()=>{await window.__thAudio.preload('landing');await window.__thAudio.preload('battle');window.__thAudio.music('landing');});
  // A 300ms marker establishes video/audio alignment to one encoded video frame.
  // Both marker and matching audio prefix are removed from the delivered clip.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>{
    const marker=document.createElement('div');marker.id='demo-sync';marker.style.cssText='position:fixed;left:0;top:0;width:8px;height:8px;background:white;z-index:2147483647';
    document.body.append(marker);window.__demoAudio.start();setTimeout(()=>{marker.remove();resolve();},300);
  })));
  start=performance.now();
  const until=async seconds=>{while(performance.now()-start<seconds*1000)await page.waitForTimeout(Math.min(1000,seconds*1000-(performance.now()-start)));};
  const checkpoint=async name=>{checkpoints.push({name,seconds:(performance.now()-start)/1000});await page.screenshot({path:resolve(out,'demo-'+name+'.png')});console.log(name);};
  await checkpoint('landing');await until(5);
  await page.getByRole('button',{name:'Play free',exact:true}).click();
  await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{
    const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.state.v4.journey.pending=[];m.go('hub');
  });
  await page.locator('.uv-dock').waitFor();await until(9);await checkpoint('home');await until(15);
  const fixture=await page.evaluate(async()=>{
    const m=window.__depthReview;
    const R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
    for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(skill=>skill.id);}
    m.state.settings.speed=1;m.state.settings.quality='high';m.state.settings.reducedMotion=false;
    const enemies=['button-guard','needle-moth','sock-skipper','spool-ram'];
    const initial={seed:71,chapter:1,cats:R.battleCats(m.state),enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true,
      enemyStats:Object.fromEntries(enemies.map(id=>[id,{hp:450,attack:45,defense:4}]))};
    const battle=R.createBattle(initial);
    for(const actor of battle.actors)if(['mochi','soot'].includes(actor.catalogId))actor.charge=100;
    battle.queue=['mochi','soot',...battle.queue.filter(id=>!['mochi','soot'].includes(id))];
    m.tutorialBattle=battle;m.galleryBattle=null;m.plan=null;m.watching=false;m.paused=false;m.go('prepare');
    return {initial,ready:['mochi','soot'],note:'Local review fixture only: level 6, two ready ultimates, four 450-HP enemies. Production rules and rewards are unchanged.'};
  });
  await checkpoint('formation');await until(19);
  await page.getByRole('button',{name:/^Fight/}).click();
  await page.waitForFunction(()=>window.__depthReview.sceneReady);
  await page.waitForFunction(()=>new Set(window.__thAudio.hits.filter(h=>h.result==='played'&&/^ult\.(mochi|soot)\.impact$/.test(h.id)).map(h=>h.id)).size===2,null,{timeout:30000});
  await checkpoint('battle');
  await page.evaluate(()=>{const m=window.__depthReview;m.state.settings.speed=3;m.notify(false);});
  await page.locator('.uv-result').waitFor({timeout:45000});
  const battle=await page.evaluate(()=>({result:window.__depthReview.battle.result,round:window.__depthReview.battle.round,choices:window.__depthReview.battle.choices}));
  assert.equal(battle.result,'party');await checkpoint('victory');
  assert.ok((performance.now()-start)/1000<70,'Battle left insufficient time for forge');
  await until(67);
  await page.evaluate(async()=>{
    const m=window.__depthReview,R=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
    m.tutorialBattle=null;m.sceneStarted=false;m.watching=false;m.state.run=null;m.state.tutorial=4;m.state.economyV3=true;
    const spec=R.GEAR.find(g=>g.rarity==='common');
    window.__demoForgeInputs=[];
    for(let i=0;i<4;i++){const gear=R.makeGear(m.state,spec.id,0);m.state.gear.push(gear);window.__demoForgeInputs.push(gear.id);}
    m.state.v4.journey.pending=[];m.go('hub');
  });
  await page.locator('[data-home-destination="Forge"]').click();
  await page.getByRole('button',{name:'Gear workshop',exact:true}).click();
  await page.locator('.b-bound-fusion').waitFor();
  const inputs=await page.evaluate(()=>window.__demoForgeInputs);
  for(const id of inputs)await page.getByRole('checkbox',{name:id,exact:true}).check();
  await checkpoint('forge');await until(75);
  await page.getByRole('button',{name:'Fuse',exact:true}).click();
  await page.locator('.b-fusion-reveal').waitFor();await checkpoint('forge-reveal');
  await until(90.7);
  const recorded=await page.evaluate(()=>window.__demoAudio.stop());
  const audioPath=resolve(temp,'mix.webm');await writeFile(audioPath,Buffer.from(recorded.split(',')[1],'base64'));
  const cues=await page.evaluate(()=>window.__thAudio.hits);
  const video=page.video();await context.close();raw=await video.path();
  assert.deepEqual(errors,[]);
  const metadata=JSON.parse((await run('ffprobe',['-v','error','-show_streams','-of','json',raw])).toString());
  const [n,d]=metadata.streams[0].avg_frame_rate.split('/').map(Number),fps=n/d;
  const markers=await run('ffmpeg',['-hide_banner','-loglevel','error','-i',raw,'-t','30','-vf','crop=8:8:0:0,format=gray','-f','rawvideo','-']);
  let first=-1;for(let i=0;i<markers.length/64;i++){let sum=0;for(let j=0;j<64;j++)sum+=markers[i*64+j];if(sum/64>248){first=i;break;}}
  assert.ok(first>=0,'Missing audio/video sync marker');
  const target=resolve(out,'demo-v3.webm');
  await run('ffmpeg',['-hide_banner','-loglevel','error','-y','-ss',String(first/fps+.3),'-i',raw,'-ss','.3','-i',audioPath,'-t','90','-map','0:v:0','-map','1:a:0','-vf','fps=30','-c:v','libvpx-vp9','-crf','34','-b:v','0','-row-mt','1','-cpu-used','5','-c:a','libopus','-b:a','112k',target]);
  await copyFile(target,resolve(desktop,'demo-v3.webm'));
  await writeFile(resolve(out,'demo-review.json'),JSON.stringify({errors,fixture,battle,checkpoints,audio:{source:'Unmodified live AudioEngine master output',synchronizationFrameSeconds:1/fps,played:cues.filter(c=>c.result==='played').length,ultimateImpacts:cues.filter(c=>c.result==='played'&&/^ult\..*\.impact$/.test(c.id)),forge:cues.filter(c=>c.id==='ui.forge-success')},seconds:90},null,2)+'\n');
  await rm(temp,{recursive:true,force:true});console.log('90-second audible demo captured');
}finally{await browser.close();}
