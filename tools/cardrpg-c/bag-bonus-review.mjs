/** Compare pre-equip bonus disclosures to the actual command on isolated accounts. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-bag-bonus-final');
await mkdir(output,{recursive:true});
const report={method:'Exact set/unique changes from public equip on isolated accounts. No combat or acceptance seeds.',checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
try{
 for(const[width,height]of[[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   const R=await import(path);window.__bagBonusRules=R;const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);
   m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.gear=[];m.state.equipment={};
   return JSON.stringify(m.state);
  },'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const audit=await page.evaluate(()=>{
    const footer=document.querySelector('.a6-inventory-actions').getBoundingClientRect(),panel=document.querySelector('.a6-inventory-detail').getBoundingClientRect(),reading=document.querySelector('.a6-inventory-reading').getBoundingClientRect(),stats=document.querySelector('.a6-inventory-stats')?.getBoundingClientRect(),quote=document.querySelector('.a6-inventory-equip').getBoundingClientRect(),change=document.querySelector('.a6-inventory-effect-changes p')?.getBoundingClientRect();
    return {overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,footerFits:footer.bottom<=Math.min(panel.bottom,innerHeight),statsFit:!stats||stats.bottom<=reading.bottom,quoteFits:quote.top>=footer.top&&quote.bottom<=footer.bottom,firstChangeFits:!change||change.top>=reading.top&&change.bottom<=reading.bottom};
   });const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-bag-bonus-${width}.png`;await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);report.shots.push({width,height,file,...audit});
   expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);for(const key of ['footerFits','statsFit','quoteFits','firstChangeFits'])expect(audit[key],`${name} ${key}`).toBe(true);
  };
  for(const kind of ['gain-two','gain-four','lose-two','lose-four','donor-two','donor-four','both-cats','unique','benched-donor','route-short','no-change']){
   const expected=await page.evaluate(({fixture,kind})=>{
    const m=window.__depthReview,R=window.__bagBonusRules;m.state=JSON.parse(fixture);m.cardId='soot';m.notice='';Object.assign(m.state.account.currencies,{fish:6000,threads:100});
    let nextSeed=819100;
    const add=(cat,set,slot,rarity='epic')=>{const g=R.makeGear(m.state,`${set}-${slot}-${rarity}`,nextSeed++);m.state.gear.push(g);if(cat)m.state=R.equipGear(m.state,cat,g.id).state;return g.id;};
    const donor=kind==='benched-donor'?'velvet':'mochi';
    if(kind.startsWith('gain')){
     for(const slot of kind==='gain-four'?['outfit','charm','relic']:['outfit'])add('soot','hearthloom',slot);
     m.itemId=add(null,'hearthloom','weapon');
    }else if(kind.startsWith('lose')){
     for(const slot of kind==='lose-four'?['weapon','outfit','charm','relic']:['weapon','outfit'])add('soot','hearthloom',slot);
     m.itemId=add(null,'moonwick','weapon');
    }else if(kind==='no-change'){
     add('soot','hearthloom','weapon');add('soot','hearthloom','outfit');m.itemId=add(null,'hearthloom','weapon');
    }else{
     m.itemId=add(donor,'hearthloom','weapon',kind==='unique'?'legendary':'epic');add(donor,'hearthloom','outfit');
     if(kind==='donor-four')for(const slot of ['charm','relic'])add(donor,'hearthloom',slot);
     if(['both-cats','route-short'].includes(kind)){add('soot','moonwick','weapon');add('soot','moonwick','charm');add('soot','hearthloom','outfit');}
    }
    if(kind==='route-short'){Object.assign(m.state.account.currencies,{fish:5,threads:1});m.state=R.startRun(m.state,1,819150).state;}
    m.state.v4.journey.pending=[];m.go('inventory');const state=m.state,command=R.equipGear(state,'soot',m.itemId),after=R.equipGear({...state,run:null},'soot',m.itemId).state;
    const changes=[];
    for(const cat of ['soot',donor]){
     const old=R.equipmentEffects(state,cat).effects,next=R.equipmentEffects(after,cat).effects;
     for(const [gain,items]of[[false,old.filter(e=>!next.includes(e))],[true,next.filter(e=>!old.includes(e))]])for(const effect of items){
      const set=R.SETS.find(s=>s.twoEffect===effect||s.fourEffect===effect),txt=set?R.setTextV4(set,true):null;
      changes.push({gain,cat,effect,title:`${R.CAT_BY_ID[cat].name}${state.team.includes(cat)?'':' (bench)'} ${gain?'gains':'loses'} ${set?`${set.name} · ${set.twoEffect===effect?2:4} pieces`:'unique effect'}`,text:set?(set.twoEffect===effect?txt.two:txt.four):R.effectTextV4(effect)});
     }
    }
    return {unchanged:JSON.stringify(state),changes,ok:command.ok,command:command.ok?{equipment:command.state.equipment,currencies:command.state.account.currencies,effects:R.equipmentEffects(command.state,'soot').effects}:null};
   },{fixture,kind});
   await page.getByRole('button',{name:'Compare on Soot',exact:true}).click();
   const equip=page.getByRole('button',{name:'Equip',exact:true}),link=page.locator('.a6-inventory-effect-link');await expect(equip).toBeInViewport({ratio:1});await capture(kind);
   if(expected.changes.length){
    const lost=expected.changes.filter(c=>!c.gain).length,count=lost||expected.changes.length;
    await expect(link).toHaveText(`${count} bonus${count!==1?'es':''} ${lost?'lost':'gained'} · Review`);await expect(link).toBeInViewport({ratio:1});
    await link.focus();await page.keyboard.press('Enter');const panel=page.getByRole('region',{name:'Equip bonus changes'});await expect(panel).toBeFocused();
    const observed=await panel.locator('p').evaluateAll(els=>els.map(el=>({title:el.querySelector('b').textContent,text:el.querySelector('span').textContent,gain:el.getAttribute('data-change')==='1'})));
    expect(observed).toHaveLength(expected.changes.length);for(const c of expected.changes)expect(observed).toContainEqual({title:c.title,text:c.text,gain:c.gain});
    expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.unchanged);await capture(kind+'-effects');
    // The detailed list scrolls independently while Equip remains reachable.
    await panel.locator('p').last().scrollIntoViewIfNeeded();await expect(panel.locator('p').last()).toBeInViewport();await expect(equip).toBeInViewport({ratio:1});
    await link.click();await expect.poll(()=>page.locator('.a6-inventory-reading').evaluate(el=>el.scrollTop)).toBe(0);
   }else await expect(link).toHaveCount(0);
   delete expected.unchanged;report.checks.push({width,kind,expected});
   expect(await equip.isEnabled()).toBe(expected.ok);
   if(expected.ok){
    await equip.focus();await page.keyboard.press('Enter');const result=await page.evaluate(()=>{const s=window.__depthReview.state,R=window.__bagBonusRules;return {equipment:s.equipment,currencies:s.account.currencies,effects:R.equipmentEffects(s,'soot').effects};});
    expect(result).toEqual(expected.command);await expect(page.getByRole('button',{name:'Equipped',exact:true})).toBeDisabled();await expect(link).toHaveCount(0);await expect(page.getByRole('region',{name:'Equip bonus changes'})).toHaveCount(0);report.checks.push({width,kind,exactPublicEquip:true});
   }
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors}));
