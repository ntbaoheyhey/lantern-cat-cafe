/** Controlled collection/crew fixtures; no battle or new progression measurement. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-bond-summary';
const report={fixture:'Controlled owned/bench/missing crew states; no gameplay sample.',checks:[],shots:[],errors:[],complete:false};
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__bondR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);
 const cats=await page.evaluate(()=>window.__bondR.CATS.map(c=>({id:c.id,name:c.name})));
 const setup=async kind=>page.evaluate(kind=>{
  const m=window.__depthReview,R=window.__bondR;
  m.offline=true;m.watching=false;m.replay=null;m.tutorialBattle=null;m.plan=null;m.galleryBattle=null;
  m.state=R.setGameplayA6(R.createDepthAccount(826116,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;
  if(kind!=='fresh')m.shortcut('unlock');
  if(kind==='paired')m.state.team=['mochi','clover','inkcap'];
  R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];
  m.cardId='clover';m.go('collection');return JSON.stringify(m.state);
 },kind);
 const capture=async(name,details=true)=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(details=>{
   const sheet=document.querySelector('.uv-sheet-content').getBoundingClientRect(),summary=document.querySelector('.a6-bond-summary');
   const fits=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.left>=sheet.left-1&&r.right<=sheet.right+1&&r.top>=sheet.top-1&&r.bottom<=sheet.bottom+1;};
   return{overflow:document.documentElement.scrollWidth>innerWidth,summaryFits:!details||fits(summary),buttonFits:!details||fits(summary.querySelector('button')),triggerFits:!details||fits(summary.querySelector('.a6-bond-trigger')),notesHeight:summary?.querySelector('.a6-bond-pair-notes').clientHeight,focus:document.activeElement?.getAttribute('aria-label')??document.activeElement?.textContent};
  },details);
  const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-bond-summary-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','82',tmp,'-o',output+'/'+file]);report.shots.push({width,name,file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.summaryFits,file+' summary').toBe(true);expect(audit.buttonFits,file+' action').toBe(true);expect(audit.triggerFits,file+' trigger').toBe(true);if(details)expect(audit.notesHeight,file+' usable notes').toBeGreaterThan(75);
 };
 let before=await setup('fresh');await page.getByRole('button',{name:'Discover all',exact:true}).click();
 for(const cat of cats){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.locator('.uv-cat-grid').getByRole('button',{name:new RegExp('^'+cat.name+',')}).click();
  await page.getByRole('complementary',{name:'Cat details'}).getByRole('button',{name:'Bonds',exact:true}).click();
  const notes=page.getByRole('region',{name:'Pair combo details'});await notes.waitFor();
  const expected=await page.evaluate(id=>{const m=window.__depthReview,R=window.__bondR;return R.PAIR_COMBOS_A6.filter(p=>p.cats.includes(id)).map(p=>({...p,missing:p.cats.filter(id=>!m.state.account.cards.some(c=>c.cardId===id)),ready:p.cats.every(id=>m.state.team.includes(id))}));},cat.id);
  for(const pair of expected){const row=notes.getByRole('article',{name:pair.name});await expect(row).toContainText(pair.description);await expect(row).toHaveAttribute('data-state',pair.missing.length?'missing':pair.ready?'ready':'owned');}
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
  const fullNote=async last=>expect(await notes.evaluate((el,last)=>{const r=el.getBoundingClientRect(),item=el.querySelector(last?'article:last-child':'article:first-child').getBoundingClientRect();return item.top>=r.top&&item.bottom<=r.bottom;},last)).toBe(true);
  await fullNote(false);await capture('fresh-'+cat.id);
  if(expected.length>1){await notes.focus();await page.keyboard.press('End');await expect.poll(()=>notes.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1)).toBe(true);await fullNote(true);await capture('fresh-'+cat.id+'-end');}
  report.checks.push({width,cat:cat.id,exactEffects:true,readOnly:true,eligibility:true,wholeNotes:true});
 }
 for(const kind of['bench','paired']){
  before=await setup(kind);await page.getByRole('complementary',{name:'Cat details'}).getByRole('button',{name:'Bonds',exact:true}).click();
  const notes=page.getByRole('region',{name:'Pair combo details'}),pair=notes.getByRole('article',{name:'Garden Afterglow'});
  await expect(pair).toHaveAttribute('data-state',kind==='bench'?'owned':'ready');
  await notes.focus();await expect(notes).toBeFocused();await page.keyboard.press('End');await expect.poll(()=>notes.evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-1)).toBe(true);
  await expect(pair).toBeInViewport({ratio:1});await capture(kind+'-end');
  await page.keyboard.press('Home');await expect.poll(()=>notes.evaluate(el=>el.scrollTop)).toBe(0);await capture(kind+'-start');
  const open=page.getByRole('button',{name:'Open Bond Book',exact:true});await page.keyboard.press('Tab');await expect(open).toBeFocused();await capture(kind+'-open');await page.keyboard.press('Enter');
  await page.getByRole('navigation',{name:'Collection bonds index'}).waitFor();
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
  await capture(kind+'-book',false);report.checks.push({width,kind,keyboard:true,readOnly:true,bookOpened:true,scrollable:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
