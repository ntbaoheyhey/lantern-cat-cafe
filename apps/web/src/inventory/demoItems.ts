import type { Gear } from '@taskbar-hero/game-rules';

/** A few spare items so the Inventory tab has something to equip before real drops arrive. */
export const DEMO_ITEMS: Gear[] = [
  { slot: 'weapon', rarity: 'rare', level: 3 },
  { slot: 'helm', rarity: 'epic', level: 2 },
  { slot: 'ring', rarity: 'common', level: 4 },
];

/**
 * Demo items for the mock API, only in `vite dev` or when the page URL has `?demo`
 * (the e2e test uses that against the production build). The real API ignores this.
 */
export function demoInventory(
  dev: boolean = import.meta.env.DEV,
  search: string = typeof location === 'undefined' ? '' : location.search,
): Gear[] {
  return dev || new URLSearchParams(search).has('demo') ? DEMO_ITEMS : [];
}
