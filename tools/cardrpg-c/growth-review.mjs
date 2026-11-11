/** Controlled affordability screens; does not replay combat or acceptance seeds. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-growth'+(baseline?'-before':'-final'));
await mkdir(output,{recursive:true});
const report={method:'Isolated UI fixtures with exact public-command comparisons; no combat/seed cohort.',baseline,checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   window.__growthRules=await import(path);const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.cardId='mochi';m.go('collection');return JSON.stringify(m.state);
  },'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-growth-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);
   const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length}));report.shots.push({width,height,file,...layout});if(layout.overflow||layout.broken)throw Error(JSON.stringify(layout));
  };
  for(const kind of ['both-short','fish-short','thread-short','shard-short','ready','level-cap','star-cap','route']){
   const expected=await page.evaluate(({fixture,kind})=>{
    const m=window.__depthReview,R=window.__growthRules;m.state=JSON.parse(fixture);m.state.v4.journey.pending=[];
    const c=m.state.account.cards.find(c=>c.cardId==='mochi');Object.assign(c,{level:10,stars:2,shards:7});Object.assign(m.state.account.currencies,{fish:40,threads:0});
    if(kind==='fish-short')m.state.account.currencies.threads=2;
    if(kind==='thread-short'){m.state.account.currencies.fish=300;c.shards=20;}
    if(kind==='shard-short'){m.state.account.currencies.fish=300;m.state.account.currencies.threads=2;}
    if(['ready','level-cap','star-cap','route'].includes(kind)){m.state.account.currencies.fish=300;m.state.account.currencies.threads=2;c.shards=20;}
    if(kind==='level-cap')c.level=20;if(kind==='star-cap')c.stars=5;
    if(kind==='route')m.state=R.startRun(m.state,1,819010).state;
    m.cardId='mochi';m.notice='';m.go('collection');
    return {state:JSON.stringify(m.state),level:R.metaCommand(m.state,{type:'level',cardId:c.id}).ok,ascend:R.metaCommand(m.state,{type:'ascend',cardId:c.id}).ok};
   },{fixture,kind});
   const detail=page.getByRole('complementary',{name:'Cat details'});await detail.getByRole('button',{name:'Growth',exact:true}).click();
   for(const[action,label]of[['level','Level up'],['ascend','Add a star']]){
    const button=detail.getByRole('button',{name:label,exact:true});await expect(button).toBeInViewport({ratio:1});
    expect(await button.isEnabled()).toBe(expected[action]);
   }
   const observed=await detail.locator('[data-growth]').evaluateAll(els=>els.map(el=>({kind:el.getAttribute('data-growth'),text:el.textContent,described:document.getElementById(el.querySelector('button').getAttribute('aria-describedby'))?.textContent})));
   const state=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));expect(state).toBe(expected.state);
   const all=observed.map(x=>x.text).join(' '),costs=all.includes('250 fish points')&&all.includes('2 threads')&&all.includes('300 fish points');
   const deficits=all.includes('210 more fish')&&all.includes('2 more threads')&&all.includes('260 more fish')&&all.includes('13 more matching shards');
   if(!baseline&&kind==='both-short'){expect(costs).toBe(true);expect(deficits).toBe(true);}
   if(!baseline&&kind==='route')expect(all).not.toContain('more fish');
   report.checks.push({width,kind,enabled:{level:expected.level,ascend:expected.ascend},unchanged:true,fullCosts:costs,fullDeficits:deficits,observed});await capture(kind);
   if(!baseline&&kind==='ready'){
    const next=await page.evaluate(()=>{const m=window.__depthReview;return window.__growthRules.metaCommand(m.state,{type:'ascend',cardId:'mochi'}).state;});
    await detail.getByRole('button',{name:'Add a star',exact:true}).focus();await page.keyboard.press('Enter');
    const result=await page.evaluate(()=>({currencies:window.__depthReview.state.account.currencies,cards:window.__depthReview.state.account.cards}));
    expect(result).toEqual({currencies:next.account.currencies,cards:next.account.cards});report.checks.push({width,exactStarPurchase:true});
    await capture('after-star');
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
