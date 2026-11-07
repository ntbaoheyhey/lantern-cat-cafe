import { ShiftLoadouts } from './EquipmentV4';
import { useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID, EQUIPMENT_SLOTS, RARITY_ORDER } from '@taskbar-hero/game-rules/cardrpg';
import { PageTitle, Stats, ItemIcon } from '../shared';
import { CompanionCard } from './CompanionCard';
import { CompanionPreview } from './CompanionPreview';
import { bestRoleTeam, COMPANION_ROLES, nextChallenge } from './meta-presentation';
import { skillIcon } from './assets';
import type { DepthModel } from './model';
import { CrewPanel } from './PreparationV4';

export function Team({ m }: { m: DepthModel }) {
  const state = m.state;
  const v4 = R.gameplayV4(state);
  const locked = !!state.run && !state.run.complete;
  const challenge = nextChallenge(state);
  const combos = R.teamCombos(state.team);
  const update = (team = state.team, rows = state.rows) => m.apply(
    R.configureTeam(state, team, rows, state.skills),
    'Team and rows updated. Your companions use their unlocked kits.',
  );
  const move = (id: string, row: R.Row) => {
    if (!locked && state.team.includes(id)) update(state.team, { ...state.rows, [id]: row });
  };
  return <>
    <PageTitle eyebrow="Three companions · automatic battles" title="Build your evening shift." />
    <section className="cr-panel dp-team-heading">
      <div><small>TEAM POWER</small><strong>{challenge.teamPower}</strong></div>
      <p className={challenge.teamPower < challenge.enemyPower ? 'dp-power-warning' : ''}>
        {challenge.chapter.name} · {challenge.exact ? 'next encounter' : 'opening estimate'} {challenge.enemyPower} power
        {challenge.teamPower < challenge.enemyPower && <small>Try stronger equipment or level your companions before this route.</small>}
      </p>
      <button disabled={locked} title="Highest displayed power among guardians, healers and offensive roles. Review the team's synergies before a route."
        onClick={() => {
          const team = bestRoleTeam(state);
          update(team, { ...state.rows, ...Object.fromEntries(team.map(id => [id, R.CAT_BY_ID[id]!.row])) });
        }}>Best team</button>
      <button className="cr-primary" disabled={locked} onClick={() => m.start(challenge.chapter.id)}>Begin {challenge.chapter.name}</button>
    </section>
    {locked && <p>Finish or abandon the current route to change the team.</p>}
    <div className="dp-formation" aria-label="Team formation">
      {(['front', 'rear'] as const).map(row => <section key={row} className={`dp-formation-row dp-formation-${row}`}
        aria-label={`${row} row drop area`} onDragOver={event => { if (!locked) event.preventDefault(); }}
        onDrop={event => { event.preventDefault(); move(event.dataTransfer.getData('text/plain'), row); }}>
        <header><h2>{row === 'front' ? 'Front row' : 'Back row'}</h2><small>{row === 'front' ? 'At least one companion protects the team' : 'Protected by the front row'}</small></header>
        <div className="dp-row-cards">{state.team.filter(id => state.rows[id] === row).map(id => <div key={id}
          className="dp-formation-card" draggable={!locked} onDragStart={event => event.dataTransfer.setData('text/plain', id)}>
          <CompanionCard id={id} m={m} />
          <label>{R.CAT_BY_ID[id]!.name} row<select disabled={locked} value={row} onChange={event => move(id, event.target.value as R.Row)}>
            <option value="front">Front</option><option value="rear">Back</option>
          </select></label>
          <small>{Object.values(R.equipmentEffects(state, id).counts).reduce((sum, count) => sum + count, 0)}/4 pieces equipped</small>
          {R.SETS.filter(set => R.equipmentEffects(state, id).counts[set.id]).map(set => <small className="dp-team-set" key={set.id}
            title={`2 pieces · ${set.two} 4 pieces · ${set.four}`}>
            {set.name} · {R.equipmentEffects(state, id).counts[set.id]}/4
          </small>)}
        </div>)}</div>
      </section>)}
    </div>
    <section className="cr-panel">
      <div className="dp-three">{state.team.map((id, index) => <label key={index}>Seat {index + 1}
        <select disabled={locked} value={id} onChange={event => update(state.team.map((old, seat) => seat === index ? event.target.value : old))}>
          {state.account.cards.map(card => <option key={card.cardId} value={card.cardId}
            disabled={card.cardId !== id && state.team.includes(card.cardId)}>{R.CAT_BY_ID[card.cardId]!.name}</option>)}
        </select>
      </label>)}</div>
      {v4 ? <CrewPanel ids={state.team} /> : <div className="dp-combos">{R.TEAM_COMBOS.map(combo => <span key={combo.id}
        className={combos.some(active => active.id === combo.id) ? 'active' : ''} title={combo.description}>
        {combo.name} · {combos.some(active => active.id === combo.id) ? 'active' : combo.tags.join(' + ')}
      </span>)}</div>}
    </section>
    {v4?<ShiftLoadouts m={m}/>:<section className="cr-panel dp-presets"><h2>Saved shifts</h2><div className="dp-three">
      {m.teamPresets.map((preset, index) => <div key={index}>
        <b>Shift {index + 1}</b><p>{preset ? preset.team.map(id => R.CAT_BY_ID[id]!.name).join(' · ') : 'Ready for a team'}</p>
        <div className="cr-actions"><button disabled={locked} onClick={() => m.saveTeamPreset(index)}>Save shift {index + 1}</button>
          <button disabled={locked || !preset} onClick={() => m.loadTeamPreset(index)}>Use shift {index + 1}</button></div>
      </div>)}
    </div></section>}
    <section className="cr-panel"><h2>Automatic kits</h2><div className="dp-three">{state.team.map(id => <div key={id}>
      <h3>{R.CAT_BY_ID[id]!.name}</h3><p>{v4 ? R.passiveDescriptionV4(id) : R.CAT_BY_ID[id]!.passive.description}</p>
      {R.availableSkills(state, id).map(skill => <div className="dp-skill-summary" key={skill.id}>
        <img src={skillIcon(skill.id)} alt="" /><span><b>{skill.name}</b><small>{v4 ? R.skillDescriptionV4(skill) : skill.description}</small></span>
      </div>)}
      <small>{R.availableSkills(state, id).length === 4 ? 'Ultimate included.' : 'Level 6 or three stars unlocks the ultimate.'}</small>
    </div>)}</div></section>
    <div className="cr-actions">{R.CHAPTERS.filter(chapter => chapter.id !== challenge.chapter.id).map(chapter => <button key={chapter.id}
      disabled={locked || chapter.id > 1 && !state.cleared.includes(chapter.id - 1)} onClick={() => m.start(chapter.id)}>Begin {chapter.name}</button>)}</div>
  </>;
}

