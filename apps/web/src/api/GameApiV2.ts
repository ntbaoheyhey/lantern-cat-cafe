// Cat RPG v2 API contract (card V7). Types and the interface only: no implementation.
// MockGameApiV2 (browser) and SupabaseGameApiV2 (Edge Functions `v2-*`) must both satisfy
// `GameApiV2`. Written out in docs/api-v2.md. v1 (GameApi.ts, docs/api.md) is unchanged until
// the cut-over (V29).
import type { ForgeStatus, GameApiErrorCode, RelicVoucher, TodayRelic } from '@taskbar-hero/api-contract';
import type { v2 } from '@taskbar-hero/game-rules';

export type ClassId = v2.ClassId;
export type GearSlotId = v2.GearSlotId;
export type GearRarityId = v2.GearRarityId;
export type StatId = v2.StatId;
export type WeaponType = v2.WeaponType;
export type MaterialId = v2.MaterialId;

/** Recipe ids are `rcp.<gear rarity>` (game-rules v2 RECIPES). The Relic recipe is not craftable here. */
export type RecipeId = `rcp.${GearRarityId}`;

/** Every countable thing in `player_stacks`: Fish plus the registry materials (Yarn and cat keys included). */
export type StackId = 'fish' | MaterialId;

/** Materials other than Yarn and keys, which have their own fields. */
export type OtherMaterialId = Exclude<MaterialId, 'yarn' | 'catKey'>;
export type MaterialStacks = Partial<Record<OtherMaterialId, number>>;

/** One bonus line on an item. Stats themselves are derived (deriveStats), never sent. */
export interface BonusLineV2 {
  stat: StatId;
  value: number;
}

/** A gear item the player owns. `id` is the server's row id (uuid). */
export interface ItemV2 {
  id: string;
  /** Catalog id from the content registry, e.g. `wpn.bow.willow`. */
  itemKey: string;
  slot: GearSlotId;
  /** Set only when slot is `weapon`. */
  weaponType?: WeaponType;
  rarity: GearRarityId;
  level: number;
  bonus: BonusLineV2[];
  locked: boolean;
  equipped: boolean;
}

/** An item the bag had no room for. It was salvaged at once; its yield is inside the loot totals. */
export interface AutoSalvagedV2 {
  itemKey: string;
  slot: GearSlotId;
  weaponType?: WeaponType;
  rarity: GearRarityId;
  level: number;
}

/** What a claim, a boss chest or a salvage handed out. Numbers are what was actually added (key cap applied). */
export interface LootV2 {
  fish: number;
  yarn: number;
  materials: MaterialStacks;
  keys: number;
  /** New items now in the bag, equipped = false. */
  items: ItemV2[];
  /** Items that did not fit in the bag. Their salvage yield is already counted in fish/yarn/materials. */
  autoSalvaged: AutoSalvagedV2[];
}

export interface GainsV2 extends LootV2 {
  xp: number;
  levelsGained: number;
}

export interface CatV2 {
  /** Null until the player picks a class (v2-choose-class). */
  classId: ClassId | null;
  level: number;
  /** XP into the current level. */
  xp: number;
  xpToNext: number;
}

export interface ProgressV2 {
  chapter: number;
  round: number;
  /** Kills in the current round. */
  kills: number;
  killsPerRound: number;
  /** True when the cat is too weak to advance (idle farming waits at the gate). */
  gated: boolean;
  /** Power needed to pass the gate; meaningful when `gated`. */
  neededPower: number;
}

export interface CurrenciesV2 {
  fish: number;
  yarn: number;
  /** Boss keys (stack `catKey`), at most the config cap. */
  keys: number;
}

export interface BossClearV2 {
  chapter: number;
  cleared: boolean;
  /** Boss wins in this chapter (rematches count). */
  wins: number;
}

export interface BossesV2 {
  chapters: BossClearV2[];
  /** Unix seconds. One per player: after a loss, no boss fight in any chapter until then. Null when ready. */
  cooldownUntil: number | null;
}

/** Why the Relic forge is blocked, in check order (game-rules v2 relicForgeBlockV2). */
export type ForgeBlockV2 = 'daily_limit' | 'not_enough_yarn' | 'no_moon_pearl';

/** Same shape as v1 `ForgeStatus`, with the v2 block reasons. `pending` and `today` are the v1 types. */
export interface ForgeStatusV2 extends Omit<ForgeStatus, 'blockedBy' | 'pending' | 'today'> {
  blockedBy: ForgeBlockV2 | null;
  forgedToday: boolean;
  pending: RelicVoucher | null;
  today: TodayRelic | null;
}

/** Authoritative account snapshot. Every v2 response carries one. The server's numbers win. */
export interface ServerStateV2 {
  cat: CatV2;
  progress: ProgressV2;
  currencies: CurrenciesV2;
  /** Stacks other than Fish, Yarn and keys; absent id = 0. */
  materials: MaterialStacks;
  /** Every owned item, equipped ones included. */
  inventory: ItemV2[];
  bagLimit: number;
  /** All 9 slots: the equipped item id or null. */
  equipped: Record<GearSlotId, string | null>;
  /** Slots the cat level has unlocked. */
  unlockedSlots: GearSlotId[];
  bosses: BossesV2;
  forge: ForgeStatusV2;
  /** True for players who received the Founder bundle at cut-over. */
  founder: boolean;
  /** Unix seconds on the server clock. */
  serverTime: number;
}

