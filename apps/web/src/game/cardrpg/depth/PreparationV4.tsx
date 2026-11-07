import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from './model';

export function CrewPanel({ ids }: { ids: string[] }) {
  return <section className="cr-panel dp-v4-crews" aria-label="Crew bonuses"><h2>Work better together</h2>
    <p>Each primary job adds two marks; the second adds one. A bonus needs two different cats. Four marks replace the smaller bonus.</p>
    <div className="dp-v4-grid">{R.crewThresholds(ids).map(crew => <article key={crew.id} data-active={!!crew.threshold}>
      <h3>{crew.name}</h3><b>{crew.marks}/4 marks · {crew.contributors.length} cats</b>
      <p>{crew.description}</p><small>{crew.contributors.map(id => R.CAT_BY_ID[id]!.name).join(' · ') || 'No contributors yet'}</small>
    </article>)}</div>
  </section>;
}

export function PreparationV4({ m }: { m: DepthModel }) {
  const battle = m.battle!, plan = battle.v4!.plan;
  const locked = battle.v4!.committed || !!m.replay;
  const rosterLocked = locked || !!m.state.run && (m.state.run.visited.length > 0 || m.state.run.floor > 1);
  const ids = battle.initial.cats.map(cat => cat.id);
  const rows = Object.fromEntries(battle.initial.cats.map(cat => [cat.id, cat.row]));
  return <>
    <section className="cr-panel dp-v4-prepare"><h2>Your opening formation</h2>
      <p>The front row receives ordinary single-target pressure. Rear cats have 10% cover while a front cat lives. Row attacks and explicit rear reach bypass cover.</p>
      <div className="dp-three">{ids.map((id, seat) => <div key={seat}>
        <label>Opening seat {seat + 1}<select aria-label={`Opening seat ${seat + 1}`} disabled={rosterLocked} value={id}
          onChange={event => { const chosen = event.target.value; m.prepareCrew(ids.map((old, i) => i === seat ? chosen : old), { ...m.state.rows, ...rows, [chosen]: m.state.rows[chosen] ?? R.CAT_BY_ID[chosen]!.row }, plan); }}>
          {m.state.account.cards.map(card => <option key={card.cardId} value={card.cardId} disabled={card.cardId !== id && ids.includes(card.cardId)}>{R.CAT_BY_ID[card.cardId]!.name}</option>)}
        </select></label>
        <label>{R.CAT_BY_ID[id]!.name} opening row<select aria-label={`${R.CAT_BY_ID[id]!.name} opening row`} disabled={locked} value={rows[id]}
          onChange={event => m.prepareCrew(ids, { ...rows, [id]: event.target.value as R.Row }, plan)}>
          <option value="front">Front</option><option value="rear">Back</option>
        </select></label>
        <small>{R.CAT_CREWS[id]!.map((job, i) => `${R.CREW_JOBS.find(c => c.id === job)!.name} +${i ? 1 : 2}`).join(' · ')}</small>
      </div>)}</div>
      {rosterLocked && !locked && <p>The route roster is fixed. You can still change rows and the standing plan without restoring carried HP.</p>}
      <h3>Standing plan</h3><div className="dp-v4-grid">
        <label>Focus<select aria-label="Focus" disabled={locked} value={plan.focus} onChange={event => m.prepareCrew(ids, rows, { ...plan, focus: event.target.value as R.StandingPlan['focus'] })}>
          <option value="finish">Finish weak reachable foes</option><option value="support">Pressure enemy support</option><option value="leader">Pressure the boss</option>
        </select></label>
        <label>Care<select aria-label="Care" disabled={locked} value={plan.care} onChange={event => m.prepareCrew(ids, rows, { ...plan, care: event.target.value as R.StandingPlan['care'] })}>
          <option value="steady">Steady · rescue below 45% HP</option><option value="protect">Protect · rescue below 65% HP</option>
        </select></label>
      </div><p>These preferences guide automatic choices within reach and cooldown rules. Protect may trade damage for recovery. Fight commits this preparation.</p>
    </section><CrewPanel ids={ids} />
  </>;
}

export function OutcomeV4({ battle }: { battle: R.Battle }) {
  const rearFallen = battle.actors.some(a => a.side === 'party' && a.row === 'rear' && a.hp === 0);
  const suggestion = battle.result === 'party'
    ? 'For the next encounter, compare the visible enemy intent before keeping this formation.'
    : rearFallen ? 'A rear companion fell. Check for row attacks or rear reach; try a cleanser or the Protect plan.'
      : 'Try a sturdier front or the Protect plan, then compare the next result with this one.';
  return <section className="cr-panel dp-v4-outcome"><h2>What your preparation contributed</h2>
    {battle.v4!.events.filter(e=>e.kind==='boss-phase'||e.kind==='boss-finish').map(e=><p key={e.sequence}>{e.text}</p>)}
    <ul>{R.battleReasons(battle).map(reason => <li key={reason}>{reason}</li>)}</ul>
    <p>Standing plan: {battle.v4!.plan.focus} / {battle.v4!.plan.care}. These are observed contributions, not proof that one effect decided the fight.</p>
    <p><b>Next adjustment:</b> {suggestion}</p>
    <details><summary>Preparation event log</summary><ol>{battle.v4!.events.map(event => <li key={event.sequence}>Round {event.round} · {event.text}</li>)}</ol></details>
  </section>;
}
