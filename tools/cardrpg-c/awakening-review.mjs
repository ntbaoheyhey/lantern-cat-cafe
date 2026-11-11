/** Isolated Awakening quotes and purchases; no gameplay cohort or seed reuse. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-awakening'+(baseline?'-before':'-final'));
await mkdir(output,{recursive:true});
const report={method:'Isolated public-command comparison, no combat or balance cohort.',baseline,checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   window.__awakeningRules=await import(path);const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.cardId='mochi';m.go('collection');return JSON.stringify(m.state);
  },'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-awakening-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);
   const layout=await page.evaluate(()=>{
    const receipt=document.querySelector('.a6-awakening-receipt').getBoundingClientRect(),panel=document.querySelector('.a6-cat-detail').getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,receiptBottom:receipt.bottom,panelBottom:panel.bottom,fits:receipt.bottom<=Math.min(panel.bottom,innerHeight)};
   });report.shots.push({width,height,file,...layout});expect(layout.overflow).toBe(false);expect(layout.broken).toBe(0);if(!baseline)expect(layout.fits).toBe(true);
  };
  for(const kind of ['all-short','training-needed','mastery-short','currency-short','ready-1','ready-2','ready-3','cap','route']){
   const expected=await page.evaluate(({fixture,kind})=>{
    const m=window.__depthReview,R=window.__awakeningRules;m.state=JSON.parse(fixture);m.state.v4.journey.pending=[];
    const c=m.state.account.cards.find(c=>c.cardId==='mochi');Object.assign(c,{level:10,stars:2});m.state.awakened.mochi=0;m.state.materials=10;Object.assign(m.state.account.currencies,{fish:40,threads:5,essence:1});
    if(kind==='training-needed'){c.level=4;c.stars=1;}
    if(kind==='mastery-short')Object.assign(m.state.account.currencies,{fish:300,threads:40,essence:5});
    if(kind==='currency-short')m.state.materials=30;
    if(['ready-1','ready-2','ready-3','cap','route'].includes(kind)){Object.assign(m.state.account.currencies,{fish:3000,threads:400,essence:50});m.state.materials=300;}
    if(kind==='ready-2')m.state.awakened.mochi=1;if(kind==='ready-3')m.state.awakened.mochi=2;if(kind==='cap')m.state.awakened.mochi=3;
    if(kind==='route')m.state=R.startRun(m.state,1,819020).state;
    m.cardId='mochi';m.notice='';m.go('collection');const result=R.awakenCat(m.state,'mochi');
    return {state:JSON.stringify(m.state),ok:result.ok,error:result.ok?null:result.error};
   },{fixture,kind});
   const detail=page.getByRole('complementary',{name:'Cat details'});await detail.getByRole('button',{name:'Growth',exact:true}).click();
   const awakening=detail.locator('.a6-awakening');if(!await awakening.evaluate(el=>el.open))await awakening.locator('summary').click();
   const button=awakening.getByRole('button',{name:'Awaken',exact:true});await expect(button).toBeInViewport({ratio:1});expect(await button.isEnabled()).toBe(expected.ok);
   const observed=await awakening.locator('.a6-awakening-receipt').evaluate(el=>({text:el.textContent,described:document.getElementById(el.querySelector('button').getAttribute('aria-describedby'))?.textContent}));
   expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.state);
   const fullCosts=['300 fish points','40 threads','5 essence','30 mastery materials'].every(x=>observed.text.includes(x));
   const fullDeficits=['260 more fish','35 more threads','4 more essence','20 more mastery materials'].every(x=>observed.text.includes(x));
   if(!baseline&&kind==='all-short'){expect(fullCosts).toBe(true);expect(fullDeficits).toBe(true);}
   if(!baseline&&kind==='training-needed')expect(observed.text).toContain('Awakening needs level 10 and two stars.');
   if(!baseline&&['route','cap'].includes(kind))expect(fullCosts).toBe(false);
   report.checks.push({width,kind,enabled:expected.ok,unchanged:true,fullCosts,fullDeficits,observed});await capture(kind);
   if(!baseline&&kind.startsWith('ready-')){
    const next=await page.evaluate(()=>{const m=window.__depthReview;return window.__awakeningRules.awakenCat(m.state,'mochi').state;});
    await button.focus();await page.keyboard.press('Enter');
    const result=await page.evaluate(()=>{const s=window.__depthReview.state;return {currencies:s.account.currencies,cards:s.account.cards,awakened:s.awakened,materials:s.materials};});
    expect(result).toEqual({currencies:next.account.currencies,cards:next.account.cards,awakened:next.awakened,materials:next.materials});report.checks.push({width,kind,exactPublicPurchase:true});
    await expect(button).toBeInViewport({ratio:1});await capture('after-'+kind);
   }
   await awakening.locator('summary').click();await expect(detail.getByRole('button',{name:'Level up',exact:true})).toBeInViewport({ratio:1});
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
