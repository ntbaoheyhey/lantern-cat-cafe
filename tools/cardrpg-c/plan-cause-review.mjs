/** Result summaries describe recorded plan selection without inferring tactical success. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-plan-cause';await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const legacy of[false,true])for(const scenario of['manual','mixed','unknown']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const fixture=await page.evaluate(async({root,reduced,legacy,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917287,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917287,gameplayA6:!legacy,skillsV5:!legacy,plan:{focus:'support',care:'protect'},enemies:['button-guard','teacup-healer']});
   b.queue=['mochi','soot','clover',...b.queue.filter(id=>id.startsWith('foe-'))];
   const target=b.actors.find(a=>a.catalogId==='button-guard'),acted=R.act(b,{actorId:'mochi',targetId:target.id,skillId:'mochi-1'}),e=b.v4.events.find(e=>e.kind==='plan-target');
   if(scenario==='mixed')b.v4.events=[e,{...e,sequence:101,plan:{focus:'support',care:'steady'}},{...e,sequence:102,plan:{focus:'finish',care:'protect'}},{...e,sequence:103},{...e,sequence:104,actorId:'soot'},{...e,sequence:105,actorId:target.id},{...e,sequence:106,actorId:'unrecorded-cat'},{...e,sequence:107,plan:{focus:'future',care:'protect'},text:'Unfamiliar recorded tactic.'}];
   if(scenario==='unknown')b.v4.events=[{...e,plan:{focus:'future',care:'protect'},text:'Unfamiliar recorded tactic.'}];
   b.v4.plan={focus:'leader',care:'steady'};m.state.v4.plan={focus:'finish',care:'steady'};
   m.state.run.battle=b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');return{acted,target:target.catalogId,events:b.v4.events};
  },{root,reduced,legacy,scenario});expect(fixture.acted).toBe(true);expect(fixture.target).toBe('button-guard');
  const trigger=page.getByRole('button',{name:'Read details'});await trigger.waitFor();await page.evaluate(()=>document.fonts.ready);
  const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__depthReview.state)),before=await snapshot();await trigger.click();
  const panel=legacy?page.locator('.uv-advanced'):page.getByRole('dialog',{name:'Battle details'});
  if(!legacy)await panel.getByRole('button',{name:'Battle notes',exact:true}).click();
  const outcome=panel.locator('.dp-v4-outcome'),cause=outcome.locator(':scope > ul > li'),expected=scenario==='unknown'?null:`Mochi took ${scenario==='mixed'?'2 actions':'1 action'} with “Their support · Protect” selected.`;
  if(expected)await expect(cause.filter({hasText:expected})).toHaveCount(1);else await expect(cause.filter({hasText:' selected.'})).toHaveCount(0);
  await expect(outcome).not.toContainText('followed');await expect(outcome).not.toContainText('Focus the boss');
  const summary=outcome.locator('summary');await summary.focus();await page.keyboard.press('Enter');
  if(scenario==='unknown')await expect(outcome).toContainText('Unfamiliar recorded tactic.');
  if(expected)await cause.filter({hasText:expected}).scrollIntoViewIfNeeded();else await summary.scrollIntoViewIfNeeded();
  const geometry=await outcome.evaluate(el=>{const body=el.closest('.a6-result-report-body')??el.closest('.uv-sheet-content'),b=body.getBoundingClientRect(),list=el.querySelector('ul').getBoundingClientRect();return{causeFits:list.left>=b.left&&list.right<=b.right&&list.top>=b.top&&list.bottom<=b.bottom,horizontalOverflow:body.scrollWidth>body.clientWidth+1};});
  expect(geometry).toEqual({causeFits:true,horizontalOverflow:false});
  if(reduced&&(!legacy||scenario==='manual')){
   const name=`${width}-${legacy?'legacy':'current'}-${scenario}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,legacy,scenario});
  }
  expect(await snapshot()).toBe(before);
  if(legacy){await trigger.click();await expect(panel).toHaveCount(0);}else{await panel.getByRole('region',{name:'Battle report content'}).focus();await page.keyboard.press('End');await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();}
  report.cases.push({width,height,reduced,legacy,scenario,...fixture,expected,...geometry,readOnly:true,keyboard:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