/** One step of a boss fight replay. `t` is ms from fight start. The client replays it and never re-simulates. */
export interface TimelineEventV2 {
  t: number;
  type: 'attack_start' | 'impact' | 'boss_windup' | 'boss_impact' | 'dot' | 'end';
  damage?: number;
  crit?: boolean;
  catHp?: number;
  bossHp?: number;
  /** boss_windup and boss_impact: the telegraphed big attack. */
  big?: boolean;
  /** boss_impact: the cat dodged, taking zero damage. */
  dodged?: boolean;
}

export interface ClaimResultV2 {
  gains: GainsV2;
  state: ServerStateV2;
}

export interface BossFightResultV2 {
  won: boolean;
  timeline: TimelineEventV2[];
  /** Present on a win (first clear or rematch chest). */
  chest?: LootV2;
  /** True when the win spent a key. A loss keeps the key and starts the cooldown. */
  keySpent: boolean;
  state: ServerStateV2;
}

export interface CraftResultV2 {
  item: ItemV2;
  state: ServerStateV2;
}

export interface SalvageResultV2 {
  /** Materials, Yarn and Fish returned for the salvaged items. */
  gains: Pick<LootV2, 'fish' | 'yarn' | 'materials'>;
  state: ServerStateV2;
}

export interface ForgeResultV2 {
  /** The voucher to mint (new, or today's pending one). Same shape as v1. */
  voucher: RelicVoucher;
  state: ServerStateV2;
}

/** v2 refusals. v1 codes that still apply keep their names and statuses. */
export const ERROR_CODES_V2 = [
  'unauthenticated',
  'invalid_request',
  'not_found',
  'rate_limited',
  'server_error',
  'no_class',
  'not_owner',
  'wrong_slot',
  'slot_locked',
  'wrong_weapon',
  'stale',
  'cooldown',
  'not_reached',
  'no_key',
  'not_enough',
  'bag_full',
  'equipped',
  'locked',
  'forge_blocked',
] as const;

export type GameApiErrorCodeV2 = (typeof ERROR_CODES_V2)[number];

/** HTTP status per code (docs/api-v2.md). Refusals of a valid request in the wrong game state are 409. */
export const HTTP_STATUS_V2: Record<GameApiErrorCodeV2, number> = {
  unauthenticated: 401,
  invalid_request: 400,
  not_found: 404,
  rate_limited: 429,
  server_error: 500,
  no_class: 409,
  not_owner: 403,
  wrong_slot: 409,
  slot_locked: 409,
  wrong_weapon: 409,
  stale: 409,
  cooldown: 409,
  not_reached: 409,
  no_key: 409,
  not_enough: 409,
  bag_full: 409,
  equipped: 409,
  locked: 409,
  forge_blocked: 409,
};

/** Extra fields of the error body `{ error, ... }`. */
export interface GameApiErrorBodyV2 {
  error: GameApiErrorCodeV2;
  /** `forge_blocked` only. */
  reason?: ForgeBlockV2;
  /** `not_enough` only: the first missing stack. */
  stack?: StackId;
  /** `cooldown` only: unix seconds when the fight is possible again. */
  cooldownUntil?: number;
}

/** Every v1 code a v2 call can still raise is also a v1 code (compile-time check). */
export type V1CodesKeptInV2 = Extract<GameApiErrorCodeV2, GameApiErrorCode>;

/**
 * Seam between the client and the server for v2. One method per Edge Function `v2-*`.
 * Every method resolves with the new ServerStateV2 (directly or in `state`) and rejects with a
 * GameApiError-like error whose code is a GameApiErrorCodeV2.
 */
export interface GameApiV2 {
  /** v2-state */
  getState(): Promise<ServerStateV2>;
  /** v2-claim: credit everything earned since the last claim (min 10 s apart). */
  claim(): Promise<ClaimResultV2>;
  /**
   * v2-equip: equip an owned item in `slot`, or empty the slot with `itemId = null`.
   * Rejects `no_class`, `not_owner`, `wrong_slot`, `slot_locked`, `wrong_weapon`, `stale`.
   */
  equip(itemId: string | null, slot: GearSlotId): Promise<ServerStateV2>;
  /** v2-choose-class: pick or change the class. Rejects `invalid_request` for an unknown class. */
  chooseClass(classId: ClassId): Promise<ServerStateV2>;
  /** v2-boss-fight: fight a chapter boss. Rejects `no_class`, `cooldown`, `not_reached`, `no_key`, `stale`. */
  fightBoss(chapter: number): Promise<BossFightResultV2>;
  /** v2-craft: craft a guaranteed-rarity item for `slot`. Rejects `no_class`, `not_enough`, `bag_full`. */
  craft(recipeId: RecipeId, slot: GearSlotId): Promise<CraftResultV2>;
  /** v2-salvage: all or nothing. Rejects `not_owner`, `equipped`, `locked`. */
  salvage(itemIds: string[]): Promise<SalvageResultV2>;
  /** v2-lock: set the locked flag. Rejects `not_owner`. */
  setLocked(itemId: string, locked: boolean): Promise<ServerStateV2>;
  /** v2-relic-forge: 30 Yarn + 1 Moon Pearl, one per day shared with v1. Rejects `forge_blocked` (with `reason`). */
  forgeRelic(): Promise<ForgeResultV2>;
}
