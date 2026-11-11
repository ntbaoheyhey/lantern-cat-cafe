/** Daily reward decisions on isolated practice fixtures; no combat or acceptance seeds. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-daily-final');
const cases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',')??['full','partial','capped','week-end','points-full','incomplete','collected','patrol','rollback'];
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__dailyR=R;window.__dailyNow=0;const m=window.__depthReview;m.offline=true;Object.defineProperty(m,'cafeNow',{get:()=>window.__dailyNow});
  m.state=R.setGameplayA6(R.createDepthAccount(826033,0),true);m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.dailyA6={...R.dailyProgressA6(m.state),completed:R.DAILY_TASKS_A6.map(t=>t.id),weeklyPoints:30};R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];return JSON.stringify(m.state);},root);
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind})=>{const R=window.__dailyR,m=window.__depthReview;window.__dailyNow=0;m.state=JSON.parse(fixture);m.notice='';m.replay=null;m.plan=null;m.watching=false;
   if(kind==='week-end'){window.__dailyNow=6*86400000;m.state=R.syncCalendarDay(m.state,window.__dailyNow).state;m.state.dailyA6={...R.dailyProgressA6(m.state),completed:R.DAILY_TASKS_A6.map(t=>t.id),weeklyPoints:30};}
   const caps=R.depthCaps(m.state);m.state.account.daily.earned={fish:0,stamps:0,threads:0,essence:0};
   if(kind==='partial'||kind==='week-end')m.state.account.daily.earned={...caps,fish:caps.fish-3,stamps:caps.stamps-3,threads:caps.threads-2};
   if(kind==='capped')m.state.account.daily.earned={...caps};
   if(kind==='points-full')m.state.dailyA6.weeklyPoints=35;
   if(kind==='incomplete')m.state.dailyA6={...R.dailyProgressA6(m.state),completed:[],weeklyPoints:0};
   if(kind==='collected')m.state.dailyA6={...R.dailyProgressA6(m.state),claimed:R.DAILY_TASKS_A6.map(t=>t.id),weeklyClaims:[10,20,30],loginDay:m.state.account.day,loginGifts:7};
   if(kind==='patrol')m.state=R.startRun(m.state,1,826033).state;
   if(kind==='rollback')m.state.v4.clockWatermark=100;
   m.state.v4.journey.pending=[];m.go('hub');const b=R.dailyBoardA6(m.state,m.cafeNow);
   const gifts=[{...b.login,kind:'login',id:'login',requested:R.LOGIN_GIFTS_A6[b.progress.loginGifts]??{},command:R.claimDailyA6(m.state,m.cafeNow,'login')},...b.weekly.map(w=>({...w,kind:'weekly',id:w.points,requested:{stamps:w.points*4,threads:w.points},command:R.claimDailyA6(m.state,m.cafeNow,'weekly',w.points)})),...b.tasks.map(t=>({...t,kind:'task',requested:R.DAILY_TASKS_A6.find(x=>x.id===t.id).reward,command:R.claimDailyA6(m.state,m.cafeNow,'task',t.id)}))];return{before:JSON.stringify(m.state),gifts};
  },{fixture,kind});
  await page.getByRole('button',{name:'Events',exact:true}).click();
  const buttonFor=g=>g.kind==='login'?page.locator('.a6-login>.cr-primary'):g.kind==='weekly'?page.getByRole('button',{name:`Collect ${g.id}-task weekly gift`,exact:true}):page.locator('.a6-daily-tasks article').filter({has:page.getByRole('heading',{name:g.name,exact:true})}).getByRole('button');
  const cardFor=g=>g.kind==='login'?page.locator('.a6-login-claim'):g.kind==='weekly'?buttonFor(g).locator('xpath=ancestor::article[1]'):buttonFor(g).locator('xpath=ancestor::article[1]');
  for(const g of expected.gifts){const button=buttonFor(g);expect(await button.isEnabled()).toBe(g.command.ok);const reduced=Object.entries(g.requested).some(([id,n])=>(g.reward[id]??0)<n);
   if(!baseline&&!g.claimed){const card=cardFor(g);for(const[id,n]of Object.entries(g.requested))await expect(card).toContainText(`${n} ${id}`);if(reduced){await expect(card).toContainText('Today:');for(const[id]of Object.entries(g.requested))await expect(card).toContainText(`${g.reward[id]??0} ${id}`);}
    if(g.command.ok&&reduced){await expect(button).toContainText('Collect reduced gift');const description=await button.evaluate(b=>(b.getAttribute('aria-describedby')??'').split(' ').map(id=>document.getElementById(id)?.textContent??'').join(' '));expect(description.toLowerCase()).toContain('uses the whole gift');}
   }if(!baseline&&g.kind==='login'&&!g.command.ok){expect(await button.evaluate(b=>getComputedStyle(b).backgroundImage)).toBe('none');}report.checks.push({width,kind,gift:g.kind,id:g.id,eligible:g.command.ok,reduced});
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  if(!baseline){await expect(page.locator('.a6-task-heading')).toContainText('Task gifts reset tomorrow.');await expect(page.locator('.a6-weekly-reset')).toContainText(kind==='week-end'?'Weekly gifts reset tomorrow.':'Weekly gifts reset in 7 days.');if(kind==='week-end')await expect(page.locator('.a6-weekly-reset')).not.toContainText('Wait for a new day');if(kind==='points-full')await expect(page.locator('.a6-task-heading')).toContainText('Weekly points are full.');}
  const capture=async(section,suffix='')=>{const target=section==='top'?page.locator('.a6-login'):page.locator('.a6-daily-tasks');await target.scrollIntoViewIfNeeded();await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));const audit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,cardOverflow:[...document.querySelectorAll('.a6-daily article,.a6-login-days>div')].some(c=>c.scrollWidth>c.clientWidth+1)}));const file=`${width}-${kind}-${section}${suffix}.webp`,png=`/tmp/cardrpg-c-daily-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({file,...audit});if(!baseline){expect(audit.overflow,file).toBe(false);expect(audit.cardOverflow,file).toBe(false);}};
  await capture('top');
  if(!baseline){const jump=page.getByRole('button',{name:'Tonight’s tasks ↓'});await jump.focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Tonight’s five tasks'})).toBeFocused();await expect(page.getByRole('heading',{name:'Tonight’s five tasks'})).toBeInViewport({ratio:1});report.checks.push({width,kind,jump:true});}
  await capture('tasks');
  if(!baseline)for(const g of expected.gifts.filter(g=>g.command.ok)){
   await page.evaluate(before=>{const m=window.__depthReview;m.state=JSON.parse(before);m.notify(false);},expected.before);
   const button=buttonFor(g);await button.focus();await expect(button).toBeInViewport({ratio:1});
   const contained=await button.evaluate(b=>{const h=b.closest('.uv-sheet-content').getBoundingClientRect(),r=b.getBoundingClientRect();return r.top>=h.top+2&&r.bottom<=h.bottom-2;});expect(contained,`${width}/${kind}/${g.kind}/${g.id}`).toBe(true);
   await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(g.command.state);await expect(buttonFor(g)).toBeDisabled();report.checks.push({width,kind,gift:g.kind,id:g.id,keyboard:true,exactCommand:true});
   if(g.kind==='login'&&kind==='partial'||g.kind==='task'&&g.id==='gear'&&kind==='week-end')await capture(g.kind==='login'?'top':'tasks','-claimed');
  }
  if(!baseline&&['capped','week-end'].includes(kind)){
   const next=await page.evaluate(before=>{const R=window.__dailyR,m=window.__depthReview;m.state=JSON.parse(before);window.__dailyNow+=86400000;const b=R.dailyBoardA6(m.state,m.cafeNow);m.notify(false);return{before:JSON.stringify(m.state),tasks:b.tasks.map(t=>t.complete),weekly:b.weekly.map(w=>!w.reason),login:!b.login.reason,day:b.state.account.day};},expected.before);
   expect(next.tasks).toEqual([false,false,false,false,false]);expect(next.weekly).toEqual(kind==='week-end'?[false,false,false]:[true,true,true]);expect(next.login).toBe(true);expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(next.before);await capture('top','-next-day');report.checks.push({width,kind,rollover:next});
  }
  await page.getByRole('button',{name:'Close',exact:true}).click();
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,keyboard:report.checks.filter(c=>c.keyboard).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
