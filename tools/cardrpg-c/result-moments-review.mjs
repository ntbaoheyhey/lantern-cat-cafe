/** Controlled result records: interrupted choices, actual casts, and shield-only contacts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-result-moments';
await mkdir(output,{recursive:true});const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const scenario of['cancelled','after-cancel','dazed','enemy-only','blocked','legacy-cancelled','legacy-after-cancel']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const actual=await page.evaluate(async({root,reduced,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917284,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917284,gameplayA6:!scenario.startsWith('legacy'),enemies:['button-guard']});
   const source=b.actors.find(a=>a.id==='soot'),mochi=b.actors.find(a=>a.id==='mochi'),foe=b.actors.find(a=>a.side==='enemy');
   b.queue=[source.id,mochi.id,'clover',foe.id];source.charge=100;source.turns=4;b.log=[];const acted=[];
   if(scenario==='enemy-only'){foe.charge=100;b.queue=[foe.id,source.id,mochi.id,'clover'];acted.push(R.enemyAct(b));}
   else if(scenario==='blocked'){foe.shield=5000;acted.push(R.act(b,{actorId:source.id,skillId:'soot-1',targetId:foe.id}));}
   else{
    if(scenario==='dazed')source.statuses=[{id:'drowsy',stacks:1,remaining:1,source:foe.id,appliedRound:b.round}];
    else{source.hp=1;source.shield=0;source.statuses=[{id:'snag',stacks:1,remaining:3,source:foe.id,appliedRound:b.round}];}
    acted.push(R.act(b,{actorId:source.id,skillId:'soot-4',targetId:foe.id}));
    if(scenario.endsWith('after-cancel')){mochi.charge=100;mochi.turns=4;acted.push(R.act(b,{actorId:mochi.id,skillId:'mochi-4',targetId:mochi.id}));}
   }
   m.state.run.battle=b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');
   return{acted,cast:scenario.endsWith('after-cancel')?`Round 1 · Mochi used ${R.SKILLS['mochi-4'].name}`:'Your crew did not cast an ultimate in this encounter.',noDamage:['blocked','enemy-only'].includes(scenario),log:b.log,events:b.v4.events};
  },{root,reduced,scenario});
  expect(actual.acted.every(Boolean)).toBe(true);const details=page.getByRole('button',{name:'Read details'});await details.waitFor();await page.evaluate(()=>document.fonts.ready);
  const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));await details.click();
  if(scenario.startsWith('legacy')){
   const legacy=page.locator('.uv-advanced');await legacy.getByRole('heading',{name:'Key moments',exact:true}).waitFor();
   if(scenario.endsWith('after-cancel'))await expect(legacy).toContainText('First crew ultimate · round 1 · Mochi used ');
   else await expect(legacy).not.toContainText('First crew ultimate');
   expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);await details.click();await expect(legacy).toHaveCount(0);
   report.cases.push({width,height,reduced,scenario,...actual,readOnly:true,legacyInlineReport:true});continue;
  }
  const dialog=page.getByRole('dialog',{name:'Battle details'});
  await dialog.getByRole('button',{name:'Key moments',exact:true}).click();const body=dialog.getByRole('region',{name:'Battle report content'});
  const cast=body.locator('article').filter({has:page.getByRole('heading',{name:'First crew ultimate',exact:true})});await expect(cast.locator('p')).toHaveText(actual.cast);
  if(actual.noDamage)await expect(body.locator('article').filter({has:page.getByRole('heading',{name:'Biggest hit',exact:true})}).locator('p')).toHaveText('No HP damage was recorded in this encounter.');
  await body.focus();await page.keyboard.press('End');await expect.poll(()=>body.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThan(2);await page.keyboard.press('Home');await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
  const geometry=await dialog.evaluate(el=>{const r=el.getBoundingClientRect(),body=el.querySelector('.a6-result-report-body');return{fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,bodyFits:body.scrollWidth<=body.clientWidth+1};});
  expect(geometry).toEqual({fits:true,overflow:false,bodyFits:true});
  if(reduced){await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));const name=`${width}-${scenario}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,...geometry});}
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(details).toBeFocused();
  report.cases.push({width,height,reduced,scenario,...actual,...geometry,readOnly:true,keyboard:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
