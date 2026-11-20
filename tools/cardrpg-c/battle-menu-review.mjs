/** Battle options geometry on isolated frozen scenes, not progression measurements. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),diagnostic=process.argv.includes('--diagnostic'),output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-battle-menu-final';
await mkdir(output,{recursive:true});
const report={scope:'Isolated frozen normal/boss scenes; no balance or account acceptance samples.',checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of baseline?[true]:[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__menuR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__menuG=await import('/src/game/cardrpg/depth/feel-lab.ts');},root);
 for(const enemies of [['teacup-healer','button-guard'],['yarn-giant'],['rain-spool'],['pantry-crown']]){
  await page.evaluate(({enemies,reduced})=>{
   const m=window.__depthReview,R=window.__menuR,G=window.__menuG;
   m.state=R.setGameplayA6(R.createDepthAccount(918446,0),true);m.state.tutorial=4;m.state.settings.reducedMotion=reduced;
   m.galleryBattle=null;m.replay=null;m.tutorialBattle=R.createBattle({...G.galleryFixture('mochi-4').battle.initial,enemies});m.plan=null;m.animationAt=0;m.playbackAt=0;m.ultimateBannersAt=[];m.ultimateBannerUntil=0;m.watching=true;m.paused=true;m.screen='map';m.sceneStarted=true;m.sceneReady=true;m.sceneError='';m.notify(false);
  },{enemies,reduced});
  await page.waitForFunction(()=>{const m=window.__depthReview,s=window.__depthScene;return s?.ready&&m.battle.actors.every(a=>s.actors.get(a.id)?.asset===a.catalogId);});
  await page.evaluate(()=>{const s=window.__depthScene;if(!s.__menuView){s.__menuView=s.view.bind(s);s.view=()=>({...s.__menuView(),fixedTime:window.__menuTime??3});}window.__menuTime=3;});
  for(const pose of baseline?['idle']:['idle','ultimate','impact'])for(const blocked of[false,true]){
   await page.evaluate(({pose,blocked})=>{
    const m=window.__depthReview,R=window.__menuR,s=window.__depthScene;
    if(pose==='ultimate'&&!m.plan){const b=m.battle,a=b.actors.find(a=>a.catalogId==='mochi');a.skills=R.CAT_BY_ID.mochi.skills.map(s=>s.id);a.charge=100;a.turns=3;b.queue=[a.id,...b.queue.filter(id=>id!==a.id)];b.v4.committed=true;m.paused=false;m.act(R.legalChoices(b).find(c=>c.skillId==='mochi-4'));m.paused=true;}
    m.audio.blocked=blocked;m.audio.enabled=false;
    m.notify(false);
   },{pose,blocked});
   await page.evaluate(async pose=>{
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const m=window.__depthReview,s=window.__depthScene;
    if(pose==='idle'){s.prepare(s.view());s.render(s.view(),0);return;}
    const target=pose==='ultimate'?m.plan.beats[2].start*.6:m.plan.beats[2].start+80;
    for(let at=0;at<=target;at+=1000/60){m.animationAt=at;window.__menuTime=3+at/1000;s.render(s.view(),0);}
    m.animationAt=target;window.__menuTime=3+target/1000;s.render(s.view(),0);m.notify(false);
   },pose);
   const trigger=page.getByRole('button',{name:'More battle options'});
   if(await trigger.getAttribute('aria-expanded')==='false'){await trigger.focus();await page.keyboard.press('Enter');}
   await page.getByRole('button',{name:/Turn banners/}).focus();
   await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const audit=await page.evaluate(()=>{
    const menu=document.querySelector('.uv-battle-menu'),r=menu.getBoundingClientRect(),canvas=document.querySelector('.dp-canvas').getBoundingClientRect(),s=window.__depthScene;
    const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
    const plates=[...document.querySelectorAll('.dp-world-plate:not([hidden]),.uv-battle-party,.uv-boss,.uv-enemy-rage')].filter(e=>e.getClientRects().length).map(e=>({label:e.getAttribute('aria-label')??e.className,rect:e.getBoundingClientRect().toJSON()}));
    const bodies=s.audit().labels.heads.map((b,i)=>({label:'body'+i,rect:{left:canvas.left+b.x,right:canvas.left+b.x+b.width,top:canvas.top+b.y,bottom:canvas.top+b.y+b.height}}));
    const cues=[...document.querySelectorAll('.spine-ultimate-cutin:not([hidden]),.spine-phase-cue:not([hidden]),.dp-float-number:not([hidden])')].filter(e=>e.getClientRects().length).map(e=>({label:e.className,rect:e.getBoundingClientRect().toJSON()}));
    const collisions=[...plates,...bodies,...cues].filter(p=>overlap(r,p.rect)).map(p=>p.label);
    const buttons=[...menu.querySelectorAll('button')].map(b=>b.getBoundingClientRect());
    return{collisions,cues,ultimateVisible:!!document.querySelector('.spine-ultimate-cutin:not([hidden])'),ultimateAvailable:s.cinematic.ultimateVisible,box:r.toJSON(),viewportFit:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,controlsFit:buttons.every(b=>b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom),targets44:buttons.every(b=>b.width>=44&&b.height>=44),overflow:document.documentElement.scrollWidth>innerWidth};
   });
   report.checks.push({width,height,reduced,enemies,pose,blocked,...audit});
   if(reduced&&blocked){const file=`${width}-${enemies[0]}-${pose}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+file]);report.shots.push({file,width,enemies,pose,...audit});}
   if(!baseline&&!diagnostic){expect(audit.collisions,JSON.stringify(report.checks.at(-1))).toEqual([]);expect(audit.viewportFit).toBe(true);expect(audit.controlsFit).toBe(true);expect(audit.targets44).toBe(true);expect(audit.overflow).toBe(false);if(pose==='ultimate')expect(audit.ultimateVisible).toBe(audit.ultimateAvailable);}
   const before=await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle,plan:window.__depthReview.plan,paused:window.__depthReview.paused}));
   await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect(page.locator('.uv-battle-menu')).toHaveCount(0);
   expect(await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle,plan:window.__depthReview.plan,paused:window.__depthReview.paused}))).toBe(before);
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,overlaps:report.checks.filter(c=>c.collisions.length).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
