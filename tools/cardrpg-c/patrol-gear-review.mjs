/** Controlled UI review; copied gear/crew only. No acceptance seed or combat replay. */
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const {gear,equipment,team,cards}=JSON.parse(await readFile(root+'/reports/cardrpg-c/checks/clean-live-build-observation.json','utf8'));
const output=root+'/reports/cardrpg-c/shots/c11-patrol-gear';await mkdir(output,{recursive:true});
const report={fixture:'Separate review account copies only recorded owned gear and crew. No balance/recovery or natural-progression claim.',shots:[],checks:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text())});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async data=>{
   window.__patrolRules=await import('/@fs/Users/bao/taskbar-hero-cardrpg-a6/packages/game-rules/src/cardrpg/depth/index.ts');
   const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;
   m.state.gear=data.gear;m.state.equipment=data.equipment;m.state.team=data.team;
   m.state.account.cards=m.state.account.cards.filter(c=>data.cards.some(x=>x.id===c.cardId));
   for(const card of m.state.account.cards){const found=data.cards.find(x=>x.id===card.cardId);card.level=found.level;card.stars=found.stars;}
   m.state.v4.journey.pending=[];m.go('hub');return JSON.stringify(m.state);
  },{gear,equipment,team,cards});
  const reminder=page.getByRole('complementary',{name:'Before your patrol'}),patrol=page.locator('[data-home-destination="Patrol"]');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const metrics=await page.evaluate(()=>{
    const rect=el=>{const r=el?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
    return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,reminder:rect(document.querySelector('.a6-patrol-gear')),patrol:rect(document.querySelector('.uv-patrol')),dock:rect(document.querySelector('.uv-dock nav')),crew:[...document.querySelectorAll('.uv-home-crew figure')].map(rect),text:document.querySelector('.a6-patrol-gear')?.textContent??null};
   });
   if(metrics.overflow||metrics.broken)throw Error(JSON.stringify(metrics));
   if(metrics.reminder){
    await expect(reminder).toBeInViewport({ratio:1});await expect(patrol).toBeInViewport({ratio:1});
    const r=metrics.reminder,p=metrics.patrol,d=metrics.dock;
    if(r.x<d.x+d.width||r.x+r.width>p.x)throw Error('Gear reminder overlaps dock or Patrol.');
    if(metrics.crew.some(c=>r.x<c.x+c.width&&r.x+r.width>c.x&&r.y<c.y+c.height&&r.y+r.height>c.y))throw Error('Gear reminder overlaps a crew portrait/label.');
   }
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-patrol-${width}-${name}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',output+'/'+file]);report.shots.push({name,width,height,file,...metrics});
  };
  const expected=await page.evaluate(()=>{
   const m=window.__depthReview,R=window.__patrolRules,result=R.autoEquipA6(m.state);if(!result.ok)throw Error(result.error);
   return{equipment:result.state.equipment,power:Math.round(R.teamPowerV4(result.state)),gain:Math.round(R.teamPowerV4(result.state))-Math.round(R.teamPowerV4(m.state)),currencies:JSON.stringify(m.state.account.currencies),nextRunId:m.state.nextRunId};
  });
  const equip=reminder.getByRole('button',{name:`Equip owned gear · +${expected.gain.toLocaleString('en-US')} Power`});
  await expect(equip).toBeVisible();await expect(equip).toBeEnabled();await capture('available');
  if(width===1280){await equip.focus();await page.keyboard.press('Enter');}else await equip.click();
  await expect(reminder.getByRole('status')).toContainText(`+${expected.gain.toLocaleString('en-US')} Power`);await expect(patrol).toBeFocused();
  const actual=await page.evaluate(()=>{const m=window.__depthReview;return{equipment:m.state.equipment,power:Math.round(window.__patrolRules.teamPowerV4(m.state)),currencies:JSON.stringify(m.state.account.currencies),nextRunId:m.state.nextRunId,run:m.state.run,screen:m.screen};});
  if(JSON.stringify(actual.equipment)!==JSON.stringify(expected.equipment)||actual.power!==expected.power||actual.currencies!==expected.currencies||actual.nextRunId!==expected.nextRunId||actual.run!==null||actual.screen!=='hub')throw Error('Equip changed more than its public command or started a route.');
  report.checks.push({width,action:width===1280?'keyboard-equip':'pointer-equip',exactPreview:true,currenciesUnchanged:true,routeUnstarted:true,focusOnPatrol:true,gain:expected.gain});
  await capture('equipped');
  await patrol.click();await expect(page.getByRole('button',{name:/^Fight/})).toBeVisible();await expect(reminder).toHaveCount(0);
  const preparation=await page.evaluate(()=>{const m=window.__depthReview;return{equipment:m.state.equipment,power:Math.round(m.battle.initial.cats.reduce((s,c)=>s+window.__patrolRules.powerScoreA6(c.stats),0)),committed:m.battle.v4.committed,screen:m.screen};});
  if(JSON.stringify(preparation.equipment)!==JSON.stringify(expected.equipment)||preparation.power!==expected.power||preparation.committed||preparation.screen!=='prepare')throw Error('Patrol did not prepare the equipped crew.');
  report.checks.push({width,action:'prepare-after-equip',...preparation});await capture('prepare');
  await page.getByRole('button',{name:'Close',exact:true}).click();await expect(patrol).toBeVisible();await expect(reminder).toHaveCount(0);await capture('active-route');
  report.checks.push({width,action:'active-route',reminderHidden:true});
  for(const guide of ['patrol','recruit','upgrade']){
   await page.evaluate(({fixture,guide})=>{const m=window.__depthReview;m.state=JSON.parse(fixture);m.state.tutorial=guide==='patrol'?0:4;m.state.freeInvite=guide==='upgrade';if(guide==='upgrade')for(const c of m.state.account.cards)c.level=1;m.go('hub');},{fixture,guide});
   await expect(reminder).toHaveCount(0);await expect(page.getByRole('list',{name:'First three steps'})).toBeVisible();
   report.checks.push({width,action:`onboarding-${guide}`,reminderHidden:true});
  }
  await capture('onboarding');
  await page.evaluate(fixture=>{const m=window.__depthReview,R=window.__patrolRules;m.state=JSON.parse(fixture);m.state=R.autoEquipA6(m.state).state;m.go('team');},fixture);
  await page.getByRole('dialog',{name:'Team',exact:true}).waitFor();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(reminder).toHaveCount(0);
  report.checks.push({width,action:'already-equipped',reminderHidden:true});await capture('already-equipped');
  await page.evaluate(fixture=>{const m=window.__depthReview;m.state=JSON.parse(fixture);m.state.settings.reducedMotion=false;m.go('hub');},fixture);
  await expect(reminder.getByRole('button')).toBeVisible();await capture('motion');
  // The optional action must not intercept Patrol when the player skips it.
  await patrol.click();await expect(page.getByRole('button',{name:/^Fight/})).toBeVisible();
  const skipped=await page.evaluate(()=>({equipment:window.__depthReview.state.equipment,screen:window.__depthReview.screen}));
  if(JSON.stringify(skipped.equipment)!==JSON.stringify(equipment)||skipped.screen!=='prepare')throw Error('Optional prompt changed skipped gear or blocked Patrol.');
  report.checks.push({width,action:'skip-prompt',gearUnchanged:true,prepared:true});
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({complete:report.complete,shots:report.shots.length,checks:report.checks.length,errors:report.errors}));
