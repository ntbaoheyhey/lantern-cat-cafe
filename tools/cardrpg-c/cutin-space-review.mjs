/** Pre-contact cinematic space, menu priority and contact-label safety; isolated presentation only. */
import {createRequire} from 'node:module';
import {access,mkdir,readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-cutin-space-final';
const slots=JSON.parse(await readFile(root+'/assets/cardrpg-look/spine/slots.json','utf8'));
const skills=slots.units.filter(u=>u.side==='party').map(u=>({unit:u.id,skill:u.skills.find(s=>s.animation==='ult').id}));
await mkdir(output,{recursive:true});
const report={scope:'Frozen presentation fixtures; no progression, balance or performance sample.',checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__csR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__csG=await import('/src/game/cardrpg/depth/feel-lab.ts');},root);
 const cases=skills.flatMap(({unit,skill})=>(unit==='mochi'?[['teacup-healer','button-guard'],['yarn-giant'],['rain-spool'],['pantry-crown']]:[['yarn-giant']]).flatMap(enemies=>(unit==='mochi'?[1,2,3]:[1]).map(speed=>({unit,skill,enemies,speed}))));
 const settle=()=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const shot=async(name,meta)=>{await settle();const file=`${width}-${name}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+file]);report.shots.push({file,...meta});};
 for(const c of cases){
  await page.evaluate(({c,reduced})=>{
   const m=window.__depthReview,R=window.__csR,G=window.__csG;
   m.state=R.setGameplayA6(R.createDepthAccount(918447,0),true);m.state.tutorial=4;m.state.settings.reducedMotion=reduced;m.state.settings.speed=c.speed;
   m.galleryBattle=null;m.replay=null;m.tutorialBattle=R.createBattle({...G.galleryFixture(c.skill).battle.initial,enemies:c.enemies});m.plan=null;m.animationAt=0;m.playbackAt=0;m.ultimateBannersAt=[];m.ultimateBannerUntil=0;m.watching=true;m.paused=true;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.audio.blocked=true;m.audio.enabled=false;m.notify(false);
  },{c,reduced});
  await page.waitForFunction(()=>{const m=window.__depthReview,s=window.__depthScene;return s?.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
  await page.evaluate(c=>{
   const m=window.__depthReview,R=window.__csR,s=window.__depthScene;
   if(!s.__csView){s.__csView=s.view.bind(s);s.view=()=>({...s.__csView(),fixedTime:window.__csTime??3,...window.__csExtra});}window.__csTime=3;window.__csExtra={};
   const b=m.battle,a=b.actors.find(a=>a.catalogId===c.unit);a.skills=R.CAT_BY_ID[c.unit].skills.map(s=>s.id);a.charge=100;a.turns=3;b.queue=[a.id,...b.queue.filter(id=>id!==a.id)];b.v4.committed=true;m.paused=false;
   const choice=R.legalChoices(b).find(x=>x.skillId===c.skill);if(!choice)throw Error('No legal ultimate '+c.skill);m.act(choice);m.paused=true;m.notify(false);
  },c);
  await settle();
  const sample=async fraction=>page.evaluate(fraction=>{const m=window.__depthReview,s=window.__depthScene,at=m.plan.beats[2].start*fraction;for(let t=m.animationAt;t<at;t+=1000/60){m.animationAt=t;window.__csTime=3+t/1000;s.render(s.view(),0);}m.animationAt=at;window.__csTime=3+at/1000;s.render(s.view(),0);m.notify(false);},fraction);
  await sample(.6);await settle();
  const snapshot=()=>page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle,paused:window.__depthReview.paused,plan:window.__depthReview.plan}));
  const before=await snapshot();
  const audit=()=>page.evaluate(()=>{
   const s=window.__depthScene,overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top,canvas=document.querySelector('.dp-canvas').getBoundingClientRect();
   const bodies=s.audit().labels.heads.map(b=>({left:canvas.left+b.x,right:canvas.left+b.x+b.width,top:canvas.top+b.y,bottom:canvas.top+b.y+b.height}));
   const rects=selector=>[...document.querySelectorAll(selector)].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
   const protectedRects=[...bodies,...rects('.dp-world-plate,.uv-battle-party,.uv-boss,.uv-enemy-rage,.dp-float-number')],cards=rects('.spine-ultimate-cutin,.spine-phase-cue'),menus=rects('.uv-battle-menu');
   return{visible:cards.length,available:s.cinematic.ultimateVisible,collisions:cards.filter(r=>protectedRects.some(p=>overlap(r,p))||menus.some(p=>overlap(r,p))).length,menuCollisions:menus.filter(r=>protectedRects.some(p=>overlap(r,p))).length,labels:rects('.dp-float-number').length,zoom:s.camera.zoom,draws:s.stats.calls+s.effects.stats.draws,numberLanes:s.anchors.filter(a=>a.textLane).length,clip:s.sampled.get(window.__depthReview.plan.actorId)?.name};
  });
  const closed=await audit();expect(closed.available,JSON.stringify({width,reduced,...c,closed})).toBe(true);expect(closed.visible).toBe(1);expect(closed.collisions).toBe(0);expect(closed.labels).toBe(0);expect(closed.clip).toBe('ult');
  if(reduced&&c.speed===1&&(c.unit!=='mochi'||c.enemies[0]==='yarn-giant'))await shot(c.skill+'-closed',{width,reduced,...c,pose:'cast'});
  const trigger=page.getByRole('button',{name:'More battle options'});await trigger.focus();await page.keyboard.press('Enter');await settle();
  const open=await audit();expect(open.collisions).toBe(0);expect(open.menuCollisions).toBe(0);expect(await snapshot()).toBe(before);
  if(reduced&&c.speed===1&&c.unit==='mochi'&&c.enemies[0]==='yarn-giant')await shot(c.skill+'-menu',{width,reduced,...c,pose:'menu'});
  await page.keyboard.press('Escape');await settle();await expect(trigger).toBeFocused();expect((await audit()).visible).toBe(1);expect(await snapshot()).toBe(before);
  await sample(1.2);await settle();const contact=await audit();expect(contact.available).toBe(false);expect(contact.visible).toBe(0);expect(await snapshot()).toBe(before);
  if(reduced&&c.speed===1&&c.unit==='mochi'&&c.enemies[0]==='yarn-giant')await shot(c.skill+'-contact',{width,reduced,...c,pose:'contact'});
  report.checks.push({width,height,reduced,...c,closed,open,contact});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,cases:report.checks.length,shots:report.shots.length,errors:report.errors,maxDraws:Math.max(...report.checks.map(c=>Math.max(c.closed.draws,c.contact.draws)))}));
