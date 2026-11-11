/** Isolated selector decisions; no battle or acceptance-seed replay. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-selector-final');
const cases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',')??['new-cat','short-marks','duplicate-blocked','duplicate','shards-full','gear','gear-duplicate','gear-full','chapter','mastery','short-all','patrol'];
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__selectorR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__selectorCore=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/index.ts');},root);
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const expected=await page.evaluate(kind=>{const R=window.__selectorR,C=window.__selectorCore,m=window.__depthReview;m.state=R.setGameplayA6(R.createDepthAccount(826051,0),true);m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.selectorMarks=48;m.notice='';m.replay=null;m.plan=null;m.watching=false;
   const gear=['gear','gear-duplicate','gear-full','chapter','mastery','short-all'].includes(kind),type=gear?'gear':'cat';let id=gear?R.GEAR.find(g=>g.chapter===1&&g.rarity==='common').id:'sorrel';
   if(kind==='short-marks')m.state.v4.selectorMarks=3;
   if(kind==='cat-short-all'){id='mochi';m.state.v4.selectorMarks=3;m.state.account.cards.find(c=>c.cardId===id).shards=Number.MAX_SAFE_INTEGER;}
   if(kind==='duplicate-blocked')id='mochi';
   if(['duplicate','shards-full'].includes(kind)){m.shortcut('unlock');m.state.v4.selectorMarks=48;id='mochi';if(kind==='shards-full')m.state.account.cards.find(c=>c.cardId===id).shards=Number.MAX_SAFE_INTEGER;}
   if(kind==='gear-duplicate')m.state.gear.push(R.makeGear(m.state,id,826051));
   if(['chapter','mastery','short-all'].includes(kind)){id=R.GEAR.find(g=>g.chapter===3&&g.rarity==='legendary').id;if(kind==='mastery')m.state.account.chapter=3;}
   if(['gear-full','short-all'].includes(kind))while(m.state.gear.length<R.GEAR_CAP_V4)m.state.gear.push(R.makeGear(m.state,R.GEAR[0].id,m.state.gear.length));
   if(kind==='short-all')m.state.v4.selectorMarks=3;
   if(kind==='patrol')m.state=R.startRun(m.state,1,826051).state;
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('gacha');
   return{before:JSON.stringify(m.state),type,id,name:gear?R.GEAR_BY_ID[id].name:R.CAT_BY_ID[id].name,owned:gear?m.state.gear.filter(g=>g.templateId===id).length:m.state.account.cards.find(c=>c.cardId===id),shards:gear?0:C.CARD_RPG_CONFIG.rarity[C.CARDS.find(c=>c.id===id).rarity].shards,command:R.chooseSelectorV4(m.state,type,id)};
  },kind);
  await page.locator('.uv-recruit-extras>summary').filter({hasText:'Choose with marks'}).click();
  const selector=page.getByRole('region',{name:'Guaranteed choice',exact:true});await selector.getByLabel('Reward type',{exact:true}).selectOption(expected.type);await selector.getByLabel('Chosen reward',{exact:true}).selectOption(expected.id);await selector.evaluate(el=>el.scrollIntoView({block:'center'}));
  const button=selector.getByRole('button',{name:'Choose reward · 24 marks',exact:true});
  const capture=async suffix=>{await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));const file=`${width}-${kind}-${suffix}.webp`,png=`/tmp/cardrpg-c-selector-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file});};
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  if(baseline){report.checks.push({width,kind,enabled:await button.isEnabled(),expectedEnabled:expected.command.ok,text:await selector.innerText()});await capture('before');continue;}
  expect(await button.isEnabled()).toBe(expected.command.ok);if(!expected.command.ok)await expect(selector).toContainText(expected.command.error);
  const preview=selector.getByRole('region',{name:'Chosen reward preview',exact:true});await expect(preview).toContainText(expected.name);expect(await button.getAttribute('aria-describedby')).toBe(await preview.getAttribute('id'));
  if(expected.type==='cat')await expect(preview).toContainText(['shards-full','cat-short-all'].includes(kind)?'Matching shard balance is full.':expected.owned?`${expected.owned.shards} → ${expected.owned.shards+expected.shards} matching shards`:'Level 1 · 1 star');else await expect(preview).toContainText(`${expected.owned} → ${expected.owned+1} owned`);
  if(kind==='cat-short-all')for(const text of ['Earn 21 more selector marks.','Choose an uncollected companion first.','This saved balance is full.'])await expect(preview).toContainText(text);
  if(kind==='short-all')for(const text of ['Earn 21 more selector marks.','The equipment shelf is full (240).','Reach chapter 3.','Complete chapter 3 mastery for this legendary template.'])await expect(preview).toContainText(text);
  const geometry=await selector.evaluate(el=>{const host=el.closest('.uv-sheet-content').getBoundingClientRect(),r=el.getBoundingClientRect();return{inside:r.top>=host.top&&r.bottom<=host.bottom,overflow:el.scrollWidth>el.clientWidth+1};});expect(geometry).toEqual({inside:true,overflow:false});report.checks.push({width,kind,exactEligibility:true,geometry});await capture('preview');
  if(expected.command.ok){await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.command.state);const receipt=selector.getByRole('status');await expect(receipt).toContainText(expected.name);await expect(receipt).toContainText('24 marks spent');report.checks.push({width,kind,keyboardClaim:true,exactCommand:true});await selector.evaluate(el=>el.scrollIntoView({block:'center'}));await capture('claimed');
   const resultButton=selector.getByRole('button',{name:expected.type==='cat'?'View this cat':'View this gear',exact:true});await resultButton.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.screen)).toBe(expected.type==='cat'?'collection':'inventory');expect(await page.evaluate(type=>type==='cat'?window.__depthReview.cardId:window.__depthReview.itemId,expected.type)).toBe(expected.type==='cat'?expected.id:expected.command.state.gear.at(-1).id);report.checks.push({width,kind,openedExactReward:true});
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,keyboardClaims:report.checks.filter(c=>c.keyboardClaim).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
