import { showReviewTools } from "./player-mode";
import { useEffect, useState, type ReactNode } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import { portraitProps } from './assets';
import type { DepthModel } from './model';
import { summarizeBattle } from './battle-summary';
import { CompanionCard } from './CompanionCard';
import { PreparationV4, OutcomeV4 } from './PreparationV4';
import { ForecastV4 } from './ForecastV4';
import { AdviceV4 } from './AdviceV4';
import { ScoutingV4 } from './ScoutingV4';

function CrewDetails({ v4, children }: { v4: boolean; children: ReactNode }) {
  return v4 ? <details className="cr-panel dp-v4-crew-details"><summary>Equipped gear and skills</summary>{children}</details> : <>{children}</>;
}

export function Prepare({ m }: { m: DepthModel }) {
  const battle = m.battle!;
  const [prediction, setPrediction] = useState<{ wins: number; remaining: number } | null>(null);
  useEffect(() => {
    if (battle.v4) return;
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
    <div className="cr-actions"><button className="cr-primary dp-fight" onClick={() => m.fight()}>Fight</button><button onClick={() => m.leave()}>Return to cafe</button><span>{battle.v4 ? 'Pick your plan. Your cats take it from here.' : 'Your companions choose their actions. Watch, then improve your team.'}</span></div>
    {battle.v4 ? <ForecastV4 setup={battle.initial} /> : <>
    <section className="cr-panel dp-matchup"><div><small>TEAM POWER</small><strong>{power('party')}</strong></div><div><b>{difficulty}</b><small>{battle.v4 ? (prediction ? 'Rough forecast · your current crew' : 'Reading the matchup…') : prediction ? `${prediction.wins}/5 simulated wins` : 'Trying five seeded fights for this team'}</small></div><div><small>ENEMY POWER</small><strong>{power('enemy')}</strong></div></section>
    <details className="dp-estimate-note"><summary>How difficulty is estimated</summary><p>Power combines current HP ÷ 5, attack × 2 and defense × 1.5. Difficulty uses five alternate-seed simulations with your current gear and health. This small sample is a rough build hint, not a promised win rate.</p></details>
    </>}
    <ScoutingV4 run={m.state.run} />
    {battle.v4&&<section className="cr-panel dp-v4-pacing"><h2>Challenge band {battle.initial.challengeLevel??'legacy'}</h2><p>Each band has fixed enemies. Choose a lower completed band for a gentler route.</p>{battle.initial.enemies.some(id=>R.ENEMY_BY_ID[id]?.tier==='boss')&&<p>At half health, the boss changes tactics. Defeat the boss and its helpers leave.</p>}</section>}
    {battle.v4 && <PreparationV4 m={m} />}
    <CrewDetails v4={!!battle.v4}>
    <div className="dp-three">{battle.actors.filter(actor => actor.side === 'party').map(actor => <section className="cr-panel" key={actor.id}>
      <div className="dp-cat-heading"><img {...portraitProps(actor.catalogId)} alt="" /><div><h2>{actor.name}</h2><small>{actor.row} row · {actor.hp}/{actor.maxHp} HP</small></div></div>
      <h3>Equipped</h3><ul className="dp-equipped-list">{(['weapon', 'outfit', 'charm', 'relic'] as const).map(slot => {
        const template = actor.equipment.map(id => R.GEAR_BY_ID[id]!).find(item => item.slot === slot);
        return <li key={slot}><small>{slot}</small><span>{template ? `${template.name} · ${template.rarity}` : 'Empty slot'}</span></li>;
      })}</ul><p>{actor.skills.map(id => R.SKILLS[id]!.name).join(' · ')}</p>
    </section>)}</div></CrewDetails>
    <section className="cr-panel dp-opponents"><h2>At the other end of the table</h2><div>{battle.actors.filter(actor => actor.side === 'enemy').map(actor => <span key={actor.id}><img {...portraitProps(actor.catalogId)} alt="" /><b>{actor.name}</b><small>{actor.hp} HP · {actor.row} row</small></span>)}</div></section>
    {battle.v4 && <section className="cr-panel"><h2>Read their plan</h2><div className="dp-v4-grid">{battle.actors.filter(a => a.side === 'enemy').map(actor => {
      const guide = R.enemyGuideV4(actor.catalogId);
      return <article key={actor.id}><h3>{actor.name} · {actor.role}</h3><p>{guide.intent}</p><small>{guide.exception}</small><p><b>Try:</b> {guide.counter}</p></article>;
    })}</div></section>}
  </>;
}

export function BattleResult({ m }: { m: DepthModel }) {
  const battle = m.battle!;
  const summary = summarizeBattle(battle);
  const name = (id: string) => battle.actors.find(actor => actor.id === id)?.name ?? id;
  const maxima = { damage: Math.max(1, ...summary.cats.map(cat => cat.damage)), healing: Math.max(1, ...summary.cats.map(cat => cat.healing)), taken: Math.max(1, ...summary.cats.map(cat => cat.taken)) };
  const labels = { damage: 'Damage', healing: 'Healing', taken: 'Damage taken' };
  return <><PageTitle eyebrow={`${m.replay ? 'Replay' : 'Encounter'} · ${battle.round} rounds${showReviewTools(!!battle.v4) ? ` · seed ${battle.seed}` : ''}`} title={battle.result === 'party' ? 'Victory' : battle.result === 'enemy' ? 'Defeat' : 'Recorded segment complete'} />
    <div className="cr-actions"><button className="cr-primary" onClick={() => m.finish()}>{m.replay ? 'Close replay' : m.tutorialBattle ? 'Complete lesson' : 'Continue to rewards'}</button>{!m.replay && <><button onClick={() => m.replayLast()}>Watch replay</button><button onClick={() => m.improveTeam()}>Improve team</button></>}</div>
    {battle.v4 && <OutcomeV4 battle={battle} />}
    {battle.v4 && battle.result === 'enemy' && !m.replay && !m.tutorialBattle && <AdviceV4 m={m} />}
    <section className={`cr-panel dp-result-banner ${battle.result === 'party' ? 'victory' : ''}`}><CompanionCard id={summary.mvp!.catalogId} m={m} /><div><small>MOST VALUABLE COMPANION</small><h2>{summary.mvp!.name}</h2><p>{summary.mvp!.damage} damage · {summary.mvp!.healing} healing · {summary.mvp!.shielding} shields</p><small>Contribution = damage + healing + ¼ shields.</small></div></section>
    <div className="dp-three">{summary.cats.map(cat => <section className="cr-panel dp-cat-result" key={cat.id}><h2>{cat.name}</h2>{(['damage', 'healing', 'taken'] as const).map(metric => <label key={metric}><span>{labels[metric]} <b>{cat[metric]}</b></span><progress aria-label={`${cat.name} ${labels[metric]}`} value={cat[metric]} max={maxima[metric]} /></label>)}</section>)}</div>
    <section className="cr-panel"><h2>Key moments</h2>{summary.firstUltimate && <p>First ultimate · round {summary.firstUltimate.round} · {name(summary.firstUltimate.actorId)} used {R.SKILLS[summary.firstUltimate.skillId]!.name}</p>}
      {summary.biggestHit && <p>Biggest hit · round {summary.biggestHit.round} · {name(summary.biggestHit.actorId)} dealt {summary.biggestHit.amount} to {name(summary.biggestHit.targetId)}</p>}
      {summary.saves.map((event, index) => <p key={index}>Saved · round {event.round} · {name(event.targetId)} {event.kind === 'revive' ? 'returned to the fight' : 'survived with Second sprout'}</p>)}
    </section>
    {!m.replay && m.state.run && !m.state.run.complete && <p>Improve team ends this route and keeps your earned rewards, then opens team building.</p>}
  </>;
}
