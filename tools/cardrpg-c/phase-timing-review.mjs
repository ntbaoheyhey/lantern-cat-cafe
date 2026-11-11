/** Real action/round phase timing in isolated accounts; not progression or balance evidence. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json');
const {chromium,expect}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-phase-timing-final';
await mkdir(output,{recursive:true});
const report={scope:'Isolated real action and round-end transitions; no acceptance seed, progression or performance claim.',checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const reduced of [false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__ptR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__ptG=await import('/src/game/cardrpg/depth/feel-lab.ts');window.__ptP=await import('/src/game/cardrpg/depth/battle-presentation.ts');},root);
 const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const ready=async()=>{await settle();await page.waitForFunction(()=>{const m=window.__depthReview,s=window.__depthScene;return s?.ready&&m.visualBattle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});};
 const shot=async(c,pose)=>{await settle();const file=`${width}-${c.id}-${c.phase}-${c.cause}-${pose}.webp`;await sharp(await page.screenshot()).webp({quality:82}).toFile(output+'/'+file);report.shots.push({file,width,height,reduced,...c,pose});};
 const audit=()=>page.evaluate(()=>{
  const m=window.__depthReview,s=window.__depthScene,boss=m.visualBattle.actors.find(a=>window.__ptR.ENEMY_BY_ID[a.catalogId]?.tier==='boss'),canvas=document.querySelector('.dp-canvas').getBoundingClientRect();
  const rects=selector=>[...document.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
  const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const bodies=s.audit().labels.heads.map(b=>({left:canvas.left+b.x,right:canvas.left+b.x+b.width,top:canvas.top+b.y,bottom:canvas.top+b.y+b.height}));
  const protectedRects=[...bodies,...rects('.dp-world-plate,.uv-battle-party,.uv-boss,.uv-enemy-rage,.dp-float-number')],cards=rects('.spine-phase-cue'),menus=rects('.uv-battle-menu');
  return {phase:window.__ptP.displayedBossPhase(m.visualBattle,boss),hp:boss.hp,actors:m.visualBattle.actors.length,rendered:s.actors.size,available:s.cinematic.phaseVisible,visible:cards.length,text:document.querySelector('.spine-phase-cue')?.textContent,collisions:cards.filter(r=>protectedRects.some(p=>overlap(r,p))||menus.some(p=>overlap(r,p))).length,menuCollisions:menus.filter(r=>protectedRects.some(p=>overlap(r,p))).length,labels:rects('.dp-float-number').length,plan:m.plan?.skillId,clip:s.sampled.get(boss.id)?.name,draws:s.stats.calls+s.effects.stats.draws,zoom:s.camera.zoom};
 });
 const advance=async(ms)=>{
  await page.evaluate(ms=>{const m=window.__depthReview;m.paused=false;window.__ptNow+=ms;m.playbackFrameAt=window.__ptNow-ms;m.tick(ms,window.__ptNow);m.paused=true;window.__ptTime+=ms*m.state.settings.speed/1000;m.notify(false);},ms);
  await ready();await page.evaluate(()=>{const s=window.__depthScene;s.render(s.view(),0);});await settle();
 };
 for(const id of ['yarn-giant','rain-spool','pantry-crown'])for(const phase of [2,3])for(const cause of ['attack','burn'])for(const speed of [1,2,3]){
  const c={id,phase,cause,speed};
  await page.evaluate(({c,reduced})=>{
   const m=window.__depthReview,R=window.__ptR;
   m.state=R.setGameplayA6(R.createDepthAccount(918448,0),true);m.state.tutorial=4;m.state.settings.reducedMotion=reduced;m.state.settings.speed=c.speed;
   m.galleryBattle=null;m.replay=null;m.plan=null;m.animationAt=0;m.playbackAt=0;m.playbackFrameAt=undefined;m.ultimateBannersAt=[];m.ultimateBannerUntil=0;m.watching=true;m.paused=true;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.audio.blocked=false;m.audio.enabled=false;
   m.tutorialBattle=R.createBattle({...window.__ptG.galleryFixture('mochi-1').battle.initial,enemies:[c.id],gameplayV4:true,skillsV5:true,gameplayA6:true});
   const b=m.battle,cat=b.actors.find(a=>a.catalogId==='mochi'),boss=b.actors.find(a=>a.catalogId===c.id);
   boss.hp=Math.ceil(boss.maxHp*(c.phase===2?.66:.33))+5;boss.shield=0;if(c.phase===3)boss.bonuses.a6FirstPhase=1;
   if(c.cause==='burn'){boss.statuses=[{id:'scald',stacks:1,remaining:3,source:cat.id,appliedRound:b.round}];b.queue=[cat.id];b.acted=b.actors.filter(a=>a!==cat).map(a=>a.id);}
   else b.queue=[cat.id,...b.queue.filter(id=>id!==cat.id)];
   b.v4.committed=true;window.__ptNow=10000;window.__ptTime=10;m.notify(false);
  },{c,reduced});await ready();
  await page.evaluate(()=>{const s=window.__depthScene;if(!s.__ptBase){s.__ptBase=s.view.bind(s);s.view=()=>({...s.__ptBase(),fixedTime:window.__ptTime});}s.render(s.view(),0);});await settle();
  const initial=await audit();expect(initial.phase).toBe(phase-1);expect(initial.visible).toBe(0);
  const timing=await page.evaluate(c=>{
   const m=window.__depthReview,b=m.battle,cat=b.actors.find(a=>a.catalogId==='mochi'),boss=b.actors.find(a=>a.catalogId===c.id);
   m.paused=false;m.act({actorId:cat.id,skillId:c.cause==='burn'?'defend':'mochi-1',targetId:c.cause==='burn'?cat.id:boss.id});m.paused=true;m.notify(false);
   return{hit:m.plan.beats[2].start,duration:m.plan.duration,resolved:JSON.stringify(b),account:JSON.stringify(m.state),finalPhase:window.__ptP.displayedBossPhase(b,boss)};
  },c);expect(timing.finalPhase).toBe(phase);
  await advance(timing.hit*.5/speed);const anticipation=await audit();expect(anticipation.phase).toBe(phase-1);expect(anticipation.visible).toBe(0);
  await advance((timing.hit*.5+1)/speed);const contact=await audit();expect(contact.phase).toBe(cause==='attack'?phase:phase-1);expect(contact.actors).toBe(cause==='burn'?initial.actors:contact.rendered);expect(contact.collisions).toBe(0);
  if(cause==='burn')expect(contact.visible).toBe(0);else expect(contact.visible).toBe(1);
  if(reduced&&speed===1&&id==='yarn-giant')await shot(c,'contact');
  if(cause==='burn'){await advance((timing.duration-timing.hit+1)/speed);const round=await audit();expect(round.plan).toBe('round-status');}
  const phaseCue=await audit();expect(phaseCue.phase).toBe(phase);expect(phaseCue.visible).toBe(1);expect(phaseCue.collisions).toBe(0);expect(phaseCue.text).toContain(`Phase ${phase}`);
  if(reduced&&speed===1)await shot(c,'phase');
  const trigger=page.getByRole('button',{name:'More battle options'});await trigger.focus();await page.keyboard.press('Enter');await settle();const menu=await audit();if(menu.collisions||menu.menuCollisions){await shot(c,'menu-failure');console.log(JSON.stringify({width,height,reduced,...c,menu}));}expect(menu.collisions).toBe(0);expect(menu.menuCollisions).toBe(0);
  await page.keyboard.press('Escape');await settle();await expect(trigger).toBeFocused();expect((await audit()).visible).toBe(1);
  await page.evaluate(()=>window.__depthScene.render(window.__depthScene.view(),0));await settle();expect((await audit()).visible).toBe(1);
  const same=await page.evaluate(()=>({resolved:JSON.stringify(window.__depthReview.battle),account:JSON.stringify(window.__depthReview.state)}));expect(same.resolved).toBe(timing.resolved);expect(same.account).toBe(timing.account);
  await page.evaluate(()=>{window.__ptTime+=1.3;window.__depthScene.render(window.__depthScene.view(),0);});await settle();const expired=await audit();expect(expired.visible).toBe(0);
  report.checks.push({width,height,reduced,...c,initial,anticipation,contact,phaseCue,menu,expired});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,cases:report.checks.length,shots:report.shots.length,errors:report.errors}));
