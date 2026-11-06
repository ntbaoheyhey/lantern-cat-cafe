import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID, CARD_RPG_CONFIG, QUESTS, getBannerOdds, getDrawPool, emptyPity, type Slot } from '@taskbar-hero/game-rules/cardrpg';
import { PageTitle, CostView, ItemIcon, rarityStyle } from '../shared';
import { portrait, skillIcon } from './assets';
import type { DepthModel } from './model';

export function Companion({ id, m }: { id: string; m: DepthModel }) {
  const cat = R.CAT_BY_ID[id]!, owned = m.state.account.cards.find(c => c.cardId === id);
  return <button className={`cr-cat-card dp-cat ${owned ? '' : 'locked'}`} style={rarityStyle(CARD_BY_ID[id]!.rarity)} onClick={() => { m.cardId = id; m.go('collection'); }}>
    <div className="cr-portrait"><img src={portrait(id)} alt={`${cat.name}'s own miniature`} />{!owned && <strong className="dp-question">?</strong>}<span>{CARD_BY_ID[id]!.rarity}</span></div>
    <div className="cr-card-caption"><small>{cat.role} · {cat.flavour}</small><h3>{cat.name}</h3><p>{owned ? `Lv. ${owned.level} · ${'★'.repeat(owned.stars)}` : 'Invite to collect'}</p></div>
  </button>;
}
export function Hub({ m }: { m: DepthModel }) {
  const active = m.state.run && !m.state.run.complete;
  const next = m.state.tutorial < 3 ? 'Try the practice table.' : !m.state.freeInvite ? 'Open your welcome invitation.' : m.state.tutorial === 3 ? 'Equip your first piece from the equipment shelf.' : m.state.cleared.length === 0 ? 'Prepare your team and visit the Tangled Cafe.' : `Explore ${R.CHAPTERS[Math.min(2, m.state.cleared.length)]!.name}.`;
  return <><PageTitle eyebrow={`Cafe day ${m.state.account.day}`} title="A small light. A brave little team." />
    <section className="cr-hero"><div><small>THE FIRST LANTERN</small><h2>Keep the cafe<br />warm tonight.</h2><p>{next}</p>
      <button className="cr-primary" onClick={() => active ? m.go('map') : m.state.tutorial < 3 ? m.tutorial() : m.go('team')}>{active ? 'Continue your route' : m.state.tutorial < 3 ? 'Try the practice table' : 'Prepare your team'} →</button>
      <button disabled={!!active} onClick={() => m.watchNow()}>Watch a battle now</button>
      {m.state.tutorial < 3 && <button onClick={() => { m.state.tutorial = 3; m.notify(); }}>Skip lesson</button>}</div>
      <div className="cr-hero-art">{m.state.team.map(id => <Companion key={id} id={id} m={m} />)}</div></section>
    <div className="cr-hub-grid"><section className="cr-panel"><h2>Tonight’s route</h2><div className="cr-route-list">{R.CHAPTERS.map(chapter => <button key={chapter.id} disabled={active || chapter.id > 1 && !m.state.cleared.includes(chapter.id - 1)} onClick={() => m.start(chapter.id)}>
      <span>{chapter.name}<small>{chapter.reward}</small></span><em>{m.state.cleared.includes(chapter.id) ? 'Cleared ↗' : '→'}</em></button>)}</div>
      <div className="cr-actions"><button disabled={!!active} onClick={() => m.start(Math.max(1, Math.min(3, m.state.cleared.length + 1)), 'daily')}>Daily challenge</button><button disabled={!!active || !m.state.cleared.includes(3)} onClick={() => m.start(1, 'tower')}>Tower · best {m.state.towerBest}</button></div>
      <small>{R.calendarChallenge(m.offline ? '2026-11-06' : new Date().toISOString().slice(0, 10)).mutator.description} Rewards are capped once per date.</small></section>
      <section className="cr-panel"><h2>A little service, every day.</h2><p>The kettle keeps time while you are away. Up to eight hours count toward two daily services.</p>
        <button disabled={!!active || R.idlePreview(m.state, m.offline ? 3600000 : Date.now()).claims === 0} onClick={() => m.apply(R.claimIdleService(m.state, m.offline ? 3600000 : Date.now()), 'Cafe service collected within the daily allowance.')}>{m.offline ? 'Claim fixture hour of service' : 'Claim cafe service'}</button>
        {QUESTS.map(q => { const progress = m.state.account.quests[q.id]!; return <div className="cr-quest-mini" key={q.id}><span>{q.name}<small>{progress.progress}/{q.target} · <CostView cost={q.reward.currencies} /></small></span><button disabled={progress.claimed || progress.progress < q.target || !!active} onClick={() => m.command({ type: 'claimQuest', questId: q.id })}>{progress.claimed ? 'Claimed' : 'Claim'}</button></div>; })}
      </section></div></>;
}
export function Team({ m }: { m: DepthModel }) {
  const state = m.state, locked = !!state.run && !state.run.complete;
  const update = (team = state.team, rows = state.rows) => m.apply(R.configureTeam(state, team, rows, state.skills), 'Team and rows updated. Your companions use their unlocked kits.');
  return <><PageTitle eyebrow="Three companions · automatic battles" title="Build your evening shift." />
    <section className="cr-panel"><div className="dp-three">{state.team.map((id, index) => <label key={index}>Seat {index + 1}<select disabled={locked} value={id} onChange={e => update(state.team.map((old, i) => i === index ? e.target.value : old))}>{state.account.cards.map(c => <option key={c.cardId} value={c.cardId}>{R.CAT_BY_ID[c.cardId]!.name}</option>)}</select></label>)}</div>
      <div className="dp-combos">{R.TEAM_COMBOS.map(combo => <span key={combo.id} className={R.teamCombos(state.team).some(c => c.id === combo.id) ? 'active' : ''} title={combo.description}>{combo.name} · {R.teamCombos(state.team).some(c => c.id === combo.id) ? 'active' : combo.tags.join(' + ')}</span>)}</div></section>
    <div className="dp-three">{state.team.map(id => { const cat = R.CAT_BY_ID[id]!; return <section className="cr-panel" key={id}>
      <div className="dp-cat-heading"><img src={portrait(id)} alt="" /><div><h2>{cat.name}</h2><small>{cat.role} · {cat.flavour}</small></div></div>
      <label>Battle row<select disabled={locked} value={state.rows[id]} onChange={e => update(state.team, { ...state.rows, [id]: e.target.value as R.Row })}><option value="front">Front · protects the rear</option><option value="rear">Rear · protected by front</option></select></label>
      <p title={cat.passive.description}><b>{cat.passive.name}</b> · {cat.passive.description}</p>
      {R.availableSkills(state, id).map(skill => <div className="dp-skill-summary" key={skill.id}><img src={skillIcon(skill.id)} alt="" /><span><b>{skill.name}</b><small>{skill.description}</small></span></div>)}
      <small>{R.availableSkills(state, id).length === 4 ? 'Ultimate unlocked and included in the automatic kit.' : `Level 6 or three stars unlocks ${cat.skills[3]!.name}.`}</small>
    </section>; })}</div><div className="cr-actions">{R.CHAPTERS.map(chapter => <button disabled={locked || chapter.id > 1 && !state.cleared.includes(chapter.id - 1)} key={chapter.id} onClick={() => m.start(chapter.id)}>Begin {chapter.name}</button>)}</div></>;
}
export function Collection({ m }: { m: DepthModel }) {
  const cat = R.CAT_BY_ID[m.cardId]!, owned = m.state.account.cards.find(c => c.cardId === cat.id);
  return <><PageTitle eyebrow={`${m.state.account.cards.length} / 12 companions`} title="Every seat has a story." />
    <div className="dp-collection-layout"><div className="cr-card-grid">{R.CATS.map(cat => <Companion key={cat.id} id={cat.id} m={m} />)}</div>
      <section className="cr-panel dp-detail"><img className={`dp-detail-portrait ${owned ? '' : 'silhouette'}`} src={portrait(cat.id)} alt={cat.name} /><h2>{cat.name}</h2><p>{cat.role} · {cat.flavour} · {CARD_BY_ID[cat.id]!.rarity}</p><p><b>{cat.passive.name}</b> · {cat.passive.description}</p>
        {cat.skills.map(skill => <div className="dp-skill-summary" key={skill.id}><img src={skillIcon(skill.id)} alt="" /><span><b>{skill.name}</b><small>{skill.description} · ◆ {skill.cost} · CD {skill.cooldown}</small></span></div>)}
        {owned && <><p>Level {owned.level} · {owned.stars} stars · {owned.shards} duplicate shards · Awakening {m.state.awakened[cat.id] ?? 0}/3</p><div className="cr-actions"><button onClick={() => m.command({ type: 'level', cardId: owned.id })}>Level up</button><button onClick={() => m.command({ type: 'ascend', cardId: owned.id })}>Add a star</button><button title="Level 10, two stars. Rank one costs 30 mastery materials, 300 fish points, 40 threads and 5 essence. Each rank adds 3% HP and attack." onClick={() => m.apply(R.awakenCat(m.state, cat.id), 'Awakening raised HP and attack by 3%.')}>Awaken</button></div><small>Awakening uses {30 * ((m.state.awakened[cat.id] ?? 0) + 1)} materials at the next rank. Balance {m.state.materials}.</small></>}
      </section></div></>;
}
export function Invitations({ m }: { m: DepthModel }) {
  const pity = m.state.account.pity['cats-standard'] ?? emptyPity();
  const odds = getBannerOdds('standard', pity), last = m.state.account.history.at(-1);
  return <><PageTitle eyebrow="Earned stamps only" title="A new face at the door." />
    <section className="cr-panel dp-invitation"><div><h2>Cafe Guestbook</h2><p>Invite a companion for 150 earned stamps. Duplicates grant shards for stars and skill unlocks.</p><div className="cr-actions"><button className="cr-primary" onClick={() => m.invite(!m.state.freeInvite)}>{m.state.freeInvite ? 'Invite once · 150 stamps' : 'Open free welcome invitation'}</button></div>
      <p>Legendary pity {pity.sinceLegendary}/60 · soft pity begins on draw 41.</p><dl className="dp-odds">{Object.entries(odds).map(([rarity, value]) => <div key={rarity}><dt>{rarity}</dt><dd>{value / 100}%</dd></div>)}</dl>
      <details><summary>Exact next-draw probabilities</summary>{getDrawPool(m.state.account, 'standard').map(item => <p key={item.id}>{CARD_BY_ID[item.id]?.name ?? item.id} · {(item.probability * 100).toFixed(4)}%</p>)}</details></div>
      {last?.cardId ? <div className="dp-reveal"><Companion id={last.cardId} m={m} /><h2>{CARD_BY_ID[last.cardId]!.name} arrived.</h2><p>{last.duplicate ? `${last.shards} duplicate shards` : 'A new companion joins the collection.'}</p><button onClick={() => m.go('inventory')}>Equip a first piece</button><button onClick={() => m.go('team')}>Build a team</button></div> : <div className="dp-letter" aria-hidden="true">✉</div>}
    </section><p>Companions and random equipment are bound to this account. Tradable Relic eligibility uses the effort paths in the Relic panel.</p></>;
}
export function Inventory({ m }: { m: DepthModel }) {
  const [slot, setSlot] = useState<string>('all'), [setId, setSetId] = useState('all');
  const [craftId, setCraftId] = useState(R.GEAR[0]!.id), [affix, setAffix] = useState('');
  const item = m.state.gear.find(g => g.id === m.itemId) ?? m.state.gear[0]!;
  if (!item) return <section className="cr-panel"><h1>Your equipment shelf is empty.</h1><button onClick={() => m.apply(R.craftGear(m.state, R.GEAR[0]!.id))}>Craft a common piece</button><button onClick={() => m.go('hub')}>Return to a route</button></section>;
  const template = R.GEAR_BY_ID[item.templateId]!, preview = R.enhancementPreview(item);
  const compatible = R.AFFIXES.filter(a => a.slots.includes(template.slot) && !item.affixes.includes(a.id));
  const effects = R.equipmentEffects(m.state, m.cardId);
  return <><PageTitle eyebrow={`${m.state.gear.length} pieces · ${R.GEAR.length} templates`} title="Give your plan a shape." />
    <div className="cr-filter"><label>Equip for<select value={m.cardId} onChange={e => { m.cardId = e.target.value; m.notify(false); }}>{m.state.account.cards.map(c => <option key={c.cardId} value={c.cardId}>{R.CAT_BY_ID[c.cardId]!.name}</option>)}</select></label><label>Slot<select value={slot} onChange={e => setSlot(e.target.value)}>{['all', 'weapon', 'outfit', 'charm', 'relic'].map(s => <option key={s}>{s}</option>)}</select></label><label>Set<select value={setId} onChange={e => setSetId(e.target.value)}><option value="all">All sets</option>{R.SETS.map(set => <option key={set.id} value={set.id}>{set.name}</option>)}</select></label></div>
    <div className="dp-inventory-layout"><div className="dp-gear-grid">{m.state.gear.filter(g => (slot === 'all' || R.GEAR_BY_ID[g.templateId]!.slot === slot) && (setId === 'all' || R.GEAR_BY_ID[g.templateId]!.setId === setId)).map(g => { const t = R.GEAR_BY_ID[g.templateId]!; return <button key={g.id} style={rarityStyle(t.rarity)} aria-pressed={g.id === item.id} onClick={() => { m.itemId = g.id; m.notify(false); }}><ItemIcon slot={t.slot} /><b>{t.name}</b><small>{t.slot} · {t.rarity} · +{g.enhancement}</small></button>; })}</div>
      <section className="cr-panel"><h2>{template.name}</h2><p>{template.rarity} · item level {template.level} · {template.source}</p><p>{template.story}</p><p>{template.main} {preview.before}{item.enhancement < 12 ? ` → ${preview.after} at +${item.enhancement + 1}` : ' · maximum +12'}</p><CostView cost={preview.cost} />
        <div className="cr-actions"><button className="cr-primary" onClick={() => { if (m.apply(R.equipGear(m.state, m.cardId, item.id), 'Equipment fitted. Its set rules apply in the next run.')) { m.state.tutorial = Math.max(4, m.state.tutorial); m.notify(); } }}>Equip selected</button><button disabled={item.enhancement >= 12} onClick={() => m.apply(R.enhanceGear(m.state, item.id))}>Enhance equipment</button><button onClick={() => m.apply(R.equipGear(m.state, m.cardId, null, template.slot))}>Unequip slot</button><button onClick={() => m.apply(R.salvageGear(m.state, item.id))}>Salvage</button></div>
        {item.affixes.map(id => <p key={id}>{R.AFFIX_BY_ID[id]!.name} · {item.rolls[id]} · {R.AFFIX_BY_ID[id]!.description}</p>)}
        {item.affixes.length > 0 && <div className="cr-actions"><label>Replace first affix<select value={affix || compatible[0]?.id || ''} onChange={e => setAffix(e.target.value)}>{compatible.map(a => <option key={a.id} value={a.id}>{a.name} · {a.tiers[item.tier - 1]!.join('–')}</option>)}</select></label><button onClick={() => m.apply(R.reforgeGear(m.state, item.id, 0, affix || compatible[0]!.id))}>Reforge · 90 fish / 15 threads</button></div>}
        <h3>Set progress on {R.CAT_BY_ID[m.cardId]!.name}</h3>{R.SETS.filter(s => effects.counts[s.id]).map(s => <p key={s.id}>{s.name} {effects.counts[s.id]}/4<br /><small>2 pieces · {s.two}<br />4 pieces · {s.four}</small></p>)}
      </section></div><section className="cr-panel"><h2>Choose a tailoring project</h2><label>Template<select value={craftId} onChange={e => setCraftId(e.target.value)}>{R.GEAR.map(g => <option key={g.id} value={g.id}>{g.name} · chapter {g.chapter}</option>)}</select></label><p>{R.GEAR_BY_ID[craftId]!.story}</p><button onClick={() => m.apply(R.craftGear(m.state, craftId), 'Chosen piece crafted. Look for it in your equipment.')}>Craft chosen piece</button></section></>;
}
export function Codex() {
  const [tab, setTab] = useState('keywords');
  return <><PageTitle eyebrow="Intent, response, outcome" title="Know what matters." /><div className="cr-tabs">{['keywords', 'enemies', 'charms', 'sets'].map(id => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{id}</button>)}</div>
    <p>{R.FLAVOUR_RULE}</p><div className="dp-codex-grid">
      {tab === 'keywords' && R.STATUSES.map(status => <article className="cr-panel" key={status.id}><h2>{status.name}</h2><p>{status.description}</p><small>{status.kind} · cap {status.cap} · {status.duration} rounds · {status.dispellable ? 'Dispellable' : 'Protected from dispel'}</small></article>)}
      {tab === 'enemies' && R.ENEMIES.map(enemy => <article className="cr-panel" key={enemy.id}><img className="dp-enemy-portrait" src={portrait(enemy.id)} alt={enemy.name} /><h2>{enemy.name}</h2><small>{enemy.tier} · {enemy.flavour} · {enemy.row}</small><p>{enemy.intent}</p><p>{enemy.counter}</p><small>{enemy.phases.join(' · ')}</small></article>)}
      {tab === 'charms' && R.BOONS.map(boon => <article className="cr-panel" key={boon.id}><h2>{boon.name}</h2><small>{boon.archetype} · stack cap {boon.cap}</small><p>{boon.description}</p></article>)}
      {tab === 'sets' && R.SETS.map(set => <article className="cr-panel" key={set.id}><h2>{set.name}</h2><p>2 pieces · {set.two}</p><p>4 pieces · {set.four}</p></article>)}
    </div><p>Debuff success is 90% + Effect Hit − Effect Resist, bounded to 10–98%. Boss control lasts one round and grants a short control-resistance window.</p></>;
}
