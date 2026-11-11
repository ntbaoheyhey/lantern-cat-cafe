/** Recruitment purchase explanations; isolated fixtures, no balance/acceptance-seed replay. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const animated=process.argv.includes('--animated');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-recruit-final');
const cases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',')??['welcome','new','ten','empty','short','daily','day-full','shelf','shelf-full','gear-ten','marks-full','all-short','patrol','duplicate','gear-duplicate','featured'];
await mkdir(output,{recursive:true});const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(12000);page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__recruitR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__recruitWelcome=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/onboarding.ts');},root);
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const expected=await page.evaluate(({kind,animated})=>{const R=window.__recruitR,m=window.__depthReview;m.state=R.setGameplayA6(R.createDepthAccount(826081,0),true);m.offline=true;m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=!animated;m.state.v4.selectorMarks=23;m.notice='';m.replay=null;m.plan=null;m.watching=false;
   const gear=['shelf','shelf-full','gear-ten','gear-duplicate','all-short','gear-legendary'].includes(kind),bannerId=gear?'equipment':kind==='featured'?'featured':'standard',count=['ten','gear-ten'].includes(kind)?10:1,welcome=kind==='welcome';
   if(welcome){m.state.freeInvite=false;m.state.account.currencies.stamps=0;}
   if(['empty','all-short'].includes(kind))m.state.account.currencies.stamps=0;
   if(kind==='short')m.state.account.currencies.stamps=590;
   if(['daily','all-short'].includes(kind))m.state.account.daily.draws=29;
   if(kind==='day-full')m.state.account.daily.draws=30;
   if(['shelf','shelf-full','all-short'].includes(kind))while(m.state.gear.length<(kind==='shelf-full'?240:235))m.state.gear.push(R.makeGear(m.state,R.GEAR[0].id,m.state.gear.length));
   if(kind==='marks-full')m.state.v4.selectorMarks=Number.MAX_SAFE_INTEGER;
   if(kind==='patrol')m.state=R.startRun(m.state,1,826081).state;
   if(kind==='duplicate'){m.shortcut('unlock');m.state.account.cards.forEach(c=>{c.level=10;c.stars=3;});m.state.account.currencies.stamps=600;m.state.v4.selectorMarks=23;}
   if(kind==='gear-duplicate')for(const g of R.GEAR)if(!m.state.gear.some(i=>i.templateId===g.id))m.state.gear.push(R.makeGear(m.state,g.id,m.state.gear.length));
   if(kind==='gear-legendary')m.state.account.pity.gear={sinceLegendary:23,totalPulls:23,featuredGuaranteed:false};
   if(kind==='featured')m.state.account.pity['cats-featured']={sinceLegendary:23,totalPulls:23,featuredGuaranteed:true};
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('gacha');
   const b=R.invitationBannerV4(bannerId,m.state),seed=m.state.account.seed+(m.state.account.pity[b.pityGroup]?.totalPulls??0)*101+39;
   return{before:JSON.stringify(m.state),bannerId,count,welcome,one:R.metaCommand(m.state,{type:'pull',bannerId,count:1,seed}),ten:R.metaCommand(m.state,{type:'pull',bannerId,count:10,seed}),command:welcome?window.__recruitWelcome.firstInvitation(m.state,4):R.metaCommand(m.state,{type:'pull',bannerId,count,seed})};
  },{kind,animated});
  if(expected.bannerId!=='standard')await page.getByRole('button',{name:expected.bannerId==='equipment'?'Mending Basket':'Marigold at Closing Time',exact:true}).click();
  const purchases=page.locator('.a6-recruit-purchases'),counter=page.locator('.uv-recruit-counter');
  const capture=async suffix=>{await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));const file=`${width}-${kind}-${suffix}.webp`,png=`/tmp/cardrpg-c-recruit-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file});};
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  for(const[count,quote]of[[1,expected.one],[10,expected.ten]]){
   const group=page.getByRole('group',{name:`${count} invitation purchase`,exact:true}),button=group.getByRole('button');expect(await button.isEnabled()).toBe(quote.ok);expect(await button.getAttribute('aria-describedby')).toBe(await group.locator('.a6-recruit-quote').getAttribute('id'));
   if(!quote.ok){const css=await button.evaluate(el=>{const s=getComputedStyle(el);return{background:s.backgroundImage,opacity:s.opacity,shadow:s.boxShadow};});expect(css).toEqual({background:'none',opacity:'1',shadow:'none'});}
   report.checks.push({width,kind,count,exactEligibility:true,described:true});
  }
  if(kind==='all-short')for(const text of ['Need 600 more stamps.','1 invitation left today; this needs 10.','5 gear spaces free; this needs 10.'])await expect(page.getByRole('group',{name:'10 invitation purchase',exact:true})).toContainText(text);
  await purchases.evaluate(el=>el.scrollIntoView({block:'center'}));
  const geometry=await purchases.evaluate(el=>{const host=el.closest('.uv-sheet-content').getBoundingClientRect(),r=el.getBoundingClientRect();return{inside:r.top>=host.top&&r.bottom<=host.bottom,overflow:el.scrollWidth>el.clientWidth+1};});expect(geometry).toEqual({inside:true,overflow:false});report.checks.push({width,kind,geometry});await capture('preview');
  if(expected.command.ok){
   const group=page.getByRole('group',{name:expected.welcome?'Free welcome':`${expected.count} invitation purchase`,exact:true}),button=group.getByRole('button');await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.command.state);
   if(animated){
    const splash=page.getByRole('dialog',{name:'Invitation reveal',exact:true});await splash.waitFor();if(expected.bannerId==='equipment')await expect(splash).toContainText('A KEEPSAKE FOR THE JOURNEY');
    const bounds=await splash.evaluate(el=>{const nodes=[...el.querySelectorAll('.a6-recruit-highlight>*,.uv-reveal-toolbar')].filter(n=>!n.classList.contains('a6-reveal-particles'));return nodes.map(n=>{const r=n.getBoundingClientRect();return {tag:n.tagName,className:n.className,text:n.textContent?.slice(0,100),inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overflow:n.scrollWidth>n.clientWidth+1};});});
    report.checks.push({width,kind,animation:true,bounds});await capture('highlight');expect(bounds.every(b=>b.inside&&!b.overflow)).toBe(true);
    const settled=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));await page.keyboard.press('Escape');expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(settled);
   }
   const results=page.getByLabel('Invitation results',{exact:true});await expect(results.locator('article')).toHaveCount(expected.count);await expect(page.getByRole('heading',{name:'Welcome home',exact:true})).toBeFocused();report.checks.push({width,kind,keyboardClaim:true,exactCommand:true});
   const last=expected.command.state.account.history.slice(-expected.count);expect(await results.getByLabel('1 star',{exact:true}).count()).toBe(last.filter(r=>r.cardId&&!r.duplicate).length);
   if(kind==='featured')await expect(results).toContainText('Marigold');
   const summary=await results.evaluate(el=>{const host=el.closest('.uv-sheet-content').getBoundingClientRect(),r=el.getBoundingClientRect(),button=el.nextElementSibling.getBoundingClientRect();return{inside:r.top>=host.top&&button.bottom<=host.bottom,overflow:el.scrollWidth>el.clientWidth+1};});report.checks.push({width,kind,results:true,summary});await capture('result');expect(summary).toEqual({inside:true,overflow:false});
   if(kind==='gear-duplicate'){await page.locator('.uv-recruit-extras>summary').filter({hasText:'Recent invitations'}).click();await expect(page.locator('.uv-history')).toContainText('Added to your bag');await expect(page.locator('.uv-history')).not.toContainText('0 shards');await capture('history');}
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,keyboardClaims:report.checks.filter(c=>c.keyboardClaim).length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
