/** Enemy advice in the handbook, live battle guide and preparation; isolated accounts. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-enemy-guide';
const modes=(process.argv.find(a=>a.startsWith('--modes='))?.slice(8)??'sheet,battle,prepare').split(',');
const prepareId=process.argv.find(a=>a.startsWith('--prepare-id='))?.slice(13);
const report={checks:[],shots:[],errors:[],complete:false};await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const enemies=await page.evaluate(async root=>{
  window.__enemyR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  window.__enemyGuide=await import('/@fs'+root+'/apps/web/src/game/cardrpg/ui-v3/guide-a6.ts');
  return window.__enemyR.ENEMIES.map(e=>({id:e.id,name:e.name,...window.__enemyGuide.enemyGuideA6(e.id)}));
 },root);
 const setup=async(mode,ids=[])=>page.evaluate(({mode,ids})=>{
  const m=window.__depthReview,R=window.__enemyR;m.offline=true;m.tutorialBattle=null;m.replay=null;m.plan=null;m.watching=false;
  m.state=R.setGameplayA6(R.createDepthAccount(826143,0),true);m.state.settings.reducedMotion=true;m.state.tutorial=4;m.state.freeInvite=true;
  if(mode==='prepare'){
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   m.state.run.battle=R.createBattle({...m.battle.initial,enemies:ids});
  }else if(mode==='battle'){m.tutorial();m.fight();m.paused=true;}
  R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go(mode==='sheet'?'codex':mode==='battle'?'battle':'prepare');
  return JSON.stringify({state:m.state,battle:m.battle});
 },{mode,ids});
 const snapshot=()=>page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle}));
 const capture=async(name,mode)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const host=page.locator(mode==='prepare'?'.uv-prepare-main':'.a6-field-guide');
  await host.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  if(mode==='prepare')await page.waitForFunction(()=>{
   const note=document.querySelector('.a6-foe-copy');
   return !!document.querySelector('.a6-foe-scroll-hint')===(note.scrollHeight>note.clientHeight+1);
  });
  const audit=await page.evaluate(mode=>{
   const host=document.querySelector(mode==='prepare'?'.uv-prepare-main':'.a6-field-guide').getBoundingClientRect();
   const note=document.querySelector(mode==='prepare'?'.a6-foe-copy':'.a6-guide-writing'),r=note.getBoundingClientRect();
   const inside=(rect,box)=>rect.top>=box.top-1&&rect.bottom<=box.bottom+1&&rect.left>=box.left-1&&rect.right<=box.right+1;
   const focus=document.activeElement,focusBox=focus.getBoundingClientRect();
   const focusHost=focus.closest('.a6-guide-index')?.getBoundingClientRect()??host;
   const focusMargin=focus.closest('.a6-guide-index')?5.5:0;
   const buttons=[...document.querySelectorAll(mode==='prepare'?'.a6-foe-choice':'.a6-guide-chapters button')];
   const fight=document.querySelector('.uv-fight-bar')?.getBoundingClientRect();
   const forecast=document.querySelector('.dp-v4-forecast');
   return{overflow:document.documentElement.scrollWidth>innerWidth,noteFits:inside(r,host),noteHeight:note.clientHeight,noteTotal:note.scrollHeight,noteTop:note.scrollTop,controlsFit:buttons.every(b=>inside(b.getBoundingClientRect(),host)),focusFits:inside(focusBox,{top:focusHost.top+focusMargin,bottom:focusHost.bottom-focusMargin,left:focusHost.left+focusMargin,right:focusHost.right-focusMargin}),fightFits:!fight||fight.bottom<=innerHeight,forecastFits:mode!=='prepare'||inside(forecast.getBoundingClientRect(),host)};
  },mode);
  const file=`${width}-${mode}-${name}.webp`,png='/tmp/cardrpg-c-enemy-guide.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({file,width,mode,name,...audit});
  expect(audit.overflow,file).toBe(false);for(const key of ['noteFits','controlsFit','focusFits','fightFits','forecastFits'])expect(audit[key],file+' '+key).toBe(true);
 };
 for(const mode of ['sheet','battle'].filter(mode=>modes.includes(mode))){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await setup(mode);
  if(mode==='battle'){
   await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
   await page.getByRole('button',{name:'Read battle guide'}).focus();await page.keyboard.press('Enter');
  }
  const guide=page.getByRole('region',{name:'Cafe field guide'});await guide.waitFor();
  const before=await snapshot();await guide.getByRole('button',{name:'enemies',exact:true}).click();
  const index=guide.getByRole('navigation',{name:'enemies index'});await expect(index.getByRole('button')).toHaveCount(13);
  for(const enemy of enemies){
   const button=index.getByRole('button',{name:enemy.name,exact:true});await button.focus();await page.keyboard.press('Enter');
   const note=guide.getByRole('region',{name:enemy.name+' field note'});await expect(note).toContainText(enemy.intent);await expect(note).toContainText(enemy.counter);
   if(enemy.phases)await expect(note).toContainText(enemy.phases);
   expect(await note.evaluate(el=>el.scrollTop)).toBe(0);await capture(enemy.id+'-selected',mode);
   await note.focus();await page.keyboard.press('End');await expect.poll(()=>note.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);
   if(enemy.phases||enemy.id==='teacup-healer')await capture(enemy.id+'-end',mode);
   await page.keyboard.press('Home');await expect.poll(()=>note.evaluate(el=>el.scrollTop)).toBe(0);
   report.checks.push({width,mode,id:enemy.id,keyboard:true,copy:true,scroll:true});
  }
  await guide.getByRole('searchbox',{name:'Find a field note'}).fill('full rage');await expect(index.getByRole('button')).toHaveCount(9);
  report.checks.push({width,mode,rageSearch:true});expect(await snapshot()).toBe(before);report.checks.push({width,mode,readOnly:true});
  if(mode==='battle'){
   await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Read battle guide'})).toBeFocused();
   expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);report.checks.push({width,mode,returnFocus:true,paused:true});
  }
 }
 for(let start=0;modes.includes('prepare')&&start<enemies.length;start+=3){
  const group=enemies.slice(start,start+3);if(prepareId&&!group.some(e=>e.id===prepareId))continue;
  await setup('prepare',group.map(e=>e.id));
  await page.locator('.dp-v4-forecast:not([data-forecast-state=checking])').waitFor({timeout:15000});const before=await snapshot();
  for(const enemy of group.filter(e=>!prepareId||e.id===prepareId)){
   const button=page.getByRole('button',{name:'Read '+enemy.name+' tactics',exact:true});await button.focus();await page.keyboard.press('Enter');
   const note=page.getByRole('region',{name:enemy.name+' tactics'});await expect(note).toContainText(enemy.intent);await expect(note).toContainText(enemy.counter);
   if(enemy.phases)await expect(note).toContainText(enemy.phases);
   expect(await note.evaluate(el=>el.scrollTop)).toBe(0);await capture(enemy.id,'prepare');
   await note.focus();await page.keyboard.press('End');await expect.poll(()=>note.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);
   if(enemy.phases||['teacup-healer','kettle-knight'].includes(enemy.id))await capture(enemy.id+'-end','prepare');
   await page.keyboard.press('Home');await expect.poll(()=>note.evaluate(el=>el.scrollTop)).toBe(0);
   expect(await snapshot()).toBe(before);report.checks.push({width,mode:'prepare',id:enemy.id,keyboard:true,copy:true,readOnly:true,scroll:true});
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
