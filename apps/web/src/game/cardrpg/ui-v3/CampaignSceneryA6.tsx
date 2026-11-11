import {useId, type CSSProperties} from 'react';
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
const symbols: Record<R.NodeKind,string> = {battle:'⚔',elite:'✦',event:'✉',treasure:'◇',shop:'☕',campfire:'♨',boss:'♛'};
const position=(node:R.RunNode):[number,number]=>stops[node.id]??[95+node.depth*160,235+node.lane*90];

/** Original vector scenery; no external art or copied map layout. */
function NightStreet(){
 const id=useId().replaceAll(':','');
 const ref=(name:string)=>`url(#${id}-${name})`;
 const buildings: Array<[number,number,number,number]>=[[15,65,145,145],[160,38,125,150],[317,56,145,100],[486,45,155,110],[684,25,135,120],[950,40,165,120],[1115,90,120,135]];
 return <svg className="a6-street-art" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">
  <defs>
   <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#28344e"/><stop offset=".6" stopColor="#65617b"/><stop offset="1" stopColor="#ad8d83"/></linearGradient>
   <linearGradient id={`${id}-wall`} x2="0" y2="1"><stop stopColor="#aa7860"/><stop offset="1" stopColor="#534657"/></linearGradient>
   <linearGradient id={`${id}-road`} x2="0" y2="1"><stop stopColor="#78666e"/><stop offset="1" stopColor="#3f3e51"/></linearGradient>
   <radialGradient id={`${id}-glow`}><stop stopColor="#ffc871" stopOpacity=".8"/><stop offset="1" stopColor="#ffc871" stopOpacity="0"/></radialGradient>
   <pattern id={`${id}-roof`} width="22" height="12" patternUnits="userSpaceOnUse"><path d="M0 0h22v12H0z" fill="#514454"/><path d="M0 11h22M11 0v11" stroke="#9a6b69" strokeWidth="1"/></pattern>
   <pattern id={`${id}-paving`} width="40" height="22" patternUnits="userSpaceOnUse"><path d="M0 0h40v22H0z" fill="none"/><path d="M0 21h40M20 0v21" stroke="#b6a28e" strokeWidth=".7" opacity=".15"/></pattern>
  </defs>
  <path d="M0 0h1200v500H0z" fill={ref('sky')}/>
  <circle cx="805" cy="50" r="31" fill="#fbe3ae" opacity=".8"/><circle cx="816" cy="42" r="28" fill="#353e57"/>
  {Array.from({length:24},(_,i)=><circle key={i} cx={25+i*49} cy={14+(i*37)%100} r={i%3===0?1.4:.8} fill="#fce3bc" opacity=".55"/>)}
  <path d="M0 180V92l42-26 31 25 39-49 66 40 48-19 45 58 74-58 45 43 33-78 48 49 38-24 60 54 49-34 48 31 47-59 44 40 67-64 42 45 53-16 53 63 35-24 55 45 41-29 42 29 52-14v54Z" fill="#30394e" opacity=".7"/>
  {buildings.map(([x,y,w,h],i)=><g key={i} opacity=".9">
   <path d={`M${x} ${y+60}h${w}v${h}h-${w}z`} fill={ref('wall')} stroke="#332c40" strokeWidth="3"/>
   <path d={`M${x-12} ${y+65}l${w/2+12} -40 ${w/2+12} 40Z`} fill={ref('roof')} stroke="#ab7e76" strokeWidth="3"/>
   <path d={`M${x+w-35} ${y+30}v-26h18v36`} fill="#725060" stroke="#332c40" strokeWidth="3"/>
   {[0,1,2].map(j=><g key={j}><rect x={x+16+j*(w-36)/3} y={y+81} width="22" height="32" rx="11" fill="#edbd79" opacity={j===i%3?.85:.3}/><path d={`M${x+27+j*(w-36)/3} ${y+81}v32m-11-16h22`} stroke="#65434c" strokeWidth="3"/></g>)}
   <path d={`M${x+8} ${y+130}h${w-16}m-${w-16} 18h${w-16}`} stroke="#d69e7d" opacity=".3"/>
  </g>)}
  <path d="M0 250Q140 220 260 260T480 235 700 250 920 225 1200 235V500H0Z" fill={ref('road')}/>
  <path d="M0 250Q140 220 260 260T480 235 700 250 920 225 1200 235V500H0Z" fill={ref('paving')}/>
  <path d="M-30 470Q170 390 355 465T720 450 1000 465 1250 435" fill="none" stroke="#1f3447" strokeWidth="53"/>
  <path d="M-30 455Q170 375 355 450T720 435 1000 450 1250 420" fill="none" stroke="#b58c73" strokeWidth="8"/>
  <path d="M35 471l60-12m40-5 45 3m252 35 54-3m80-21 65-11m350 33 65-7" fill="none" stroke="#bfb0b4" opacity=".25" strokeWidth="3"/>
  <g transform="translate(45 340)"><path d="M0 0h95v85H0z" fill="#795240" stroke="#d5aa78" strokeWidth="3"/><path d="M-12 4 45-30 108 4Z" fill={ref('roof')} stroke="#d5aa78" strokeWidth="3"/><path d="M15 30h28v35H15zm42-10h24v65H57z" fill="#dca460"/><path d="M29 30v35m-14-18h28" stroke="#634332" strokeWidth="4"/><text x="46" y="18" textAnchor="middle" fill="#ffe5a8" fontSize="9" letterSpacing="2">THE LANTERN</text></g>
  <g transform="translate(520 342)"><path d="M0 0h116v55H0z" fill="#8c5a44" stroke="#d6ae7e" strokeWidth="3"/><path d="M-8 0 8-20h98l18 20Z" fill="#b3755d"/><path d="M10-20v20m21-20v20m21-20v20m21-20v20m21-20v20" stroke="#e9c69b" strokeWidth="9"/><circle cx="20" cy="62" r="13" fill="#3a2c35" stroke="#c09b69" strokeWidth="4"/><circle cx="96" cy="62" r="13" fill="#3a2c35" stroke="#c09b69" strokeWidth="4"/><path d="M35 19h46m-32-6v22m18-22v22" stroke="#dcae73" strokeWidth="4"/></g>
  {[190,380,675,835,1010,1170].map((x,i)=><g key={x} transform={`translate(${x} ${i%2?340:230})`}><ellipse cy="45" rx="50" ry="64" fill={ref('glow')} opacity=".55"/><path d="M0 80V0q0-16 18-16h13" stroke="#342b3d" strokeWidth="5" fill="none"/><rect x="20" y="-15" width="20" height="32" rx="7" fill="#f8c775" stroke="#ad6c50" strokeWidth="3"/><path d="M23-4h14m-14 9h14" stroke="#d59058" strokeWidth="2"/></g>)}
  <path d="M120 20Q410 160 700 30M700 30q235 155 500 45" fill="none" stroke="#332b43" strokeWidth="2"/>
  {[195,310,435,565,860,975,1105].map((x,i)=><g key={x}><circle cx={x} cy={i<4?55+i%2*19:80+i%2*18} r="35" fill={ref('glow')} opacity=".6"/><rect x={x-6} y={(i<4?55+i%2*19:80+i%2*18)-9} width="12" height="18" rx="4" fill="#ffd18a"/></g>)}
  <path d="M0 0h1200v500H0z" fill="none" stroke="#201e32" strokeWidth="14"/>
 </svg>;
}

