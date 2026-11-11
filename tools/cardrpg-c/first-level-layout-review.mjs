/** Guided Cats layout after the cost/recruit refinements; no combat or seed replay. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-firstlevel-final');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({headless:true,channel:'chromium'});
await mkdir(output,{recursive:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__firstLevelR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__firstLevelO=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/onboarding.ts');},root);
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const file=`${width}-${name}.webp`,png=`/tmp/cardrpg-c-firstlevel-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,name,file});
 };
 for(const kind of ['ready','short','route','unowned']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
  const before=await page.evaluate(kind=>{const R=window.__firstLevelR,m=window.__depthReview;m.state=R.setGameplayA6(R.createDepthAccount(826091,0),true);m.state.tutorial=3;m.state=window.__firstLevelO.firstInvitation(m.state,4).state;m.state.settings.reducedMotion=true;
   if(kind==='short'){m.state.account.currencies.fish=0;m.state.account.currencies.threads=0;}
   if(kind==='route')m.state=R.startRun(m.state,1,826091).state;
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.cardId=kind==='unowned'?'marigold':'mochi';m.go('collection');return JSON.stringify(m.state);
  },kind);
  await page.getByLabel('Your next action',{exact:true}).waitFor();await page.getByRole('complementary',{name:'Cat details'}).waitFor();
  const bounds=await page.locator('.uv-cat-grid').evaluate(el=>{const g=el.getBoundingClientRect();return[...el.children].slice(0,3).map(card=>{const c=card.getBoundingClientRect();return{name:card.getAttribute('aria-label'),top:c.top,bottom:c.bottom,inside:c.top>=g.top&&c.bottom<=g.bottom,overflow:card.scrollWidth>card.clientWidth+1};});});
  expect(bounds.every(b=>b.inside&&!b.overflow)).toBe(true);
  const strip=await page.getByLabel('Your next action',{exact:true}).evaluate(el=>({overflow:el.scrollWidth>el.clientWidth+1,children:[...el.children].map(c=>{const r=c.getBoundingClientRect(),host=el.getBoundingClientRect();return r.left>=host.left&&r.right<=host.right;})}));expect(strip.overflow).toBe(false);expect(strip.children.every(Boolean)).toBe(true);
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);report.checks.push({width,kind,bounds,strip,noSpend:true});
  if(kind!=='unowned'){
   const level=page.getByRole('button',{name:'Level up',exact:true});await expect(level).toBeInViewport({ratio:1});expect(await level.isEnabled()).toBe(kind==='ready');
   const hand=await level.evaluate(el=>{const s=getComputedStyle(el,'::after');return{rotate:s.rotate,animation:s.animationName,content:s.content};});
   if(kind==='ready')expect(hand).toMatchObject({rotate:'180deg',animation:'none'});else expect(hand.content).toBe('none');report.checks.push({width,kind,hand,levelAccessible:true});
  }
  await capture(kind);
  if(kind==='ready'){
   const fourth=page.locator('.uv-cat-grid>button').nth(3);await fourth.focus();await expect(fourth).toBeInViewport({ratio:1});await page.keyboard.press('Enter');
   const picked=await page.evaluate(()=>window.__depthReview.cardId);expect(picked).not.toBe('mochi');expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(before);await capture('fourth-cat');report.checks.push({width,fourthCat:picked,keyboard:true,noSpend:true});
   const first=page.locator('.uv-cat-grid>button').first();await first.focus();await page.keyboard.press('Enter');
   const expected=await page.evaluate(()=>{const R=window.__firstLevelR,m=window.__depthReview;return R.metaCommand(m.state,{type:'level',cardId:m.state.account.cards.find(c=>c.cardId==='mochi').id}).state;});
   await page.getByRole('button',{name:'Level up',exact:true}).focus();await page.keyboard.press('Enter');
   const after=await page.evaluate(()=>{const m=window.__depthReview;return{cards:m.state.account.cards,currencies:m.state.account.currencies,equipment:m.state.equipment,guide:window.__firstLevelR.introductionA6(m.state).guide};});
   expect(after).toEqual({cards:expected.account.cards,currencies:expected.account.currencies,equipment:expected.equipment,guide:null});await expect(page.getByLabel('Your next action',{exact:true})).toHaveCount(0);await capture('after-level');report.checks.push({width,keyboardPurchase:true,exactCommand:true});
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
