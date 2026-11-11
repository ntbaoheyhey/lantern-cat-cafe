/** Empty/partial battle reports distinguish HP damage from shields and outgoing damage. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-row-share';await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const legacy of[false,true])for(const scenario of['empty','blocked','shield','front','mixed']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(async({root,reduced,legacy,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917289,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917289,gameplayA6:!legacy,skillsV5:!legacy,enemies:['button-guard']});
   const foe=b.actors.find(a=>a.side==='enemy'),base={round:1,actorId:foe.id,targetId:'mochi',skillId:'',text:''};b.log=[];b.v4.events=[];b.round=scenario==='empty'?1:5;
   if(scenario==='blocked')b.log=[{...base,kind:'absorbed',amount:60},{...base,kind:'damage',amount:0}];
   if(scenario==='shield')b.log=[{...base,actorId:'clover',kind:'shield',amount:1}];
   if(scenario==='front'||scenario==='mixed')b.log=[{...base,kind:'damage',amount:60}];
   if(scenario==='mixed')b.log.push({...base,targetId:'clover',kind:'reaction-damage',amount:20},{...base,targetId:'clover',kind:'absorbed',amount:400},{...base,actorId:'soot',targetId:foe.id,kind:'damage',amount:1000});
   m.state.run.battle=b;m.replay=scenario==='mixed'?null:b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');
  },{root,reduced,legacy,scenario});
  const trigger=page.getByRole('button',{name:'Read details'});await trigger.waitFor();await page.evaluate(()=>document.fonts.ready);
  const snapshot=()=>page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,replay:window.__depthReview.replay})),before=await snapshot();
  const main=page.locator('.uv-result');await expect(main).not.toContainText('rounds played');await expect(main).not.toContainText('$ROUND');
  if(scenario==='empty')await expect(main).toContainText('No battle effects were recorded.');
  if(['shield','front'].includes(scenario))await expect(main).toContainText('Record ends in round 5.');
  if(!legacy||scenario==='mixed')await expect(main.locator(legacy?'.uv-result-title small':'.a6-result-heading small')).toContainText(`ROUND ${scenario==='empty'?1:5}`);
  const capture=async label=>{if(!reduced)return;await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const name=`${width}-${legacy?'legacy':'current'}-${scenario}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,legacy,scenario,label});};
  if(['empty','shield'].includes(scenario))await capture('result');
  await trigger.click();const panel=legacy?page.locator('.uv-advanced'):page.getByRole('dialog',{name:'Battle details'});
  if(!legacy)await panel.getByRole('button',{name:'Battle notes',exact:true}).click();
  const outcome=panel.locator('.dp-v4-outcome'),expected=['front','mixed'].includes(scenario)?`Back row took ${scenario==='front'?0:25}% of your crew’s HP damage.`:'No HP damage to your crew was recorded.';
  await expect(outcome.locator(':scope > p').first()).toHaveText(expected);
  const note=outcome.getByText(expected,{exact:true});await note.scrollIntoViewIfNeeded();
  const geometry=await note.evaluate(el=>{const p=el.getBoundingClientRect(),body=el.closest('.a6-result-report-body')??el.closest('.uv-sheet-content'),b=body.getBoundingClientRect();return{noteFits:p.left>=b.left&&p.right<=b.right&&p.top>=b.top&&p.bottom<=b.bottom,horizontalOverflow:body.scrollWidth>body.clientWidth+1};});expect(geometry).toEqual({noteFits:true,horizontalOverflow:false});
  if(['empty','mixed'].includes(scenario))await capture('notes');
  const disclosure=outcome.locator('summary');await disclosure.focus();await page.keyboard.press('Enter');await expect(outcome.locator('details')).toHaveAttribute('open','');
  expect(await snapshot()).toBe(before);
  if(legacy){await trigger.click();await expect(panel).toHaveCount(0);}else{await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();}
  expect(await snapshot()).toBe(before);report.cases.push({width,height,reduced,legacy,scenario,expected,...geometry,readOnly:true,keyboard:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
