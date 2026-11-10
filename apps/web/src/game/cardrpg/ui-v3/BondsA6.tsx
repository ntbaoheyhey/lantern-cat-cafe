import {useState} from 'react';
import {CARD_BY_ID} from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';

export function BondSummaryA6({ m, catId }: { m: DepthModel; catId?: string }) {
  const pairs = catId ? R.PAIR_COMBOS_A6.filter(pair => pair.cats.includes(catId)) : R.activePairCombosA6(m.state.team);
  return <section className="a6-bond-summary" aria-label="Bonds">
    <b>∞ Collection bonus +{R.collectionBonusA6(m.state) / 100}% HP & attack</b>
    {pairs.map(pair => <p key={pair.id}><strong>{pair.name}</strong><small>{pair.cats.map(id => R.CAT_BY_ID[id]!.name).join(' + ')} · {pair.cats.every(id => m.state.team.includes(id)) ? 'Combo ready' : 'Place both in your team'}</small></p>)}
    {!pairs.length && <p>Bring a bonded pair to unlock a combo.</p>}
    <button onClick={() => m.go('bonds')}>Open Bond Book</button>
  </section>;
}

/** An album index keeps every collection and pair within reach of the same page. */
export function BondBookA6({m}:{m:DepthModel}) {
  const [section,setSection]=useState<'collections'|'pairs'>('collections');
  const [selection,setSelection]=useState({collections:'first-lantern',pairs:'lantern-pledge'});
  const bonds=R.collectionBondsA6(m.state),owned=new Set(m.state.account.cards.map(card=>card.cardId));
  const activePairs=R.activePairCombosA6(m.state.team);
  const entries=section==='collections'?bonds.map(bond=>({
    id:bond.id,name:bond.name,cats:bond.cats,active:bond.active,
    status:bond.active?'Complete':`${bond.owned.length} / ${bond.cats.length} owned`,
    description:bond.active?'+0.5% HP & attack for all cats':`Missing: ${bond.missing.map(id=>R.CAT_BY_ID[id]!.name).join(', ')}`,
  })):R.PAIR_COMBOS_A6.map(pair=>({
    id:pair.id,name:pair.name,cats:pair.cats,active:activePairs.some(active=>active.id===pair.id),
    status:activePairs.some(active=>active.id===pair.id)?'Ready':pair.cats.every(id=>owned.has(id))?'Pair up':`${pair.cats.filter(id=>!owned.has(id)).length} missing`,
    description:pair.description,
  }));
  const selected=entries.find(entry=>entry.id===selection[section])??entries[0]!;
  return <div className="a6-bond-book">
    <header className="a6-bond-overview"><div><small>THE FRIENDSHIP ALBUM</small><h2>Every friendship matters</h2></div><p><b>All cats +{R.collectionBonusA6(m.state)/100}% HP & attack</b><span>{bonds.filter(bond=>bond.active).length} / {bonds.length} collections complete · {activePairs.length} {activePairs.length===1?'pair':'pairs'} ready</span></p></header>
    <nav className="a6-bond-sections" aria-label="Bond Book sections">
      <button aria-pressed={section==='collections'} onClick={()=>setSection('collections')}>Collection bonds <span>{bonds.length}</span></button>
      <button aria-pressed={section==='pairs'} onClick={()=>setSection('pairs')}>Pair combos <span>{R.PAIR_COMBOS_A6.length}</span></button>
    </nav>
    <div className="a6-bond-album">
      <nav className="a6-bond-index" aria-label={section==='collections'?'Collection bonds index':'Pair combos index'}>
        <small>{section==='collections'?'COLLECT TOGETHER':'FIGHT TOGETHER'}</small>
        {entries.map((entry,index)=><button key={entry.id} aria-pressed={entry.id===selected.id} aria-controls="a6-bond-page" data-active={entry.active} onClick={()=>setSelection(previous=>({...previous,[section]:entry.id}))}>
          <i aria-hidden="true">{String(index+1).padStart(2,'0')}</i><span>{entry.name}</span><small>{entry.status}</small>
        </button>)}
      </nav>
      <section className="a6-bond-page" id="a6-bond-page" aria-label={selected.name}>
        <header><div><small>{section==='collections'?'A COLLECTION TO KEEP':'AN AUTOMATIC TEAM COMBO'}</small><h3>{selected.name}</h3></div><span className="a6-bond-stamp" data-active={selected.active}>{selected.active?'✓ ':''}{selected.status}</span></header>
        <div className="a6-bond-cast">{selected.cats.map(id=>{
          const card=m.state.account.cards.find(card=>card.cardId===id);
          return <button key={id} data-owned={!!card} data-rarity={CARD_BY_ID[id]!.rarity} onClick={()=>{m.cardId=id;m.go('collection');}} aria-label={`${R.CAT_BY_ID[id]!.name}: ${card?'owned':'missing'}`}>
            {card&&<span className="a6-bond-level">Lv. {card.level}</span>}<img {...portraitProps(id)} alt=""/>
            <strong>{R.CAT_BY_ID[id]!.name}</strong><small>{card?<>Owned · <span aria-label={`${card.stars} stars`}>{'★'.repeat(card.stars)}</span></>:'Missing'}</small>
          </button>;
        })}</div>
        <div className="a6-bond-note"><b>{selected.description}</b><p>{section==='collections'?'Own every cat in this set for +0.5% HP and attack. The bonus stays active from the bench.':'Both partners must be in your team and still standing. Each pair triggers once per battle, from round three.'}</p></div>
        <footer><small>{section==='collections'?'Select a cat to open their profile.':'Crew reactions stay active too.'}</small><button className="cr-primary" onClick={()=>m.go('team')}>Build a bonded team</button></footer>
      </section>
    </div>
  </div>;
}
