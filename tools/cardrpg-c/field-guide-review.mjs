/** Read-only handbook fixtures in the cafe sheet and paused battle dialog. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-field-guide';
const report={checks:[],shots:[],errors:[],complete:false};await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const core=['Burn','Bleed','Bitter','Mark','Shred','Daze','Regen','Warm'];
const added=['Crumb trail','Glaze','Shelter','Saucer riposte','Apron link','Second sprout','Yarn decoy'];
const reactions=['Crumb Burst','Wildfire','Rupture','Spread'];
try{for(const[width,height]of[[1280,720],[1440,900]])for(const mode of['sheet','battle']){
 if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async({root,mode})=>{
  const m=window.__depthReview,R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');m.offline=true;m.state.settings.reducedMotion=true;
  if(mode==='battle'){m.tutorial();m.fight();m.paused=true;m.notify(false);}else m.go('codex');
  R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.notify(false);
 },{root,mode});
 if(mode==='battle'){
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  await page.getByRole('button',{name:'Read battle guide'}).focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Close guide'})).toBeFocused();
 }
 const guide=page.getByRole('region',{name:'Cafe field guide'});await guide.waitFor();
 const before=await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle}));
 const search=guide.getByRole('searchbox',{name:'Find a field note'}),index=guide.getByRole('navigation',{name:'keywords index'});
 const capture=async(name)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  await guide.evaluate(async el=>{await Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
  const audit=await page.evaluate(()=>{
   const guide=document.querySelector('.a6-field-guide'),container=guide.parentElement.getBoundingClientRect();
   const inside=(el,box=container)=>{const r=el.getBoundingClientRect();return r.top>=box.top&&r.bottom<=box.bottom&&r.left>=box.left&&r.right<=box.right;};
   const writing=guide.querySelector('.a6-guide-writing'),list=guide.querySelector('.a6-guide-index');
   const active=document.activeElement,listBox=list.getBoundingClientRect();
   const focusInList=active&&list.contains(active)&&inside(active,{top:listBox.top+5.5,bottom:listBox.bottom-5.5,left:listBox.left+5.5,right:listBox.right-5.5});
   const focusInNote=active===writing&&inside(active);
   return{overflow:document.documentElement.scrollWidth>innerWidth,panelsFit:[...guide.children].every(el=>inside(el)),noteFits:!writing||inside(writing),focus:active?.textContent?.slice(0,90),focusVisible:focusInList||focusInNote||active===guide.querySelector('input')||!!guide.querySelector('.a6-guide-chapters')?.contains(active),noteScroll:writing?{top:writing.scrollTop,height:writing.clientHeight,total:writing.scrollHeight}:null};
  });
  const file=`${width}-${mode}-${name}.webp`,png='/tmp/cardrpg-c-field-guide.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({file,width,mode,name,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.panelsFit,file+' panels').toBe(true);expect(audit.noteFits,file+' note').toBe(true);expect(audit.focusVisible,file+' focus ring').toBe(true);
 };
 await expect(index.getByRole('button')).toHaveCount(19);
 for(const name of [...core,...added,...reactions]){
  const button=index.getByRole('button',{name,exact:true});await button.focus();await page.keyboard.press('Enter');
  await expect(guide.getByRole('heading',{name,exact:true})).toBeVisible();const note=guide.getByRole('region',{name:name+' field note'});
  const text=await note.innerText();expect(text.length).toBeGreaterThan(70);
  if(reactions.includes(name)){expect(text).toContain('one per foe each round');expect(text).toContain('Reactions do not trigger other reactions');expect(text).toContain('Any crew');}
  if(added.includes(name)||reactions.includes(name))await capture(name.toLowerCase().replaceAll(' ','-'));
  report.checks.push({width,mode,name,keyboard:true,present:true});
 }
 for(const [alias,current]of[['Tangle','Shred'],['Hush','Daze'],['Rattled','Daze'],['Scald','Burn']]){
  await search.fill(alias);await expect(guide.getByRole('heading',{name:current,exact:true})).toBeVisible();report.checks.push({width,mode,alias,current,search:true});
 }
 await search.fill('no such cafe note');await expect(guide.getByRole('heading',{name:'No notes found.'})).toBeVisible();await expect(guide.getByText('Try a name, effect or crew role.')).toHaveCSS('color','rgb(118, 86, 56)');await capture('empty-search');report.checks.push({width,mode,emptyHintContrast:true});
 await guide.getByRole('button',{name:'Clear search'}).focus();await page.keyboard.press('Enter');await expect(search).toBeFocused();await expect(index.getByRole('button')).toHaveCount(19);report.checks.push({width,mode,clearSearchFocus:true});
 await index.getByRole('button',{name:'Wildfire',exact:true}).focus();await page.keyboard.press('Enter');
 const writing=guide.getByRole('region',{name:'Wildfire field note'});await writing.focus();await page.keyboard.press('End');await expect(writing).toBeFocused();
 await expect.poll(()=>writing.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThanOrEqual(1);await capture('wildfire-end');
 await page.keyboard.press('Home');await expect.poll(()=>writing.evaluate(el=>el.scrollTop)).toBe(0);await capture('wildfire-home');report.checks.push({width,mode,keyboardNoteScroll:true});
 for(const [chapter,name]of[['companions','Clover'],['enemies','Yarn Giant'],['charms',null],['sets',null]]){
  await guide.getByRole('button',{name:chapter,exact:true}).focus();await page.keyboard.press('Enter');
  const chapterIndex=guide.getByRole('navigation',{name:chapter+' index'}),button=name?chapterIndex.getByRole('button',{name,exact:true}):chapterIndex.getByRole('button').last();
  await button.focus();await page.keyboard.press('Enter');await capture(chapter);report.checks.push({width,mode,chapter,keyboard:true});
 }
 expect(await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle}))).toBe(before);report.checks.push({width,mode,readOnly:true});
 if(mode==='battle'){
  const note=page.locator('.a6-guide-writing');await note.focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Close guide'})).toBeFocused();
  await page.keyboard.press('Shift+Tab');await expect(note).toBeFocused();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Battle guide'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Read battle guide'})).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);report.checks.push({width,mode,focusTrap:true,pausePreserved:true});
 }
 await context.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
