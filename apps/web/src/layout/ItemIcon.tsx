import type { JSX } from 'react';
import type { ItemV2 } from '../api/GameApiV2';
import { ItemPixelIcon } from '../art/itemIcons';
import { V2PixelIcon } from '../art/v2Icons';
import { itemArtOf } from './itemView';
import { GAMEPLAY_ITEM_KEYS } from '../art/gameplayItemKeys';

export interface ItemIconProps {
  item: Pick<ItemV2, 'itemKey' | 'slot' | 'weaponType'>;
  size?: number;
  title?: string;
}

/**
 * Renders the visual icon for a v2 equipment or accessory item:
 * specific pixel art when available (ItemPixelIcon), falling back to
 * the slot or weapon-type icon (V2PixelIcon).
 */
export function ItemIcon({ item, size = 3, title }: ItemIconProps): JSX.Element | null {
  const art = itemArtOf(item);
  const key = art.kind === 'item' ? art.key : art.name;
  if (GAMEPLAY_ITEM_KEYS.has(key)) {
    const pixels = 16 * Math.max(1, Math.round(size));
    return <img className="gameplay-item-icon" data-icon={key} src={`/art/gameplay/item-${key}.png`}
      width={pixels} height={pixels} alt={title ?? ''} title={title} aria-hidden={title ? undefined : true}
      style={{ imageRendering: 'pixelated', objectFit: 'contain' }} />;
  }
  if (art.kind === 'item') {
    return <ItemPixelIcon itemKey={art.key} size={size} title={title} />;
  }
  return <V2PixelIcon name={art.name} size={size} title={title} />;
}
