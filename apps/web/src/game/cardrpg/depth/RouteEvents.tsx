import {useId,useMemo,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from './model';
import './route-stops.css';

type Decision={id:string;label:string;description:string;cost:number;boon?:string;unavailable?:string};
function RouteDecision({m,state,choice,result,cats}:{m:DepthModel;state:R.DepthAccount;choice:Decision;result:R.RuleResult<R.DepthAccount>;cats:ReturnType<typeof R.battleCats>}){
 const description=useId(),run=state.run!,next=result.state.run!,boon=choice.boon?R.boonForMode(choice.boon,!!run.gameplayV4):null;
 const hp=cats.map(cat=>({id:cat.id,before:run.hp[cat.id]??cat.stats.hp,after:next.hp[cat.id]??cat.stats.hp}));
 const changed=hp.some(row=>row.after!==row.before),short=Math.max(0,choice.cost-run.points);
 return <article className="dp-route-decision" aria-label={choice.label}>
  <h3>{choice.label}</h3><p>{choice.description}</p>
  <div id={description} className="dp-route-decision-preview">
   {result.ok?<p><b>Run points: {run.points} → {next.points}</b></p>:<p><b>{short?`Need ${short} more run points (${run.points}/${choice.cost}).`:choice.unavailable??result.error}</b></p>}
   {boon&&<p><b>{boon.name} · Stack {run.boons[boon.id]??0}{result.ok?` → ${next.boons[boon.id]}`:''}/{boon.cap}</b><span>{boon.description}</span></p>}
   {result.ok&&(changed?<ul>{hp.map(row=><li key={row.id}><b>{R.CAT_BY_ID[row.id]!.name}</b><span>{row.before} → {row.after} HP ({row.after>=row.before?'+':''}{row.after-row.before}){row.before===0&&row.after>0?' · Revives':''}</span></li>)}</ul>:<p>Crew HP unchanged.</p>)}
  </div>
  <button aria-describedby={description} disabled={!result.ok} onClick={()=>m.apply(R.resolveNode(m.state,choice.id),'Choice made. Continue along the route.')}>{choice.label}</button>
 </article>;
}

export function RouteStory({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run,event=R.EVENTS.find(e=>e.id===run?.nodes.find(n=>n.id===run.current)?.eventId);
 const quotes=useMemo(()=>event?.choices.map(choice=>({choice,result:R.resolveNode(state,choice.id)}))??[],[state,event]);
 const cats=useMemo(()=>R.battleCats(state),[state]);
 if(!run||!event)return null;
 return <div className="dp-route-story"><h2>{event.name}</h2><p>{event.story}</p><div className="dp-route-decisions">{quotes.map(({choice,result})=><RouteDecision key={choice.id} m={m} state={state} choice={choice} result={result} cats={cats}/>)}</div></div>;
}

export function RouteTreasure({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run;
 const quotes=useMemo(()=>({points:R.resolveNode(state,'points'),charm:R.resolveNode(state,'charm')}),[state]);
 const cats=useMemo(()=>R.battleCats(state),[state]);
 if(!run)return null;
 const id=R.shopStock(run)[0],boon=id?R.boonForMode(id,!!run.gameplayV4):null;
 const choices:Decision[]=[{id:'points',label:'Take 70 run points',description:'Save points for a later tea cart or story choice.',cost:0},{id:'charm',label:boon?`Take ${boon.name}`:'No charm available',description:boon?'This charm lasts for the rest of the route.':'Every charm is fully stacked. Take points to continue.',cost:0,boon:id,unavailable:'All charms are fully stacked.'}];
 return <div className="dp-route-treasure"><h2>Something tucked behind the cups</h2><p>Choose one gift for this route.</p><div className="dp-route-decisions">{choices.map(choice=><RouteDecision key={choice.id} m={m} state={state} choice={choice} result={quotes[choice.id as keyof typeof quotes]} cats={cats}/>)}</div></div>;
}
