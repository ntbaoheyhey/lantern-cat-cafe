/** C2 real UI play. A fresh seeded save is installed before first navigation;
 * every progression action thereafter is a Playwright click. Wall time is real,
 * x1, no grants, skipped onboarding, injected commands or clock acceleration.
 * Optional skips apply only when the game's earned three-star skip is enabled.
 */
import {mkdir,writeFile,access,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {root,require,loadRuntime,freshAccount,decisionDelay,summarize,fraction} from './runtime.mjs';
import {chooseAction,remember} from './policy.mjs';
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const out=resolve(arg('out',resolve(root,'work/cardrpg-c2/realplay'))),seeds=arg('seeds','80001,80002,80003,80004,80005').split(',').map(Number),duration=Number(arg('seconds','1800'));
if(seeds.some(s=>!Number.isSafeInteger(s)||s<1)||!Number.isFinite(duration)||duration<1)throw Error('Invalid seeds/duration');
await mkdir(out,{recursive:true});
for(const seed of seeds)if(await access(resolve(out,`${seed}.json`)).then(()=>true,()=>false))throw Error(`Keep prior measurements: ${seed}.json exists; use another output directory.`);
const frozenRuntime=arg('runtime'),runtimePath=resolve(frozenRuntime??resolve(out,'runtime/runtime.mjs'));
const {R}=frozenRuntime?await import(pathToFileURL(runtimePath).href):await loadRuntime(resolve(out,'runtime'));
const runtimeSha256=createHash('sha256').update(await readFile(runtimePath)).digest('hex');
const {chromium}=require('@playwright/test');
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const sourceDiffSha256=createHash('sha256').update(execFileSync('git',['diff','HEAD'],{cwd:root})).digest('hex');
const hashes=Object.fromEntries(await Promise.all(['realplay-bot.mjs','policy.mjs','runtime.mjs'].map(async f=>[f,createHash('sha256').update(await readFile(resolve(import.meta.dirname,f))).digest('hex')])));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});
const stopped=()=>access(resolve(root,'STOP-C2')).then(()=>true,()=>false);
async function play(seed){
 const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();
 page.setDefaultTimeout(10000);
 const epoch=Date.now(),initial=freshAccount(R,seed,epoch),memory={},report={seed,epoch,sourceHead:head,sourceDiffSha256,runtimePath,runtimeSha256,hashes,secondsRequested:duration,concurrentSessions:seeds.length,method:'Fresh public seed; UI-only actions; real wall time; x1; eligible skips recorded.',actions:[],curve:[],errors:[],stalls:[],encounters:[],initial};
 await context.addInitScript(({key,save})=>{if(location.protocol==='http:'&&!localStorage.getItem(key))localStorage.setItem(key,save);},{key:R.SAVE_KEY,save:R.exportSave(initial)});
 const started=Date.now(),seconds=()=> (Date.now()-started)/1000;
 page.on('pageerror',e=>report.errors.push({at:seconds(),message:e.message}));
 let previousAt=0,lastActionAt=0,lastAction=null;
 // Compact route help and the action deliberately share accessible labels.
 // Choose the transaction control, never its explanatory dialog trigger.
 const button=name=>page.getByRole('button',{name,exact:typeof name==='string'}).and(page.locator('button:not(.c2-help-trigger)'));
 async function click(a){
  if(a.type==='front'){
   await page.locator(`.c2-seat[data-seat="${a.catId}"]`).click();
   await page.locator(`.c2-seat[data-seat="${a.swapId}"]`).click();
   return;
  }
  const names={patrol:/^Night Patrol/,fight:/^Fight/,skip:'Skip to result',finish:/^(Next|Complete lesson|Back to cafe|Back to Tower)$/,welcome:'✉ Welcome',meet:'Meet your cats','open-recruit':'Recruit','open-cats':'Cats','open-team':'Team','first-level':'Level up',equip:'Auto-equip best gear',upgrade:'Quick upgrade','open-tips':'Review Fast reward','close-tips':'Back to cafe',fast:'Collect fast reward',tips:'Collect saved tips','open-events':'Events',login:'Collect login gift',task:a.label,weekly:`Collect ${a.points}-task weekly gift`,reward:a.label,resolve:a.label,tab:new RegExp(a.tab??'^$','i'),close:'Close','close-events':'Close'};
  const target=a.type==='enter'?page.locator(".dp-node:not(:disabled)"):button(names[a.type]);
  await target.first().click();
 }
 async function save(){
  const probe=await page.evaluate(()=>window.__c2Probe?{encounters:window.__c2Probe.encounters,frames:window.__c2Probe.frames,live:window.__c2Probe.live}:null).catch(()=>null);
  if(!probe){await writeFile(resolve(out,`${seed}.json`),JSON.stringify(report,null,2));return;}
  report.encounters=probe.encounters;report.live=probe.live;report.frameDelivery=probe.frames;
  report.activeSeconds=seconds();report.summary=summarize(report.encounters,report.activeSeconds);
  await writeFile(resolve(out,`${seed}.json`),JSON.stringify(report,null,2));
 }
 try{
  await page.goto(arg('url','http://localhost:5970')+'/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1&lookSpine=1');
  await page.waitForFunction(()=>!!window.__depthReview);
  report.loadedAssets=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\.(js|css)(\?|$)/.test(n)).sort());
  await page.evaluate(()=>history.replaceState({},'',location.href.replace('&dev=1','')));
  const installed=await page.evaluate(()=>({seed:window.__depthReview.state.account.seed,offline:window.__depthReview.offline,team:window.__depthReview.state.team,speed:window.__depthReview.state.settings.speed}));
  if(installed.seed!==seed||installed.speed!==1||installed.team.length!==4)throw Error('Fresh seeded C2 account was not installed');
  report.installed=installed;
  await page.evaluate(started=>{
   const m=window.__depthReview,p={encounters:[],live:null,frames:{count:0,totalMs:0,over50:0,maxMs:0},lastFrame:0,lastPlan:null};window.__c2Probe=p;
   const seconds=()=> (Date.now()-started)/1000;
   const sample=()=>{
    const b=m.battle;
    if(m.showBattle&&b){
     if(!p.live)p.live={seed:b.seed,runId:m.state.run?.id,at:seconds(),readyAt:null,tutorial:!!m.tutorialBattle,boss:false,chapter:b.chapter,node:m.state.run?.current,kind:m.state.run?.nodes.find(n=>n.id===m.state.run.current)?.kind,initial:structuredClone(b.initial),skipped:false,plans:[]};
     p.live.boss=p.live.kind==='boss';
     if(m.sceneReady&&p.live.readyAt===null)p.live.readyAt=seconds();
     if(m.plan&&m.plan!==p.lastPlan){p.lastPlan=m.plan;p.live.plans.push({skill:m.plan.presentationId??m.plan.skillId,duration:m.plan.duration,at:seconds()});}
    }else if(p.live&&b?.result){
     p.encounters.push({...p.live,endedAt:seconds(),playbackSeconds:p.live.readyAt===null?null:seconds()-p.live.readyAt,result:b.result,rounds:b.round,hpRemaining:b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+a.hp,0)/Math.max(1,b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+a.maxHp,0)),choices:structuredClone(b.choices)});p.live=null;p.lastPlan=null;
    }
   };
   m.subscribe(sample);setInterval(sample,50);
   const frame=at=>{if(m.showBattle&&m.sceneReady){if(p.lastFrame){const dt=at-p.lastFrame;p.frames.count++;p.frames.totalMs+=dt;p.frames.maxMs=Math.max(p.frames.maxMs,dt);if(dt>50)p.frames.over50++;}p.lastFrame=at;}else p.lastFrame=0;requestAnimationFrame(frame);};requestAnimationFrame(frame);
  },started);
  while(seconds()<duration&&!await stopped()){
   const v=await page.evaluate(()=>{const m=window.__depthReview;return {screen:m.screen,watching:m.showBattle,canSkip:m.canSkip,sceneReady:m.sceneReady,now:m.cafeNow,cardId:m.cardId,state:m.showBattle?null:m.state,runId:m.state.run?.id,node:m.state.run?.current,revealDone:document.querySelector('.uv-recruit-stage')?.getAttribute('data-beat')==='summary',tipsOpen:!!document.querySelector('dialog.a6-tip-review[open]'),eventsOpen:!!document.querySelector('[data-screen="events"]'),eventTab:document.querySelector('.c2-reward-book nav button[aria-pressed=true]')?.textContent?.trim().split(' ').at(-1)?.toLowerCase(),loading:!!document.querySelector('.a6-opening,.uv-opening')};});
   if(v.watching){
    if(v.canSkip&&fraction(seed,`skip:${v.runId}:${v.node}`)<.2){await page.evaluate(()=>{if(window.__c2Probe.live)window.__c2Probe.live.skipped=true;});await click({type:'skip'});report.actions.push({at:seconds(),type:'skip'});}
    lastActionAt=seconds();
   }else if(!v.loading){
    const a=chooseAction(R,v.state,v,memory);
    if(a){
     const delay=decisionDelay(seed,report.actions.length,a);await page.waitForTimeout(delay);
     if(seconds()>=duration)break;
     await click(a);remember(memory,a,v.state);lastActionAt=seconds();lastAction=a;
     const after=await page.evaluate(()=>{const s=window.__depthReview.state;return {currencies:s.account.currencies,xp:s.account.accountXp,level:s.account.accountLevel,team:s.team,cards:s.account.cards.map(c=>({id:c.cardId,level:c.level,stars:c.stars})),nextRunId:s.nextRunId,gear:s.gear.length};});
     report.actions.push({at:seconds(),delayMs:delay,...a});report.curve.push({at:seconds(),...after});
    }
   }
   if(seconds()-lastActionAt>45){report.stalls.push({at:seconds(),screen:v.screen,lastAction,buttons:await page.getByRole('button').allTextContents()});await page.screenshot({path:resolve(out,`${seed}-stall.png`)});throw Error('No useful UI progress for 45 seconds');}
   if(seconds()-previousAt>=30){await save();previousAt=seconds();console.log(JSON.stringify({seed,seconds:Math.round(seconds()),screen:v.screen,...report.summary}));}
   await page.waitForTimeout(150);
  }
  report.completed=seconds()>=duration;report.stopped=await stopped();
  report.final=await page.evaluate(()=>window.__depthReview.state);
 }catch(error){report.errors.push({at:seconds(),message:String(error)});report.completed=false;await page.screenshot({path:resolve(out,`${seed}-error.png`)}).catch(()=>{});}
 finally{await save().catch(error=>report.errors.push({message:String(error)}));await context.close();}
 console.log(JSON.stringify({seed,completed:report.completed,errors:report.errors,summary:report.summary}));return report;
}
try{
 const results=await Promise.allSettled(seeds.map(play));
 const reports=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
 await writeFile(resolve(out,'summary.json'),JSON.stringify({head,runtimePath,runtimeSha256,hashes,seeds,duration,reports:reports.map(r=>({seed:r.seed,completed:r.completed,errors:r.errors,summary:r.summary})),rejected:results.filter(r=>r.status==='rejected').map(r=>String(r.reason))},null,2));
 if(reports.some(r=>!r.completed||r.errors.length)||results.some(r=>r.status==='rejected'))process.exitCode=1;
}finally{await browser.close();}
