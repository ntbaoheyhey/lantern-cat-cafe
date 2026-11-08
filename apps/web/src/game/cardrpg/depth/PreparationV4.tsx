import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { portraitProps } from './assets';
import type { DepthModel } from './model';

export function CrewPanel({ ids }: { ids: string[] }) {
  const crews = R.crewThresholds(ids);
  return <section className="cr-panel dp-v4-crews" aria-label="Crew bonuses"><h2>Better together</h2>
    <div className="dp-v4-grid">{crews.filter(crew => crew.marks > 0).map(crew => <article key={crew.id} data-active={!!crew.threshold}>
      <h3>{crew.name}</h3><b>{crew.marks}/4 marks · {crew.contributors.length} cats</b>
      <p>{crew.description}</p><small>{crew.contributors.map(id => R.CAT_BY_ID[id]!.name).join(' · ')}</small>
    </article>)}</div>
    <details><summary>How crew jobs work</summary><p>A primary job adds two marks; a second job adds one.</p>
      <p>Each bonus needs two cats. Four marks replace the smaller bonus.</p></details>
  </section>;
}

export function PreparationV4({ m }: { m: DepthModel }) {
  const battle = m.battle!, plan = battle.v4!.plan;
  const locked = battle.v4!.committed || !!m.replay;
  const rosterLocked = locked || !!m.state.run && (m.state.run.visited.length > 0 || m.state.run.floor > 1);
  const cats = battle.initial.cats;
  const ids = cats.map(cat => cat.id);
  const rows = Object.fromEntries(cats.map(cat => [cat.id, cat.row]));
  const [picked, setPicked] = useState(ids[0]!);
  const selected = ids.includes(picked) ? picked : ids[0]!;
  const name = R.CAT_BY_ID[selected]!.name;
  const place = (row: R.Row) => m.prepareCrew(ids, { ...rows, [selected]: row }, plan);
  const canPlace = (row: R.Row) => !locked && rows[selected] !== row && (row === 'front' || ids.some(id => id !== selected && rows[id] === 'front'));
  const chooseCompanion = (chosen: string) => {
    m.prepareCrew(ids.map(id => id === selected ? chosen : id),
      { ...m.state.rows, ...rows, [chosen]: rows[selected]! }, plan);
    setPicked(chosen);
  };
  return <>
    <section className="cr-panel dp-v4-prepare"><h2>Choose a cat. Choose its place.</h2>
      <div className="dp-v4-placement" role="group" aria-label="Opening formation">
        {(['front', 'rear'] as const).map(row => <section key={row} className="dp-v4-row" aria-label={`${row === 'front' ? 'Front' : 'Back'} row`}>
          <div className="dp-v4-row-heading"><h3>{row === 'front' ? 'Front · protect the crew' : 'Back · room to work'}</h3>
            <button disabled={!canPlace(row)} onClick={() => place(row)} aria-label={`Place ${name} in ${row === 'front' ? 'Front' : 'Back'}`}>
              {row === 'front' ? 'Place in Front' : 'Place in Back'}</button></div>
          <div className="dp-v4-row-cats">{cats.filter(cat => rows[cat.id] === row).map(cat => <button key={cat.id}
            className="dp-v4-placement-card" aria-label={`Select ${R.CAT_BY_ID[cat.id]!.name} for placement`}
            disabled={locked} aria-pressed={selected === cat.id} onClick={() => setPicked(cat.id)}>
            <img {...portraitProps(cat.id)} alt="" /><strong>{R.CAT_BY_ID[cat.id]!.name}</strong>
            <small>{battle.actors.find(actor => actor.id === cat.id)!.hp}/{cat.stats.hp} HP</small>
          </button>)}{!cats.some(cat => rows[cat.id] === row) && <span className="dp-v4-empty-row">A place for your next move.</span>}</div>
        </section>)}
      </div>
      <p aria-live="polite">{name} selected. Keep at least one cat in front.</p>
      <details><summary>Cover and crew changes</summary>
        <p>Front cats take ordinary single hits. Back cats receive 10% cover while a front cat lives.</p>
        <p>Row attacks and attacks that reach the back ignore cover.</p>
        {rosterLocked ? <p>Your route crew is set. You can still change rows and plans.</p> : <>
          <p>Swap {name} with a companion from your collection.</p>
          <div className="cr-actions" role="group" aria-label={`Replace ${name}`}>{m.state.account.cards.filter(card => !ids.includes(card.cardId)).map(card =>
            <button key={card.cardId} disabled={locked} onClick={() => chooseCompanion(card.cardId)}>{R.CAT_BY_ID[card.cardId]!.name}</button>)}</div>
          {m.state.account.cards.length === ids.length && <p>Meet more companions through invitations.</p>}
        </>}
      </details>
      <div className="dp-v4-plans"><fieldset disabled={locked}><legend>Who needs pressure?</legend>
        {([['finish', 'Finish weak foes'], ['support', 'Stop their support'], ['leader', 'Focus the boss']] as const).map(([focus, text]) =>
          <button key={focus} aria-pressed={plan.focus === focus} onClick={() => m.prepareCrew(ids, rows, { ...plan, focus })}>{text}</button>)}
      </fieldset><fieldset disabled={locked}><legend>When should we help?</legend>
        <button aria-pressed={plan.care === 'steady'} onClick={() => m.prepareCrew(ids, rows, { ...plan, care: 'steady' })}>Steady · below 45% HP</button>
        <button aria-pressed={plan.care === 'protect'} onClick={() => m.prepareCrew(ids, rows, { ...plan, care: 'protect' })}>Protect · below 65% HP</button>
      </fieldset></div><p>Protect favours earlier healing. It can leave less time to attack.</p>
    </section><CrewPanel ids={ids} />
  </>;
}

export function OutcomeV4({ battle }: { battle: R.Battle }) {
  const outcome = R.outcomeV4(battle);
  return <section className="cr-panel dp-v4-outcome"><h2>Your crew’s turning points</h2>
    <ul>{outcome.causes.map(cause => <li key={cause.id}>{cause.text}</li>)}</ul>
    <p>Back row took {outcome.rearShare}% of the damage.</p>
    {outcome.firstFallen && <p>{outcome.firstFallen.name} fell first, in round {outcome.firstFallen.round}.</p>}
    <details><summary>Round-by-round notes</summary><p>Plan: {battle.v4!.plan.focus} / {battle.v4!.plan.care}.</p>
      <ol>{battle.v4!.events.map(event => <li key={event.sequence}>Round {event.round} · {event.text}</li>)}</ol>
    </details>
  </section>;
}
