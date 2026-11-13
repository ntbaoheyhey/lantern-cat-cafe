import {GameIcon,StarIcons} from '../../../ui/GameIcon';
import { CARD_BY_ID } from '@taskbar-hero/game-rules/cardrpg';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { rarityStyle } from '../shared';
import { portraitProps } from './assets';
import { powerScore } from './meta-presentation';
import type { DepthModel } from './model';

import { artPropsA6 } from '../ui-v3/art-a6';
import { PowerA6 } from '../ui-v3/PowerA6';

const ROLE_ICONS = { guardian: 'shield', hexer: 'moon', healer: 'heart', striker: 'fight', controller: 'stun', witch: 'burn' };

export function CompanionCard({ id, m, onSelect, selected = false }: {
  id: string; m: DepthModel; onSelect?: () => void; selected?: boolean;
}) {
  const card = CARD_BY_ID[id]!;
  const cat = R.CAT_BY_ID[id]!;
  const owned = m.state.account.cards.find(candidate => candidate.cardId === id);
  const power = owned ? (R.gameplayA6(m.state)?R.powerV4(m.state,id).total:powerScore(R.depthStats(m.state, id))) : null;
  return <button className={`cr-cat-card dp-cat dp-card-${card.rarity} ${owned ? '' : 'locked'}`}
    data-rarity={card.rarity} style={rarityStyle(card.rarity)} aria-pressed={selected}
    aria-label={`${cat.name}, ${card.rarity}, ${owned ? `level ${owned.level}, power ${power}` : 'not collected'}`}
    onClick={onSelect ?? (() => { m.cardId = id; m.go('collection'); })}>
    <div className="cr-portrait"><img {...(R.gameplayA6(m.state) ? artPropsA6(id) : portraitProps(id))} alt="" />
      {R.gameplayA6(m.state)&&owned&&<span className="a6-level-badge">{m.state.formationC2?'Level':'Lv.'} {owned.level}</span>}
      {!owned && <strong className="dp-question">?</strong>}
      <span className="dp-role" title={cat.role}><GameIcon name={ROLE_ICONS[cat.role]} size={20}/></span>
      {R.gameplayA6(m.state)&&<span className="a6-bond-icon" title={R.PAIR_COMBOS_A6.filter(p=>p.cats.includes(id)).map(p=>p.name).join(' · ')}><GameIcon name="bonds" size={18}/> {m.state.formationC2?'':R.activePairCombosA6(m.state.team).filter(p=>p.cats.includes(id)).length ? 'Combo ready' : 'Bonds'}</span>}
      <span className="dp-card-rarity" aria-label={card.rarity}>{m.state.formationC2?<StarIcons count={['common','rare','epic','legendary'].indexOf(card.rarity)+1}/>:card.rarity}</span>
    </div>
    <div className="cr-card-caption">{!m.state.formationC2&&<small>{cat.role} · {cat.flavour}</small>}<h3>{cat.name}</h3>
      <p>{owned ? <>{m.state.formationC2?'Level':'Lv.'} {owned.level} <span className="dp-card-stars" aria-label={`${owned.stars} stars`}>{<StarIcons count={owned.stars}/>}</span></> : m.state.formationC2?'invitations':'Invite to collect'}</p>
      {owned && <strong className="dp-card-power">{R.gameplayA6(m.state)?<PowerA6 value={power!} reducedMotion={m.state.settings.reducedMotion}/>:<>{power}<small> power</small></>}</strong>}
    </div>
  </button>;
}
