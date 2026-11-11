/** First-evening presentation states; isolated fixtures, no balance cohort. */
import{createRequire}from'node:module';
import{access,mkdir,writeFile}from'node:fs/promises';
import{execFileSync}from'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-first-context',report={checks:[],shots:[],errors:[],complete:false};
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chromium'});
try{for(const[width,height]of[[1280,720],[1440,900]]){
const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
await page.evaluate(async root=>{window.__firstR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__firstO=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/onboarding.ts');},root);
const capture=async name=>{await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));const file=width+'-'+name+'.webp',png='/tmp/cardrpg-c-first-context-'+width+'.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,name,file});};
for(const kind of(process.argv.find(a=>a.startsWith('--cases='))?.slice(8)??'patrol,recruit,recruit-route,recruit-complete,upgrade,upgrade-route,upgrade-complete,short,unowned,unowned-short').split(',')){
if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
const before=await page.evaluate(kind=>{const m=window.__depthReview,R=window.__firstR;m.tutorialBattle=null;m.plan=null;m.watching=false;m.state=R.setGameplayA6(R.createDepthAccount(826097,0),true);m.state.settings.reducedMotion=true;
if(kind!=='patrol')m.state.tutorial=3;
if(!kind.startsWith('recruit')&&kind!=='patrol')m.state=window.__firstO.firstInvitation(m.state,4).state;
if(kind.includes('short')){m.state.account.currencies.fish=0;m.state.account.currencies.threads=0;}
if(kind.includes('route')||kind.includes('complete'))m.state=R.startRun(m.state,1,826097).state;
if(kind.includes('complete'))m.state.run.complete=true;
R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.cardId=kind.startsWith('unowned')?'marigold':'mochi';m.go('hub');return JSON.stringify(m.state);},kind);
await page.getByLabel('Your next goal',{exact:true}).waitFor();
const target=kind==='patrol'||kind.includes('route')||kind.includes('short')?'patrol':kind.startsWith('recruit')?'recruit':'upgrade';
await expect(page.locator('.uv-shell')).toHaveAttribute('data-a6-guide',target);
const goal=page.getByLabel('Your next goal',{exact:true});
if(kind.includes('route'))await expect(goal).toContainText('Continue Night Patrol');
if(kind.includes('short'))await expect(goal).toContainText('fish and threads');
const home=await page.locator('[data-home-destination]').evaluateAll(es=>es.map(el=>({name:el.getAttribute('data-home-destination'),content:getComputedStyle(el,'::after').content,animation:getComputedStyle(el,'::after').animationName})));
const pointed=home.filter(x=>x.content!=='none'&&x.content!=='normal');expect(pointed).toEqual([{name:target==='patrol'?'Patrol':target==='recruit'?'Recruit':'Cats',content:'""',animation:'none'}]);
expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
await capture(kind+'-home');report.checks.push({width,kind,screen:'home',target,noSpend:true,pointed});
if(kind==='patrol'){await page.getByRole('button',{name:/Night Patrol/}).focus();await page.keyboard.press('Enter');}
else{const entry=page.getByRole('button',{name:kind.startsWith('recruit')?'Recruit':'Cats',exact:true});await entry.focus();await page.keyboard.press('Enter');}
if(kind==='patrol')await page.getByRole('button',{name:/^Fight/}).waitFor();else if(kind.startsWith('recruit'))await page.getByRole('button',{name:'Welcome a friend',exact:true}).waitFor();
await page.getByLabel('Your next action',{exact:true}).waitFor();
const strip=page.getByLabel('Your next action',{exact:true});
if(kind.includes('route'))await expect(strip).toContainText('Finish this route first');
else if(kind.startsWith('unowned'))await expect(strip).toContainText('Choose a cat you own');
else if(kind==='short')await expect(strip).toContainText('missing supplies');
else if(kind==='patrol')await expect(strip).toContainText('Tap Fight');
else if(kind.startsWith('recruit'))await expect(strip).toContainText('costs no stamps');
else await expect(strip).toContainText('Choose Level up');
await expect(strip).toBeInViewport({ratio:1});
if(!kind.startsWith('recruit')&&kind!=='patrol'){
const bounds=await page.locator('.uv-cat-grid').evaluate(el=>{const g=el.getBoundingClientRect();return[...el.children].slice(0,3).map(c=>{const b=c.getBoundingClientRect();return b.top>=g.top&&b.bottom<=g.bottom;});});expect(bounds.every(Boolean)).toBe(true);
}
expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);await capture(kind+'-sheet');report.checks.push({width,kind,screen:'sheet',noSpend:true,keyboard:true});
await page.keyboard.press('Escape');await expect(page.locator('.uv-sheet')).toHaveCount(0);
expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);
if(kind.includes('route')){await page.getByRole('button',{name:/Night Patrol/}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('dialog',{name:'Prepare',exact:true})).toBeVisible();const after=await page.evaluate(()=>{const m=window.__depthReview;return{currencies:m.state.account.currencies,guide:window.__firstR.introductionA6(m.state).guide,run:m.state.run.id};});const original=JSON.parse(before);expect(after.currencies).toEqual(original.account.currencies);expect(after.run).toBe(original.run.id);expect(after.guide).toBe(kind.startsWith('recruit')?'recruit':'upgrade');report.checks.push({width,kind,resumesSameRoute:true,keyboard:true,noSpend:true});}
}
await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
