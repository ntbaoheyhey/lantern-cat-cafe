/** Long tactical notes use the report's scrolling surface and preserve keyboard return paths. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-result-notes';
await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const scenario of['long','loss','practice','replay','legacy']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const fixture=await page.evaluate(async({root,reduced,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.sceneStarted=false;m.autoContinue=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917285,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);
   const setup={...m.battle.initial,seed:917285,gameplayA6:scenario!=='legacy',enemies:[scenario==='practice'?'practice-cushion':'yarn-giant']};
   if(scenario==='long'){setup.cats=setup.cats.map(cat=>({...cat,stats:{...cat.stats,hp:cat.stats.hp*25}}));delete setup.hp;}
   if(scenario==='practice')setup.tutorial=true;
   const b=R.playBattle(R.createBattle(setup),'auto');m.state.run.battle=b;
   if(scenario==='practice')m.tutorialBattle=b;if(scenario==='replay')m.replay=b;
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('result');
   return{rounds:b.round,result:b.result,notes:b.v4.events.map(event=>`Round ${event.round} · ${event.text}`)};
  },{root,reduced,scenario});
  await page.getByRole('button',{name:'Read details'}).waitFor();await page.evaluate(()=>document.fonts.ready);
  const snapshot=()=>page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,replay:window.__depthReview.replay,tutorial:window.__depthReview.tutorialBattle}));
  const before=await snapshot(),trigger=page.getByRole('button',{name:'Read details'});await trigger.click();
  const legacy=scenario==='legacy',panel=legacy?page.locator('.uv-advanced'):page.getByRole('dialog',{name:'Battle details'});
  if(!legacy)await panel.getByRole('button',{name:'Battle notes',exact:true}).click();
  const summary=panel.locator('summary').filter({hasText:'Round-by-round notes'}),detail=summary.locator('..'),body=legacy?page.locator('.uv-sheet-content'):panel.getByRole('region',{name:'Battle report content'});
  await summary.focus();await expect(summary).toBeFocused();await page.keyboard.press('Enter');await expect(detail).toHaveAttribute('open','');
  expect(await detail.locator('li').allTextContents()).toEqual(fixture.notes);expect(fixture.notes.length).toBeGreaterThan(scenario==='practice'?0:10);
  const nested=await detail.evaluate(el=>({overflow:getComputedStyle(el).overflowY,clipped:el.scrollHeight>el.clientHeight+1}));expect(nested.clipped).toBe(false);
  const last=detail.locator('li').last();
  const lastVisible=()=>last.evaluate(el=>{const body=el.closest('.a6-result-report-body')??el.closest('.uv-sheet-content'),r=el.getBoundingClientRect(),b=body.getBoundingClientRect();return r.top>=b.top+2&&r.bottom<=b.bottom-2;});
  if(legacy){
   for(let i=0;i<30&&!await lastVisible();i++){await page.keyboard.press('PageDown');await page.waitForTimeout(130);}
   expect(await lastVisible()).toBe(true);
  }else{
   await body.focus();await expect(body).toBeFocused();await page.keyboard.press('Space');await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
   await page.keyboard.press('End');await expect.poll(()=>body.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThan(2);expect(await lastVisible()).toBe(true);
   await page.keyboard.press('Tab');await expect(summary).toBeFocused();
   const focused=await summary.evaluate(el=>{const r=el.getBoundingClientRect(),b=el.closest('.a6-result-report-body').getBoundingClientRect();return r.top>=b.top+6&&r.bottom<=b.bottom-6;});expect(focused).toBe(true);
   await page.keyboard.press('Home');await expect.poll(()=>body.evaluate(el=>el.scrollTop)).toBe(0);
   await body.focus();await page.keyboard.press('End');await expect.poll(lastVisible).toBe(true);
  }
  const geometry=await panel.evaluate(el=>{const body=el.closest('.uv-sheet-content')??el.querySelector('.a6-result-report-body'),r=el.getBoundingClientRect();return{panelFits:el.matches('.uv-advanced')||r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth||body.scrollWidth>body.clientWidth+1,focusInside:el.contains(document.activeElement)};});
  expect(geometry).toEqual({panelFits:true,horizontalOverflow:false,focusInside:true});
  const capture=async(label)=>{
   if(!reduced)return;await page.evaluate(()=>Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{}))));
   const name=`${width}-${scenario}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,scenario,label});
  };
  await capture('end');
  if(!legacy){
   await summary.focus();await capture('focus');
   await page.keyboard.press('Enter');await expect(detail).not.toHaveAttribute('open','');
   expect(await summary.evaluate(el=>{const r=el.getBoundingClientRect(),b=el.closest('.a6-result-report-body').getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom;})).toBe(true);
   if(scenario==='practice')await expect(panel.getByRole('region',{name:'Your placement paid off'})).toBeVisible();
   await capture('closed');
   for(const tab of['Crew totals','Key moments','Battle notes']){await panel.getByRole('button',{name:tab,exact:true}).click();expect(await body.evaluate(el=>el.scrollTop)).toBe(0);}
   const first=panel.getByRole('button',{name:'Back to result'}),lastButton=panel.locator('footer button').last();
   await first.focus();await page.keyboard.press('Shift+Tab');await expect(lastButton).toBeFocused();await page.keyboard.press('Tab');await expect(first).toBeFocused();
   expect(await snapshot()).toBe(before);await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();
  }else{await summary.focus();await page.keyboard.press('Enter');await expect(detail).not.toHaveAttribute('open','');expect(await snapshot()).toBe(before);await trigger.click();await expect(panel).toHaveCount(0);}
  report.cases.push({width,height,reduced,scenario,...fixture,...geometry,nested,lastVisible:true,readOnly:true,keyboard:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
