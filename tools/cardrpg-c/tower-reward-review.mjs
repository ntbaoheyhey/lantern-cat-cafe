/** Tower gift decisions on isolated accounts; no combat or acceptance-seed replay. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json'),{chromium,expect}=require('@playwright/test');
const baseline=process.argv.includes('--baseline'),output=resolve(process.argv.find(a=>a.startsWith('--output='))?.slice(9)??`/tmp/cardrpg-c-tower-gifts-${baseline?'before':'final'}`);
const selected=process.argv.find(a=>a.startsWith('--cases='))?.slice(8).split(','),events=process.argv.includes('--events');
await mkdir(output,{recursive:true});
const report={baseline,checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 const fixture=await page.evaluate(async root=>{window.__towerR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');const m=window.__depthReview;m.offline=true;m.shortcut('unlock');m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=true;m.state.v4.journey.pending=[];m.state.run=null;return JSON.stringify(m.state);},root);
 for(const kind of (events?[]:selected??(baseline?['partial','capped','next']:['locked','next','earned','ready','partial','one-currency','capped','patrol','floor','collected']))){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(()=>window.__depthReview.go('hub'));await expect(page.locator('.a6-tower')).toHaveCount(0);
  const expected=await page.evaluate(({fixture,kind})=>{const R=window.__towerR,m=window.__depthReview;m.state=JSON.parse(fixture);m.replay=null;m.watching=false;m.plan=null;m.error=false;m.notice='';
   m.state.cleared=kind==='locked'?[]:[1];m.state.towerBest=kind==='locked'?0:kind==='next'?4:kind==='earned'?5:30;
   m.state.challengeClaims=kind==='collected'?R.TOWER_CHESTS_A6.map(f=>'a6-tower-chest-'+f):[];
   m.state.account.daily.earned={fish:0,stamps:0,threads:0,essence:0};const caps=R.depthCaps(m.state);
   if(['partial','one-currency','capped'].includes(kind))m.state.account.daily.earned={...caps,stamps:caps.stamps-(kind==='partial'?3:0),threads:caps.threads-(kind==='partial'?2:kind==='one-currency'?12:0)};
   if(kind==='patrol')m.state=R.startRun(m.state,1,826011,'campaign','2026-11-06',1).state;
   if(kind==='floor')m.state=R.enterNode(R.startTowerFloorA6(m.state,5).state,'0-0').state;
   m.state.v4.journey.pending=[];m.go('tower');
   return{before:JSON.stringify(m.state),best:m.state.towerBest,next:Math.min(30,m.state.towerBest+1),chests:R.TOWER_CHESTS_A6.map(f=>({...R.towerChestA6(m.state,f),command:R.claimTowerChestA6(m.state,f)}))};
  },{fixture,kind});
  await page.getByRole('button',{name:/Milestone gifts/}).click();
  while(await page.getByRole('button',{name:'Dismiss celebration'}).count())await page.getByRole('button',{name:'Dismiss celebration'}).click();
  const panel=page.getByRole('region',{name:'Tower milestone chests'});
  const capture=async suffix=>{
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
   const audit=await page.evaluate(()=>{const p=document.querySelector('.a6-tower'),scroll=document.querySelector('.a6-tower-parcels'),h=document.querySelector('.uv-sheet-content').getBoundingClientRect(),pbox=p.getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length,panelFits:pbox.top>=h.top-1&&pbox.bottom<=h.bottom+1,cardsFit:[...p.querySelectorAll('article')].every(c=>c.scrollWidth<=c.clientWidth+1),scrolls:!!scroll&&scroll.scrollHeight>scroll.clientHeight+1};});
   const file=`${width}-${kind}${suffix}.webp`,png=`/tmp/cardrpg-c-tower-gifts-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({file,...audit});
   expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);if(!baseline){expect(audit.panelFits,file).toBe(true);expect(audit.cardsFit,file).toBe(true);}
  };
  for(const p of expected.chests){const card=panel.getByRole('article',{name:`Floor ${p.floor} gift`});
   const body=await card.innerText(),full=p.requested??{stamps:50+p.floor*2,threads:10+p.floor};
   const fullShown=Object.entries(full).every(([id,n])=>body.includes(`${n} ${id}`)),reduced=Object.entries(full).some(([id,n])=>(p.reward[id]??0)<n);
   const noteShown=(await panel.innerText()).includes('uses the whole gift');
   report.checks.push({width,kind,floor:p.floor,claimed:p.claimed,fullShown,needsDisclosure:!p.reason&&reduced,disclosed:noteShown});
   if(!baseline){
    if(!p.claimed)expect(fullShown,`${kind} floor${p.floor} full gift`).toBe(true);
    if(!p.claimed&&reduced){await expect(card).toContainText('Today:');for(const [id]of Object.entries(full))await expect(card).toContainText(`${p.reward[id]??0} ${id}`);}
    if(!p.reason&&reduced)expect(noteShown).toBe(true);
    if(expected.best>=p.floor||kind==='locked'||['patrol','floor'].includes(kind))expect(await card.getByRole('button').isEnabled()).toBe(p.command.ok);
    else await expect(card.getByRole('button',{name:`Plan floor ${expected.next} toward floor ${p.floor} gift`})).toBeEnabled();
   }
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);await capture('');
  if(!baseline){
   const parcelList=page.getByRole('region',{name:'All six Tower gifts'});const scrolls=await parcelList.evaluate(el=>el.scrollHeight>el.clientHeight+1);
   if(scrolls){await parcelList.evaluate(el=>{el.scrollTop=el.scrollHeight;});await capture('-last');await parcelList.evaluate(el=>{el.scrollTop=0;});}
   const claim=expected.chests.find(p=>p.command.ok);
   if(claim){const button=panel.getByRole('button',{name:`Floor ${claim.floor} Collect`,exact:true});await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(claim.command.state);await expect(panel.getByRole('button',{name:`Floor ${claim.floor} Collected`,exact:true})).toBeDisabled();report.checks.push({width,kind,exactCommand:true,keyboard:true});await capture('-claimed');}
   if(kind==='next'||kind==='earned'){
    const target=kind==='next'?5:10,button=panel.getByRole('button',{name:`Plan floor ${expected.next} toward floor ${target} gift`,exact:true});
    const saved=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));await button.focus();await page.keyboard.press('Enter');
    const climb=page.getByRole('button',{name:`Climb floor ${expected.next} →`,exact:true});await expect(climb).toBeVisible();await expect(climb).toBeFocused();expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(saved);report.checks.push({width,kind,keyboard:true,planReadOnly:true,focused:true});await capture('-plan');
    const command=await page.evaluate(f=>{const R=window.__towerR,m=window.__depthReview;return R.enterNode(R.startTowerFloorA6(m.state,f).state,'0-0');},expected.next);expect(command.ok).toBe(true);await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(command.state);expect(await page.evaluate(()=>window.__depthReview.screen)).toBe('prepare');report.checks.push({width,kind,keyboard:true,exactStart:true});
   }
   if(['patrol','floor'].includes(kind)){await panel.getByRole('button',{name:kind==='floor'?'Return to formation':'Return to your patrol'}).focus();await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.screen)).toBe(kind==='floor'?'prepare':'map');expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);report.checks.push({width,kind,keyboard:true,returnReadOnly:true});}
   if(kind==='capped'){
    const expectedNext=await page.evaluate(()=>{const R=window.__towerR,m=window.__depthReview;const r=R.metaCommand(m.state,{type:'advanceLocalDay'});m.apply(r);return r.state;});
    await expect(page.getByRole('button',{name:'Milestone gifts 6'})).toBeVisible();expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(expectedNext);await expect(panel).not.toContainText('Today:');report.checks.push({width,kind,nextDayRestores:true});await capture('-new-day');
   }
  }
 }
 if(events)for(const kind of selected??['full','partial','one-currency','capped','patrol','collected']){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(({fixture,kind})=>{const R=window.__towerR,m=window.__depthReview;m.state=JSON.parse(fixture);m.state.cleared=[1];m.state.towerBest=30;m.state.challengeClaims=kind==='collected'?R.TOWER_CHESTS_A6.map(f=>'a6-tower-chest-'+f):[];m.state.account.daily.earned={fish:0,stamps:0,threads:0,essence:0};
   const caps=R.depthCaps(m.state);if(['partial','one-currency','capped'].includes(kind))m.state.account.daily.earned={...caps,stamps:caps.stamps-(kind==='partial'?3:0),threads:caps.threads-(kind==='partial'?2:kind==='one-currency'?12:0)};
   if(kind==='patrol')m.state=R.startRun(m.state,1,826016).state;m.state.v4.journey.pending=[];m.go('hub');
   return{before:JSON.stringify(m.state),chests:R.TOWER_CHESTS_A6.map(f=>({...R.towerChestA6(m.state,f),command:R.claimTowerChestA6(m.state,f)}))};
  },{fixture,kind});
  await page.getByRole('button',{name:'Events',exact:true}).click();await page.getByRole('button',{name:/Ready gifts/}).click();
  while(await page.getByRole('button',{name:'Dismiss celebration'}).count())await page.getByRole('button',{name:'Dismiss celebration'}).click();
  const shelf=page.getByRole('region',{name:'Yarn Tower',exact:true});
  for(const p of expected.chests){const button=shelf.getByRole('button',{name:`Collect Floor ${p.floor} chest`,exact:true}),card=button.locator('..');expect(await button.isEnabled()).toBe(p.command.ok);
   if(!p.claimed)for(const [id,n]of Object.entries(p.requested))await expect(card).toContainText(`${n} ${id}`);
   if(p.command.ok&&['partial','one-currency'].includes(kind)){
    await expect(button).toHaveText('Collect reduced gift');await expect(shelf).toContainText('uses the whole gift');await expect(card).toContainText('Uses the whole gift.');
    const desc=await button.evaluate(b=>(b.getAttribute('aria-describedby')??'').split(' ').map(id=>document.getElementById(id)?.textContent).join(' '));expect(desc).toContain('uses the whole gift');
   }
   report.checks.push({width,kind,floor:p.floor,events:true,fullVisible:true,eligibility:true});
  }
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.before);
  const capture=async(suffix,element)=>{
   await element.evaluate(el=>el.scrollIntoView({block:'center'}));
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
   const audit=await element.evaluate(el=>{const host=document.querySelector('.uv-sheet-content').getBoundingClientRect(),box=el.getBoundingClientRect();return{fits:box.top>=host.top-1&&box.bottom<=host.bottom+1,overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.images].filter(i=>i.checkVisibility()&&!i.naturalWidth).length};});
   const file=`${width}-events-${kind}-${suffix}.webp`,png=`/tmp/cardrpg-c-tower-events-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','80',png,'-o',output+'/'+file]);report.shots.push({file,...audit});expect(audit.fits,file).toBe(true);expect(audit.overflow,file).toBe(false);expect(audit.broken,file).toBe(0);
  };
  await capture('first',shelf.getByRole('button',{name:'Collect Floor 5 chest',exact:true}).locator('..'));
  await capture('last',shelf.getByRole('button',{name:'Collect Floor 30 chest',exact:true}).locator('..'));
  const p=expected.chests[0];if(p.command.ok){const button=shelf.getByRole('button',{name:'Collect Floor 5 chest',exact:true});await button.focus();await expect(button).toBeInViewport({ratio:1});await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(p.command.state);await expect(button).toBeDisabled();report.checks.push({width,kind,events:true,exactCommand:true,keyboard:true});await capture('claimed',button.locator('..'));}
  await page.getByRole('button',{name:'Close',exact:true}).click();
 }
 await page.close();
}if(report.errors.length)throw Error(JSON.stringify(report.errors));report.complete=true;
}finally{await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify({output,checks:report.checks.length,shots:report.shots.length,keyboard:report.checks.filter(c=>c.keyboard).length,hiddenFullGifts:report.checks.filter(c=>!c.claimed&&c.fullShown===false).length,missingDisclosure:report.checks.filter(c=>c.needsDisclosure&&!c.disclosed).length,errors:report.errors,complete:report.complete}));
