/** Isolated leave-table previews: pointer/keyboard, exact settlements and both layouts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-battle-leave';
await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const setup=async(kind='campaign',paused=true)=>{
  await page.evaluate(async({root,kind,paused,reduced})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;window.__leaveR=R;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.galleryBattle=null;m.plan=null;m.watching=false;
   m.state=R.setGameplayA6(R.createDepthAccount(826149,0),kind!=='legacy');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.autoContinue=false;
   if(kind==='practice'){m.state.freeInvite=false;m.tutorial();}
   else{
    const mode=kind.startsWith('daily')?'daily':kind.startsWith('tower')?'tower':'campaign';
    if(mode==='tower'){m.state.cleared=[1,2,3];m.state=R.startTowerFloorA6(m.state,1).state;}
    else m.start(1,mode);
    m.enter(R.availableNodes(m.state.run)[0].id);
    if(kind==='spent-supply'){
     const run=m.state.run;run.visited=run.nodes.filter(n=>n.id!==run.current).slice(0,3).map(n=>n.id);
     run.battle.initial.packedSupply={id:'shield-biscuit',catId:m.state.team[0]};
    }
    if(kind==='daily-capped')Object.assign(m.state.account.daily.earned,{fish:99999,threads:99999,stamps:99999,essence:99999});
    if(kind==='capped')m.state.account.daily.battles=6;
    if(kind==='daily-claimed')m.state.challengeClaims.push(`daily-${m.state.run.date}`);
    if(kind==='tower-claimed')m.state.challengeClaims.push('a6-tower-floor-1');
   }
   R.observeDiscoveriesV4(m.state);if(m.state.v4?.journey)m.state.v4.journey.pending=[];
   m.fight();m.paused=paused;m.notify(false);
  },{root,kind,paused,reduced});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
 };
 const snapshot=()=>page.evaluate(()=>{const m=window.__depthReview;return JSON.stringify({state:m.state,battle:m.battle,plan:m.plan,at:m.playbackAt,animation:m.animationAt});});
 const capture=async(name,dialog=true)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const audit=await page.evaluate(dialog=>{
   const host=dialog?document.querySelector('.uv-leave-table'):document.querySelector('.uv-battle-top');
   const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
   const rect=host.getBoundingClientRect(),viewport={left:0,top:0,right:innerWidth,bottom:innerHeight};
   return{overflow:document.documentElement.scrollWidth>innerWidth,hostFits:inside(rect,viewport),controlsFit:[...host.querySelectorAll('button')].every(e=>inside(e.getBoundingClientRect(),rect)),allTextFits:host.scrollHeight<=host.clientHeight+2,focusInside:!dialog||host.contains(document.activeElement),modal:!dialog||host.matches(':modal'),text:host.textContent};
  },dialog);
  const file=`${width}-${reduced?'reduced':'motion'}-${name}.webp`,png=output+'/capture.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);
  report.shots.push({file,width,reduced,...audit});expect(audit.overflow,file).toBe(false);for(const key of['hostFits','controlsFit','allTextFits','focusInside','modal'])expect(audit[key],file+' '+key).toBe(true);
 };
 const open=async()=>{const more=page.getByRole('button',{name:'More battle options'});await more.focus();await page.keyboard.press('Enter');const leave=page.getByRole('button',{name:'Leave table'});await leave.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Keep fighting'})).toBeFocused();return dialog;};
 for(const paused of[false,true])for(const close of['button','escape','cancel']){
  await setup('campaign',paused);const dialog=await open(),before=await snapshot();
  const points=await page.locator('.uv-battle-actions').evaluate(el=>[...el.querySelectorAll('button,input')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};}));
  for(const point of points)await page.mouse.click(point.x,point.y);
  await page.locator('.uv-battle-actions button').first().evaluate(el=>el.focus());expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  expect(await snapshot()).toBe(before);expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);
  const keep=dialog.getByRole('button',{name:'Keep fighting'}),confirm=dialog.getByRole('button',{name:'End patrol'});
  await keep.focus();await page.keyboard.press('Shift+Tab');await expect(confirm).toBeFocused();await page.keyboard.press('Tab');await expect(keep).toBeFocused();
  if(close==='button'){await capture(`cancel-${paused?'paused':'running'}`);await page.keyboard.press('Enter');}
  else if(close==='escape')await page.keyboard.press('Escape');else await dialog.evaluate(el=>el.dispatchEvent(new Event('cancel',{cancelable:true})));
  await expect(dialog).toHaveCount(0);await expect(page.getByRole('button',{name:'More battle options'})).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(paused);
  if(paused)expect(await snapshot()).toBe(before);
  report.checks.push({width,reduced,paused,close,blockedClicks:points.length,inertFocus:true,clockHeld:true,readOnly:true,focusReturned:true});
 }
 for(const kind of['campaign','spent-supply','daily','daily-capped','daily-claimed','capped','tower','tower-claimed','practice','legacy']){
  await setup(kind);const before=await snapshot();const expected=await page.evaluate(()=>{const m=window.__depthReview;return m.tutorialBattle?structuredClone(m.state.account):window.__leaveR.abandonRun(m.state).state;});
  const dialog=await open();expect(await snapshot()).toBe(before);
  const info=await page.evaluate(()=>{const m=window.__depthReview,R=window.__leaveR,preview=m.tutorialBattle?null:R.abandonRun(m.state);return{preview:preview?.ok,usesGift:preview?.ok&&preview.state.account.daily.battles>m.state.account.daily.battles,usesChallenge:preview?.ok&&preview.state.challengeClaims.length>m.state.challengeClaims.length};});
  if(info.usesGift)await expect(dialog).toContainText('Uses 1 of today’s 6 route gifts');
  if(kind==='daily'||kind==='daily-capped')await expect(dialog).toContainText('Uses this daily challenge’s gift');
  if(kind==='spent-supply')await expect(dialog).toContainText('stays spent');
  if(kind==='capped')await expect(dialog).toContainText('All 6 route gifts');
  if(kind==='daily-claimed')await expect(dialog).toContainText('already claimed');
  if(kind.startsWith('tower'))await expect(dialog).toContainText('Leaving does not claim a floor gift.');
  await dialog.getByRole('button',{name:kind==='practice'?'Leave practice':kind.startsWith('tower')?'Leave floor':'End patrol'}).focus();await capture(kind);
  await page.keyboard.press('Enter');await page.waitForFunction(()=>window.__depthReview.screen==='hub'&&!window.__depthReview.showBattle);
  const after=await page.evaluate(practice=>{const m=window.__depthReview;return practice?m.state.account:m.state;},kind==='practice');
  expect(after).toEqual(expected);await expect(page.getByRole('dialog')).toHaveCount(0);
  report.checks.push({width,reduced,kind,...info,readOnly:true,keyboardConfirm:true,exactSettlement:true});
 }
 // A saved replay must not settle the underlying active patrol.
 await setup();await page.evaluate(()=>{const m=window.__depthReview;m.replayLast();m.paused=true;m.notify(false);});const replayBefore=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 await page.getByRole('button',{name:'More battle options'}).click();await page.getByRole('button',{name:'Return from replay'}).focus();await page.keyboard.press('Enter');
 expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(replayBefore);expect(await page.evaluate(()=>window.__depthReview.replay)).toBeNull();await expect(page.locator('.uv-leave-table')).toHaveCount(0);report.checks.push({width,reduced,replayReturn:true,readOnly:true});
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
