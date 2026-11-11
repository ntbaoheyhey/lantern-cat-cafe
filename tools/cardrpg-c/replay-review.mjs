/** Isolated playback fixtures. These are navigation checks, never balance samples. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-replay-final';
await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of(baseline?[true]:[false,true])){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();page.setDefaultTimeout(15000);
 const check=(kind,details)=>report.checks.push({width,reduced,kind,...details});
 const capture=async(name)=>{
  await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
  await page.waitForTimeout(350);
  const file=output+'/'+width+'-'+(reduced?'reduced':'motion')+'-'+name;
  await page.screenshot({path:file+'.png'});execFileSync('magick',[file+'.png','-quality','82',file+'.webp']);report.shots.push(file+'.webp');
 };
 const setup=async(kind='unsettled')=>{
  await page.evaluate(async({root,kind,reduced})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;window.__replayR=R;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;m.paused=false;
   m.state=R.setGameplayA6(R.createDepthAccount(826157,0),kind!=='legacy');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;m.state.account.cards.forEach(c=>c.level=12);
   if(kind==='practice'){m.tutorial();}
   else{if(kind==='tower'){m.state.cleared=[1,2,3];m.state=R.startTowerFloorA6(m.state,1).state;}else m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);}
   if(kind!=='empty'){
    if(kind==='partial'){m.fight();m.sceneReady=true;m.step();while(m.plan)m.finishMoment();m.leave();window.__replayExpected=R.replayBattle(m.state.lastBattle,m.state.lastChoices);}
    else{R.playBattle(m.battle,'auto');window.__replayExpected=structuredClone(m.battle);m.go('result');if(kind==='settled')m.finish();}
   }
   R.observeDiscoveriesV4(m.state);if(m.state.v4?.journey)m.state.v4.journey.pending=[];
   m.error=false;m.go(kind==='result'?'result':'save');m.state.account.cards.forEach(c=>{c.level=60;c.stars=5;});m.notify(false);
   window.__replayBefore=structuredClone(m.state);window.__replayPracticeBefore=structuredClone(m.tutorialBattle);
  },{root,kind,reduced});
  if(kind==='result')await page.getByRole('button',{name:'Read details'}).waitFor();else await page.getByRole('button',{name:'Replay last battle'}).waitFor();
 };
 const account=()=>page.evaluate(()=>window.__depthReview.state);
 if(baseline){
  await setup();await page.getByRole('button',{name:'Replay last battle'}).click();await page.evaluate(()=>{window.__depthReview.paused=true;window.__depthReview.notify(false);});
  await page.locator('.uv-battle-hud').waitFor();await capture('unsettled-playing');
  await page.getByRole('button',{name:'Skip to result',exact:true}).click();await page.locator('.uv-result').waitFor();
  check('unsettled-source',await page.evaluate(()=>({expectedChoices:window.__replayExpected.choices.length,actualChoices:window.__depthReview.replay.choices.length,expectedResult:window.__replayExpected.result,actualResult:window.__depthReview.replay.result,unchanged:JSON.stringify(window.__depthReview.state)===JSON.stringify(window.__replayBefore)})));
  await capture('unsettled-result');await setup('empty');check('empty',{buttonEnabled:await page.getByRole('button',{name:'Replay last battle'}).isEnabled()});await capture('empty-settings');
 }else{
  await setup('empty');await expect(page.getByRole('button',{name:'Replay last battle'})).toBeDisabled();expect(await account()).toEqual(await page.evaluate(()=>window.__replayBefore));check('empty',{disabled:true,readOnly:true});await capture('empty-settings');
  for(const kind of['unsettled','settled','partial','tower','practice','result','legacy']){
   await setup(kind);
   if(kind==='result'){await page.getByRole('button',{name:'Read details'}).click();const dialog=page.getByRole('dialog',{name:'Battle details'});await dialog.getByRole('button',{name:'Watch replay'}).focus();await page.keyboard.press('Enter');}
   else{await page.getByRole('button',{name:'Replay last battle'}).focus();await page.keyboard.press('Enter');}
   await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;m.notify(false);});
   await page.locator('.uv-battle-hud').waitFor();await expect(page.locator('.uv-battle-hud').getByText('Recorded replay',{exact:true})).toBeVisible();await expect(page.getByRole('checkbox',{name:'Auto-next'})).toHaveCount(0);await expect(page.locator('.a6-hud-level,.a6-hud-stars')).toHaveCount(0);
   expect(await account()).toEqual(await page.evaluate(()=>window.__replayBefore));check(kind+'-playing',{recordedMode:true,noCurrentRank:true,readOnly:true,keyboard:true});
   if(['unsettled','practice','legacy'].includes(kind))await capture(kind+'-playing');
   await page.getByRole('button',{name:'More battle options'}).click();await page.getByRole('button',{name:'Read battle log'}).click();const log=page.getByRole('dialog',{name:'Battle log'});await expect(log).toBeVisible();await page.keyboard.press('Escape');await expect(log).toHaveCount(0);expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);check(kind+'-log',{pausePreserved:true});
   await page.getByRole('button',{name:'Skip to result',exact:true}).focus();await page.keyboard.press('Enter');await page.locator('.uv-result').waitFor();
   expect(await page.evaluate(()=>window.__depthReview.replay)).toEqual(await page.evaluate(()=>window.__replayExpected));expect(await account()).toEqual(await page.evaluate(()=>window.__replayBefore));
   await expect(page.getByRole('button',{name:/^Close replay/})).toBeVisible();await expect(page.locator('[data-reward-id]')).toHaveCount(0);check(kind+'-result',{exactReplay:true,noSettlement:true,keyboard:true});await capture(kind+'-result');
   if(kind!=='legacy'){
    await page.getByRole('button',{name:'Read details'}).click();const dialog=page.getByRole('dialog',{name:'Battle details'});await expect(dialog.getByRole('button',{name:'Improve team'})).toHaveCount(0);await expect(dialog.getByRole('button',{name:'Watch replay'})).toHaveCount(0);await dialog.getByRole('button',{name:'Key moments'}).click();await capture(kind+'-details');await page.keyboard.press('Escape');
   }
   await page.getByRole('button',{name:/^Close replay/}).focus();await page.keyboard.press('Enter');
   expect(await page.evaluate(()=>window.__depthReview.screen)).toBe(kind==='result'?'result':'save');expect(await account()).toEqual(await page.evaluate(()=>window.__replayBefore));expect(await page.evaluate(()=>window.__depthReview.tutorialBattle)).toEqual(await page.evaluate(()=>window.__replayPracticeBefore));check(kind+'-return',{originRestored:true,noSettlement:true,keyboard:true});
   if(kind==='result')await page.getByRole('button',{name:'Read details'}).waitFor();else await page.getByRole('button',{name:'Replay last battle'}).waitFor();
   await capture(kind+'-returned');
   if(kind==='unsettled'){
    await page.getByRole('button',{name:'Replay last battle'}).click();await page.evaluate(()=>{window.__depthReview.paused=true;window.__depthReview.notify(false);});await page.locator('.uv-battle-hud').waitFor();await page.getByRole('button',{name:'More battle options'}).click();await page.getByRole('button',{name:'Return from replay'}).focus();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:'Replay last battle'}).waitFor();expect(await account()).toEqual(await page.evaluate(()=>window.__replayBefore));check('early-return',{noSettlement:true,keyboard:true});
    await page.evaluate(()=>window.__depthReview.go('result'));await page.getByRole('button',{name:/^Next/}).click();
    expect(await account()).toEqual(await page.evaluate(()=>window.__replayR.finishEncounter(window.__replayBefore).state));check('real-result',{exactPublicSettlement:true});
   }
  }
 }
 await page.close();console.log(JSON.stringify({width,reduced,checks:report.checks.length,shots:report.shots.length}));
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
