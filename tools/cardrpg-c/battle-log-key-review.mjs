/** Reading the native event book must preserve the paused combat clock. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-battle-log-keys';
await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const reduced of [false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',error=>report.errors.push(error.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const speed of [1,2,3])for(const wasPaused of [false,true]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(async({root,reduced,speed,wasPaused})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.plan=null;m.watching=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917263,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.settings.speed=speed;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.fight();m.sceneReady=true;m.paused=false;
   for(let i=0;i<6;i++){m.step();while(m.plan)m.finishMoment();}m.step();m.animationAt=0;m.paused=wasPaused;m.notify(false);
  },{root,reduced,speed,wasPaused});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  const more=page.getByRole('button',{name:'More battle options'});await more.click();await page.getByRole('button',{name:'Read battle log'}).click();
  const log=page.getByRole('dialog',{name:'Battle log'}),events=log.getByRole('region',{name:'Battle events, newest first'}),close=log.getByRole('button',{name:'Close log'});
  await expect(close).toBeFocused();expect(await log.evaluate(el=>el.matches(':modal'))).toBe(true);
  await page.keyboard.press('Shift+Tab');await expect(events).toBeFocused();await page.keyboard.press('Tab');await expect(close).toBeFocused();
  const snapshot=()=>page.evaluate(()=>{const m=window.__depthReview;return JSON.stringify({battle:m.battle,account:m.state.account,clock:m.playbackAt,animation:m.animationAt,plan:m.plan?.id,paused:m.paused});});
  const before=await snapshot(),count=await events.locator('li').count();expect(count).toBeGreaterThan(25);await events.focus();
  await page.keyboard.press('Space');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBeGreaterThan(150);
  await page.waitForTimeout(180);expect(await snapshot()).toBe(before);
  report.checks.push({width,reduced,speed,wasPaused,key:'Space',scrolled:true,clockAndBattleHeld:true});
  await page.keyboard.press('Shift+Space');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBe(0);
  for(const key of ['PageDown','End']){await page.keyboard.press(key);await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBeGreaterThan(150);expect(await snapshot()).toBe(before);report.checks.push({width,reduced,speed,wasPaused,key,scrolled:true,clockAndBattleHeld:true});}
  await expect.poll(()=>events.evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop))).toBeLessThan(2);
  if(speed===1){
   const audit=await log.evaluate(el=>{const r=el.getBoundingClientRect(),events=el.querySelector('.a6-log-events'),last=[...events.querySelectorAll('li')].at(-1),e=events.getBoundingClientRect(),lastRect=last.getBoundingClientRect();return{fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,focusInside:el.contains(document.activeElement),scrollable:events.scrollHeight>events.clientHeight,lastVisible:lastRect.top>=e.top-2&&lastRect.bottom<=e.bottom+2};});
   for(const key of ['fits','focusInside','scrollable','lastVisible'])expect(audit[key],key).toBe(true);expect(audit.overflow).toBe(false);
   await page.evaluate(()=>document.fonts.ready);const name=`${width}-${reduced?'reduced':'motion'}-${wasPaused?'paused':'running'}.webp`,png=output+'/capture.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+name]);report.shots.push({name,width,height,reduced,wasPaused,...audit});
  }
  await page.keyboard.press('Home');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBe(0);
  await page.keyboard.press('ArrowDown');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);expect(await snapshot()).toBe(before);
  report.checks.push({width,reduced,speed,wasPaused,shiftSpaceHomeArrow:true,clockAndBattleHeld:true});
  if(wasPaused)await page.keyboard.press('Escape');else await close.click();
  await expect(log).toHaveCount(0);await expect(more).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(wasPaused);
  await page.evaluate(()=>{window.__depthReview.paused=true;window.__depthReview.notify(false);});
  // Outside the book the existing Space shortcut still pauses/resumes normally.
  await page.evaluate(()=>{document.activeElement.blur();});await page.keyboard.press('Space');expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(false);
  await page.keyboard.press('Space');expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);
  report.checks.push({width,reduced,speed,wasPaused,restored:true,outerShortcutPreserved:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
