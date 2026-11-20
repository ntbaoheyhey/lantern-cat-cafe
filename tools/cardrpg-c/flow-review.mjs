/** C7: real initial clicks plus explicitly labelled Bag fixtures; no 30-minute claim. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const root=process.cwd(),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,expect}=require('@playwright/test'),sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const output=resolve(root,'reports/cardrpg-c/shots/c7');await mkdir(output,{recursive:true});
const report=process.argv.includes('--resume')?JSON.parse(await readFile(resolve(output,'review.json'),'utf8')):{method:'First three actions use fresh-account UI clicks. Bag states are reviewer fixtures.',shots:[],actions:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const launch=async(width,height,a6)=>{const p=await browser.newPage({viewport:{width,height}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(`http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&ui=v3&a6=${a6}&lookSpine=1`);await p.waitForFunction(()=>window.__depthReview);await p.getByRole('button',{name:'Cats',exact:true}).waitFor();return p;};
const capture=async(p,name,width)=>{await p.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth>0));await p.waitForTimeout(200);const file=`${width}-${name}.webp`;await sharp(await p.screenshot()).webp({quality:85}).toFile(resolve(output,file));const audit=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,guide:document.querySelector('.uv-shell')?.dataset.a6Guide,broken:[...document.images].filter(i=>i.getClientRects().length&&!i.naturalWidth).length}));report.shots=report.shots.filter(s=>s.name!==name||s.width!==width);report.shots.push({name,width,file,...audit});if(audit.overflow||audit.broken)throw Error('Layout '+JSON.stringify(audit));};
const rulePath=`/@fs${root}/packages/game-rules/src/cardrpg/depth/index.ts`;
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  if(!report.actions.some(a=>a.width===width&&a.firstThree)){
  const p=await launch(width,height,1);
  await expect(p.locator('.a6-first-path [aria-current=step]')).toHaveText('1First patrol');
  await capture(p,'first-home',width);
  await p.getByRole('button',{name:/Night Patrol/}).click();
  await expect(p.getByLabel('Your next action')).toContainText('Tap Fight');
  await expect(p.getByRole('button',{name:/^Fight/})).toBeInViewport({ratio:1});
  await capture(p,'first-prepare',width);
  await p.getByRole('button',{name:/^Fight/}).click();
  await p.getByRole('button',{name:/Complete lesson/}).waitFor({timeout:90000});
  await capture(p,'first-reward',width);
  await p.getByRole('button',{name:/Complete lesson/}).click();
  await expect(p.locator('.uv-shell')).toHaveAttribute('data-a6-guide','recruit');
  if(await p.getByRole('button',{name:'Recruit',exact:true}).isVisible())await p.getByRole('button',{name:'Recruit',exact:true}).click();
  await expect(p.getByLabel('Your next action')).toContainText('costs no stamps');
  await p.getByRole('button',{name:'Welcome a friend',exact:true}).waitFor();
  await capture(p,'free-recruit',width);
  const stamps=await p.evaluate(()=>window.__depthReview.state.account.currencies.stamps);
  await p.getByRole('button',{name:'Welcome a friend',exact:true}).click();
  await p.getByRole('button',{name:'Meet your cats',exact:true}).waitFor({timeout:30000});
  if(await p.evaluate(()=>window.__depthReview.state.account.currencies.stamps)!==stamps)throw Error('Welcome spent stamps');
  await capture(p,'free-friend',width);
  await p.getByRole('button',{name:'Meet your cats',exact:true}).click();
  await expect(p.getByLabel('Your next action')).toContainText('3 / 3');
  await expect(p.getByRole('button',{name:'Level up',exact:true})).toBeInViewport({ratio:1});
  await capture(p,'first-level',width);
  const cost=await p.evaluate(async path=>{const m=window.__depthReview,R=await import(path),card=m.state.account.cards.find(c=>c.cardId===m.cardId),next=R.metaCommand(m.state,{type:'level',cardId:card.id});return{currencies:next.state.account.currencies,level:card.level+1,id:card.id};},rulePath);
  await p.getByRole('button',{name:'Level up',exact:true}).focus();await p.keyboard.press('Enter');
  await expect(p.getByLabel('Your next action')).toHaveCount(0);
  const after=await p.evaluate(id=>({currencies:window.__depthReview.state.account.currencies,level:window.__depthReview.state.account.cards.find(c=>c.id===id).level}),cost.id);
  if(JSON.stringify(after.currencies)!==JSON.stringify(cost.currencies)||after.level!==cost.level)throw Error('Level cost mismatch');
  report.actions.push({width,firstThree:true,welcomeCost:0,levelPublicCost:true});
  await p.close();
  }
  for(const a6 of [0,1]){
   const q=await launch(width,height,a6);
   await q.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.state.freeInvite=true;m.shortcut('unlock');m.shortcut('chapter');if(m.state.v4?.journey)m.state.v4.journey.pending=[];m.go('inventory');});
   const mode=a6?'a6':'legacy';
   if(!a6){
    await expect(q.locator('.a6-gear-detail>.uv-feature-portrait')).toBeVisible();
    const rect=await q.locator('.a6-gear-detail>.uv-feature-portrait').boundingBox();if(rect.height>111||rect.width>96)throw Error('Legacy portrait escaped');
    await expect(q.getByRole('button',{name:'Equip',exact:true})).toBeInViewport({ratio:1});
    await capture(q,'legacy-gear',width);
    await q.getByRole('button',{name:'Equip',exact:true}).focus();await q.keyboard.press('Enter');
    await q.getByText('Enhance or compare',{exact:true}).click();
    const expected=await q.evaluate(async path=>{const m=window.__depthReview,R=await import(path),item=m.state.gear.find(g=>g.id===m.itemId)??m.state.gear[0];return R.enhanceGear(m.state,item.id).state.account.currencies;},rulePath);
    await q.getByRole('button',{name:'Enhance',exact:true}).click();
    if(JSON.stringify(await q.evaluate(()=>window.__depthReview.state.account.currencies))!==JSON.stringify(expected))throw Error('Legacy enhancement cost');
    await capture(q,'legacy-enhanced',width);
    await q.evaluate(()=>{const m=window.__depthReview;m.state.gear=[];m.itemId='';m.notify(false);});
    await expect(q.locator('.uv-gear-empty .cr-primary')).toBeInViewport({ratio:1});
    await capture(q,'legacy-empty',width);
   }else {await q.locator('.a6-inventory').waitFor();await capture(q,'a6-gear',width);}
   await q.locator('.uv-sheet>nav').getByRole('button',{name:'Materials',exact:true}).click();
   await q.locator('[aria-label="Inventory types"]').waitFor();
   for(const category of ['Materials','Consumables','Collectibles','Currencies']){
    await q.getByRole('button',{name:category,exact:true}).last().click();
    await capture(q,`${mode}-${category.toLowerCase()}`,width);
    if(category==='Consumables'&&a6){
     const expected=await q.evaluate(async path=>{const m=window.__depthReview,R=await import(path),result=R.metaCommand(m.state,{type:'forge',recipeId:'mend-pantry-key'});return{ok:result.ok,currencies:result.state.account.currencies,stacks:result.state.account.inventory.stacks};},rulePath);
     if(!expected.ok)throw Error('Recipe fixture not eligible');
     await q.getByRole('button',{name:'Craft pantry item',exact:true}).click();
     const actual=await q.evaluate(()=>({currencies:window.__depthReview.state.account.currencies,stacks:window.__depthReview.state.account.inventory.stacks}));
     if(JSON.stringify(actual)!==JSON.stringify({currencies:expected.currencies,stacks:expected.stacks}))throw Error('Pantry cost/count');
     report.actions.push({width,pantryExact:true});
    }
   }
   await q.keyboard.press('Escape');await expect(q.getByRole('button',{name:'Bag',exact:true})).toBeVisible();
   await q.close();
  }
 }
 if(report.errors.length)throw Error(JSON.stringify(report.errors));
 report.complete=true;
}finally{await writeFile(resolve(output,'review.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({shots:report.shots.length,actions:report.actions,errors:report.errors}));
