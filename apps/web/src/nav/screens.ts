import type { ComponentType } from 'react';
import { TABS, type TabName } from '../Panel';
import type { IconName } from '../art/pixelIcons';

export { TABS, type TabName };

export type ScreenId =
  | 'landing'
  | 'class'
  | 'home'
  | 'bag'
  | 'map'
  | 'forge'
  | 'market'
  | 'hero'
  | 'squad'
  | 'help';

export interface ScreenDef<P = any> {
  id: ScreenId;
  label: string;
  icon: IconName | 'help';
  Component?: ComponentType<P>;
  rail: boolean;
}

export const SCREEN_REGISTRY: readonly ScreenDef[] = [
  { id: 'landing', label: 'Landing', icon: 'paw', rail: false },
  { id: 'class', label: 'Class', icon: 'paw', rail: false },
  { id: 'home', label: 'Home', icon: 'paw', rail: true },
  { id: 'bag', label: 'Bag', icon: 'bag', rail: true },
  { id: 'map', label: 'Map', icon: 'sword', rail: true },
  { id: 'forge', label: 'Forge', icon: 'flask', rail: true },
  { id: 'market', label: 'Market', icon: 'shop', rail: true },
  { id: 'hero', label: 'Hero', icon: 'ears', rail: true },
  { id: 'squad', label: 'Squad Lab', icon: 'sword', rail: true },
  { id: 'help', label: 'Help', icon: 'help', rail: true },
] as const;

export const RAIL_SCREENS = SCREEN_REGISTRY.filter((s) => s.rail);

/** Map legacy TabName to redesign ScreenId. */
export function tabNameToScreenId(tabName: TabName | string): ScreenId {
  switch (tabName) {
    case 'Inventory':
    case 'Bag':
      return 'bag';
    case 'Boss':
    case 'Map':
      return 'map';
    case 'Forge':
      return 'forge';
    case 'Market':
      return 'market';
    case 'Hero':
    case 'Character':
      return 'hero';
    case 'Help':
      return 'help';
    case 'Home':
      return 'home';
    case 'Landing':
      return 'landing';
    case 'Class':
      return 'class';
    default: {
      const lower = tabName.toLowerCase() as ScreenId;
      if (SCREEN_REGISTRY.some((s) => s.id === lower)) return lower;
      return 'home';
    }
  }
}

/** Map redesign ScreenId back to legacy TabName for components/tests that expect it. */
export function screenIdToTabName(screenId: ScreenId): TabName {
  switch (screenId) {
    case 'bag':
      return 'Inventory';
    case 'map':
      return 'Boss';
    case 'forge':
      return 'Forge';
    case 'market':
      return 'Market';
    case 'hero':
      return 'Hero';
    case 'home':
      return 'Hero';
    default:
      return 'Hero';
  }
}
