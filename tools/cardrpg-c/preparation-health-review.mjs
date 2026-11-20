/** Encounter health presentation and legal row moves; isolated accounts, no balance cohort. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-preparation-health';
const cases=(process.argv.find(a=>a.startsWith('--cases='))?.slice(8)??'practice,full,injured,ko-front,two-front,all-front,boss,tower,committed,team').split(',');
const report={checks:[],shots:[],errors:[],complete:false};await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async root=>{window.__healthR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');},root);
 const capture=async name=>{
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  if(await page.locator('.dp-v4-forecast').count())await page.locator('.dp-v4-forecast:not([data-forecast-state=checking])').waitFor({timeout:15000});
  await expect.poll(()=>page.locator('.a6-power').evaluateAll(es=>es.filter(el=>el.dataset.gain==='true'||el.querySelector('b')?.textContent.replaceAll(',','')!==el.getAttribute('aria-label')?.match(/\d+$/)?.[0]).map(el=>el.getAttribute('aria-label')))).toEqual([]);
  const audit=await page.evaluate(()=>{
   const fight=document.querySelector('.uv-fight-bar')?.getBoundingClientRect(),main=document.querySelector('.uv-prepare-main')?.getBoundingClientRect(),stage=document.querySelector('.a6-formation-stage').getBoundingClientRect(),limit=Math.min(fight?.top??innerHeight,main?.bottom??innerHeight);
   const visible=el=>{const b=el.getBoundingClientRect();return b.width>0&&b.top>=0&&b.bottom<=limit&&b.left>=0&&b.right<=innerWidth;};
   const names=[...document.querySelectorAll('.a6-formation-cat>div')].map(el=>el.getBoundingClientRect().top);
   return{stageFits:stage.top>=0&&stage.bottom<=limit,healthFits:[...document.querySelectorAll('.a6-seat-health')].every(visible),hintFits:visible(document.querySelector('.a6-placement-hint')),bondsClearNames:[...document.querySelectorAll('.a6-bond-lines path')].every(el=>el.getBoundingClientRect().bottom<Math.min(...names)),fightFits:!fight||fight.top>=0&&fight.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth};
  });
  const file=`${width}-${name}.webp`,png=`/tmp/cardrpg-c-health-${width}.png`;await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+file]);report.shots.push({width,name,file,...audit});
  for(const key of ['stageFits','healthFits','hintFits','bondsClearNames','fightFits'])expect(audit[key],file+' '+key).toBe(true);expect(audit.overflow).toBe(false);report.checks.push({width,name,reducedMotionPower:true,layout:true});
 };
 for(const kind of cases){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  const expected=await page.evaluate(kind=>{
   const m=window.__depthReview,R=window.__healthR;m.offline=true;m.tutorialBattle=null;m.replay=null;m.plan=null;m.watching=false;m.state=R.setGameplayA6(R.createDepthAccount(826111,0),true);m.state.settings.reducedMotion=true;
   if(kind!=='practice'){m.state.tutorial=4;m.state.freeInvite=true;m.state.account.cards[0].level=2;}
   if(kind==='two-front')m.state.rows.soot='front';if(kind==='all-front')m.state.rows={...m.state.rows,mochi:'front',soot:'front',clover:'front'};
   if(kind==='practice')m.tutorial();
   else if(kind!=='team'){
    if(kind==='tower')m.state.cleared=[1];
    m.start(1,kind==='tower'?'tower':'campaign',1);if(m.error)throw Error(m.notice);
    if(!['full','tower'].includes(kind))m.state.run.hp.soot=37;
    if(['ko-front','two-front','committed'].includes(kind))m.state.run.hp.mochi=0;
    if(kind==='injured')m.state.run.hp.mochi=200;
    m.enter(R.availableNodes(m.state.run)[0].id);
    if(kind==='boss')m.state.run.battle=R.createBattle({...m.battle.initial,enemies:['yarn-giant','button-guard','needle-moth']});
    if(kind==='committed')m.state=R.commitPreparation(m.state).state;
   }
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go(kind==='team'?'team':'prepare');
   return{state:JSON.stringify(m.state),battle:JSON.stringify(m.battle),actors:m.battle?.actors.filter(a=>a.side==='party').map(a=>({name:a.name,id:a.catalogId,hp:a.hp,maxHp:a.maxHp}))??[]};
  },kind);
  await page.getByRole('region',{name:'Formation',exact:true}).waitFor();
  if(kind!=='team'){
   await page.getByRole('button',{name:/^Fight/}).waitFor();
   await page.locator('.dp-v4-forecast:not([data-forecast-state=checking])').waitFor({timeout:15000});
   for(const actor of expected.actors){
    const meter=page.getByRole('progressbar',{name:actor.name+' HP',exact:true});await expect(meter).toHaveAttribute('value',String(actor.hp));await expect(meter).toHaveAttribute('max',String(actor.maxHp));
    const card=page.getByRole('button',{name:`Select ${actor.name} for placement`,exact:true});
    await expect(card).toHaveAccessibleDescription(actor.hp===0?'Knocked out · 0 HP':`${actor.hp.toLocaleString('en-US')} / ${actor.maxHp.toLocaleString('en-US')} HP`);
    report.checks.push({width,kind,actor:actor.id,hp:actor.hp,maxHp:actor.maxHp,description:true});
   }
   if(kind==='committed')for(const card of await page.locator('.a6-formation-cat').all())await expect(card).toBeDisabled();
   if(expected.actors.some(a=>a.hp===0))await expect(page.locator('.uv-fight-bar')).toContainText('Knocked-out cats cannot act.');
  }else await expect(page.locator('.a6-seat-health')).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.state))).toBe(expected.state);expect(await page.evaluate(()=>JSON.stringify(window.__depthReview.battle))).toBe(expected.battle);
  report.checks.push({width,kind,readOnly:true});await capture(kind);
  if(['two-front','ko-front'].includes(kind)){
   const select=async name=>{await page.getByRole('button',{name:`Select ${name} for placement`,exact:true}).focus();await page.keyboard.press('Enter');};
   const move=async(id,name,row)=>{
    const expected=await page.evaluate(({id,row})=>{const m=window.__depthReview,R=window.__healthR,result=R.configurePreparation(m.state,m.state.team,{...m.state.rows,[id]:row},m.state.v4.plan);if(!result.ok)throw Error(result.error);return{run:result.state.run,rows:result.state.rows,hp:m.state.run.hp,seed:m.battle.seed,foes:m.battle.initial.enemies,currencies:m.state.account.currencies};},{id,row});
    await page.getByRole('button',{name:`Place ${name} ${row}`,exact:true}).focus();await page.keyboard.press('Enter');
    const after=await page.evaluate(()=>{const m=window.__depthReview;return{run:m.state.run,rows:m.state.rows,hp:m.state.run.hp,seed:m.battle.seed,foes:m.battle.initial.enemies,currencies:m.state.account.currencies};});expect(after).toEqual(expected);report.checks.push({width,kind,id,row,exactCommand:true,keyboard:true});
   };
   await select('Soot');
   if(kind==='ko-front'){await expect(page.locator('.a6-placement-hint')).toContainText('Choose a living cat');await move('soot','Soot','front');}
   await expect(page.getByRole('button',{name:'Place Soot rear',exact:true})).toBeDisabled();report.checks.push({width,kind,protectsLivingFront:true});await capture(kind+'-protected');
   await select('Clover');await move('clover','Clover','front');await select('Soot');await move('soot','Soot','rear');
   await expect(page.getByRole('progressbar',{name:'Soot HP',exact:true})).toHaveAttribute('value','37');await capture(kind+'-moved');
  }
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
