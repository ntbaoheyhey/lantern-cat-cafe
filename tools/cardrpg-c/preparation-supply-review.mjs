/** Packed-supply preparation guards; isolated fixture accounts, no acceptance seeds. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-preparation-final');await mkdir(output,{recursive:true});
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
const cases=[['shield-biscuit','saved-out'],['shield-biscuit','saved-in'],...['shield-biscuit','quicken-yarn','cleanse-tea','ultimate-treat'].map(id=>[id,'suggested']),['shield-biscuit','replace-carrier'],['shield-biscuit','replace-other'],['shield-biscuit','later'],['shield-biscuit','committed'],['shield-biscuit','tower'],[null,'saved-out'],[null,'suggested'],[null,'replace-carrier']];
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{window.__prepR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__prepF=await import('/@fs'+root+'/apps/web/src/game/cardrpg/ui-v3/formation-a6.ts');window.__prepSnapshot=s=>({team:s.team,rows:s.rows,plan:s.v4.plan,equipment:s.equipment,currencies:s.account.currencies,inventory:s.account.inventory,run:s.run,lastBattle:s.lastBattle});const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.shortcut('chapter');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];return JSON.stringify(m.state);},root);
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(()=>{const d=document.querySelector('dialog.a6-formation-tool'),b=d.getBoundingClientRect(),note=d.querySelector('.a6-supply-note')?.getBoundingClientRect(),controls=[...d.querySelectorAll('.a6-team-suggestions>button,.a6-saved-team-desk>footer>button,.a6-replacement-desk>footer select')].map(n=>n.getBoundingClientRect());return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,dialogFits:b.top>=0&&b.bottom<=innerHeight,noteFits:!note||note.top>=b.top&&note.bottom<=b.bottom,controlsFit:controls.every(r=>r.top>=b.top&&r.bottom<=Math.min(b.bottom,innerHeight))};});
  const file=`${width}-${name}.webp`,png='/tmp/cardrpg-c-preparation-'+width+'.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,height,file,...audit});expect(audit.overflow).toBe(false);expect(audit.broken).toBe(0);for(const k of ['dialogFits','noteFits','controlsFit'])expect(audit[k],file+' '+k).toBe(true);
 };
 for(const[supply,kind]of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,supply,kind})=>{const m=window.__depthReview,R=window.__prepR,F=window.__prepF;m.state=JSON.parse(fixture);m.error=false;m.notice='';m.watching=false;m.replay=null;m.tutorialBattle=null;m.plan=null;
   const alt=['mochi','soot','clover'],rows={...m.state.rows,mochi:'front',panko:'front',soot:'rear',clover:'rear'};
   m.state=R.configureTeam(m.state,alt,rows,m.state.skills).state;if(kind!=='saved-in')m.state=R.saveLoadoutV4(m.state,0,'Without Panko').state;
   m.state=R.configureTeam(m.state,['panko','soot','clover'],rows,m.state.skills).state;if(kind==='saved-in')m.state=R.saveLoadoutV4(m.state,0,'With Panko').state;
   m.start(1,kind==='tower'?'tower':'campaign',1);if(supply){m.state.account.inventory.stacks[supply]=1;const packed=R.packSupplyV4(m.state,supply,'panko');if(!packed.ok)throw Error(packed.error);m.state=packed.state;}
   m.enter(R.availableNodes(m.state.run)[0].id);if(kind==='later')m.state.run.visited=['earlier-node'];if(kind==='committed')m.state=R.commitPreparation(m.state).state;
   m.state.v4.journey.pending=[];m.go('prepare');
   const menu=kind.startsWith('saved')?'saved':['suggested','committed','tower'].includes(kind)?'suggested':'replace',selected=['replace-other','later'].includes(kind)?'soot':'panko';
   let options=[];
   if(menu==='suggested')options=F.suggestedTeamsA6(m.state,1).map((s,i)=>({label:`Use suggested team ${i+1}: ${s.name}`,team:s.team,rows:{...rows,...s.rows},plan:s.plan}));
   else if(menu==='saved'){const s=m.state.v4.loadouts[0];options=[{label:'Use saved campaign team',team:s.team,rows:{...rows,...s.rows},plan:s.plan}];}
   else options=[{label:`Replace ${R.CAT_BY_ID[selected].name} with Mochi`,team:m.state.team.map(id=>id===selected?'mochi':id),rows:{...rows,mochi:rows[selected]},plan:m.state.v4.plan}];
   options=options.map(o=>{const result=R.configurePreparation(m.state,o.team,o.rows,o.plan);return{...o,ok:result.ok,error:result.error,result:result.ok?window.__prepSnapshot(result.state):null};});
   return{menu,selected,supplyName:supply?R.itemCatalogueV4().find(i=>i.id===supply).name:null,options,before:JSON.stringify(m.state),seed:m.battle.seed,foes:m.battle.initial.enemies,inventory:structuredClone(m.state.account.inventory),packed:structuredClone(m.battle.initial.packedSupply)};
  },{fixture,supply,kind});
  if(expected.menu==='replace')await page.getByRole('button',{name:`Select ${expected.selected==='soot'?'Soot':'Panko'} for placement`,exact:true}).click();
  const name=expected.menu==='saved'?'Saved teams':expected.menu==='suggested'?'Suggested teams · 3 plans':`Replace ${expected.selected==='soot'?'Soot':'Panko'} or change the plan`;
  const opener=page.getByRole('button',{name,exact:true});await opener.click();const dialog=page.locator('dialog.a6-formation-tool');
  if(supply){await expect(dialog.locator('.a6-supply-note')).toContainText(`Panko carries ${expected.supplyName}. Keep Panko in this crew for this encounter.`);if(kind==='committed')await expect(dialog.locator('.a6-supply-note')).not.toContainText('Rows and plan can still change.');}
  else await expect(dialog.locator('.a6-supply-note')).toHaveCount(0);
  for(const option of expected.options){const button=dialog.getByRole('button',{name:option.label,exact:true});expect(await button.isEnabled(),kind+' '+option.label).toBe(option.ok);if(expected.menu==='suggested'&&supply&&!option.team.includes('panko'))await expect(button).toContainText('Needs Panko in this crew');}
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);delete expected.before;
  await capture((supply??'none')+'-'+kind);report.checks.push({width,supply,kind,options:expected.options.map(({label,ok,error})=>({label,ok,error})),readOnly:true});
  if(kind==='later'){
   const command=await page.evaluate(()=>{const m=window.__depthReview,R=window.__prepR;return window.__prepSnapshot(R.configurePreparation(m.state,m.state.team,m.state.rows,{...m.state.v4.plan,care:'protect'}).state);});
   await dialog.getByRole('combobox',{name:'Formation care'}).selectOption('protect');expect(await page.evaluate(()=>window.__prepSnapshot(window.__depthReview.state))).toEqual(command);report.checks.push({width,kind,exactPlan:true});await capture(supply+'-later-plan');
  }
  const choice=expected.options.find(o=>o.ok);
  if(choice){await dialog.getByRole('button',{name:choice.label,exact:true}).focus();await page.keyboard.press('Enter');await expect(dialog).toHaveCount(0);expect(await page.evaluate(()=>window.__prepSnapshot(window.__depthReview.state))).toEqual(choice.result);report.checks.push({width,supply,kind,exactCommand:true});}
  else{await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);}
  await expect(page.getByRole('group',{name:'Formation tools'}).getByRole('button').nth(expected.menu==='saved'?0:expected.menu==='suggested'?1:2)).toBeFocused();
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
