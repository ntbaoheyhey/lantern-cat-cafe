import { useEffect, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import { portrait } from './assets';
import type { DepthModel } from './model';
import { summarizeBattle } from './battle-summary';
import { CompanionCard } from './CompanionCard';

export function Prepare({ m }: { m: DepthModel }) {
  const battle = m.battle!;
  const [prediction, setPrediction] = useState<{ wins: number; remaining: number } | null>(null);
  useEffect(() => {
    let cancelled = false, count = 0, wins = 0, remaining = 0;
    let timer: ReturnType<typeof setTimeout>;
    setPrediction(null);
    const sample = () => {
      if (cancelled) return;
      const simulated = R.playBattle(R.createBattle({ ...battle.initial, seed: battle.seed + 1001 + count * 7919 }), 'auto');
      if (simulated.result === 'party') wins++;
      const party = simulated.actors.filter(actor => actor.side === 'party');
      remaining += party.reduce((sum, actor) => sum + actor.hp / actor.maxHp, 0) / party.length;
      count++;
      if (count === 5) setPrediction({ wins, remaining: remaining / count });
      else timer = setTimeout(sample, 20);
    };
    timer = setTimeout(sample, 50);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [battle]);
  const power = (side: R.Actor['side']) => Math.round(battle.actors.filter(actor => actor.side === side)
    .reduce((sum, actor) => sum + actor.hp / 5 + actor.attack * 2 + actor.defense * 1.5, 0));
  const difficulty = !prediction ? 'Estimating…' : prediction.wins < 3 ? 'Hard' : prediction.wins === 5 && prediction.remaining > .55 ? 'Easy' : 'Even';
  return <><PageTitle eyebrow={m.tutorialBattle ? 'Practice table' : R.CHAPTERS[battle.chapter - 1]!.name} title="Prepare your team" />
    <div className="cr-actions"><button className="cr-primary dp-fight" onClick={() => m.fight()}>Fight</button><button onClick={() => m.leave()}>Return to cafe</button><span>Your companions choose their actions. Watch, then improve your team.</span></div>
    <section className="cr-panel dp-matchup"><div><small>TEAM POWER</small><strong>{power('party')}</strong></div><div><b>{difficulty}</b><small>{prediction ? `${prediction.wins}/5 simulated wins` : 'Trying five seeded fights for this team'}</small></div><div><small>ENEMY POWER</small><strong>{power('enemy')}</strong></div></section>
    <p className="dp-estimate-note">Power combines current HP ÷ 5, attack × 2 and defense × 1.5. Difficulty uses five alternate-seed simulations with your current gear and health.</p>
    <div className="dp-three">{battle.actors.filter(actor => actor.side === 'party').map(actor => <section className="cr-panel" key={actor.id}>
      <div className="dp-cat-heading"><img src={portrait(actor.catalogId)} alt="" /><div><h2>{actor.name}</h2><small>{actor.row} row · {actor.hp}/{actor.maxHp} HP</small></div></div>
      <h3>Equipped</h3><ul className="dp-equipped-list">{(['weapon', 'outfit', 'charm', 'relic'] as const).map(slot => {
        const template = actor.equipment.map(id => R.GEAR_BY_ID[id]!).find(item => item.slot === slot);
        return <li key={slot}><small>{slot}</small><span>{template ? `${template.name} · ${template.rarity}` : 'Empty slot'}</span></li>;
      })}</ul><p>{actor.skills.map(id => R.SKILLS[id]!.name).join(' · ')}</p>
    </section>)}</div>
    <section className="cr-panel dp-opponents"><h2>At the other end of the table</h2><div>{battle.actors.filter(actor => actor.side === 'enemy').map(actor => <span key={actor.id}><img src={portrait(actor.catalogId)} alt="" /><b>{actor.name}</b><small>{actor.hp} HP · {actor.row} row</small></span>)}</div></section>
  </>;
}

export function BattleResult({ m }: { m: DepthModel }) {
  const battle = m.battle!;
  const summary = summarizeBattle(battle);
  const name = (id: string) => battle.actors.find(actor => actor.id === id)?.name ?? id;
  const maxima = { damage: Math.max(1, ...summary.cats.map(cat => cat.damage)), healing: Math.max(1, ...summary.cats.map(cat => cat.healing)), taken: Math.max(1, ...summary.cats.map(cat => cat.taken)) };
  const labels = { damage: 'Damage', healing: 'Healing', taken: 'Damage taken' };
  return <><PageTitle eyebrow={`${m.replay ? 'Replay' : 'Encounter'} · ${battle.round} rounds · seed ${battle.seed}`} title={battle.result === 'party' ? 'Victory' : battle.result === 'enemy' ? 'Defeat' : 'Recorded segment complete'} />
    <div className="cr-actions"><button className="cr-primary" onClick={() => m.finish()}>{m.replay ? 'Close replay' : m.tutorialBattle ? 'Complete lesson' : 'Continue to rewards'}</button>{!m.replay && <><button onClick={() => m.replayLast()}>Watch replay</button><button onClick={() => m.improveTeam()}>Improve team</button></>}</div>
    <section className={`cr-panel dp-result-banner ${battle.result === 'party' ? 'victory' : ''}`}><CompanionCard id={summary.mvp!.catalogId} m={m} /><div><small>MOST VALUABLE COMPANION</small><h2>{summary.mvp!.name}</h2><p>{summary.mvp!.damage} damage · {summary.mvp!.healing} healing · {summary.mvp!.shielding} shields</p><small>Contribution = damage + healing + one quarter of shields granted.</small></div></section>
    <div className="dp-three">{summary.cats.map(cat => <section className="cr-panel dp-cat-result" key={cat.id}><h2>{cat.name}</h2>{(['damage', 'healing', 'taken'] as const).map(metric => <label key={metric}><span>{labels[metric]} <b>{cat[metric]}</b></span><progress aria-label={`${cat.name} ${labels[metric]}`} value={cat[metric]} max={maxima[metric]} /></label>)}</section>)}</div>
    <section className="cr-panel"><h2>Key moments</h2>{summary.firstUltimate && <p>First ultimate · round {summary.firstUltimate.round} · {name(summary.firstUltimate.actorId)} used {R.SKILLS[summary.firstUltimate.skillId]!.name}</p>}
      {summary.biggestHit && <p>Biggest hit · round {summary.biggestHit.round} · {name(summary.biggestHit.actorId)} dealt {summary.biggestHit.amount} to {name(summary.biggestHit.targetId)}</p>}
      {summary.saves.map((event, index) => <p key={index}>Saved · round {event.round} · {name(event.targetId)} {event.kind === 'revive' ? 'returned to the fight' : 'survived with Second sprout'}</p>)}
    </section>
    {!m.replay && m.state.run && !m.state.run.complete && <p>Improve team ends this route and keeps your earned rewards, then opens team building.</p>}
  </>;
}
