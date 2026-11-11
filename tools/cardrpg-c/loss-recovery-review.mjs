/** Controlled completed losses and advice messages; no earned-play or recovery-rate claim. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-loss-recovery';
const cases=(process.argv.find(a=>a.startsWith('--cases='))?.slice(8)??'owned,timeout,error,training,formation,paid,plan,row,swap,equip,tower').split(',');
const report={fixture:'Controlled result/worker fixtures only. No C5 seeds, combat sample or recovery-rate claim.',checks:[],shots:[],errors:[],complete:false};await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{const NativeWorker=window.Worker;window.__lossPending=[];window.Worker=class extends NativeWorker{postMessage(data,...rest){if(data?.state&&data?.setup&&data?.key)window.__lossPending.push({worker:this,data});else super.postMessage(data,...rest);}};});
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__lossR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);
 const capture=async(name,selector)=>{
  await page.locator(selector).waitFor();
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const audit=await page.evaluate(selector=>{
   const target=document.querySelector(selector),r=target.getBoundingClientRect(),sheet=target.closest('.uv-sheet-content')?.getBoundingClientRect(),limit=sheet??{top:0,left:0,bottom:innerHeight,right:innerWidth};
   const fit=rect=>rect.top>=limit.top-1&&rect.left>=limit.left-1&&rect.bottom<=limit.bottom+1&&rect.right<=limit.right+1;
   return{targetFits:fit(r),controlsFit:[...target.querySelectorAll('button')].every(el=>fit(el.getBoundingClientRect())),overflow:document.documentElement.scrollWidth>innerWidth,text:target.textContent,focus:document.activeElement?.textContent};
  },selector);
  const file=`${width}-${name}.webp`,png=`/tmp/cardrpg-c-loss-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({width,name,file,...audit});
  expect(audit.targetFits,file+' target').toBe(true);expect(audit.controlsFit,file+' controls').toBe(true);expect(audit.overflow).toBe(false);
 };
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  // Unmount each result so an old worker cannot cross fixture boundaries.
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.locator('[data-screen=result]').waitFor({state:'hidden'});
  const fixture=await page.evaluate(kind=>{
   const m=window.__depthReview,R=window.__lossR;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.galleryBattle=null;m.plan=null;m.watching=false;m.paused=false;window.__lossPending=[];
   m.state=R.setGameplayA6(R.createDepthAccount(826115,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.account.cards[0].level=2;m.state.settings.reducedMotion=true;
   Object.assign(m.state.account.currencies,{fish:5000,threads:500});
   if(['owned','timeout','error','equip'].includes(kind)){
    const gear=R.makeGear(m.state,'hearthloom-weapon-epic',24);m.state.gear.push(gear);window.__lossGear=gear.id;
   }
   if(kind==='formation'){for(const id in m.state.account.currencies)m.state.account.currencies[id]=0;m.state.account.daily.earned={...R.depthCaps(m.state)};}
   if(kind==='swap')m.state.account.cards.push({id:'reserve-panko',cardId:'panko',level:2,stars:1,shards:0,soulbound:true});
   if(['training','formation'].includes(kind)){const equipped=R.autoEquipA6(m.state);if(equipped.ok)m.state=equipped.state;}
   if(kind==='tower'){m.state.cleared=[1];m.state.towerBest=4;m.state=R.startTowerFloorA6(m.state,5).state;}
   else m.start(1,'campaign',1);
   m.enter(R.availableNodes(m.state.run)[0].id);
   const b=m.state.run.battle;b.result='enemy';b.round=6;for(const a of b.actors.filter(a=>a.side==='party'))a.hp=0;
   b.log.push({round:2,kind:'damage',actorId:'soot',targetId:b.actors.find(a=>a.side==='enemy').id,amount:150,text:'Controlled loss fixture.'});
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.watching=false;m.screen='result';m.notify(false);
   const settled=R.resultAdviceStateV4(m.state);if(!settled.ok)throw Error(settled.error);
   return{before:JSON.stringify(m.state),settled:settled.state,floor:m.state.run.floor,chapter:m.state.run.chapter};
  },kind);
  const region=page.getByRole('region',{name:'Your next change'});await expect(region).toHaveAttribute('data-advice-state','checking');
  await page.waitForFunction(()=>window.__lossPending.length===1);
  if(kind==='owned'){await expect(region.getByRole('button')).toBeDisabled();await capture(kind+'-checking','.a6-result-story');}
  const response=await page.evaluate(kind=>{
   const {worker,data}=window.__lossPending[0],R=window.__lossR,s=data.state;
   if(kind==='timeout')return null;
   if(kind==='error'){worker.dispatchEvent(new ErrorEvent('error'));return null;}
   const changes={paid:{kind:'level',cardId:s.account.cards[0].id},tower:{kind:'level',cardId:s.account.cards[0].id},plan:{kind:'plan',plan:{focus:'leader',care:'protect'}},row:{kind:'row',catId:'soot',row:'front'},swap:{kind:'cat',catId:'mochi',replacementId:'panko'},equip:{kind:'equip',catId:'soot',gearId:window.__lossGear}};
   const labels={paid:'Raise Mochi to level 3',tower:'Raise Mochi to level 3',plan:'Focus the boss · Protect',row:'Place Soot in Front',swap:'Replace Mochi with Panko in Front',equip:'Give Soot '+R.GEAR_BY_ID[s.gear.find(g=>g.id===window.__lossGear)?.templateId]?.name};
   let advice=null,applied=null;
   if(changes[kind]){applied=R.changeBuildV4(s,changes[kind]);if(!applied.ok)throw Error(applied.error);const cost=Object.fromEntries(Object.entries(s.account.currencies).flatMap(([id,n])=>n-applied.state.account.currencies[id]>0?[[id,n-applied.state.account.currencies[id]]]:[]));advice={change:changes[kind],label:labels[kind],cost,expectedBuild:data.key,before:{wins:0,margin:0},after:{wins:1,margin:.1},samples:10};}
   worker.dispatchEvent(new MessageEvent('message',{data:{key:data.key,result:advice}}));
   return advice?{advice,applied:applied.state}:null;
  },kind);
  await expect(region).toHaveAttribute('data-advice-state',kind==='timeout'?'timeout':kind==='error'?'unavailable':response?'ready':'no-change',{timeout:12000});
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(fixture.before);report.checks.push({width,kind,readOnly:true});
  const button=region.getByRole('button');await expect(button).toBeEnabled();await button.focus();await expect(button).toBeFocused();
  await expect(button).toHaveAccessibleDescription(/Cost:|Formation changes are free/);
  if(response)await expect(button).toHaveAccessibleDescription(new RegExp(kind==='tower'?'Retry Tower floor 5 with full crew HP':'Restart chapter 1 at its first stop with full crew HP'));
  await capture(kind+'-ready','.a6-result-story');
  const expected=response?response.applied:fixture.settled;
  await page.keyboard.press('Enter');
  const current=await page.evaluate(()=>{const m=window.__depthReview;return{state:m.state,screen:m.screen,battle:m.battle,notice:m.notice,error:m.error};});
  if(response){
   expect(current.screen,JSON.stringify({kind,notice:current.notice,error:current.error})).toBe('prepare');expect(current.state.account).toEqual(expected.account);expect(current.state.team).toEqual(expected.team);expect(current.state.rows).toEqual(expected.rows);expect(current.state.equipment).toEqual(expected.equipment);expect(current.state.v4.plan).toEqual(expected.v4.plan);
   expect(current.battle.actors.filter(a=>a.side==='party').every(a=>a.hp===a.maxHp)).toBe(true);expect(current.state.run.chapter).toBe(fixture.chapter);expect(current.state.run.floor).toBe(fixture.floor);expect(current.state.run.current).toBe(current.state.run.nodes[0].id);
   await page.locator('.dp-v4-forecast:not([data-forecast-state=checking])').waitFor({timeout:15000});
   await capture(kind+'-prepared','.uv-fight-bar');report.checks.push({width,kind,keyboard:true,exactChange:true,fullHp:true,retryDestination:true});
  }else{
   expect(current.state).toEqual(expected);report.checks.push({width,kind,keyboard:true,reviewOnly:true});
   if(['owned','timeout','error'].includes(kind)){
    expect(current.screen).toBe('team');const equip=page.getByRole('button',{name:'Auto-equip best gear',exact:true});await expect(equip).toBeEnabled();
    const applied=await page.evaluate(()=>{const m=window.__depthReview,R=window.__lossR;return R.autoEquipA6(m.state).state;});await equip.focus();await capture(kind+'-review','.a6-quick-upgrade');await page.keyboard.press('Enter');expect(await page.evaluate(()=>window.__depthReview.state)).toEqual(applied);report.checks.push({width,kind,exactEquip:true,keyboard:true});
   }else if(kind==='formation'){expect(current.screen).toBe('team');await capture(kind+'-review','.a6-formation-stage');}
   else{expect(current.screen).toBe('collection');await capture(kind+'-review','.a6-cat-growth');}
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
