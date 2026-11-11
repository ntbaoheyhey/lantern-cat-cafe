/** Isolated completion receipts and navigation; no combat/acceptance-seed replay. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-completion-final');await mkdir(output,{recursive:true});
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(',');
const report={checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const modern of [true,false]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&'+(modern?'a6=1&lookSpine=1':'ui=legacy'));await page.waitForFunction(()=>!!window.__depthReview);
 const fixture=await page.evaluate(async root=>{window.__completionR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;if(m.state.v4)m.state.v4.journey.pending=[];m.state.run=null;return JSON.stringify(m.state);},root);
 for(const kind of modern?['six','duplicate','converted','mixed','none','missing','loss','caps','tower29','tower30']:['legacy-six','legacy-none','legacy-loss','legacy-tower30']){
  if(selected&&!selected.includes(kind))continue;
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind,modern})=>{
   const R=window.__completionR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';
   const started=R.startRun(m.state,1,824011,'campaign','2026-11-06',1);if(!started.ok)throw Error(started.error);m.state=started.state;
   let run=m.state.run;run.complete=true;run.won=!kind.includes('loss');
   const ids=['hearthloom-weapon-common','mossbrew-charm-rare','moonwick-outfit-epic','bellsteel-relic-legendary','velvetrim-weapon-legendary','emberfelt-outfit-legendary'];
   const add=id=>{const g=R.makeGear(m.state,id,824012);m.state.gear.push(g);run.earnedItems.push(id);return g;};
   if(!['none','legacy-none','tower29','tower30','legacy-tower30','converted'].includes(kind))for(const id of kind.includes('six')?ids:ids.slice(1,2))add(id);
   if(kind==='duplicate'){add(ids[1]);add(ids[1]);}
   if(kind==='missing')m.state.gear=m.state.gear.filter(g=>g.templateId!==ids[1]);
   if(kind==='mixed'||kind==='converted'){
    while(m.state.gear.length<240)m.state.gear.push(R.makeGear(m.state,ids[0],824013));
    m.state.account.inventory.stacks['depth-drops-'+m.state.account.day]=0;
    for(let i=0;i<(kind==='converted'?6:2);i++)R.dropGear(m.state,'boss',824020+i,1);
   }
   if(kind==='caps')m.state.account.daily.earned={...R.depthCaps(m.state)};
   if(kind.startsWith('tower')){const floor=Number(kind.slice(5));m.state.cleared=[1,2,3];m.state.towerBest=floor;m.state=R.startTowerFloorA6(m.state,floor).state;run=m.state.run;run.complete=true;run.won=true;}
   if(kind==='legacy-tower30'){run.mode='tower';run.floor=30;}
   if(m.state.v4)m.state.v4.journey.pending=[];m.itemId=m.state.gear[0].id;m.go('map');
   const counts={};for(const id of run.earnedItems)if(R.GEAR_BY_ID[id])counts[id]=(counts[id]??0)+1;
   const finds=Object.entries(counts).map(([id,count])=>{const pieces=m.state.gear.filter(g=>g.templateId===id),spec=R.GEAR_BY_ID[id];return{id,count,name:spec.name,slot:spec.slot,owned:pieces.length,selected:pieces.at(-1)?.id??null};});
   return{before:JSON.stringify(m.state),finds,notes:run.earnedItems.filter(id=>!R.GEAR_BY_ID[id]),won:run.won,next:run.mode==='tower'?R.nextTowerFloor(m.state):null};
  },{fixture,kind,modern});
  const panel=page.locator('.dp-route-complete');await expect(panel).toBeVisible();if(modern)await page.locator('.uv-sheet-content').evaluate(el=>{el.scrollTop=0;});else await panel.evaluate(el=>el.scrollIntoView({block:'center'}));
  await expect(panel.getByRole('heading',{level:2})).toHaveText(expected.won?'The lantern stays lit.':'Every journey leaves a lesson.');
  expect(await panel.locator('.dp-route-find').count()).toBe(expected.finds.length);
  for(const f of expected.finds){const card=panel.locator('.dp-route-find').filter({has:page.getByRole('heading',{name:f.name,exact:true})});await expect(card).toContainText('Found '+f.count);if(f.owned){await expect(card).toContainText(f.owned+' in Bag');await expect(card.getByRole('button')).toHaveCount(1);}else{await expect(card).toContainText('No matching piece remains in your Bag.');await expect(card.getByRole('button')).toHaveCount(0);}}
  for(const note of expected.notes)await expect(panel).toContainText(note);
  await expect(panel.getByRole('button',{name:'Equip your rewards',exact:true})).toHaveCount(0);
  if(!expected.finds.length&&!expected.notes.length)await expect(panel).toContainText('No new equipment this route.');
  if(expected.next?.ok)await expect(panel.getByRole('button',{name:/Climb to floor/})).toBeEnabled();else await expect(panel.getByRole('button',{name:/Climb to floor/})).toHaveCount(0);
  if(expected.next&&!expected.next.ok)await expect(panel.getByRole('status')).toHaveText(expected.next.error);
  if(kind==='caps')await expect(panel).toContainText('Today’s supplies are gathered.');
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,kind,exactReceipt:true,readOnly:true,towerEligibility:true});
  const capture=async suffix=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
   const audit=await page.evaluate(()=>{const p=document.querySelector('.dp-route-complete'),host=p.closest('.a6-route-activity')??document.querySelector('#depth-main'),h=host.getBoundingClientRect(),r=p.getBoundingClientRect(),clip={top:Math.max(0,h.top),bottom:Math.min(innerHeight,h.bottom)};return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,panelFits:r.top>=clip.top-1&&r.bottom<=clip.bottom+1,footerFits:[...p.querySelectorAll('.cr-actions button')].every(b=>{const r=b.getBoundingClientRect();return r.top>=clip.top-1&&r.bottom<=clip.bottom+1&&b.scrollWidth<=b.clientWidth+1;}),cardsFit:[...p.querySelectorAll('.dp-route-find')].every(c=>c.scrollWidth<=c.clientWidth+1)};});
   const file=`${width}-${kind}${suffix}.webp`,png=`/tmp/cardrpg-c-completion-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({width,kind,file,...audit});
   for(const key of ['panelFits','footerFits','cardsFit'])expect(audit[key],file+' '+key).toBe(true);expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);
  };
  await capture('');
  if(expected.notes.length){const list=panel.getByRole('region',{name:'Route finds'});const scrolls=await list.evaluate(el=>el.scrollHeight>el.clientHeight);if(scrolls){await list.evaluate(el=>{el.scrollTop=el.scrollHeight;});await capture('-notes-last');await list.evaluate(el=>{el.scrollTop=0;});}}
  for(const f of expected.finds.filter(f=>f.selected)){
   const link=panel.getByRole('button',{name:`View ${f.name} in Bag`,exact:true});await link.focus();await expect(link).toBeInViewport({ratio:1});if(expected.finds.at(-1)===f&&expected.finds.length>1)await capture('-last');await page.keyboard.press('Enter');
   await page.waitForFunction(()=>window.__depthReview.screen==='inventory');const actual=await page.evaluate(()=>({item:window.__depthReview.itemId,slot:window.__depthReview.inventorySlot,state:JSON.stringify(window.__depthReview.state)}));
   expect(actual.item).toBe(f.selected);expect(actual.slot).toBe(f.slot);expect(actual.state).toBe(expected.before);
   if(modern)await expect(page.locator('[data-selected-gear]')).toHaveAttribute('data-selected-gear',f.selected);else await expect(page.locator('.dp-equip-action h2')).toHaveText(f.name);
   report.checks.push({width,kind,template:f.id,keyboard:true,selected:f.selected,exactNavigation:true});
   await page.evaluate(()=>window.__depthReview.go('map'));await expect(panel).toBeVisible();if(modern)await page.locator('.uv-sheet-content').evaluate(el=>{el.scrollTop=0;});else await panel.evaluate(el=>el.scrollIntoView({block:'center'}));
  }
  if(expected.next?.ok){await panel.getByRole('button',{name:/Climb to floor/}).focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expected.next.state);await expect(panel).toBeHidden();report.checks.push({width,kind,keyboard:true,exactNextFloor:true});}
  else{await panel.getByRole('button',{name:'Review equipment',exact:true}).focus();await page.keyboard.press('Enter');const target=expected.finds.find(f=>f.selected);expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);if(target)expect(await page.evaluate(()=>window.__depthReview.itemId)).toBe(target.selected);report.checks.push({width,kind,keyboard:true,generalBag:true,readOnly:true});
   await page.evaluate(()=>window.__depthReview.go('map'));await panel.getByRole('button',{name:'Return to cafe',exact:true}).focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.screen)).toBe('hub');expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,kind,keyboard:true,home:true,readOnly:true});}
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,keyboard:report.checks.filter(c=>c.keyboard).length,errors:report.errors,complete:report.complete}));
