import type { Rarity, Slot } from '@taskbar-hero/game-rules';

/** Cat Café Quest display names. Internal ids (gold, shards, bossKey, slot and rarity keys) never change. */
export const LABELS = {
  hero: 'Mochi',
  gold: 'Fish',
  shards: 'Yarn',
  bossKey: 'Cat Key',
  power: 'Cat power',
  /** Shared reset-time wording, also used by the boss note. */
  resetTime: () => 'midnight Vietnam time (UTC+7)',
  slots: {
    weapon: 'Feather Wand',
    helm: 'Cat Ears',
    armor: 'Collar',
    ring: 'Bell',
  } satisfies Record<Slot, string>,
  rarities: {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  } satisfies Record<Rarity, string>,
  /** Relic names by rarity. The on-chain Relic ids map to these through /relics/{id}.json. */
  relics: {
    common: 'Paw Charm',
    rare: 'Silver Bell',
    epic: 'Moon Collar',
    legendary: 'Golden Maneki',
  } satisfies Record<Rarity, string>,
  /** Household bosses, cycled by boss level. */
  bosses: ['Yarn Giant', 'Vacuum Beast', 'Bathtub Tyrant', 'Laser Dot Phantom', 'Cucumber Scare'],
} as const;

export function bossName(level: number): string {
  const n = LABELS.bosses.length;
  return LABELS.bosses[(((Math.floor(level) - 1) % n) + n) % n] ?? LABELS.bosses[0];
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
