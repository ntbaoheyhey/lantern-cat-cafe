import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { rarityStyle } from '../shared';
import { portraitProps } from './assets';
import { powerScore } from './meta-presentation';
import type { DepthModel } from './model';

const ROLE_ICONS = { guardian: '◈', hexer: '☾', healer: '♧', striker: '✧', controller: '⌘', witch: '✦' };

export function CompanionCard({ id, m, onSelect, selected = false }: {
  id: string; m: DepthModel; onSelect?: () => void; selected?: boolean;
}) {
  const card = CARD_BY_ID[id]!;
  const cat = R.CAT_BY_ID[id]!;
  const owned = m.state.account.cards.find(candidate => candidate.cardId === id);
  const power = owned ? powerScore(R.depthStats(m.state, id)) : null;
  return <button className={`cr-cat-card dp-cat dp-card-${card.rarity} ${owned ? '' : 'locked'}`}
    style={rarityStyle(card.rarity)} aria-pressed={selected}
    aria-label={`${cat.name}, ${card.rarity}, ${owned ? `level ${owned.level}, power ${power}` : 'not collected'}`}
    onClick={onSelect ?? (() => { m.cardId = id; m.go('collection'); })}>
    <div className="cr-portrait"><img {...portraitProps(id)} alt="" />
      {!owned && <strong className="dp-question">?</strong>}
      <span className="dp-role" title={cat.role}>{ROLE_ICONS[cat.role]}</span>
      <span className="dp-card-rarity">{card.rarity}</span>
    </div>
    <div className="cr-card-caption"><small>{cat.role} · {cat.flavour}</small><h3>{cat.name}</h3>
      <p>{owned ? <>Lv. {owned.level} <span className="dp-card-stars" aria-label={`${owned.stars} stars`}>{'★'.repeat(owned.stars)}</span></> : 'Invite to collect'}</p>
      {owned && <strong className="dp-card-power">{power}<small> power</small></strong>}
    </div>
  </button>;
}
