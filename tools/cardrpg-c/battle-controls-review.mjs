/** Native guide isolation and public battle controls, using isolated fixture accounts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-battle-controls';
await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
 await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const setup=async({paused=true,earned=false,legacy=false}={})=>{
  await page.evaluate(async({root,paused,earned,legacy,reduced})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   window.__controlsR=R;m.offline=true;m.tutorialBattle=null;m.replay=null;m.plan=null;m.watching=false;
   m.state=R.setGameplayA6(R.createDepthAccount(826147,0),!legacy);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.settings.speed=1;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   if(earned){const run=m.state.run,node=run.nodes.find(n=>n.id===run.current),key=R.nodeStarKeyV4(run,node);m.state.v4.journey.stars[key]={key,chapter:run.chapter,band:run.challengeLevel,nodeId:node.id,kind:node.kind,conditions:[true,true,true]};}
   R.observeDiscoveriesV4(m.state);if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.fight();m.paused=paused;m.notify(false);
  },{root,paused,earned,legacy,reduced});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
 };
 const snapshot=()=>page.evaluate(()=>{const m=window.__depthReview;return JSON.stringify({battle:m.battle,account:m.state.account,settings:m.state.settings,auto:m.autoContinue,at:m.playbackAt,animation:m.animationAt});});
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const audit=await page.evaluate(()=>{
   const dialog=document.querySelector('dialog[open]'),host=dialog??document.querySelector('.uv-battle-top'),r=host.getBoundingClientRect();
   const inside=(a,b)=>a.left>=b.left-1&&a.right<=b.right+1&&a.top>=b.top-1&&a.bottom<=b.bottom+1;
   const focus=document.activeElement;
   return{overflow:document.documentElement.scrollWidth>innerWidth,hostFits:inside(r,{left:0,top:0,right:innerWidth,bottom:innerHeight}),controlsFit:[...host.querySelectorAll('button,input')].filter(el=>el.getClientRects().length&&!el.closest('.a6-guide-index')).every(el=>inside(el.getBoundingClientRect(),r)),focusInside:!dialog||dialog.contains(focus),modal:!!dialog?.matches(':modal')};
  });
  const file=`${width}-${reduced?'reduced':'motion'}-${name}.webp`,png=output+'/capture.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);
  report.shots.push({file,width,reduced,...audit});expect(audit.overflow,file).toBe(false);for(const key of['hostFits','controlsFit','focusInside'])expect(audit[key],file+' '+key).toBe(true);
 };
 for(const paused of[false,true])for(const close of['button','escape','cancel']){
  await setup({paused,earned:true});
  const points=await page.locator('.uv-battle-actions').evaluate(el=>[...el.querySelectorAll('button,input')].map(button=>{const r=button.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};}));
  const trigger=page.getByRole('button',{name:'Read battle guide'});await trigger.focus();await page.keyboard.press('Enter');
  const guide=page.getByRole('dialog',{name:'Battle guide'});await expect(guide.getByRole('region',{name:'Cafe field guide'})).toBeVisible();
  await expect(guide.getByRole('button',{name:'Close guide'})).toBeFocused();expect(await guide.evaluate(el=>el.matches(':modal'))).toBe(true);
  const before=await snapshot();
  for(const point of points)await page.mouse.click(point.x,point.y);
  // Native inertness also rejects an attempted programmatic focus behind the guide.
  await page.locator('.uv-battle-actions button').first().evaluate(el=>el.focus());
  expect(await guide.evaluate(el=>el.contains(document.activeElement))).toBe(true);
  expect(await snapshot()).toBe(before);expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);
  report.checks.push({width,reduced,paused,close,backgroundClicksBlocked:points.length,inertFocus:true,clockHeld:true,readOnly:true});
  const first=guide.getByRole('button',{name:'Close guide'}),last=guide.locator('.a6-guide-writing');
  await first.focus();await page.keyboard.press('Shift+Tab');await expect(last).toBeFocused();await page.keyboard.press('Tab');await expect(first).toBeFocused();
  report.checks.push({width,reduced,paused,close,focusTrap:true});
  if(close==='button'){
   await guide.getByRole('button',{name:'enemies',exact:true}).click();await guide.getByRole('button',{name:'Pantry Crown',exact:true}).click();await capture(`guide-${paused?'paused':'running'}-enemy`);
   await first.click();
  }else if(close==='escape'){
   await guide.getByRole('searchbox',{name:'Find a field note'}).fill('not-a-real-note');await capture(`guide-${paused?'paused':'running'}-empty`);await page.keyboard.press('Escape');
  }else await guide.evaluate(el=>el.dispatchEvent(new Event('cancel',{cancelable:true})));
  await expect(guide).toHaveCount(0);await expect(trigger).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(paused);
  report.checks.push({width,reduced,paused,close,returned:true});
 }
 await setup();const before=await snapshot();
 const speed=page.getByRole('button',{name:'Change playback speed'});await speed.focus();
 for(const expected of[2,3,1]){await page.keyboard.press('Enter');await expect(speed).toHaveText('×'+expected);expect(await page.evaluate(()=>window.__depthReview.state.settings.speed)).toBe(expected);}
 expect(await snapshot()).toBe(before);await capture('speed');report.checks.push({width,reduced,speedCycle:true,unchangedBattle:true});
 const auto=page.getByRole('checkbox',{name:'Auto-next'});await auto.focus();await page.keyboard.press('Space');await expect(auto).toBeChecked();await page.keyboard.press('Space');await expect(auto).not.toBeChecked();
 expect(await snapshot()).toBe(before);report.checks.push({width,reduced,autoNextToggle:true});
 await expect(page.getByRole('button',{name:'Skip · 3★ needed'})).toBeDisabled();
 await page.getByRole('button',{name:'Resume auto'}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Pause auto'})).toBeVisible();
 await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Resume auto'})).toBeVisible();report.checks.push({width,reduced,pauseToggle:true,unearnedSkipBlocked:true});
 const more=page.getByRole('button',{name:'More battle options'});await more.focus();await page.keyboard.press('Enter');await expect(more).toHaveAttribute('aria-expanded','true');await page.getByRole('button',{name:/Turn banners/}).focus();await capture('menu');
 await page.keyboard.press('Escape');await expect(more).toHaveAttribute('aria-expanded','false');await expect(more).toBeFocused();report.checks.push({width,reduced,menuEscape:true});
 await more.click();await page.getByRole('button',{name:'Read battle log'}).click();const log=page.getByRole('dialog',{name:'Battle log'});await expect(log).toBeVisible();await capture('log');
 await page.keyboard.press('Escape');await expect(log).toHaveCount(0);await expect(more).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);report.checks.push({width,reduced,logReturn:true});
 await setup({earned:true});await page.getByRole('button',{name:'Skip to result'}).focus();await page.keyboard.press('Enter');
 await page.waitForFunction(()=>window.__depthReview.screen==='result');expect(await page.evaluate(()=>window.__depthReview.plan)).toBeNull();report.checks.push({width,reduced,earnedSkip:true});
 if(reduced){
  await setup({legacy:true});await page.getByRole('button',{name:'Read battle guide'}).click();const guide=page.getByRole('dialog',{name:'Battle guide'});await expect(guide.getByRole('button',{name:'Close guide'})).toBeFocused();
  const original=await snapshot();await page.mouse.click(width-40,40);expect(await snapshot()).toBe(original);await capture('legacy-guide');await page.keyboard.press('Escape');expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);report.checks.push({width,reduced,legacyGuide:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
