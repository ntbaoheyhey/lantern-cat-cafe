/** Fixed seed, fixed simulation clock, real renderer. Never changes combat stats. */
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {root,evidenceMeta} from './check-gates.mjs';
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const config=JSON.parse(await readFile(resolve(root,'scripts/v3a2/fixtures.json'),'utf8'));
const args=process.argv.slice(2),arg=(name,fallback)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:fallback;
const seconds=Number(arg('seconds','30')),fps=config.fps,id=arg('fixture','all');
const width=Number(arg('width','1280')),height=Number(arg('height','720'));
const out=resolve(root,arg('out','reports/v3-battle/a2/G0/capture'));
if(!out.startsWith(root+'/reports/')&&!out.startsWith(root+'/work/'))throw Error('Capture must remain in this worktree reports/ or work/');
const base=arg('url','http://127.0.0.1:5990');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of config.fixtures.filter(f=>id==='all'||f.id===id)){
  const folder=resolve(out,fixture.id);await mkdir(folder,{recursive:true});
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1}),errors=[],mediaRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',response=>{const u=new URL(response.url());if(u.pathname.startsWith('/cinematics/')&&response.status()>=400)mediaRequests.push(`Plate HTTP ${response.status()}: ${u.pathname}`);});
  page.on('requestfailed',request=>{const u=new URL(request.url());if(u.pathname.startsWith('/cinematics/'))mediaRequests.push(`Plate request failed: ${u.pathname}: ${request.failure()?.errorText}`);});
  await page.addInitScript(()=>{localStorage.setItem('lantern.entered.v3','1');localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true}));});
  // All app traffic is local; fonts and original game art are served by Vite.
  await page.route('**/*',route=>{const u=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)?route.continue():route.abort();});
  await page.goto(base+'/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.waitForFunction(()=>window.__depthReview,null,{timeout:90000});
  await page.evaluate(async({fixture,seed,root})=>{
    const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
    m.state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(seed),true));
    m.state.tutorial=4;m.state.settings.speed=1;m.state.settings.quality='high';m.state.settings.reducedMotion=false;
    for(const card of m.state.account.cards){card.level=6;m.state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(s=>s.id);}
    const battle=R.createBattle({seed,chapter:fixture.chapter,cats:R.battleCats(m.state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
    battle.v4.committed=true;
    m.tutorialBattle=battle;m.galleryBattle=null;m.replay=null;m.plan=null;m.roundPlan=null;m.watching=true;m.paused=true;m.sceneStarted=true;m.screen='map';m.notify(false);
    const {presentationTier}=await import('/@fs'+root+'/apps/web/src/game/cardrpg/battle-v3/presentation.ts');
    window.__v3a2={R,presentationTier,initial:structuredClone(battle),plans:[],lastPlan:null};
  },{fixture,seed:config.seed,root});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthScene.actors.size===window.__depthReview.battle.actors.length,null,{timeout:90000});
  await page.evaluate(()=>document.fonts.ready);
  // Cancel the native RAF before Playwright replaces request/cancelAnimationFrame.
  // A pre-install handle cannot be cancelled through the synthetic clock API.
  await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));
  await page.clock.install({time:new Date('2026-11-13T00:00:00Z')});
  await page.clock.pauseAt(new Date('2026-11-13T00:00:01Z'));
  // The capture owns the renderer clock. React's HUD RAF may still paint, but
  // a second scene RAF would mix performance.now() with fixedTime and reset bursts.
  await page.evaluate(()=>cancelAnimationFrame(window.__depthScene.raf));
  const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0','-an','-c:v','libvpx-vp9','-b:v','0','-crf','33','-row-mt','1','-pix_fmt','yuv420p',resolve(folder,'battle.webm')],{stdio:['pipe','ignore','pipe']});
  let fferror='';encoder.stderr.on('data',d=>{fferror+=d;});const encoded=new Promise((res,rej)=>{encoder.on('error',rej);encoder.on('close',code=>code===0?res():rej(Error(fferror)));});
  const frames=[],minimumFrames=Math.ceil(seconds*fps),completeActions=args.includes('--complete-actions');let outstanding=false;
  for(let i=0;i<minimumFrames||completeActions&&outstanding&&i<minimumFrames+fps*10;i++){
    const sample=await page.evaluate(({i,fps,minimumFrames})=>{
      const m=window.__depthReview,s=window.__depthScene,c=window.__v3a2;
      m.paused=false;
      if(!m.plan&&!m.battle.result&&i<minimumFrames)m.step();
      if(m.plan&&c.lastPlan!==m.plan){c.lastPlan=m.plan;c.plans.push({frame:i,at:i/fps,actorId:m.plan.actorId,skillId:m.plan.skillId,presentationId:m.plan.presentationId,ultimate:m.plan.ultimate,duration:m.plan.duration,events:structuredClone(m.plan.events)});}
      m.tick(i===0?0:1000/fps,1000+i*1000/fps);m.paused=true;
      s.render({...s.view(),fixedTime:10+i/fps,paused:true},1/fps);
      const audit=s.audit(),visibleWords=[...document.querySelectorAll('.b3-hud *')].filter(e=>e.childElementCount===0&&e.getClientRects().length).map(e=>e.textContent).join(' ').match(/\b[A-Za-z]+\b/g)??[];
      let coverage=null;
      if(i%3===0&&s.effects){const canvas=s.effects.canvas,px=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let pixels=0;for(let j=3;j<px.length;j+=4)if(px[j]>=64)pixels++;coverage=pixels/(innerWidth*innerHeight*(canvas.width/s.width)**2);}
      return {index:i,t:i/fps,fieldSize:{width:s.width,height:s.height},units:audit.units,motion:audit.motion??[],events:audit.events.slice(-8),sequence:{...audit.sequence},stats:{...audit.stats},numbers:s.numbers?.drawn??[],field:{...s.effects?.field?.audit,coverage},visibleWords,action:m.plan?{actorId:m.plan.actorId,skillId:m.plan.presentationId??m.plan.skillId,tier:c.presentationTier(m.plan),elapsed:m.animationAt,duration:m.plan.duration,impact:m.plan.beats[2].start}:null};
    },{i,fps,minimumFrames});
    outstanding=!!sample.action;
    // Paint HUD timers at a controlled clock; model stays paused during this tick.
    await page.clock.runFor(Math.round((i+1)*1000/fps)-Math.round(i*1000/fps));
    // Seeked media is decoded before screenshot, independent of wall-clock speed.
    await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('video')].filter(v=>!v.hidden&&v.seeking).map(v=>new Promise(resolve=>v.addEventListener('seeked',resolve,{once:true}))));});
    // Setting currentTime temporarily reduces readyState to HAVE_METADATA.
    // Audit the decoded frame after that seek, not the transient pre-seek state.
    if(sample.sequence.plate)Object.assign(sample.sequence,await page.evaluate(()=>{
      const v=document.querySelector('video.b3-plate');
      return {mediaReady:v?.readyState??0,videoTime:v?.currentTime??0,mediaFailed:!!v?.error};
    }));
    const png=await page.screenshot({type:'png'});
    if(!encoder.stdin.write(png))await once(encoder.stdin,'drain');
    if(i%3===0){await writeFile(resolve(folder,`frame-${String(i).padStart(5,'0')}.png`),png);}
    frames.push(sample);
  }
  encoder.stdin.end();await encoded;
  const invalidMedia=frames.filter(f=>f.sequence.plate&&(f.sequence.mediaReady<2||f.sequence.mediaFailed||Math.abs(f.sequence.videoTime-f.sequence.expectedVideoTime)>2/fps));
  if(invalidMedia.length)errors.push(`Undecoded or late plate media in ${invalidMedia.length} frames; first frame ${invalidMedia[0].index}`);
  const result=await page.evaluate(()=>{
    const m=window.__depthReview,c=window.__v3a2,expected=structuredClone(c.initial),actual=structuredClone(m.battle);
    // Finish both simulations through the same unchanged auto policy.
    c.R.playBattle(expected,'auto');c.R.playBattle(actual,'auto');
    return {parity:JSON.stringify(expected)===JSON.stringify(actual),initial:c.initial.initial,plans:c.plans,combatLog:m.battle.log,result:m.battle.result};
  });
  const capture={_meta:evidenceMeta(),fixture:fixture.id,seconds:frames.length/fps,minimumSeconds:seconds,completeActions,fps,width,height,errors,mediaRequests,...result,frames};
  await writeFile(resolve(folder,'capture.json'),JSON.stringify(capture)+'\n');
  await page.close();
  if(errors.length||!result.parity)throw Error(`${fixture.id}: ${errors.length} browser errors; parity=${result.parity}`);
  console.log(`${fixture.id}: ${frames.length} frames, ${result.plans.length} actions, parity PASS; ${folder}`);
 }
}finally{await browser.close();}
