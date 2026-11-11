/** Review existing idle commands on isolated fixtures; no combat or acceptance seeds. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-idle-final');
const cases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',')??['empty','ready','full','partial','capped','fast-used','patrol','rollback','next-day'];
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__idleR=R;window.__idleNow=0;const m=window.__depthReview;m.offline=true;Object.defineProperty(m,'cafeNow',{get:()=>window.__idleNow});m.state=R.setGameplayA6(R.createDepthAccount(826044,0),true);m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];return JSON.stringify(m.state);},root);
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind})=>{const R=window.__idleR,m=window.__depthReview;m.state=JSON.parse(fixture);m.notice='';m.replay=null;m.plan=null;m.watching=false;window.__idleNow=kind==='empty'?0:['full','partial','capped'].includes(kind)?12*3600000:3600000;
   const caps=R.depthCaps(m.state);m.state.account.daily.earned={fish:0,stamps:0,threads:0,essence:0};
   if(kind==='partial')m.state.account.daily.earned={...caps,fish:caps.fish-3,threads:caps.threads-2,stamps:caps.stamps-3};
   if(['capped','next-day'].includes(kind))m.state.account.daily.earned={...caps};
   if(['fast-used','next-day'].includes(kind))m.state.idle.a6={fastDay:0,fastClaims:2};
   if(kind==='next-day')window.__idleNow=25*3600000;
   if(kind==='patrol')m.state=R.startRun(m.state,1,826044).state;
   if(kind==='rollback')m.state.v4.clockWatermark=window.__idleNow+100;
   m.state.v4.journey.pending=[];m.go('hub');return {before:JSON.stringify(m.state),gifts:[false,true].map(fast=>({fast,preview:R.idleChestA6(m.state,m.cafeNow,fast),command:R.claimIdleA6(m.state,m.cafeNow,fast)}))};
  },{fixture,kind});
  const capture=async suffix=>{await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));const file=`${width}-${kind}-${suffix}.webp`,png=`/tmp/cardrpg-c-idle-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file});};
  await capture('home');
  if(baseline){report.checks.push({width,kind,gifts:expected.gifts.map(g=>({fast:g.fast,preview:g.preview,eligible:g.command.ok}))});continue;}
  const opener=page.getByRole('button',{name:'Review Night tips',exact:true}),fastOpener=page.getByRole('button',{name:'Review Fast reward',exact:true});
  const fastStyle=await fastOpener.evaluate(b=>({color:getComputedStyle(b).color,detail:getComputedStyle(b.querySelector('small')).color}));
  expect(fastStyle).toEqual(expected.gifts[1].command.ok?{color:'rgb(85, 56, 31)',detail:'rgb(96, 65, 36)'}:{color:'rgb(223, 197, 160)',detail:'rgb(208, 185, 155)'});report.checks.push({width,kind,fastStyle});
  await opener.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:'Night tips and fast rewards',exact:true});await expect(dialog).toBeVisible();await expect(dialog.getByRole('button',{name:'Back to cafe',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  for(const g of expected.gifts){const card=dialog.locator('article[data-reward="'+(g.fast?'fast':'tips')+'"]'),button=card.getByRole('button');expect(await button.isEnabled()).toBe(g.command.ok);
   for(const[id,n]of Object.entries(g.preview.requested)){const row=card.getByRole('row').filter({has:page.getByRole('rowheader',{name:id,exact:true})});expect(await row.locator('td').allTextContents()).toEqual([String(n),String(g.preview.reward[id]??0)]);}
   const description=await button.evaluate(b=>(b.getAttribute('aria-describedby')??'').split(' ').map(id=>document.getElementById(id)?.textContent??'').join(' '));expect(description).toContain(g.fast?'Saved tips stay in the chest.':'Collecting empties all saved tips.');if(g.preview.reason)await expect(card).toContainText(g.preview.reason);report.checks.push({width,kind,fast:g.fast,eligible:g.command.ok});
  }
  const geometry=await dialog.evaluate(d=>{const box=d.getBoundingClientRect();return{inside:box.top>=8&&box.bottom<=innerHeight-8&&box.left>=8&&box.right<=innerWidth-8,overflow:d.scrollWidth>d.clientWidth+1,cards:[...d.querySelectorAll('article')].map(c=>{const r=c.getBoundingClientRect();return{inside:r.top>=box.top&&r.bottom<=box.bottom,overflow:c.scrollWidth>c.clientWidth+1};})};});expect(geometry.inside).toBe(true);expect(geometry.overflow).toBe(false);for(const c of geometry.cards){expect(c.inside).toBe(true);expect(c.overflow).toBe(false);}report.checks.push({width,kind,geometry});await capture('review');
  await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(opener).toBeFocused();expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  await fastOpener.focus();await page.keyboard.press('Enter');await expect(dialog).toBeVisible();await page.keyboard.press('Shift+Tab');const controls=dialog.locator('button:not(:disabled)');await expect(controls.last()).toBeFocused();await page.keyboard.press('Tab');await expect(controls.first()).toBeFocused();report.checks.push({width,kind,keyboardOpenClose:true});
  for(const g of expected.gifts.filter(g=>g.command.ok)){
   await page.evaluate(before=>{const m=window.__depthReview;m.state=JSON.parse(before);m.notify(false);},expected.before);const button=dialog.locator('article[data-reward="'+(g.fast?'fast':'tips')+'"]').getByRole('button');await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(g.command.state);await expect(dialog.getByRole('status')).toContainText('Collected');for(const[id,n]of Object.entries(g.preview.reward).filter(([,n])=>n>0))await expect(dialog.getByRole('status')).toContainText(`${n} ${id}`);report.checks.push({width,kind,fast:g.fast,keyboardClaim:true,exactCommand:true});
   if(['partial','full'].includes(kind))await capture(g.fast?'fast-claimed':'tips-claimed');
  }
  await dialog.getByRole('button',{name:'Back to cafe',exact:true}).click();await expect(fastOpener).toBeFocused();
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,keyboardClaims:report.checks.filter(c=>c.keyboardClaim).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
