/** Actual crew impact of individual gear transfers; isolated accounts, no combat. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-bag-transfer'+(baseline?'-before':'-final'));
const selectedCases=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
await mkdir(output,{recursive:true});
const report={method:'Public equip comparison on isolated accounts. No combat or acceptance seeds.',baseline,checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   const R=await import(path);window.__bagTransferRules=R;const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);
   m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.gear=[];m.state.equipment={};
   m.state.account.cards.find(c=>c.cardId==='mochi').level=20;m.state.account.cards.find(c=>c.cardId==='soot').level=1;m.state.account.cards.find(c=>c.cardId==='velvet').level=15;
   const item=R.makeGear(m.state,'hearthloom-weapon-epic',819040);m.state.gear.push(item);m.cardId='soot';m.itemId=item.id;m.notice='';m.go('inventory');return {state:JSON.stringify(m.state),id:item.id};
  },'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const audit=await page.evaluate(()=>{
    const footer=document.querySelector('.a6-inventory-actions').getBoundingClientRect(),panel=document.querySelector('.a6-inventory-detail').getBoundingClientRect(),reading=document.querySelector('.a6-inventory-reading').getBoundingClientRect(),stats=document.querySelector('.a6-inventory-stats')?.getBoundingClientRect(),quote=document.querySelector('.a6-inventory-equip')?.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,footerFits:footer.bottom<=Math.min(panel.bottom,innerHeight),statsFit:!stats||stats.bottom<=reading.bottom,quoteFits:!quote||quote.top>=footer.top&&quote.bottom<=footer.bottom};
   });const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-bag-transfer-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);report.shots.push({width,height,file,...audit});
   expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);if(!baseline)for(const key of ['footerFits','statsFit','quoteFits'])expect(audit[key]).toBe(true);
  };
  for(const kind of ['spare','within-crew','to-bench','from-bench','on-bench','set-gain','set-loss','equipped','both-short','route']){
   if(selectedCases&&!selectedCases.includes(kind))continue;
   const expected=await page.evaluate(({fixture,kind})=>{
    const m=window.__depthReview,R=window.__bagTransferRules;m.state=JSON.parse(fixture.state);m.state.v4.journey.pending=[];m.cardId='soot';m.itemId=fixture.id;m.notice='';Object.assign(m.state.account.currencies,{fish:6000,threads:100});
    if(['within-crew','to-bench','both-short','route'].includes(kind))m.state=R.equipGear(m.state,'mochi',fixture.id).state;
    if(['to-bench','on-bench'].includes(kind))m.cardId='velvet';if(kind==='from-bench')m.state=R.equipGear(m.state,'velvet',fixture.id).state;
    if(kind==='equipped')m.state=R.equipGear(m.state,'soot',fixture.id).state;
    if(['set-gain','set-loss'].includes(kind)){
     const outfit=R.makeGear(m.state,'hearthloom-outfit-epic',819041);m.state.gear.push(outfit);m.state=R.equipGear(m.state,'soot',outfit.id).state;
     if(kind==='set-loss'){
      m.state=R.equipGear(m.state,'soot',fixture.id).state;const replace=R.makeGear(m.state,'moonwick-weapon-epic',819042);m.state.gear.push(replace);m.itemId=replace.id;
     }
    }
    if(kind==='both-short')Object.assign(m.state.account.currencies,{fish:5,threads:1});if(kind==='route')m.state=R.startRun(m.state,1,819043).state;
    m.go('inventory');const preview=R.comparisonV4(m.state,m.cardId,m.itemId),command=R.equipGear(m.state,m.cardId,m.itemId);
    return {unchanged:JSON.stringify(m.state),before:Math.round(preview.teamBefore),after:Math.round(preview.teamAfter),delta:Math.round(preview.teamAfter)-Math.round(preview.teamBefore),catGain:preview.after.total-preview.before.total,gained:preview.gained,lost:preview.lost,transfer:preview.transfer,ok:command.ok,command:command.ok?{equipment:command.state.equipment,currencies:command.state.account.currencies,power:Math.round(R.teamPowerV4(command.state))}:null};
   },{fixture,kind});
   const footer=page.locator('.a6-inventory-actions'),button=footer.locator('button').first();await expect(button).toBeInViewport({ratio:1});
   expect(await button.isEnabled()).toBe(expected.ok&&kind!=='equipped');
   const observed=await footer.evaluate(el=>({text:el.textContent,impact:el.querySelector('.a6-inventory-crew')?.textContent??null,description:document.getElementById(el.querySelector('button')?.getAttribute('aria-describedby'))?.textContent,delta:Number(el.querySelector('.a6-inventory-crew b')?.getAttribute('data-delta')??NaN)}));
   expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.unchanged);delete expected.unchanged;
   if(!baseline&&kind!=='equipped')expect(observed.delta).toBe(expected.delta);
   if(kind==='within-crew'){expect(expected.catGain).toBeGreaterThan(0);expect(expected.delta).toBeLessThan(0);}
   report.checks.push({width,kind,expected,observed});await capture(kind);
   if(['set-gain','set-loss'].includes(kind)){
    await page.getByRole('button',{name:'Set & affixes',exact:true}).click();const effects=await page.locator('.dp-v4-utility').textContent();
    if(kind==='set-gain')expect(effects).toContain('activates 2-piece');else expect(effects).toContain('Loses:');await capture(kind+'-effects');
    await page.getByRole('button',{name:'Compare on Soot',exact:true}).click();
   }
   if(!baseline&&expected.ok&&kind!=='equipped'){
    await button.focus();await page.keyboard.press('Enter');const result=await page.evaluate(()=>{const s=window.__depthReview.state,R=window.__bagTransferRules;return {equipment:s.equipment,currencies:s.account.currencies,power:Math.round(R.teamPowerV4(s))};});
    expect(result).toEqual(expected.command);await expect(button).toHaveText('Equipped');
    await expect.poll(()=>page.locator('.a6-power').evaluateAll((els,power)=>els.every(el=>el.getAttribute('aria-label')===`Team Power ${power}`&&el.querySelector('b')?.textContent===power.toLocaleString('en-US')),result.power)).toBe(true);
    report.checks.push({width,kind,exactPublicEquip:true,visibleCrewPower:result.power});
    if(kind==='within-crew'||kind==='to-bench')await capture(kind+'-after');
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
