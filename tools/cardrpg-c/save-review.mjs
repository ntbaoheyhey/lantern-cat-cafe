/** Isolated save fixtures; no earned-play, balancing or designer source changes. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-save-review';
const report={fixture:'Isolated temporary accounts in fresh browser contexts; no earned play.',checks:[],shots:[],errors:[],complete:false};
await mkdir(output,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__saveR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);
 const snapshot=()=>page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 const capture=async name=>{
  await page.locator('.a6-settings-desk').waitFor();
  await page.waitForFunction(()=>[...document.querySelectorAll('.uv-sheet-backdrop,.uv-sheet,.uv-sheet-content')].every(el=>Number(getComputedStyle(el).opacity)===1&&el.getAnimations().every(a=>a.playState!=='running')));
  await page.locator('.uv-sheet').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{
   const sheet=document.querySelector('.uv-sheet-content').getBoundingClientRect(),desk=document.querySelector('.a6-settings-desk');
   const fits=el=>{const r=el.getBoundingClientRect();return r.left>=sheet.left&&r.right<=sheet.right&&r.top>=sheet.top&&r.bottom<=sheet.bottom;};
   const motion=document.querySelector('.a6-comfort-motion');
   return{overflow:document.documentElement.scrollWidth>innerWidth,controlsFit:[...desk.querySelectorAll('button,textarea,select,input,table')].every(fits),panelsFit:[...desk.children].every(fits),motionRow:getComputedStyle(motion).flexDirection==='row',focus:document.activeElement?.getAttribute('aria-label')??document.activeElement?.textContent?.slice(0,120),tableColor:desk.querySelector('th')?getComputedStyle(desk.querySelector('th')).color:null};
  });
  const file=`${width}-${name}.webp`,png=`/tmp/cardrpg-c-save-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.controlsFit,file+' controls').toBe(true);expect(audit.panelsFit,file+' panels').toBe(true);expect(audit.motionRow).toBe(true);if(audit.tableColor)expect(audit.tableColor).toBe('rgb(99, 75, 49)');
 };
 const setup=async(offline,kind='fresh')=>{
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.locator('.a6-settings-desk').waitFor({state:'hidden'});
  return page.evaluate(({offline,kind})=>{
   const m=window.__depthReview,R=window.__saveR;m.offline=offline;m.watching=false;m.replay=null;m.plan=null;m.galleryBattle=null;m.tutorialBattle=null;
   const fresh=()=>R.setGameplayA6(R.createDepthAccount(826130,0),true);
   m.state=fresh();m.state.tutorial=4;m.state.freeInvite=true;m.state.account.cards[0].level=2;m.state.settings.reducedMotion=true;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];
   const source=fresh();source.tutorial=4;source.freeInvite=true;source.account.cards[0].level=3;source.settings.speed=3;source.settings.quality='high';source.settings.reducedMotion=false;
   Object.assign(source.account.currencies,{fish:1234,threads:111,stamps:222,essence:7});
   if(kind==='large')for(const id in source.account.currencies)source.account.currencies[id]=Number.MAX_SAFE_INTEGER;
   let saved=source;if(kind==='route')saved=R.startRun(saved,1,826132).state;
   if(kind==='tower'){saved.cleared=[1];saved.towerBest=4;saved=R.startTowerFloorA6(saved,5).state;}
   R.observeDiscoveriesV4(saved);saved.v4.journey.pending=[];m.go('save');
   return{before:JSON.stringify(m.state),code:R.exportSave(saved),saved,key:R.SAVE_KEY,storage:localStorage.getItem(R.SAVE_KEY)};
  },{offline,kind});
 };
 for(const offline of[true,false]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const mode=offline?'demo':'local';let f=await setup(offline);const box=page.getByRole('textbox',{name:'Save code'}),open=page.getByRole('button',{name:'Import save code',exact:true});
  await expect(open).toBeDisabled();await expect(page.getByRole('button',{name:'Select save code'})).toBeDisabled();await capture(mode+'-empty');
  const backup=page.getByRole('button',{name:'Export save code'});await backup.focus();await page.keyboard.press('Enter');
  const code=await box.inputValue();expect(code.startsWith('THC15.')).toBe(true);await page.getByRole('button',{name:'Select save code'}).click();
  expect(await box.evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length)).toBe(true);expect(await snapshot()).toBe(f.before);await capture(mode+'-selected');
  for(const invalid of['broken evening',f.code.slice(0,-10)]){await box.fill(invalid);await open.focus();await page.keyboard.press('Enter');await expect(page.locator('.a6-save-feedback')).toContainText('Paste the complete code');expect(await snapshot()).toBe(f.before);await expect(page.getByRole('button',{name:'Restore saved evening'})).toHaveCount(0);report.checks.push({width,mode,invalid:true,unchanged:true});}
  await capture(mode+'-invalid');
  await box.fill(f.code);await open.focus();await page.keyboard.press('Enter');const preview=page.getByRole('region',{name:'Review saved progress'});
  await expect(page.getByRole('heading',{name:'Restore this evening?'})).toBeFocused();await expect(preview.getByRole('row',{name:'Stamps 600 222'})).toBeVisible();await expect(preview.getByRole('row',{name:'Essence 0 7'})).toBeVisible();
  expect(await snapshot()).toBe(f.before);expect(await page.evaluate(key=>localStorage.getItem(key),f.key)).toBe(f.storage);await capture(mode+'-preview');
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Restore saved evening'})).toBeFocused();await capture(mode+'-restore-focus');
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Keep this account',exact:true})).toBeFocused();await capture(mode+'-cancel-focus');await page.keyboard.press('Enter');await expect(open).toBeFocused();
  expect(await snapshot()).toBe(f.before);expect(await box.inputValue()).toBe(f.code);await capture(mode+'-cancelled');report.checks.push({width,mode,cancel:true,unchanged:true,focusReturned:true});
  await page.keyboard.press('Enter');await page.keyboard.press('Tab');await page.keyboard.press('Enter');await page.locator('.a6-settings-desk').waitFor({state:'hidden'});expect(await page.evaluate(()=>window.__depthReview.screen)).toBe('hub');
  expect(await page.evaluate(()=>window.__depthReview.state.account)).toEqual(f.saved.account);expect(await page.evaluate(()=>window.__depthReview.state.team)).toEqual(f.saved.team);expect(await page.evaluate(()=>window.__depthReview.state.settings)).toEqual(f.saved.settings);await page.evaluate(()=>window.__depthReview.go('save'));await capture(mode+'-restored');report.checks.push({width,mode,exactRestoration:true,keyboard:true});
  await page.getByRole('checkbox',{name:/Reduced motion/}).check();await page.getByRole('combobox',{name:'Playback speed'}).selectOption('2');await page.getByRole('combobox',{name:'Quality',exact:true}).selectOption('low');
  expect(await page.evaluate(()=>window.__depthReview.state.settings)).toMatchObject({reducedMotion:true,speed:2,quality:'low'});await capture(mode+'-comfort');report.checks.push({width,mode,settings:true});
  if(!offline){await page.reload();await page.getByRole('button',{name:'Cats',exact:true}).waitFor();await page.evaluate(async root=>{window.__saveR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__depthReview.go('save');},root);await expect(page.getByRole('combobox',{name:'Playback speed'})).toHaveValue('2');await expect(page.getByRole('combobox',{name:'Quality',exact:true})).toHaveValue('low');await expect(page.getByRole('checkbox',{name:/Reduced motion/})).toBeChecked();expect(await page.evaluate(()=>window.__depthReview.state.account.currencies.stamps)).toBe(222);await capture(mode+'-reloaded');report.checks.push({width,mode,persisted:true});}
 }
 for(const kind of['route','tower','large']){
  const f=await setup(true,kind);await page.getByRole('textbox',{name:'Save code'}).fill(f.code);await page.getByRole('button',{name:'Import save code',exact:true}).click();
  await expect(page.getByText(kind==='route'?'Chapter 1 route':kind==='tower'?'Tower floor 5':'At the cafe',{exact:true})).toBeVisible();expect(await snapshot()).toBe(f.before);await capture(kind+'-preview');
  await page.getByRole('button',{name:'Keep this account',exact:true}).click();expect(await snapshot()).toBe(f.before);report.checks.push({width,kind,preview:true,unchanged:true});
 }
 const f=await setup(true);await page.getByRole('button',{name:'Start again'}).click();await page.getByRole('button',{name:'Reset account',exact:true}).click();expect(await snapshot()).toBe(f.before);await capture('reset-confirm');await page.getByRole('button',{name:'Keep this account',exact:true}).click();expect(await snapshot()).toBe(f.before);await expect(page.getByRole('button',{name:'Start again'})).toBeFocused();report.checks.push({width,resetCancelled:true});
 await context.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
