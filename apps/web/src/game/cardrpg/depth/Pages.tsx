import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID, QUESTS, getBannerOdds, getDrawPool, emptyPity } from '@taskbar-hero/game-rules/cardrpg';
import { PageTitle, CostView } from '../shared';
import type { DepthModel } from './model';
import { CompanionCard as Companion } from './CompanionCard';
import { CompanionPreview } from './CompanionPreview';
import { nextChallenge } from './meta-presentation';
import { portrait } from './assets';
export { Team, Collection } from './TeamCollection';
export { Inventory } from './Equipment';

export function Hub({ m }: { m: DepthModel }) {
  const active = m.state.run && !m.state.run.complete;
  const nextRoute = nextChallenge(m.state);
  const next = m.state.tutorial < 3 ? 'Try the practice table.' : !m.state.freeInvite ? 'Open your welcome invitation.' : m.state.tutorial === 3 ? 'Equip your first piece from the equipment shelf.' : m.state.cleared.length === 0 ? 'Prepare your team and visit the Tangled Cafe.' : `Explore ${R.CHAPTERS[Math.min(2, m.state.cleared.length)]!.name}.`;
  return <><PageTitle eyebrow={`Cafe day ${m.state.account.day}`} title="A small light. A brave little team." />
    <section className="cr-hero"><div><small>THE FIRST LANTERN</small><h2>Keep the cafe<br />warm tonight.</h2><p>{next}</p>
      <button className="cr-primary" onClick={() => active ? m.go('map') : m.state.tutorial < 3 ? m.tutorial() : m.go('team')}>{active ? 'Continue your route' : m.state.tutorial < 3 ? 'Try the practice table' : 'Prepare your team'} →</button>
      <button disabled={!!active} onClick={() => m.watchNow()}>Watch a battle now</button>
      {m.state.tutorial < 3 && <button onClick={() => { m.state.tutorial = 3; m.notify(); }}>Skip lesson</button>}</div>
      <div className="dp-home-team"><CompanionPreview m={m} home /><div className="dp-home-names">{m.state.team.map(id => <button key={id} onClick={() => { m.cardId = id; m.go('collection'); }}>{R.CAT_BY_ID[id]!.name}</button>)}</div></div></section>
    <div className="dp-next-goal"><span>Chapter {nextRoute.chapter.id} · {nextRoute.chapter.name}</span><b>Your team {nextRoute.teamPower} · {nextRoute.exact ? 'Next encounter' : 'Opening estimate'} {nextRoute.enemyPower} power</b><button onClick={() => m.go('team')}>Review team →</button></div><div className="cr-hub-grid"><section className="cr-panel"><h2>Tonight’s route</h2><div className="cr-route-list">{R.CHAPTERS.map(chapter => <button key={chapter.id} disabled={active || chapter.id > 1 && !m.state.cleared.includes(chapter.id - 1)} onClick={() => m.start(chapter.id)}>
      <span>{chapter.name}<small>{chapter.reward}</small></span><em>{m.state.cleared.includes(chapter.id) ? 'Cleared ↗' : '→'}</em></button>)}</div>
      <div className="cr-actions"><button disabled={!!active} onClick={() => m.start(Math.max(1, Math.min(3, m.state.cleared.length + 1)), 'daily')}>Daily challenge</button><button disabled={!!active || !m.state.cleared.includes(3)} onClick={() => m.start(1, 'tower')}>Tower · best {m.state.towerBest}</button></div>
      <small>{R.calendarChallenge(m.offline ? '2026-11-06' : new Date().toISOString().slice(0, 10)).mutator.description} Rewards are capped once per date.</small></section>
      <section className="cr-panel"><h2>A little service, every day.</h2><p>The kettle keeps time while you are away. Up to eight hours count toward two daily services.</p>
        <button disabled={!!active || R.idlePreview(m.state, m.offline ? 3600000 : Date.now()).claims === 0} onClick={() => m.apply(R.claimIdleService(m.state, m.offline ? 3600000 : Date.now()), 'Cafe service collected within the daily allowance.')}>{m.offline ? 'Claim fixture hour of service' : 'Claim cafe service'}</button>
        {QUESTS.map(q => { const progress = m.state.account.quests[q.id]!; return <div className="cr-quest-mini" key={q.id}><span>{q.name}<small>{progress.progress}/{q.target} · <CostView cost={q.reward.currencies} /></small><progress aria-label={`${q.name} progress`} value={progress.progress} max={q.target} /></span><button disabled={progress.claimed || progress.progress < q.target || !!active} onClick={() => m.command({ type: 'claimQuest', questId: q.id })}>{progress.claimed ? 'Claimed' : 'Claim'}</button></div>; })}
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
