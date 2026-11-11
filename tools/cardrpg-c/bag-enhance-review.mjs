/** Isolated gear quotes and public purchases; no combat or acceptance-seed run. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-bag-enhance'+(baseline?'-before':'-final'));
await mkdir(output,{recursive:true});
const report={method:'Isolated gear quote/keyboard transactions compared with public commands; no balance cohort.',baseline,checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   const R=await import(path);window.__bagEnhanceRules=R;const m=window.__depthReview;
   m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.gear=[];m.state.equipment={};
   m.state.account.cards.find(c=>c.cardId==='mochi').level=20;m.state.account.cards.find(c=>c.cardId==='soot').level=1;
   const item=R.makeGear(m.state,'hearthloom-weapon-epic',819030);m.state.gear.push(item);m.state=R.equipGear(m.state,'mochi',item.id).state;
   m.cardId='soot';m.itemId=item.id;m.notice='';m.go('inventory');return {state:JSON.stringify(m.state),id:item.id};
  },'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const audit=await page.evaluate(()=>{
    const panel=document.querySelector('.a6-inventory-detail').getBoundingClientRect(),footer=document.querySelector('.a6-inventory-actions').getBoundingClientRect(),reading=document.querySelector('.a6-inventory-reading'),stats=document.querySelector('.a6-inventory-stats').getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,footerFits:footer.bottom<=Math.min(panel.bottom,innerHeight),statsFit:stats.bottom<=reading.getBoundingClientRect().bottom,readingHeight:reading.clientHeight,footerHeight:footer.height};
   });
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-bag-enhance-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);report.shots.push({width,height,file,...audit});
   expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);if(!baseline){expect(audit.footerFits).toBe(true);expect(audit.statsFit).toBe(true);}
  };
  for(const kind of ['other-owner','equipped','bag-only','zero-gain','both-short','fish-short','thread-short','last-rank','cap','route']){
   const expected=await page.evaluate(({fixture,kind})=>{
    const m=window.__depthReview,R=window.__bagEnhanceRules;m.state=JSON.parse(fixture.state);m.state.v4.journey.pending=[];m.cardId='soot';m.itemId=fixture.id;m.notice='';
    Object.assign(m.state.account.currencies,{fish:6000,threads:100});const item=m.state.gear.find(g=>g.id===fixture.id);
    if(kind==='equipped')m.cardId='mochi';if(kind==='bag-only'||kind==='zero-gain')m.state.equipment={};
    if(kind==='zero-gain'){Object.assign(item,R.makeGear(m.state,'mossbrew-charm-common',819032),{id:fixture.id});m.cardId='soot';}
    if(kind==='both-short')Object.assign(m.state.account.currencies,{fish:5,threads:1});
    if(kind==='fish-short')m.state.account.currencies.fish=29;if(kind==='thread-short')m.state.account.currencies.threads=2;
    if(kind==='last-rank')item.enhancement=11;if(kind==='cap')item.enhancement=12;
    if(kind==='route')m.state=R.startRun(m.state,1,819031).state;
    m.go('inventory');const owner=Object.entries(m.state.equipment).find(([,slots])=>Object.values(slots).includes(item.id))?.[0];
    const preview=R.enhancementPreview(item,m.state,owner??m.cardId),action=R.enhanceGear(m.state,item.id);
    return {state:JSON.stringify(m.state),owner,cat:m.cardId,preview,ok:action.ok,selectedPreview:R.enhancementPreview(item,m.state,m.cardId),stat:R.GEAR_BY_ID[item.templateId].main};
   },{fixture,kind});
   const footer=page.locator('.a6-inventory-actions'),button=footer.locator('button').last();await expect(button).toBeInViewport({ratio:1});expect(await button.isEnabled()).toBe(expected.ok);
   const observed=await footer.evaluate(el=>({text:el.textContent,quote:el.querySelector('.a6-inventory-cost')?.textContent,description:document.getElementById(el.querySelectorAll('button')[1]?.getAttribute('aria-describedby'))?.textContent}));
   const unchanged=await page.evaluate(state=>JSON.stringify(window.__depthReview.state)===state,expected.state);expect(unchanged).toBe(true);
   const ownerQuote=observed.quote.includes(`${expected.preview.before} → ${expected.preview.after}`),fullDeficits=observed.text.includes('25 more fish')&&observed.text.includes('2 more threads');
   if(!baseline){
    if(kind!=='cap')expect(ownerQuote).toBe(true);
    if(kind==='other-owner')expect(observed.text).toContain('Worn by Mochi');
    if(kind==='bag-only')expect(observed.text).toContain('Equip to use');
    if(kind==='both-short')expect(fullDeficits).toBe(true);
    if(kind==='fish-short')expect(observed.text).toContain('1 more fish');
    if(kind==='thread-short')expect(observed.text).toContain('1 more thread');
    if(kind==='zero-gain'&&expected.preview.before===expected.preview.after)expect(observed.text).toContain('No main-stat gain');
   }
   report.checks.push({width,kind,expected,observed,ownerQuote,fullDeficits,unchanged});await capture(kind);
   if(!baseline&&['other-owner','equipped','bag-only','last-rank'].includes(kind)){
    const expectedState=await page.evaluate(()=>{const m=window.__depthReview;return window.__bagEnhanceRules.enhanceGear(m.state,m.itemId).state;});
    await button.focus();await page.keyboard.press('Enter');
    const actual=await page.evaluate(()=>{const s=window.__depthReview.state;return {currencies:s.account.currencies,equipment:s.equipment,gear:s.gear};});
    expect(actual).toEqual({currencies:expectedState.account.currencies,equipment:expectedState.equipment,gear:expectedState.gear});report.checks.push({width,kind,publicPurchaseExact:true});await capture('after-'+kind);
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
