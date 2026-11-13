import {GameIcon} from '../../../ui/GameIcon';
import type {ReactNode} from 'react';
import {RouteC2} from '../ui-v3/RouteC2';
import { PowerA6 } from '../ui-v3/PowerA6';
import { NodeStarsV4 } from './JourneyV4';
import { showReviewTools } from "./player-mode";
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import type { DepthModel } from './model';
import { ScoutingV4 } from './ScoutingV4';
import { RouteTonic } from './RouteTonic';
import { RouteCampfire, RouteShop } from './RouteStops';
import { RouteStory, RouteTreasure } from './RouteEvents';
import { RouteRewards } from './RouteRewards';
import { RouteComplete } from './RouteComplete';
const symbols = { battle: 'fight', elite: 'season', campfire: 'potion', shop: 'market', event: 'invitations', treasure: 'bag', boss: 'boss' };
export function RunMap({ m, scenicMap }: { m: DepthModel; scenicMap?: ReactNode }) {
  const run = m.state.run;
  if (!run) return <section className="cr-panel"><h1>Choose an evening route.</h1><button onClick={() => m.go('hub')}>Back to cafe</button></section>;
  const nodePower = (node: R.RunNode) => R.createBattle({seed:run.seed,chapter:run.chapter,cats:[],enemies:node.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:run.challengeLevel,mutator:run.mutator}).actors.reduce((n,a)=>n+R.powerScoreA6(a),0);
  const current = run.nodes.find(n => n.id === run.current);
  const available = R.availableNodes(run).map(n => n.id);
  const heading = <>
    <PageTitle eyebrow={`${run.mode} · floor ${run.floor}${showReviewTools(!!run.gameplayV4) ? ` · seed ${run.seed}` : ""}`} title={R.CHAPTERS[run.chapter - 1]!.name} />
  </>;
  const stats = <>
    <div className="dp-run-stats"><span>{run.points} run points</span><span>{run.supplies} route tonic{run.supplies===1?'':'s'}</span><span>{run.visited.length} stops visited</span>{run.mutator && <span title={R.MUTATORS.find(t => t.id === run.mutator)?.description}>{R.MUTATORS.find(t => t.id === run.mutator)?.name}</span>}<RouteTonic m={m} compact/></div>
  </>;
  const context = <>
    <ScoutingV4 run={run} />
    {run.gameplayV4&&<details className="cr-panel"><summary>Three goals at every stop</summary><p>Earn missing stars on later visits. Your best achievements stay.</p>{run.nodes.map(node=><div key={node.id}><b>{node.kind} · {node.id}</b><NodeStarsV4 m={m} node={node} goals/></div>)}</details>}
  </>;
  const map = scenicMap ?? <>
    <section className="dp-map" aria-label="Branching chapter route">{Array.from({ length: 7 }, (_, depth) => <div className="dp-map-column" key={depth}>{run.nodes.filter(n => n.depth === depth).map(node => <button key={node.id} className={`dp-node ${run.visited.includes(node.id) ? 'visited' : ''} ${node.id === run.current ? 'current' : ''}`} disabled={!available.includes(node.id)} onClick={() => m.enter(node.id)} title={node.enemies.map(id => R.ENEMY_BY_ID[id]!.name).join(' · ') || node.kind}>
      <span><GameIcon name={symbols[node.kind]} size={24}/></span><b>{node.kind}</b><small>{run.visited.includes(node.id) ? 'Visited' : node.id === run.current ? 'Here' : available.includes(node.id) ? 'Choose' : 'Ahead'}</small>{run.gameplayA6&&node.enemies.length>0&&<PowerA6 label="Rec." value={nodePower(node)}/>}<NodeStarsV4 m={m} node={node}/>{run.gameplayV4 && R.nodeClueV4(node) && <small>{R.nodeClueV4(node) === 'opening' ? 'Opening clue' : R.nodeClueV4(node) === 'closing' ? 'Closing clue' : 'Reach clue'}</small>}</button>)}</div>)}</section>
  </>;
  const activity = <>
    {run.complete ? <section className="cr-panel"><RouteComplete m={m}/></section>
      : run.rewardChoices.length ? <section className="cr-panel"><RouteRewards m={m}/></section>
      : current && !current.enemies.length && <section className="cr-panel">
        {current.kind === 'event' && <RouteStory m={m}/>}
        {current.kind === 'shop' && <RouteShop m={m}/>}
        {current.kind === 'campfire' && <RouteCampfire m={m}/>}
        {current.kind === 'treasure' && <RouteTreasure m={m}/>}
      </section>}
  </>;
  const pendingActivity = run.complete || run.rewardChoices.length > 0 || !!(current && !current.enemies.length);
  const scenicStage = scenicMap ? <div className="a6-route-stage" data-activity={pendingActivity || undefined}><div inert={pendingActivity} aria-hidden={pendingActivity || undefined}>{map}</div>{pendingActivity && <div className="a6-route-activity">{activity}</div>}</div> : null;
  const charms = <>
    <section className="cr-panel"><h2>Your charms of the night</h2><div className="dp-combos">{Object.entries(run.boons).map(([id, count]) => <span className="active" title={R.boonForMode(id, !!run.gameplayV4).description} key={id}>{R.BOON_BY_ID[id]!.name} <GameIcon name="close" size={20}/>{count}</span>)}</div><p>{Object.keys(run.boons).length ? 'Charms last through this run. Their effects apply when the next encounter begins.' : 'Choose charms after encounters to build a plan for the boss.'}</p></section>
  </>;
  if(m.state.formationC2)return <RouteC2 m={m} map={map}/>;
  return <>{!scenicMap&&heading}{stats}{R.gameplayV4(m.state) && run.gameplayV4 ? <>{scenicMap?scenicStage:<>{activity}{map}</>}{scenicMap?<details className="a6-route-notes"><summary>Boss clues & route goals</summary>{context}</details>:context}</> : <>{context}{map}{activity}</>}{scenicMap?<details className="a6-route-notes"><summary>Your charms of the night</summary>{charms}</details>:charms}</>;
}
