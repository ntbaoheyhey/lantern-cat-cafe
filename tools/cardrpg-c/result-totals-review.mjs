/** Primed combat fixtures verify report totals against actual HP loss, not a second log reducer. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-result-totals';
await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const incoming of[false,true])for(const hp of[100,10]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const actual=await page.evaluate(async({root,reduced,incoming,hp})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917273,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const b=R.createBattle({...m.battle.initial,seed:917273,enemies:['sock-skipper']});
   const source=b.actors.find(a=>a.id===(incoming?'foe-0-sock-skipper':'soot')),target=b.actors.find(a=>a.id===(incoming?'clover':'foe-0-sock-skipper'));
   target.hp=hp;target.shield=5000;target.statuses=['snag','brittle'].map(id=>({id,stacks:id==='snag'?3:1,remaining:3,source:source.id,appliedRound:b.round}));
   b.queue=[source.id,...b.actors.filter(a=>a.id!==source.id).map(a=>a.id)];b.log=[];
   const acted=incoming?R.enemyAct(b):R.act(b,{actorId:source.id,targetId:target.id,skillId:'soot-1'});
   m.state.run.battle=b;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');
   return{acted,hpLoss:hp-target.hp,reaction:b.log.find(e=>e.kind==='reaction-damage'),remainingShield:target.shield,source:source.name,target:target.name,round:b.round};
  },{root,reduced,incoming,hp});
  expect(actual.acted).toBe(true);expect(actual.hpLoss).toBe(Math.min(hp,36));expect(actual.remainingShield).toBeGreaterThan(0);expect(actual.reaction.amount).toBe(actual.hpLoss);
  const details=page.getByRole('button',{name:'Read details'});await details.waitFor();await page.evaluate(()=>document.fonts.ready);
  const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
  const capture=async(label)=>{
   if(!reduced||hp!==100)return;
   await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
   const geometry=await page.evaluate(()=>{const panel=document.querySelector('.a6-result-dialog')??document.querySelector('.a6-result-story'),r=panel.getBoundingClientRect();return{fits:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};});
   expect(geometry.fits).toBe(true);expect(geometry.overflow).toBe(false);
   const name=`${width}-${incoming?'incoming':'outgoing'}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,...geometry});
  };
  if(!incoming){await expect(page.locator('.a6-result-companion h3')).toHaveText(actual.source);await expect(page.locator('.a6-result-companion p')).toContainText(`${actual.hpLoss} damage`);await expect(page.locator('.a6-result-highlight')).toContainText(`${actual.source} dealt ${actual.hpLoss} damage`);}
  await capture('result');await details.click();
  const dialog=page.getByRole('dialog',{name:'Battle details'});await expect(dialog.getByRole('button',{name:'Back to result'})).toBeFocused();
  const card=dialog.locator('.a6-result-crew-totals article').filter({has:page.getByRole('heading',{name:incoming?actual.target:actual.source,exact:true})});
  const metric=card.locator('dl div').filter({has:page.locator('dt').filter({hasText:incoming?/^Damage taken$/:/^Damage$/})});await expect(metric.locator('dd')).toHaveText(String(actual.hpLoss));await capture('crew');
  await dialog.getByRole('button',{name:'Key moments',exact:true}).click();await expect(dialog.getByRole('region',{name:'Battle report content'})).toContainText(`${actual.source} dealt ${actual.hpLoss} to ${actual.target}`);await capture('moments');
  await dialog.getByRole('button',{name:'Battle notes',exact:true}).click();const notes=dialog.getByRole('region',{name:'Battle report content'});
  await expect(notes).toContainText(incoming?'Back row took 100% of the damage.':`${actual.source} dealt ${actual.hpLoss} damage · 100% of your total.`);await capture('notes');
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(details).toBeFocused();
  report.cases.push({width,height,reduced,incoming,hp,...actual,readOnly:true,returnFocus:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
