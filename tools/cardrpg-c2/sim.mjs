/** Prospective C2 simulation: same action policy and public DepthModel as the UI.
 * No separate battle-timing approximation or automatic invisible reward sweeps.
 */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {loadRuntime,root,freshAccount,decisionDelay,summarize,fraction} from './runtime.mjs';
import {chooseAction,remember,executeModelAction} from './policy.mjs';
const arg=(key,fallback)=>process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3)??fallback;
const out=resolve(arg('out',resolve(root,'work/cardrpg-c2/sim'))),first=Number(arg('first-seed','80001')),count=Number(arg('count','5')),duration=Number(arg('seconds','1800'));
await mkdir(out,{recursive:true});
const {R,DepthModel}=await loadRuntime(resolve(out,'runtime'));
export function simulate(seed){
 const m=new DepthModel(true,true,true,true,true);m.state=freshAccount(R,seed,0);
 const memory={},view={eventsOpen:false,tipsOpen:false,eventTab:'login',revealDone:false},report={seed,actions:[],encounters:[],curve:[]};
 let now=0,live=null,actionIndex=0,guard=0;
 // A browser ready-state budget is explicit; it is excluded from battle playback.
 const loading=Number(arg('load-ms','400')),pollMs=150,frameMs=1000/60;
 const advance=ms=>{now+=ms;};
 while(now<duration*1000&&guard++<10000){
  Object.assign(view,{screen:m.screen,watching:m.showBattle,canSkip:m.canSkip,now:Math.floor(now),cardId:m.cardId});
  if(m.showBattle){
   if(!live){live={at:now/1000,readyAt:null,seed:m.battle.seed,runId:m.state.run?.id,tutorial:!!m.tutorialBattle,boss:m.state.run?.nodes.find(n=>n.id===m.state.run.current)?.kind==='boss',kind:m.state.run?.nodes.find(n=>n.id===m.state.run.current)?.kind,chapter:m.battle.chapter,node:m.state.run?.current,initial:structuredClone(m.battle.initial),skipped:false,plans:[]};advance(loading);m.sceneReady=true;live.readyAt=now/1000;}
   if(m.canSkip&&fraction(seed,`skip:${m.state.run?.id}:${m.state.run?.current}`)<.2){m.skip();live.skipped=true;report.actions.push({at:now/1000,type:'skip'});actionIndex++;}
   while(m.showBattle&&now<duration*1000){
    if(m.canAct){advance(80/m.state.settings.speed);m.step();if(m.plan)live.plans.push({skill:m.plan.presentationId??m.plan.skillId,duration:m.plan.duration,at:now/1000});}
    if(m.plan){const ms=Math.min(duration*1000-now,Math.ceil(m.plan.duration/frameMs)*frameMs/m.state.settings.speed);advance(ms);m.tick(ms,now);if(m.plan?.skillId==='round-status')live.plans.push({skill:m.plan.skillId,duration:m.plan.duration,at:now/1000});}
    else m.tick(frameMs,now);
   }
   if(!m.showBattle){const b=m.battle;report.encounters.push({...live,endedAt:now/1000,playbackSeconds:now/1000-live.readyAt,result:b.result,rounds:b.round,hpRemaining:b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+a.hp,0)/Math.max(1,b.actors.filter(a=>a.side==='party').reduce((n,a)=>n+a.maxHp,0)),choices:structuredClone(b.choices)});live=null;advance(pollMs);}
   continue;
  }
  const a=chooseAction(R,m.state,view,memory);
  if(!a)throw Error(`No simulation action ${m.screen} ${m.state.run?.current}`);
  const delay=decisionDelay(seed,actionIndex++,a);advance(delay);
  if(now>=duration*1000)break;
  view.now=Math.floor(now);const before=m.state;
  executeModelAction(R,m,view,a);remember(memory,a,before);
  report.actions.push({at:now/1000,delayMs:delay,...a});
  report.curve.push({at:now/1000,currencies:{...m.state.account.currencies},xp:m.state.account.accountXp,level:m.state.account.accountLevel,nextRunId:m.state.nextRunId,gear:m.state.gear.length,team:[...m.state.team],cards:m.state.account.cards.map(c=>({id:c.cardId,level:c.level,stars:c.stars}))});
  if(a.type==='welcome')advance(5400);
  if(['open-team','open-cats','open-events','open-recruit','patrol'].includes(a.type))advance(100);
  advance(pollMs);
 }
 if(guard>=10000)throw Error('Simulation guard exceeded');
 report.summary=summarize(report.encounters,duration);report.live=live;report.final=m.state;
 return report;
}
const reports=[];
for(let seed=first;seed<first+count;seed++){
 const r=simulate(seed);reports.push(r);
 await writeFile(resolve(out,`${seed}.json`),JSON.stringify(r));
 console.log(JSON.stringify({seed,...r.summary}));
}
await writeFile(resolve(out,'summary.json'),JSON.stringify({method:'Shared policy, public DepthModel; actual action and round-status timelines, 80 ms action waits, 60 Hz rounding, explicit 400 ms scene-ready estimate. No clock costs for CPU execution.',seeds:[first,first+count-1],count,seconds:duration,reports:reports.map(r=>({seed:r.seed,summary:r.summary})),aggregate:summarize(reports.flatMap(r=>r.encounters),duration)},null,2));
