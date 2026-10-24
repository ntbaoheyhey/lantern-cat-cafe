import { CONFIG, dayIndex, forgeBlock, goldPerSecond, heroPower, newPlayer, type Gear } from '@taskbar-hero/game-rules';
import type { OwnedGear, RelicVoucher, ServerState, TodayRelic } from './types';

/**
 * The stored numbers a ServerState is derived from. The Edge Functions fill it from Postgres
 * rows, MockGameApi from its in-memory player; both then call `buildServerState`, so the
 * derived fields (power, gold/s, attempts left, forge block) cannot drift between them.
 */
export interface StoredState {
  gold: number;
  shards: number;
  bossKeys: number;
  bossLevel: number;
  /** Every owned item, equipped ones included. */
  inventory: readonly OwnedGear[];
  attemptsToday: number;
  keyEarnedToday: boolean;
  /** True once today's Relic has been forged (paid for), minted or not. */
  forgedToday: boolean;
  pending: RelicVoucher | null;
  /** Today's forged Relic, or null. */
  today: TodayRelic | null;
}

/** Pure: stored numbers and the server clock (ms) to the state the API returns. */
export function buildServerState(stored: StoredState, nowMs: number): ServerState {
  const inventory = stored.inventory.map((g) => ({ ...g }));
  const gear: Gear[] = inventory.filter((g) => g.equipped).map(({ slot, rarity, level }) => ({ slot, rarity, level }));
  const power = heroPower(gear);
  const day = dayIndex(nowMs / 1000);
  const player = {
    ...newPlayer(),
    shards: stored.shards,
    bossKeys: stored.bossKeys,
    lastForgeDay: stored.forgedToday ? day : -1,
  };
  return {
    gold: stored.gold,
    shards: stored.shards,
    gear,
    inventory,
    bossLevel: stored.bossLevel,
    bossKeys: stored.bossKeys,
    boss: {
      level: stored.bossLevel,
      attemptsToday: stored.attemptsToday,
      attemptsLeft: Math.max(0, CONFIG.boss.maxAttemptsPerDay - stored.attemptsToday),
      keyEarnedToday: stored.keyEarnedToday,
    },
    forge: {
      blockedBy: stored.pending ? null : forgeBlock(player, day),
      forgedToday: stored.forgedToday,
      pending: stored.pending ? { ...stored.pending } : null,
      today: stored.today ? { ...stored.today } : null,
    },
    power,
    goldPerSecond: goldPerSecond(power),
    serverTime: nowMs / 1000,
  };
}
