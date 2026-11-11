/** Pantry reservation and immediate recovery; public commands on isolated fixture accounts. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-pantry-final');await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
const cases=['shield-biscuit','quicken-yarn','cleanse-tea','ultimate-treat','empty','replace','replace-empty','reassign','milk-small','milk-large','milk-empty','milk-full','fallen','fallen-milk','home','complete','prepare','committed'];
try{for(const [width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async path=>{window.__pantryR=await import(path);const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;m.go('inventory');return JSON.stringify(m.state);},'/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
 await page.getByRole('button',{name:'Open workshop',exact:true}).click();await page.getByRole('button',{name:'Consumables',exact:true}).click();
 const capture=async name=>{
  await page.locator('.dp-v4-pantry-pack').evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{const host=document.querySelector('.a6-inventory-workshop>div').getBoundingClientRect(),pack=document.querySelector('.dp-v4-pantry-pack'),a=pack.getBoundingClientRect(),q=pack.querySelector('.dp-v4-supply-preview').getBoundingClientRect(),f=pack.querySelector('.dp-v4-pantry-actions').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,packFits:a.top>=host.top&&a.bottom<=host.bottom,quoteFits:q.top>=host.top&&q.bottom<=host.bottom,actionsFit:f.top>=host.top&&f.bottom<=host.bottom};});
  const file=`${width}-${name}.webp`,png='/tmp/cardrpg-c-pantry-'+width+'.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,height,file,...audit});expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);for(const k of ['packFits','quoteFits','actionsFit'])expect(audit[k],file+' '+k).toBe(true);
 };
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind})=>{const R=window.__pantryR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';m.start(1,'campaign',1);
   for(const id of R.SUPPLY_IDS_V4)m.state.account.inventory.stacks[id]=1;
   let supply=R.SUPPLY_IDS_V4.includes(kind)?kind:kind.startsWith('milk')||kind==='fallen-milk'?'milk-tonic':'shield-biscuit',cat=kind==='reassign'?'soot':'mochi';
   if(['replace','replace-empty'].includes(kind))m.state=R.packSupplyV4(m.state,'cleanse-tea','soot').state;
   if(kind==='reassign')m.state=R.packSupplyV4(m.state,'shield-biscuit','mochi').state;
   if(['empty','replace-empty','milk-empty'].includes(kind))m.state.account.inventory.stacks[supply]=0;
   if(['milk-small','milk-large','milk-empty'].includes(kind)){m.state=R.packSupplyV4(m.state,'quicken-yarn','soot').state;m.state.run.hp.mochi-=kind==='milk-large'?150:43;}
   if(kind.startsWith('fallen'))m.state.run.hp.mochi=0;
   if(kind==='home')m.state.run=null;if(kind==='complete')m.state.run.complete=true;
   if(['prepare','committed'].includes(kind)){m.state=R.packSupplyV4(m.state,'shield-biscuit','mochi').state;m.enter(R.availableNodes(m.state.run)[0].id);if(kind==='committed')m.state=R.commitPreparation(m.state).state;}
   m.state.v4.journey.pending=[];m.go('inventory');
   const command=R.packSupplyV4(m.state,supply,cat),cancel=m.state.run?.packedSupply?R.packSupplyV4(m.state,null,cat):null;
   const active=!!m.state.run&&!m.state.run.complete,reason=!active?'Start a patrol':m.state.run.battle?'Supplies are locked for this encounter':command.error;
   return{before:JSON.stringify(m.state),command:command.ok?command.state:null,ok:command.ok,reason,cancel:cancel?.ok??false,supply,cat,name:R.CAT_BY_ID[cat].name,supplyName:R.itemCatalogueV4().find(i=>i.id===supply).name,hp:m.state.run?.hp[cat],maxHp:R.battleCats(m.state).find(c=>c.id===cat).stats.hp,packed:m.state.run?.packedSupply};
  },{fixture,kind});
  await page.getByLabel('Supply recipient',{exact:true}).selectOption(expected.cat);await page.getByLabel('Pantry supply',{exact:true}).selectOption(expected.supply);
  const preview=page.getByRole('region',{name:'Supply preview'}),button=page.getByRole('button',{name:expected.supply==='milk-tonic'?'Use milk tonic':'Confirm packed supply',exact:true}),cancel=page.getByRole('button',{name:'Return packed supply',exact:true});
  expect(await button.isEnabled(),kind+' eligibility').toBe(expected.ok);expect(await cancel.isEnabled(),kind+' return').toBe(expected.cancel);
  if(!expected.ok)await expect(preview).toContainText(expected.reason);
  else if(expected.supply==='milk-tonic'){const after=expected.command.run.hp[expected.cat];await expect(preview).toContainText(`${expected.hp} → ${after} HP (+${after-expected.hp})`);expect(after).toBeLessThanOrEqual(expected.maxHp);}
  else await expect(preview).toContainText(`${expected.supplyName} for ${expected.name}`);
  const description=await button.getAttribute('aria-describedby');expect(await preview.getAttribute('id')).toBe(description);expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  report.checks.push({width,kind,ok:expected.ok,cancel:expected.cancel,supply:expected.supply,reason:expected.ok?null:expected.reason,readOnly:true});await capture(kind);
  if(expected.ok){
   await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.command);expect(await page.evaluate(()=>window.__depthReview.error)).toBe(false);report.checks.push({width,kind,exactCommand:true});
   if(kind==='milk-small'||kind==='reassign')await capture(kind+'-after');
   if(expected.supply!=='milk-tonic'){
    const returned=await page.evaluate(()=>{const m=window.__depthReview;return window.__pantryR.packSupplyV4(m.state,null,m.state.team[0]).state;});
    await cancel.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(returned);await expect(cancel).toBeDisabled();report.checks.push({width,kind,exactReturn:true});
   }
  }
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
