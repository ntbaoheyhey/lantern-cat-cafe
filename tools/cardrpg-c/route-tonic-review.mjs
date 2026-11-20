/** Route tonic checks on isolated accounts; no acceptance seeds or real saves. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-tonic-final');await mkdir(output,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const entry of ['map','bag']){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{window.__tonicR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;m.go('inventory');return JSON.stringify(m.state);},root);
 const capture=async name=>{
  const preview=page.getByRole('region',{name:'Route tonic recovery'});await preview.evaluate(el=>el.scrollIntoView({block:'center'}));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await preview.evaluate(el=>{const host=(el.closest('.a6-inventory-workshop>div')??document.querySelector('#depth-main')).getBoundingClientRect(),a=el.getBoundingClientRect(),b=el.querySelector('button').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,previewFits:a.top>=host.top&&a.bottom<=host.bottom&&a.left>=host.left&&a.right<=host.right,actionFits:b.top>=host.top&&b.bottom<=host.bottom,rowsFit:[...el.querySelectorAll('li')].every(row=>row.scrollWidth<=row.clientWidth)};});
  const file=`${width}-${entry}-${name}.webp`,png=`/tmp/cardrpg-c-tonic-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,entry,name,file,...audit});
  expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);for(const key of ['previewFits','actionFits','rowsFit'])expect(audit[key],file+' '+key).toBe(true);
 };
 for(const kind of ['full','small','large','fallen','empty','reward','complete','prepare','committed',...(entry==='bag'?['home']:[])]){
  if(selected&&!selected.includes(kind))continue;
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind,entry})=>{const R=window.__tonicR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';m.start(1,'campaign',1);m.state.run.supplies=2;
   m.state.account.inventory.stacks['milk-tonic']=3;m.state.run.packedSupply={id:'quicken-yarn',catId:'soot'};
   if(kind!=='full')m.state.run.hp.mochi-=kind==='large'?150:43;
   if(kind==='fallen')m.state.run.hp.soot=0;if(kind==='empty')m.state.run.supplies=0;
   if(kind==='reward'){m.state.run.current='0-0';m.state.run.rewardChoices=['shelter-1'];}
   if(kind==='complete')m.state.run.complete=true;if(kind==='home')m.state.run=null;
   if(['prepare','committed'].includes(kind)){m.enter(R.availableNodes(m.state.run)[0].id);if(kind==='committed')m.state=R.commitPreparation(m.state).state;}
   m.state.v4.journey.pending=[];m.go(entry==='bag'?'inventory':'map');
   const command=R.useTonic(m.state);return{before:JSON.stringify(m.state),ok:command.ok,reason:command.error,state:command.ok?command.state:null,rows:m.state.team.map(id=>({id,name:R.CAT_BY_ID[id].name,before:m.state.run?.hp[id]??0,after:command.state.run?.hp[id]??0}))};
  },{fixture,kind,entry});
  if(entry==='bag'){
   const workshop=page.getByRole('button',{name:'Open workshop',exact:true}),consumables=page.getByRole('button',{name:'Consumables',exact:true});
   await workshop.or(consumables).first().waitFor();if(await workshop.isVisible())await workshop.click();
   await page.getByRole('button',{name:'Consumables',exact:true}).click();
  }else{
   if(['prepare','committed'].includes(kind))await page.getByRole('button',{name:'Route',exact:true}).click();
   const details=page.locator('.dp-route-tonic');if(!await details.evaluate(el=>el.open)){await details.locator('summary').focus();await page.keyboard.press('Enter');}
  }
  const preview=page.getByRole('region',{name:'Route tonic recovery'}),button=page.getByRole('button',{name:'Use route tonic',exact:true});
  await expect(preview).toBeVisible();expect(await button.isEnabled(),entry+' '+kind).toBe(expected.ok);expect(await button.getAttribute('aria-describedby')).toBe(await preview.getAttribute('id'));
  if(expected.ok)for(const row of expected.rows)await expect(preview).toContainText(`${row.before} → ${row.after} HP (+${row.after-row.before})`);else await expect(preview).toContainText(expected.reason);
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,entry,kind,ok:expected.ok,reason:expected.reason??null,readOnly:true});await capture(kind);
  if(expected.ok){
   await button.focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.state);expect(await page.evaluate(()=>window.__depthReview.error)).toBe(false);
   const next=await page.evaluate(()=>window.__tonicR.useTonic(window.__depthReview.state));expect(await button.isEnabled()).toBe(next.ok);report.checks.push({width,entry,kind,exactCommand:true,keyboard:true,nextEnabled:next.ok});
   if(['small','fallen'].includes(kind))await capture(kind+'-after');
  }
  if(entry==='map'){await page.locator('.dp-route-tonic>summary').focus();await page.keyboard.press('Enter');await expect(preview).toBeHidden();report.checks.push({width,entry,kind,keyboardClosed:true});}
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
