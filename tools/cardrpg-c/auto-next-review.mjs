/** Result-owned timer, exact public settlement and explicit route choices on isolated accounts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-auto-next-final';
const towerOnly=process.argv.includes('--tower-only');
await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 page.setDefaultTimeout(12000);await page.clock.install();await page.clock.pauseAt(await page.evaluate(()=>Date.now()+100));console.log(JSON.stringify({width,reduced,phase:'ready'}));
 const setup=async(kind='reward')=>{
  await page.evaluate(async({root,kind,reduced})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;window.__nextR=R;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(826153,0),kind!=='legacy');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.account.cards.forEach(c=>c.level=12);
   if(kind==='tower'){m.state.cleared=[1,2,3];m.state=R.startTowerFloorA6(m.state,1).state;}
   else m.start(1);
   m.enter(R.availableNodes(m.state.run)[0].id);
   const run=m.state.run,current=run.nodes.find(n=>n.id===run.current);
   if(['fork','rest','single'].includes(kind)){
    for(const boon of R.BOONS)run.boons[boon.id]=boon.cap;for(const id of m.state.team.flatMap(id=>R.defaultSkills(m.state,id)))run.upgrades[id]=3;
    const next=run.nodes.filter(n=>n.depth===1).slice(0,kind==='fork'?2:1);current.next=next.map(n=>n.id);
    for(const n of next){n.kind=kind==='rest'?'campfire':'battle';n.enemies=kind==='rest'?[]:['crumb-sentinel'];}
   }
   if(kind==='complete')current.kind='boss';
   R.playBattle(m.battle,'auto');if(m.battle.result!=='party')throw Error('Fixture must win');
   if(kind==='loss')m.battle.result='enemy';
   if(kind==='practice')m.tutorialBattle=structuredClone(m.battle);
   if(kind==='replay')m.replay=structuredClone(m.battle);
   R.observeDiscoveriesV4(m.state);if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.error=false;m.go('result');m.autoContinue=kind!=='off';m.notify(false);
   window.__nextBefore=structuredClone(m.state);window.__nextExpected=R.finishEncounter(m.state).state;
  },{root,kind,reduced});
  await page.getByRole('button',{name:'Read details'}).waitFor();console.log(JSON.stringify({width,reduced,kind,phase:'result'}));
 };
 const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 const capture=async(name,dialog=false)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth),undefined,{polling:50});await page.evaluate(()=>document.fonts.ready);await page.clock.runFor(32);
  const audit=await page.evaluate(dialog=>{
   const host=document.querySelector(dialog?'.a6-result-dialog':'.a6-result-story')??document.querySelector('.uv-sheet-content');
   const rect=host.getBoundingClientRect(),inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
   const buttons=[...host.querySelectorAll('button')].filter(el=>el.getClientRects().length);
   return{overflow:document.documentElement.scrollWidth>innerWidth,hostFits:inside(rect,{left:0,top:0,right:innerWidth,bottom:innerHeight}),controlsFit:buttons.every(el=>inside(el.getBoundingClientRect(),rect)&&el.scrollWidth<=el.clientWidth+1),textFits:!document.querySelector('.a6-result-story')||['.a6-result-receipt','.a6-result-actions'].every(s=>{const e=document.querySelector(s);return inside(e.getBoundingClientRect(),e.parentElement.getBoundingClientRect())&&e.scrollHeight<=e.clientHeight+2;}),focusInside:!dialog||host.contains(document.activeElement),modal:!dialog||host.matches(':modal')};
  },dialog);
  const file=`${width}-${reduced?'reduced':'motion'}-${name}.webp`,png=output+'/capture.png';await page.screenshot({path:png,animations:'disabled'});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({file,width,reduced,...audit});
  expect(audit.overflow,file).toBe(false);for(const key of['hostFits','controlsFit','textFits','focusInside','modal'])expect(audit[key],file+' '+key).toBe(true);
 };
 const check=(kind,more={})=>report.checks.push({width,reduced,kind,...more});
 let before;
 if(!towerOnly){
 await setup();before=await snapshot();await page.clock.runFor(2000);await expect(page.getByLabel('Auto-next status')).toContainText('Continue in 3s');
 const stop=page.getByRole('button',{name:'Stop Auto-next'});await stop.focus();await capture('countdown');await page.keyboard.press('Enter');await page.clock.runFor(8000);
 expect(await snapshot()).toBe(before);expect(await page.evaluate(()=>window.__depthReview.autoContinue)).toBe(false);await expect(page.getByRole('button',{name:'Next',exact:true})).toBeFocused();await capture('stopped');check('stop',{readOnly:true,focusReturned:true,keyboard:true});
 for(const close of['button','escape','cancel']){
  await setup();before=await snapshot();await page.clock.runFor(2000);const trigger=page.getByRole('button',{name:'Read details'});await trigger.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'Battle details'});await expect(dialog).toContainText('Auto-next is paused');await page.clock.runFor(12000);expect(await snapshot()).toBe(before);
  const back=dialog.getByRole('button',{name:'Back to result'}),next=dialog.getByRole('button',{name:'Next'});await back.focus();await page.keyboard.press('Shift+Tab');await expect(next).toBeFocused();await page.keyboard.press('Tab');await expect(back).toBeFocused();
  const point=await page.getByRole('button',{name:'Stop Auto-next'}).evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});await page.mouse.click(point.x,point.y);expect(await page.evaluate(()=>window.__depthReview.autoContinue)).toBe(true);
  if(close==='button')for(const label of['Crew totals','Key moments','Battle notes']){await dialog.getByRole('button',{name:label,exact:true}).click();await capture('details-'+label.toLowerCase().replaceAll(' ','-'),true);}
  if(close==='button')await back.click();else if(close==='escape')await page.keyboard.press('Escape');else await dialog.evaluate(el=>el.dispatchEvent(new Event('cancel',{cancelable:true})));
  await expect(trigger).toBeFocused();await expect(page.getByLabel('Auto-next status')).toContainText('Continue in 5s');await page.clock.runFor(4000);expect(await snapshot()).toBe(before);await page.clock.runFor(1100);
  expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(await page.evaluate(()=>window.__nextExpected));await expect(page.locator('.dp-route-rewards')).toBeVisible();check('details-'+close,{readOnly:true,freshCountdown:true,keyboardLoop:true,backgroundBlocked:true,exactSettlement:true,rewardsKept:true});
 }
 await setup();before=await snapshot();await page.clock.runFor(2000);
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(10000);expect(await snapshot()).toBe(before);
 await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(4000);expect(await snapshot()).toBe(before);await page.clock.runFor(1100);expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(await page.evaluate(()=>window.__nextExpected));check('visibility-event',{simulatedVisibility:true,freshCountdown:true,exactSettlement:true});
 }
 for(const kind of towerOnly?['tower']:['reward','fork','rest','single','complete','tower']){
  await setup(kind);before=await snapshot();await page.clock.runFor(2000);expect(await snapshot()).toBe(before);await page.clock.runFor(3100);
  const after=await page.evaluate(()=>{const m=window.__depthReview;return{state:m.state,screen:m.screen,watching:m.watching};});
  if(kind==='single'){
   expect(after.watching).toBe(true);expect(after.state.run.current).toBe('1-0');expect(after.state.run.battle.v4.committed).toBe(true);check(kind,{oneCombat:true});
  }else{
   expect(after.state).toEqual(await page.evaluate(()=>window.__nextExpected));expect(after.watching).toBe(false);expect(after.screen).toBe(kind==='tower'?'tower':'map');
   if(kind==='reward'){await expect(page.locator('.dp-route-rewards')).toBeVisible();const first=page.locator('.dp-route-rewards button').first();await first.focus();await capture('reward-choice');}
   else {if(kind==='tower')await page.locator('.a6-tower').waitFor();await capture(kind);}
   check(kind,{exactSettlement:true,stopped:true});
  }
 }
 if(!towerOnly){
 for(const kind of['off','loss','practice','replay','legacy']){
  await setup(kind);before=await snapshot();await expect(page.getByRole('button',{name:'Stop Auto-next'})).toHaveCount(0);await page.clock.runFor(8000);expect(await snapshot()).toBe(before);check(kind,{noAutomaticSettlement:true});
 }
 await setup();before=await snapshot();await page.clock.runFor(2000);await page.getByRole('button',{name:'Read details'}).click();const dialog=page.getByRole('dialog',{name:'Battle details'});
 await dialog.getByRole('button',{name:'Watch replay'}).focus();await page.keyboard.press('Enter');await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;m.notify(false);});await page.clock.runFor(8000);expect(await snapshot()).toBe(before);check('watch-replay',{noUnderlyingSettlement:true,keyboard:true});
 }
 await page.close();
 console.log(JSON.stringify({width,reduced,checks:report.checks.length,shots:report.shots.length}));
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
