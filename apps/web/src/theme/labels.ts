import type { Rarity, Slot } from '@taskbar-hero/game-rules';

/** The daily reset is midnight UTC+7, which is 17:00 UTC (game-rules CONFIG.time.dayOffsetSeconds). */
const RESET_UTC_HOUR = 17;

/**
 * "midnight Vietnam time (UTC+7)", plus the next reset in the player's own time zone, e.g.
 * "midnight Vietnam time (UTC+7), 11:00 AM your time". Display only. `now` and `timeZone` are for tests.
 */
function resetTimeText(now: Date = new Date(), timeZone?: string): string {
  const vietnam = 'midnight Vietnam time (UTC+7)';
  const next = new Date(now);
  next.setUTCHours(RESET_UTC_HOUR, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const fmt = (zone?: string) =>
    new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', timeZone: zone }).format(next);
  const local = fmt(timeZone);
  // Already in Vietnam's zone: the local time would just repeat "midnight".
  if (local === fmt('Asia/Ho_Chi_Minh')) return vietnam;
  return `${vietnam}, ${local} your time`;
}

/** Cat Café Quest display names. Internal ids (gold, shards, bossKey, slot and rarity keys) never change. */
export const LABELS = {
  hero: 'Mochi',
  gold: 'Fish',
  shards: 'Yarn',
  bossKey: 'Cat Key',
  power: 'Cat power',
  /** Shared reset-time wording, also used by the boss note. */
  resetTime: resetTimeText,
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
