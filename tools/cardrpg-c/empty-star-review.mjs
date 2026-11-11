/** Empty and support-only result/replay records must not fabricate a star or crash old detail views. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-empty-star';await mkdir(output,{recursive:true});
const scenarios=process.argv.find(a=>a.startsWith('--scenarios='))?.slice(12).split(',')??['empty','enemy-only','blocked','heal','shield'];
const motions=process.argv.includes('--reduced-only')?[true]:[false,true];
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of motions){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const legacy of[false,true])for(const scenario of scenarios){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const fixture=await page.evaluate(async({root,reduced,legacy,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917288,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917288,gameplayA6:!legacy,skillsV5:!legacy,enemies:['button-guard']});
   const foe=b.actors.find(a=>a.side==='enemy'),base={round:1,actorId:'clover',targetId:'mochi',skillId:'',text:''};b.log=[];
   if(scenario==='enemy-only'){b.queue=[foe.id,'mochi','clover','soot'];if(!R.enemyAct(b))throw Error('enemy did not act');}
   if(scenario==='blocked'){foe.shield=5000;b.queue=['soot','mochi','clover',foe.id];if(!R.act(b,{actorId:'soot',skillId:'soot-1',targetId:foe.id}))throw Error('blocked attack did not act');}
   if(scenario==='heal'||scenario==='shield')b.log=[{...base,kind:scenario,amount:1}];
   if(scenario==='large')b.log=[{...base,kind:'damage',targetId:foe.id,amount:12345},{...base,kind:'heal',amount:6789},{...base,kind:'shield',amount:54321}];
   m.state.run.battle=b;m.replay=b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');
   return{support:scenario==='heal'||scenario==='shield'||scenario==='large',log:b.log};
  },{root,reduced,legacy,scenario});
  const trigger=page.getByRole('button',{name:'Read details'});await trigger.waitFor();await page.evaluate(()=>document.fonts.ready);
  const snapshot=()=>page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,replay:window.__depthReview.replay})),before=await snapshot();
  const hero=legacy?page.locator('.uv-result-mvp'):page.locator('.a6-result-companion');
  if(fixture.support){await expect(hero.getByRole('heading',{name:'Clover',exact:true})).toHaveCount(1);await expect(hero).toContainText('TONIGHT’S STAR');}
  else{await expect(page.getByText('TONIGHT’S STAR',{exact:true})).toHaveCount(0);if(!legacy)await expect(hero).toContainText('No damage dealt, healing or shields given were recorded.');}
  if(scenario==='shield')await expect(hero.locator('p')).toHaveText('0 damage · 0 healing · 1 shield given');
  if(scenario==='large')await expect(hero.locator('p')).toHaveText('12345 damage · 6789 healing · 54321 shields given');
  const capture=async(label)=>{if(!reduced||!['empty','shield','large'].includes(scenario))return;await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const name=`${width}-${legacy?'legacy':'current'}-${scenario}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,legacy,scenario,label});};
  const mainGeometry=await page.locator('.uv-result').evaluate(el=>{const body=el.closest('.uv-sheet-content'),b=body.getBoundingClientRect(),r=el.getBoundingClientRect();return{horizontalOverflow:el.scrollWidth>el.clientWidth+1||document.documentElement.scrollWidth>innerWidth,contentFits:!el.matches('.a6-result-story')||r.top>=b.top&&r.bottom<=b.bottom,buttons:[...el.querySelectorAll('button')].every(n=>{const r=n.getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom;})};});
  expect(mainGeometry).toEqual({horizontalOverflow:false,contentFits:true,buttons:true});await capture('result');await trigger.click();
  const panel=legacy?page.locator('.uv-advanced'):page.getByRole('dialog',{name:'Battle details'});
  if(legacy){await panel.getByRole('heading',{name:'Key moments',exact:true}).waitFor();await expect(panel.locator('.dp-result-banner')).toHaveCount(fixture.support?1:0);}
  else{const cards=panel.getByRole('region',{name:'Crew totals'});await expect(cards.locator('article')).toHaveCount(3);await expect(cards.getByText('Tonight’s star',{exact:true})).toHaveCount(fixture.support?1:0);}
  await capture('details');expect(await snapshot()).toBe(before);
  if(legacy){await trigger.click();await expect(panel).toHaveCount(0);}else{await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();}
  // Leaving a partial replay returns to its saved result without collecting or changing the account.
  const account=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));await page.getByRole('button',{name:'Close replay',exact:true}).click();
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(account);expect(await page.evaluate(()=>window.__depthReview.replay)).toBeNull();
  report.cases.push({width,height,reduced,legacy,scenario,...fixture,...mainGeometry,readOnly:true,keyboard:true,replayReturn:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
