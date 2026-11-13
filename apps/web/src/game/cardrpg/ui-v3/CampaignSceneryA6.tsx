import {GameIcon} from '../../../ui/GameIcon';
import {type CSSProperties} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {NodeStarsV4} from '../depth/JourneyV4';
import {artPropsA6} from './art-a6';
import {Icon} from './Icon';
import {giftReducedA6,REDUCED_GIFT_NOTE_A6} from './GiftAmountsA6';
import './campaign-a6.css';

// Presentation coordinates only. Connections and availability come from the run graph.
const stops: Record<string,[number,number]> = {'0-0':[95,305],'1-0':[255,160],'1-1':[260,355],'2-0':[425,270],'3-0':[580,150],'4-0':[735,285],'5-0':[885,130],'5-1':[900,365],'6-0':[1090,235]};
const labels: Record<R.NodeKind,string> = {battle:'Patrol',elite:'Elite',event:'A little story',treasure:'Hidden gift',shop:'Tea cart',campfire:'Warm kettle',boss:'Chapter guardian'};
const symbols: Record<R.NodeKind,string> = {battle:'fight',elite:'season',event:'invitations',treasure:'bag',shop:'home',campfire:'potion',boss:'boss'};
const position=(node:R.RunNode):[number,number]=>stops[node.id]??[95+node.depth*160,235+node.lane*90];

export function CampaignSceneryA6({m}:{m:DepthModel}){
 const run=m.state.run,nodes=run?.nodes??R.generateMap(1,1),available=run?R.availableNodes(run).map(n=>n.id):[],stars=R.starCountV4(m.state);
 return <section className="a6-scenic" aria-label="Branching chapter route" data-reduced={m.state.settings.reducedMotion}>
  <div className="b2-chapter-landscape" aria-hidden="true"/>
  <div className="a6-map-caption"><span><GameIcon name="season" size={18}/></span> {m.state.formationC2?`Chapter ${run?.chapter??1}`:run?`Chapter ${run.chapter} · ${R.CHAPTERS[run.chapter-1]!.name}`:'A little adventure after closing'}{!m.state.formationC2&&<small>{run?'Follow the glowing lanterns':'Choose a chapter above to begin'}</small>}</div>
  <svg className="a6-route-lines" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">{nodes.flatMap(node=>node.next.map(next=>{
   const target=nodes.find(n=>n.id===next);if(!target)return null;
   const [x,y]=position(node),[tx,ty]=position(target),d=`M${x} ${y}C${(x+tx)/2} ${y},${(x+tx)/2} ${ty},${tx} ${ty}`;
   const walked=run?.visited.includes(node.id)&&run.visited.includes(next);
   return <g key={`${node.id}-${next}`} data-walked={walked}><path d={d} className="a6-path-edge"/><path d={d} className="a6-path-stone"/><path d={d} className="a6-path-thread"/></g>;
  }))}</svg>
  {nodes.map(node=>{
   const [x,y]=position(node),visited=run?.visited.includes(node.id),current=run?.current===node.id,open=available.includes(node.id),art=node.enemies[0];
   const recommended=run&&node.enemies.length?R.createBattle({seed:run.seed,chapter:run.chapter,cats:[],enemies:node.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:run.challengeLevel,enemyStats:R.campaignEnemyStatsA6(run,node),mutator:run.mutator}).actors.reduce((n,a)=>n+R.powerScoreA6(a),0):undefined;
   return <button key={node.id} className="dp-node a6-scenic-stop" data-kind={node.kind} data-visited={visited} data-current={current} data-open={open} style={{'--stop-x':`${x/12}%`,'--stop-y':`${y/5}%`} as CSSProperties} aria-label={`${labels[node.kind]} ${node.depth+1}${open?' · Go here':''}`} aria-current={current?'step':undefined} disabled={!open} onClick={()=>m.enter(node.id)} title={node.enemies.map(id=>R.ENEMY_BY_ID[id]!.name).join(' · ')||labels[node.kind]}>
    <span className="a6-stop-medallion">{art?<img {...artPropsA6(art)} alt=""/>:<span aria-hidden="true"><GameIcon name={symbols[node.kind]} size={24}/></span>}</span>
    <b>{m.state.formationC2?<GameIcon name={symbols[node.kind]} size={20}/>:labels[node.kind]}</b><small>{m.state.formationC2?(visited?'Done':node.depth+1):open?'Go here':current?'You are here':visited?'Cleared':`Stop ${node.depth+1}`}</small>
    {run&&<NodeStarsV4 m={m} node={node}/>}
    {recommended!==undefined&&<span className="a6-stop-power">{m.state.formationC2?'Power':'Rec.'} {recommended.toLocaleString('en-US')}</span>}
   </button>;
  })}
  <div className="a6-map-milestones" aria-label="Star chests">{R.STAR_REWARDS_V4.map((chest,i)=>{
   const p=R.starRewardPreviewV4(m.state,chest.id),reduced=!p.claimed&&giftReducedA6(p.requested,p.reward);
   const amounts=(cost:typeof p.reward)=>Object.entries(cost).map(([id,n])=>`${n} ${id}`).join(' · ');
   return <button key={chest.id} className="a6-map-chest" data-ready={!p.reason} data-claimed={p.claimed} data-reduced={reduced} style={{left:`${[35,57,90][i]}%`,top:`${i===0?16:85}%`}} disabled={!!p.reason} title={p.reason??(reduced?REDUCED_GIFT_NOTE_A6:chest.name)} onClick={()=>m.apply(R.claimStarRewardV4(m.state,chest.id),'Star chest collected.')}>
    <Icon name="chest"/><span><b>{m.state.formationC2?(p.claimed?'Done':`${chest.target}`):p.claimed?'Collected':`${chest.target} stars`}</b>{m.state.formationC2?<small>{Math.min(stars,chest.target)}/{chest.target}{reduced?'  warning':''}</small>:p.claimed?<small>Thank you!</small>:<><small>{Math.min(stars,chest.target)}/{chest.target} · Full gift: {amounts(p.requested)}</small>{reduced&&<small>Today: {amounts(p.reward)}</small>}{!p.reason&&reduced&&<small>Uses the whole gift.</small>}</>}</span>
   </button>;
  })}</div>
 </section>;
}
