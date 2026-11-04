import { bonusRollQuality } from '@taskbar-hero/game-rules/client/gameplay';
import { CONFIG } from '@taskbar-hero/game-rules';
import type { CSSProperties } from 'react';
import type { ItemV2 } from '../api/GameApiV2';
import { ItemIcon } from '../layout/ItemIcon';
import { itemName, rarityLabel } from '../layout/itemView';
import { RarityMark } from './RarityMark';

/** Only celebrates the acknowledged item. Common gear has no bonus roll or invented pity. */
export function CraftResult({ item }: { item: ItemV2 }) {
  const roll = bonusRollQuality(item.rarity, item.bonus), fx = CONFIG.gameplay.juice;
  return <div className="forge-reveal gameplay-craft-result" data-rarity={item.rarity} data-great={roll.great} role="status" data-testid="craft-result"
    style={{ '--anticipation': `${fx.anticipationMs}ms`, '--settle': `${fx.settleMs}ms` } as CSSProperties}>
    <span className="forge-reveal-art" aria-hidden="true"><ItemIcon item={item} size={4} /><RarityMark rarity={item.rarity} /></span>
    <div>{roll.great && <span className="great-roll-label">✦ Great bonus roll</span>}
      <strong>Crafted: {rarityLabel(item.rarity)} {itemName(item.itemKey)}</strong>
      <span>Level {item.level} · Added to your Bag</span>
      <small>{roll.quality === null ? 'Selected rarity guaranteed · No bonus roll' : `Bonus quality ${Math.round(roll.quality * 100)}% of its stat ranges · Great at ${Math.round(CONFIG.gameplay.greatRollThreshold * 100)}%`}</small>
      <small>Gear is not tradable; only Relics can be listed in the Market.</small>
    </div>
  </div>;
}
