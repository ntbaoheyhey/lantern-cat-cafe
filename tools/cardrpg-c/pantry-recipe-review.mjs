/** Pantry recipes: isolated accounts, read-only quotes, exact public purchases and caps. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??`/tmp/cardrpg-c-recipe-${baseline?'before':'final'}`);
await mkdir(output,{recursive:true});
const report={baseline,checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
const recipes=['mend-pantry-key','pantry-tonic','pantry-shield-biscuit','pantry-quicken-yarn','pantry-cleanse-tea','pantry-ultimate-treat','cafe-ribbon'];
const cases=baseline?['short-both','short-threads','short-ribbon','full-key','full-supply','owned-ribbon']: [...recipes,'short-both','short-threads','short-ribbon','full-key','full-supply','owned-ribbon','route','prepare','complete'];
try{for(const [width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{window.__recipeR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__recipeC=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/catalog.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;m.go('inventory');return JSON.stringify(m.state);},root);
 await page.getByRole('button',{name:'Open workshop',exact:true}).click();await page.getByRole('button',{name:'Consumables',exact:true}).click();
 const capture=async name=>{
  await page.locator('.dp-v4-pantry-craft').evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{const host=document.querySelector('.a6-inventory-workshop>div').getBoundingClientRect(),craft=document.querySelector('.dp-v4-pantry-craft'),a=craft.getBoundingClientRect(),b=craft.querySelector('button').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,craftFits:a.top>=host.top&&a.bottom<=host.bottom,actionFits:b.top>=host.top&&b.bottom<=host.bottom};});
  const file=`${width}-${name}.webp`,png=`/tmp/cardrpg-c-recipe-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,height,file,...audit});expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);if(!baseline){expect(audit.craftFits,file).toBe(true);expect(audit.actionFits,file).toBe(true);}
 };
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind,recipes})=>{const R=window.__recipeR,C=window.__recipeC,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';
   const recipe=recipes.includes(kind)?kind:kind==='full-key'?'mend-pantry-key':kind.includes('ribbon')?'cafe-ribbon':'pantry-shield-biscuit',chosen=C.RECIPES.find(r=>r.id===recipe),id=chosen.outputStackId,cap=R.stackCapV4(id);
   m.state.account.currencies.threads=chosen.cost.threads??0;m.state.account.currencies.essence=chosen.cost.essence??0;m.state.account.inventory.stacks['pantry-key']=chosen.materials['pantry-key']??0;m.state.account.inventory.stacks[id]=0;
   if(kind==='short-both'){m.state.account.currencies.threads=3;m.state.account.inventory.stacks['pantry-key']=0;}
   if(kind==='short-threads')m.state.account.currencies.threads=0;
   if(kind==='short-ribbon'){m.state.account.currencies.threads=3;m.state.account.currencies.essence=1;}
   if(kind.startsWith('full-')||kind==='owned-ribbon')m.state.account.inventory.stacks[id]=cap;
   if(kind==='mend-pantry-key')m.state.account.inventory.stacks[id]=cap-1;
   if(kind==='pantry-shield-biscuit')m.state.account.inventory.stacks[id]=cap-1;
   if(['route','prepare','complete'].includes(kind)){m.start(1,'campaign',1);if(kind==='prepare')m.enter(R.availableNodes(m.state.run)[0].id);if(kind==='complete')m.state.run.complete=true;}
   m.state.v4.journey.pending=[];m.go('inventory');
   const command=R.metaCommand(m.state,{type:'forge',recipeId:recipe});
   return{before:JSON.stringify(m.state),state:command.ok?command.state:null,ok:command.ok,error:command.error,recipe,id,cap,owned:m.state.account.inventory.stacks[id],name:C.STACK_ITEMS.find(i=>i.id===id).name,cost:chosen.cost,materials:chosen.materials};
  },{fixture,kind,recipes});
  await page.getByLabel('Pantry recipe',{exact:true}).selectOption(expected.recipe);
  const button=page.getByRole('button',{name:'Craft pantry item',exact:true}),enabled=await button.isEnabled();
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  report.checks.push({width,kind,commandOK:expected.ok,enabled,readOnly:true,reason:expected.error??null});
  if(!baseline){
   expect(enabled,kind+' eligibility').toBe(expected.ok);
   const preview=page.getByRole('region',{name:'Recipe preview'});expect(await button.getAttribute('aria-describedby')).toBe(await preview.getAttribute('id'));
   if(expected.ok)await expect(preview).toContainText(`${expected.owned} → ${expected.owned+1}/${expected.cap}`);
   if(kind==='short-both'){await expect(preview).toContainText('7 more threads');await expect(preview).toContainText('1 more Pantry Key');}
   if(kind==='short-ribbon'){await expect(preview).toContainText('17 more threads');await expect(preview).toContainText('9 more essence');}
   if(kind==='route'||kind==='prepare')await expect(preview).toContainText('Finish this patrol before crafting.');
  }
  await capture(kind);
  if(!baseline&&expected.ok){
   await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.state);expect(await page.evaluate(()=>window.__depthReview.error)).toBe(false);
   const next=await page.evaluate(recipe=>window.__recipeR.metaCommand(window.__depthReview.state,{type:'forge',recipeId:recipe}).ok,expected.recipe);expect(await button.isEnabled()).toBe(next);report.checks.push({width,kind,exactCommand:true,keyboard:true,nextEnabled:next});
   if(['mend-pantry-key','pantry-shield-biscuit','cafe-ribbon'].includes(kind))await capture(kind+'-after');
  }
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,mismatches:report.checks.filter(c=>c.commandOK!==undefined&&c.commandOK!==c.enabled).length,errors:report.errors,complete:report.complete}));
