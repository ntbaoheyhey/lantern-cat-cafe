import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { portraitProps } from '../depth/assets';

export function BondSummaryA6({ m, catId }: { m: DepthModel; catId?: string }) {
  const pairs = catId ? R.PAIR_COMBOS_A6.filter(pair => pair.cats.includes(catId)) : R.activePairCombosA6(m.state.team);
  return <section className="a6-bond-summary" aria-label="Bonds">
    <b>∞ Collection bonus +{R.collectionBonusA6(m.state) / 100}% HP & attack</b>
    {pairs.map(pair => <p key={pair.id}><strong>{pair.name}</strong><small>{pair.cats.map(id => R.CAT_BY_ID[id]!.name).join(' + ')} · {pair.cats.every(id => m.state.team.includes(id)) ? 'Combo ready' : 'Place both in your team'}</small></p>)}
    {!pairs.length && <p>Bring a bonded pair to unlock a combo.</p>}
    <button onClick={() => m.go('bonds')}>Open Bond Book</button>
  </section>;
}

export function BondBookA6({ m }: { m: DepthModel }) {
  const bonds = R.collectionBondsA6(m.state), owned = new Set(m.state.account.cards.map(card => card.cardId));
  const portraits = (cats: readonly string[]) => <div className="a6-bond-portraits">{cats.map(id => <button key={id} data-owned={owned.has(id)} onClick={() => { m.cardId = id; m.go('collection'); }} aria-label={`${R.CAT_BY_ID[id]!.name}: ${owned.has(id) ? 'owned' : 'missing'}`}><img {...portraitProps(id)} alt=""/><span>{R.CAT_BY_ID[id]!.name}</span><small>{owned.has(id) ? 'Owned' : 'Missing'}</small></button>)}</div>;
  return <>
    <header className="a6-bond-intro"><span aria-hidden="true">∞</span><div><small>Every friendship matters</small><h2>Stronger, even from the bench</h2><p>{bonds.filter(bond => bond.active).length} / {bonds.length} collections complete · <b>All cats +{R.collectionBonusA6(m.state) / 100}% HP & attack</b></p></div></header>
    <h2>Collection bonds</h2><p>Own every cat in a set: all owned cats gain +0.5% HP and attack. They can stay on the bench.</p>
    <div className="a6-bond-grid">{bonds.map(bond => <article key={bond.id} className="a6-bond-card" data-active={bond.active}>
      <header><h3>{bond.name}</h3><span>{bond.active ? '✓ Active' : `${bond.owned.length} / ${bond.cats.length}`}</span></header>{portraits(bond.cats)}
      <p>{bond.active ? '+0.5% HP & attack for all cats' : `Missing: ${bond.missing.map(id => R.CAT_BY_ID[id]!.name).join(', ')}`}</p>
    </article>)}</div>
    <h2>Pair combos</h2><p>Both cats in the team and still standing: one extra combo from round three, once per battle. Crew reactions stay active too.</p>
    <div className="a6-bond-grid">{R.PAIR_COMBOS_A6.map(pair => <article key={pair.id} className="a6-bond-card" data-active={pair.cats.every(id => m.state.team.includes(id))}>
      <header><h3>{pair.name}</h3><span>{pair.cats.every(id => m.state.team.includes(id)) ? 'Ready' : 'Pair up'}</span></header>{portraits(pair.cats)}<p>{pair.description}</p>
    </article>)}</div>
    <button className="cr-primary" onClick={() => m.go('team')}>Build a bonded team</button>
  </>;
}