export function Collection({ m }: { m: DepthModel }) {
  const detail = useRef<HTMLElement>(null);
  const [role, setRole] = useState('all');
  const [rarity, setRarity] = useState('all');
  const [ownership, setOwnership] = useState('all');
  const [preview, setPreview] = useState('model');
  const cat = R.CAT_BY_ID[m.cardId]!;
  const v4 = R.gameplayV4(m.state);
  const owned = m.state.account.cards.find(card => card.cardId === cat.id);
  const locked = !!m.state.run && !m.state.run.complete;
  const skill = cat.skills.find(candidate => candidate.id === preview);
  const cards = R.CATS.filter(candidate => (role === 'all' || candidate.role === role)
    && (rarity === 'all' || CARD_BY_ID[candidate.id]!.rarity === rarity)
    && (ownership === 'all' || m.state.account.cards.some(card => card.cardId === candidate.id) === (ownership === 'owned')));
  return <>
    <PageTitle eyebrow={`${m.state.account.cards.length} / ${R.CATS.length} companions`} title="Every seat has a story." />
    <div className="cr-filter">
      <label>Role<select value={role} onChange={event => setRole(event.target.value)}>
        <option value="all">All roles</option>{COMPANION_ROLES.map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>Rarity<select value={rarity} onChange={event => setRarity(event.target.value)}>
        <option value="all">All rarities</option>{RARITY_ORDER.map(value => <option key={value}>{value}</option>)}
      </select></label>
      <label>Collection<select value={ownership} onChange={event => setOwnership(event.target.value)}>
        <option value="all">All companions</option><option value="owned">Collected</option><option value="locked">To discover</option>
      </select></label>
    </div>
    <div className="dp-collection-layout">
      <div className="cr-card-grid">{cards.map(card => <CompanionCard key={card.id} id={card.id} m={m}
        selected={card.id === cat.id} onSelect={() => {
          m.cardId = card.id;
          setPreview('model');
          m.notify(false);
          if (window.innerWidth <= 1100) requestAnimationFrame(() => detail.current?.scrollIntoView({
            block: 'start', behavior: m.state.settings.reducedMotion ? 'instant' : 'smooth',
          }));
        }} />)}
        {!cards.length && <p>No companions match these filters.</p>}
      </div>
      <section className="cr-panel dp-detail" ref={detail}>
        <header><small>{CARD_BY_ID[cat.id]!.rarity} · {cat.role} · {v4 ? R.CAT_CREWS[cat.id]!.map(job => R.CREW_JOBS.find(c => c.id === job)!.name).join(' / ') : cat.flavour}</small><h2>{cat.name}</h2></header>
        {owned ? <>
          <p>Level {owned.level} · {owned.stars} stars · {owned.shards} shards · Awakening {m.state.awakened[cat.id] ?? 0}/3</p>
          <div className="cr-actions">
            <button className="cr-primary" disabled={locked} onClick={() => m.command({ type: 'level', cardId: owned.id })}>Level up</button>
            <button disabled={locked} onClick={() => m.command({ type: 'ascend', cardId: owned.id })}>Add a star</button>
            <button disabled={locked || (m.state.awakened[cat.id] ?? 0) >= 3}
              title="Level 10 and two stars required. Each rank adds 3% HP and attack."
              onClick={() => m.apply(R.awakenCat(m.state, cat.id), 'Awakening raised HP and attack by 3%.')}>Awaken</button>
            <button onClick={() => m.go('inventory')}>View equipment</button>
          </div>
        </> : <button className="cr-primary" onClick={() => m.go('gacha')}>Visit invitations</button>}
        <CompanionPreview m={m} id={cat.id} skillId={skill?.id} />
        <div className="cr-actions"><button aria-pressed={!skill} onClick={() => setPreview('model')}>Rotate model</button></div>
        <p><b>{cat.passive.name}</b> · {v4 ? R.passiveDescriptionV4(cat.id) : cat.passive.description}</p>
        <div className="dp-preview-skills">{cat.skills.map(action => <button className="dp-skill-summary" key={action.id}
          aria-pressed={action.id === skill?.id} onClick={() => setPreview(action.id)}>
          <img src={skillIcon(action.id)} alt="" /><span><b>{action.name}</b><small>{v4 ? R.skillDescriptionV4(action) : action.description}</small></span>
        </button>)}</div>
        {skill && <p className="dp-preview-note">Looping preview · {skill.name}</p>}
        {owned && <>
          <Stats stats={R.depthStats(m.state, cat.id)} />
          <ul className="dp-equipped-list">{EQUIPMENT_SLOTS.map(slot => {
            const gear = R.equippedItems(m.state, cat.id).find(item => R.GEAR_BY_ID[item.templateId]!.slot === slot);
            return <li key={slot}><ItemIcon slot={slot} /><small>{slot}</small><span>{gear ? R.GEAR_BY_ID[gear.templateId]!.name : 'Empty slot'}</span></li>;
          })}</ul>
          {(m.state.awakened[cat.id] ?? 0) < 3 && <small>Next awakening uses {30 * ((m.state.awakened[cat.id] ?? 0) + 1)} materials, {300 * ((m.state.awakened[cat.id] ?? 0) + 1)} fish points, {40 * ((m.state.awakened[cat.id] ?? 0) + 1)} threads and {5 * ((m.state.awakened[cat.id] ?? 0) + 1)} essence.</small>}
        </>}
      </section>
    </div>
  </>;
}
