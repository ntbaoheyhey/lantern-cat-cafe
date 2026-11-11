/** Slot navigation on isolated accounts; no combat/balance replay. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-gear-slots'+(baseline?'-before':''));
await mkdir(output,{recursive:true});
const report={method:'Controlled isolated gear navigation; no balance run or acceptance seeds.',baseline,checks:[],shots:[],errors:[],complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const rulePath='/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts';
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
  await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');
  await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const fixture=await page.evaluate(async path=>{
   const R=await import(path);window.__slotRules=R;const m=window.__depthReview;
   m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state=structuredClone(m.state);m.state.tutorial=4;m.state.freeInvite=true;m.state.run=null;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];
   m.state.gear=[];m.state.equipment={};
   const weapon=R.makeGear(m.state,'hearthloom-weapon-common',819001),outfit=R.makeGear(m.state,'hearthloom-outfit-common',819002),charm=R.makeGear(m.state,'mossbrew-charm-rare',819003);
   m.state.gear.push(weapon,outfit,charm);m.state=R.equipGear(m.state,'mochi',outfit.id).state;
   m.cardId='mochi';m.itemId=weapon.id;m.notice='';m.go('collection');
   return {state:JSON.stringify(m.state),weapon:weapon.id,outfit:outfit.id,charm:charm.id};
  },rulePath);
  const capture=async name=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));
   const file=`${width}-${name}.webp`,tmp=`/tmp/cardrpg-c-gear-slots-${width}.png`;
   await page.screenshot({path:tmp});execFileSync('cwebp',['-quiet','-q','80',tmp,'-o',resolve(output,file)]);
   const audit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length}));
   report.shots.push({width,height,file,...audit});if(audit.overflow||audit.broken)throw Error(JSON.stringify(audit));
  };
  const open=async(slot,{remove=false,locked=false}={})=>{
   await page.evaluate(({f,remove,locked})=>{
    const m=window.__depthReview,R=window.__slotRules;m.state=JSON.parse(f.state);m.state.v4.journey.pending=[];
    if(remove)m.state.gear=m.state.gear.filter(g=>g.id!==f.charm);
    if(locked)m.state=R.startRun(m.state,1,819004).state;
    m.cardId='mochi';m.itemId=f.weapon;m.go('collection');
   },{f:fixture,remove,locked});
   await page.getByRole('complementary',{name:'Cat details'}).getByRole('button',{name:'Gear',exact:true}).click();
   const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
   const button=page.locator('.a6-cat-gear>button').filter({has:page.locator('small').filter({hasText:new RegExp('^'+slot+'$')})});
   await expect(button).toBeInViewport({ratio:1});
   if(slot==='charm'&&!locked&&!remove)await capture('cats-gear');
   await button.focus();await page.keyboard.press('Enter');await page.getByRole('region',{name:'Gear workbench'}).waitFor();
   const actual=await page.evaluate(()=>({filter:document.querySelector('[aria-label="Gear slots"] [aria-pressed=true]')?.textContent,item:document.querySelector('[data-selected-gear]')?.getAttribute('data-selected-gear')??null,card:document.querySelector('[aria-label="Equip for"]')?.value,state:JSON.stringify(window.__depthReview.state)}));
   const wanted={weapon:'Weapons',charm:'Charms',outfit:'Outfits',relic:'Relic gear'}[slot];
   const expectedId=slot==='weapon'?fixture.weapon:slot==='outfit'?fixture.outfit:slot==='charm'&&!remove?fixture.charm:null;
   const check={width,slot,remove,locked,filter:actual.filter,item:actual.item,expectedId,unchanged:before===actual.state,pass:actual.filter===wanted&&actual.item===expectedId&&actual.card==='mochi'&&before===actual.state};
   report.checks.push(check);await capture(slot+(remove?'-empty':locked?'-locked':'-opened'));
   if(!baseline&&!check.pass)throw Error(JSON.stringify(check));return actual;
  };
  await open('charm');
  if(!baseline){
   const expected=await page.evaluate(id=>{const m=window.__depthReview;return window.__slotRules.equipGear(m.state,'mochi',id).state;},fixture.charm);
   await expect(page.getByRole('button',{name:'Equip',exact:true})).toBeInViewport({ratio:1});
   await page.getByRole('button',{name:'Equip',exact:true}).click();
   const applied=await page.evaluate(()=>({equipment:window.__depthReview.state.equipment,currencies:window.__depthReview.state.account.currencies}));
   expect(applied).toEqual({equipment:expected.equipment,currencies:expected.account.currencies});report.checks.push({width,publicEquipExact:true});
   await page.keyboard.press('Escape');await page.getByRole('button',{name:'Bag',exact:true}).click();
   await expect(page.getByRole('button',{name:'All',exact:true})).toHaveAttribute('aria-pressed','true');report.checks.push({width,generalBagResets:true});
  }
  if(!baseline)await open('weapon');
  await open('outfit');await open('charm',{remove:true});await open('relic');await open('charm',{locked:true});
  if(!baseline){
   for(const name of ['Equip','Enhance +1'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();report.checks.push({width,routeLocked:true});
   await page.evaluate(f=>{const m=window.__depthReview;m.state=JSON.parse(f.state);m.state.account.cards=m.state.account.cards.filter(c=>c.cardId!=='velvet');m.cardId='velvet';m.go('collection');},fixture);
   await page.getByRole('complementary',{name:'Cat details'}).getByRole('button',{name:'Gear',exact:true}).click();
   for(const button of await page.locator('.a6-cat-gear>button').all())await expect(button).toBeDisabled();
   await capture('unowned');report.checks.push({width,unownedSlotsDisabled:true});
  }
  await page.close();
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks,shots:report.shots.length,errors:report.errors}));
