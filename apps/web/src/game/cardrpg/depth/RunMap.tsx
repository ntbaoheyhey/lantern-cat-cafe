import type {ReactNode} from 'react';
import { PowerA6 } from '../ui-v3/PowerA6';
import { NodeStarsV4 } from './JourneyV4';
import { showReviewTools } from "./player-mode";
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import type { DepthModel } from './model';
import { ScoutingV4 } from './ScoutingV4';
import { dailySuppliesFullV4 } from './star-plans-v4';
const symbols = { battle: '⚔', elite: '✦', campfire: '♨', shop: '▧', event: '✉', treasure: '◇', boss: '♛' };
export function RunMap({ m, scenicMap }: { m: DepthModel; scenicMap?: ReactNode }) {
  const run = m.state.run;
  if (!run) return <section className="cr-panel"><h1>Choose an evening route.</h1><button onClick={() => m.go('hub')}>Back to cafe</button></section>;
  const nodePower = (node: R.RunNode) => R.createBattle({seed:run.seed,chapter:run.chapter,cats:[],enemies:node.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,challengeLevel:run.challengeLevel,mutator:run.mutator}).actors.reduce((n,a)=>n+R.powerScoreA6(a),0);
  const current = run.nodes.find(n => n.id === run.current);
  const available = R.availableNodes(run).map(n => n.id);
  const event = R.EVENTS.find(e => e.id === current?.eventId);
  const rewardName = (id: string) => id.startsWith('skill:') ? R.SKILLS[id.slice(6)]!.name : R.BOON_BY_ID[id]!.name;
  const heading = <>
    <PageTitle eyebrow={`${run.mode} · floor ${run.floor}${showReviewTools(!!run.gameplayV4) ? ` · seed ${run.seed}` : ""}`} title={R.CHAPTERS[run.chapter - 1]!.name} />
  </>;
  const stats = <>
    <div className="dp-run-stats"><span>{run.points} run points</span><span>{run.supplies} milk tonics</span><span>{run.visited.length} stops visited</span>{run.mutator && <span title={R.MUTATORS.find(t => t.id === run.mutator)?.description}>{R.MUTATORS.find(t => t.id === run.mutator)?.name}</span>}<button disabled={!!run.battle || run.complete || !run.supplies} onClick={() => m.apply(R.useTonic(m.state), 'Every cat recovered up to 100 HP.')}>Use tonic</button></div>
  </>;
  const context = <>
    <ScoutingV4 run={run} />
    {run.gameplayV4&&<details className="cr-panel"><summary>Three goals at every stop</summary><p>Earn missing stars on later visits. Your best achievements stay.</p>{run.nodes.map(node=><div key={node.id}><b>{node.kind} · {node.id}</b><NodeStarsV4 m={m} node={node} goals/></div>)}</details>}
  </>;
  const map = scenicMap ?? <>
    <section className="dp-map" aria-label="Branching chapter route">{Array.from({ length: 7 }, (_, depth) => <div className="dp-map-column" key={depth}>{run.nodes.filter(n => n.depth === depth).map(node => <button key={node.id} className={`dp-node ${run.visited.includes(node.id) ? 'visited' : ''} ${node.id === run.current ? 'current' : ''}`} disabled={!available.includes(node.id)} onClick={() => m.enter(node.id)} title={node.enemies.map(id => R.ENEMY_BY_ID[id]!.name).join(' · ') || node.kind}>
      <span>{symbols[node.kind]}</span><b>{node.kind}</b><small>{run.visited.includes(node.id) ? 'Visited' : node.id === run.current ? 'Here' : available.includes(node.id) ? 'Choose' : 'Ahead'}</small>{run.gameplayA6&&node.enemies.length>0&&<PowerA6 label="Rec." value={nodePower(node)}/>}<NodeStarsV4 m={m} node={node}/>{run.gameplayV4 && R.nodeClueV4(node) && <small>{R.nodeClueV4(node) === 'opening' ? 'Opening clue' : R.nodeClueV4(node) === 'closing' ? 'Closing clue' : 'Reach clue'}</small>}</button>)}</div>)}</section>
  </>;
  const activity = <>
    {run.complete ? <section className="cr-panel"><h2>{run.won ? 'The lantern stays lit.' : 'Every journey leaves a lesson.'}</h2><p>{R.gameplayV4(m.state) ? (dailySuppliesFullV4(m.state) ? 'Today’s supplies are gathered. Your stars and collected equipment are saved.' : 'Your earned supplies, stars and collected equipment are saved.') : run.won ? 'Chapter rewards and equipment are already in your account.' : (run.gameplayV4 ? 'Your rewards are safe. Bring a fresh plan next time.' : 'Your capped partial rewards and earned gear are already in your account.')}</p>{run.earnedItems.map((id, index) => <p key={index}>{R.GEAR_BY_ID[id]?.name??id}</p>)}<div className="cr-actions"><button className="cr-primary" onClick={() => m.go('inventory')}>{R.gameplayV4(m.state)&&!run.earnedItems.length?'Review equipment':'Equip your rewards'}</button><button onClick={() => m.go('hub')}>Return to cafe</button>{run.mode === 'tower' && run.won && <button onClick={() => m.apply(R.nextTowerFloor(m.state), 'Next Tower floor opened.')}>Climb to floor {run.floor + 1}</button>}</div></section>
      : run.rewardChoices.length ? <section className="cr-panel"><h2>Carry one good thing forward.</h2><div className="dp-three">{run.rewardChoices.map(id => <button className="dp-reward" key={id} onClick={() => m.apply(R.chooseReward(m.state, id), 'Choice added for this run. Continue along the map.')}><h3>{rewardName(id)}</h3><p>{id.startsWith('skill:') ? (run.gameplayV4 ? 'Strengthen this skill by 12% tonight. Up to three upgrades.' : 'Increase this skill’s effect power by 12% for this run. Up to three upgrades.') : R.boonForMode(id, !!run.gameplayV4).description}</p><small>{id.startsWith('skill:') ? 'Skill upgrade' : `Night charm · ${R.BOON_BY_ID[id]!.archetype}`}</small></button>)}</div></section>
      : current && !current.enemies.length && <section className="cr-panel">
        {current.kind === 'event' && event && <><h2>{event.name}</h2><p>{event.story}</p><div className="dp-three">{event.choices.map(choice => <button key={choice.id} disabled={run.points < choice.cost} onClick={() => m.apply(R.resolveNode(m.state, choice.id), 'The cafe will remember that choice.')}><h3>{choice.label}</h3><p>{choice.description}</p></button>)}</div></>}
        {current.kind === 'shop' && <><h2>The travelling tea cart</h2><p>Spend earned run points. One purchase before the cart moves on.</p><div className="dp-three">{R.shopStock(run).map(id => <button key={id} disabled={run.points < 45} onClick={() => m.apply(R.resolveNode(m.state, id))}><h3>{R.BOON_BY_ID[id]!.name}</h3><p>{R.boonForMode(id, !!run.gameplayV4).description}</p><small>45 run points</small></button>)}</div><div className="cr-actions"><button disabled={run.points < 45} onClick={() => m.apply(R.resolveNode(m.state, 'tonic'))}>Buy a tonic · 45 points</button><button onClick={() => m.apply(R.resolveNode(m.state, 'leave'))}>Save your points and leave</button></div></>}
        {current.kind === 'campfire' && <><h2>A pause beside the kettle</h2><div className="cr-actions"><button onClick={() => m.apply(R.resolveNode(m.state, 'heal'), 'Team recovered 35% maximum HP.')}>Heal the team · 35% HP</button></div><h3>Or strengthen one skill</h3><div className="cr-actions">{m.state.team.flatMap(id => R.defaultSkills(m.state, id)).map(id => <button key={id} disabled={(run.upgrades[id] ?? 0) >= 3} onClick={() => m.apply(R.resolveNode(m.state, 'upgrade', id))}>{R.SKILLS[id]!.name} · +12%</button>)}</div></>}
        {current.kind === 'treasure' && <><h2>Something tucked behind the cups</h2><div className="cr-actions"><button onClick={() => m.apply(R.resolveNode(m.state, 'points'))}>Take 70 run points</button><button onClick={() => m.apply(R.resolveNode(m.state, 'charm'))}>Take {R.BOON_BY_ID[R.shopStock(run)[0]!]!.name}</button></div></>}
      </section>}
  </>;
  const pendingActivity = run.complete || run.rewardChoices.length > 0 || !!(current && !current.enemies.length);
  const scenicStage = scenicMap ? <div className="a6-route-stage" data-activity={pendingActivity || undefined}><div inert={pendingActivity} aria-hidden={pendingActivity || undefined}>{map}</div>{pendingActivity && <div className="a6-route-activity">{activity}</div>}</div> : null;
  const charms = <>
    <section className="cr-panel"><h2>Your charms of the night</h2><div className="dp-combos">{Object.entries(run.boons).map(([id, count]) => <span className="active" title={R.boonForMode(id, !!run.gameplayV4).description} key={id}>{R.BOON_BY_ID[id]!.name} ×{count}</span>)}</div><p>{Object.keys(run.boons).length ? 'Charms last through this run. Their effects apply when the next encounter begins.' : 'Choose charms after encounters to build a plan for the boss.'}</p></section>
  </>;
  return <>{!scenicMap&&heading}{stats}{R.gameplayV4(m.state) && run.gameplayV4 ? <>{scenicMap?scenicStage:<>{activity}{map}</>}{scenicMap?<details className="a6-route-notes"><summary>Boss clues & route goals</summary>{context}</details>:context}</> : <>{context}{map}{activity}</>}{scenicMap?<details className="a6-route-notes"><summary>Your charms of the night</summary>{charms}</details>:charms}</>;
}
