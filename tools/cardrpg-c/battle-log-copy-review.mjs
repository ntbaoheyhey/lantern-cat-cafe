/** Read-only event-book fixtures, with live rules producing the displayed outcomes. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),{chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-log-copy';
const only=process.argv.find(a=>a.startsWith('--scenario='))?.slice(11);
await mkdir(output,{recursive:true});
const report={cases:[],shots:[],errors:[],rows:0,complete:false};
const browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const [width,height] of [[1280,720],[1440,900]])for(const reduced of [false,true]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 for(const scenario of ['normal','boss','support','legacy'].filter(s=>!only||s===only)){
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(async({root,reduced,scenario})=>{
   const R=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts'),m=window.__depthReview;
   m.offline=true;m.tutorialBattle=null;m.replay=null;m.plan=null;m.watching=false;
   m.state=R.setGameplayA6(R.createDepthAccount(917264,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   m.start(1);m.enter(R.availableNodes(m.state.run)[0].id);R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];
   const setup=m.battle.initial;
   let b=R.createBattle({...setup,enemies:scenario==='boss'?['yarn-giant']:scenario==='support'?['teacup-healer','button-guard']:['button-guard','sock-skipper'],...(scenario==='legacy'?{gameplayA6:false,skillsV5:false,gameplayV4:false}:{})});
   if(scenario==='support'){
    const healer=b.actors.find(a=>a.catalogId==='teacup-healer'),guard=b.actors.find(a=>a.catalogId==='button-guard');guard.hp=20;
    b.queue=[healer.id];b.intents.find(i=>i.actorId===healer.id).signature=true;R.enemyAct(b);
    const clover=b.actors.find(a=>a.catalogId==='clover'),mochi=b.actors.find(a=>a.catalogId==='mochi');
    R.applyStatus(b,clover,mochi,'steep',2);R.applyStatus(b,mochi,mochi,'cozy',2);R.applyStatus(b,mochi,mochi,'cozy',1);
    R.applyStatus(b,healer,mochi,'scald',2);R.tickStatuses(b,mochi);
   }else{
    for(let i=0;i<(scenario==='boss'?21:9)&&!b.result;i++){
     if(R.currentActor(b)?.side==='enemy')R.enemyAct(b);else R.act(b,R.chooseAction(b,'auto'));
    }
   }
   m.state.run.battle=b;m.screen='map';m.plan=null;m.sceneReady=true;m.sceneStarted=true;m.watching=true;m.paused=true;m.animationAt=0;m.notify(false);
  },{root,reduced,scenario});
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.sceneReady);
  const more=page.getByRole('button',{name:'More battle options'});await more.click();await page.getByRole('button',{name:'Read battle log'}).click();
  const log=page.getByRole('dialog',{name:'Battle log'}),events=log.getByRole('region',{name:'Battle events, newest first'}),close=log.getByRole('button',{name:'Close log'});
  await expect(close).toBeFocused();
  const before=await page.evaluate(()=>JSON.stringify({battle:window.__depthReview.battle,account:window.__depthReview.state.account,clock:window.__depthReview.playbackAt}));
  const audit=await log.evaluate(el=>{
   const b=window.__depthReview.battle,rows=[...el.querySelectorAll('[data-event-index]')];
   const name=id=>{const a=b.actors.find(a=>a.id===id);if(!a)return id?'Unknown unit':'';const peers=b.actors.filter(other=>other.name===a.name&&other.side===a.side);return a.name+(peers.length>1?' '+(peers.findIndex(other=>other.id===id)+1):'');};
   return {total:b.log.length,round:b.round,rows:rows.map(row=>{const i=Number(row.dataset.eventIndex),e=b.log[i],source=name(e.actorId),target=name(e.targetId);return{index:i,kind:e.kind,amount:e.amount,text:e.text,context:row.querySelector('.a6-log-context').textContent,expectedContext:['action','enemy-action'].includes(e.kind)?source||'Battle':source&&target?source+(e.actorId===e.targetId?' · self':' → '+target):source||target||'Battle',summary:row.querySelector('p').textContent};})};
  });
  expect(audit.rows.map(r=>r.index)).toEqual(Array.from({length:Math.min(100,audit.total)},(_,i)=>audit.total-1-i));
  for(const row of audit.rows){expect(row.context).toBe(row.expectedContext);expect(row.summary.length).toBeGreaterThan(0);
   if(['damage','dot','reflect','shared','reaction-damage','detonate'].includes(row.kind))expect(row.summary).toContain(`${row.amount} HP`);
   if(row.kind==='heal')expect(row.summary).toContain(`Restored ${row.amount} HP`);
   if(row.kind==='status')expect(row.summary).toBe(`${row.text} · ${row.amount} stack${row.amount===1?'':'s'} now`);
   if(row.kind==='multi-hit')expect(row.summary).toMatch(/^Target: /);
  }
  report.rows+=audit.rows.length;
  if(scenario==='support'){
   const heal=audit.rows.find(e=>e.kind==='heal'&&e.context==='Teacup Healer → Button Guard');expect(heal).toBeTruthy();
   expect(audit.rows.find(e=>e.kind==='enemy-action').context).toBe('Teacup Healer');
   expect(audit.rows.some(e=>e.summary==='Warm · 3 stacks now')).toBe(true);
   expect(audit.rows.some(e=>e.kind==='status-tick'&&e.summary.startsWith('Tick detail · Regen'))).toBe(true);
  }
  if(scenario==='boss')expect(audit.rows.some(e=>/Binding Thread [12]/.test(e.context))).toBe(true);
  const capture=async(label)=>{
   const geometry=await log.evaluate(el=>{const r=el.getBoundingClientRect(),list=el.querySelector('.a6-log-events'),lr=list.getBoundingClientRect();return{fits:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,listWidthFits:list.scrollWidth<=list.clientWidth+1,visibleRows:[...list.querySelectorAll('li')].filter(row=>{const rr=row.getBoundingClientRect();return rr.top>=lr.top&&rr.bottom<=lr.bottom;}).length};});
   expect(geometry.fits).toBe(true);expect(geometry.overflow).toBe(false);expect(geometry.listWidthFits).toBe(true);expect(geometry.visibleRows).toBeGreaterThan(0);
   const name=`${width}-${reduced?'reduced':'motion'}-${scenario}-${label}.webp`,png=output+'/capture.png';await page.screenshot({path:png});execFileSync('cwebp',['-quiet','-q','82',png,'-o',output+'/'+name]);report.shots.push({name,...geometry});
  };
  await page.evaluate(()=>document.fonts.ready);await capture('newest');await events.focus();await page.keyboard.press('End');
  await expect.poll(()=>events.evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop))).toBeLessThan(2);await capture('oldest');
  const last=events.locator('li').last();expect(await last.evaluate(el=>{const r=el.getBoundingClientRect(),p=el.closest('.a6-log-events').getBoundingClientRect();return r.top>=p.top&&r.bottom<=p.bottom;})).toBe(true);
  await page.keyboard.press('Home');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBe(0);
  await page.keyboard.press('Space');await expect.poll(()=>events.evaluate(el=>el.scrollTop)).toBeGreaterThan(20);
  expect(await page.evaluate(()=>JSON.stringify({battle:window.__depthReview.battle,account:window.__depthReview.state.account,clock:window.__depthReview.playbackAt}))).toBe(before);
  await page.keyboard.press('Escape');await expect(log).toHaveCount(0);await expect(more).toBeFocused();expect(await page.evaluate(()=>window.__depthReview.paused)).toBe(true);
  report.cases.push({width,height,reduced,scenario,totalEvents:audit.total,rows:audit.rows.length,readOnly:true,keyboard:true,actualRecipients:true});
 }
 await page.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({cases:report.cases.length,rows:report.rows,shots:report.shots.length,errors:report.errors,complete:report.complete}));
