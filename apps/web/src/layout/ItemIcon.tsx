import type { JSX } from 'react';
import type { ItemV2 } from '../api/GameApiV2';
import { ItemPixelIcon } from '../art/itemIcons';
import { V2PixelIcon } from '../art/v2Icons';
import { itemArtOf } from './itemView';

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
  if (art.kind === 'item') {
    return <ItemPixelIcon itemKey={art.key} size={size} title={title} />;
  }
  return <V2PixelIcon name={art.name} size={size} title={title} />;
}