export function CampaignSceneryA6({m}:{m:DepthModel}){
 const run=m.state.run,nodes=run?.nodes??R.generateMap(1,1),available=run?R.availableNodes(run).map(n=>n.id):[],stars=R.starCountV4(m.state);
 return <section className="a6-scenic" aria-label="Branching chapter route" data-reduced={m.state.settings.reducedMotion}>
  <NightStreet/>
  <div className="a6-map-caption"><span>✦</span> {run?`Chapter ${run.chapter} · ${R.CHAPTERS[run.chapter-1]!.name}`:'A little adventure after closing'}<small>{run?'Follow the glowing lanterns':'Choose a chapter above to begin'}</small></div>
  <svg className="a6-route-lines" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">{nodes.flatMap(node=>node.next.map(next=>{
   const target=nodes.find(n=>n.id===next);if(!target)return null;
   const [x,y]=position(node),[tx,ty]=position(target),d=`M${x} ${y}C${(x+tx)/2} ${y},${(x+tx)/2} ${ty},${tx} ${ty}`;
   const walked=run?.visited.includes(node.id)&&run.visited.includes(next);
   return <g key={`${node.id}-${next}`} data-walked={walked}><path d={d} className="a6-path-edge"/><path d={d} className="a6-path-stone"/><path d={d} className="a6-path-thread"/></g>;
  }))}</svg>
  {nodes.map(node=>{
   const [x,y]=position(node),visited=run?.visited.includes(node.id),current=run?.current===node.id,open=available.includes(node.id),art=node.enemies[0];
   const recommended=run&&node.enemies.length?R.createBattle({seed:run.seed,chapter:run.chapter,cats:[],enemies:node.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:run.challengeLevel,enemyStats:R.campaignEnemyStatsA6(run,node),mutator:run.mutator}).actors.reduce((n,a)=>n+R.powerScoreA6(a),0):undefined;
   return <button key={node.id} className="dp-node a6-scenic-stop" data-kind={node.kind} data-visited={visited} data-current={current} data-open={open} style={{'--stop-x':`${x/12}%`,'--stop-y':`${y/5}%`} as CSSProperties} aria-current={current?'step':undefined} disabled={!open} onClick={()=>m.enter(node.id)} title={node.enemies.map(id=>R.ENEMY_BY_ID[id]!.name).join(' · ')||labels[node.kind]}>
    <span className="a6-stop-medallion">{art?<img {...artPropsA6(art)} alt=""/>:<span aria-hidden="true">{symbols[node.kind]}</span>}</span>
    <b>{labels[node.kind]}</b><small>{open?'Go here':current?'You are here':visited?'Cleared':`Stop ${node.depth+1}`}</small>
    {run&&<NodeStarsV4 m={m} node={node}/>}
    {recommended!==undefined&&<span className="a6-stop-power">Rec. {recommended.toLocaleString('en-US')}</span>}
   </button>;
  })}
  <div className="a6-map-milestones" aria-label="Star chests">{R.STAR_REWARDS_V4.map((chest,i)=>{
   const p=R.starRewardPreviewV4(m.state,chest.id),reduced=!p.claimed&&giftReducedA6(p.requested,p.reward);
   const amounts=(cost:typeof p.reward)=>Object.entries(cost).map(([id,n])=>`${n} ${id}`).join(' · ');
   return <button key={chest.id} className="a6-map-chest" data-ready={!p.reason} data-claimed={p.claimed} data-reduced={reduced} style={{left:`${[35,57,90][i]}%`,top:`${i===0?16:85}%`}} disabled={!!p.reason} title={p.reason??(reduced?REDUCED_GIFT_NOTE_A6:chest.name)} onClick={()=>m.apply(R.claimStarRewardV4(m.state,chest.id),'Star chest collected.')}>
    <Icon name="chest"/><span><b>{p.claimed?'Collected':`${chest.target} stars`}</b>{p.claimed?<small>Thank you!</small>:<><small>{Math.min(stars,chest.target)}/{chest.target} · Full gift: {amounts(p.requested)}</small>{reduced&&<small>Today: {amounts(p.reward)}</small>}{!p.reason&&reduced&&<small>Uses the whole gift.</small>}</>}</span>
   </button>;
  })}</div>
 </section>;
}
