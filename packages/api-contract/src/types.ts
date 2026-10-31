import type { BossResult, ForgeBlock, Gear, Rarity } from '@taskbar-hero/game-rules';

/** A gear item the player owns. `id` is the server's row id. */
export interface OwnedGear extends Gear {
  id: string;
  equipped: boolean;
}

/** Today's boss status. "Today" resets at midnight UTC+7 (game-rules dayIndex). */
export interface BossStatus {
  /** Boss the player faces next. */
  level: number;
  attemptsToday: number;
  /** CONFIG.boss.maxAttemptsPerDay minus attemptsToday, never below 0. */
  attemptsLeft: number;
  /** True once today's Boss Key has been granted. */
  keyEarnedToday: boolean;
}

/**
 * A signed RelicNFT mint voucher (EIP-712, docs/contracts.md). Pass the fields to
 * `RelicNFT.mint({player, relicId, rarity, nonce, expiry}, signature)` from the player's wallet.
 * uint256 values are decimal strings so they survive JSON.
 */
export interface RelicVoucher {
  /** Existing relic_forges.id. Public, stable across voucher replacements. */
  claimId: string;
  player: `0x${string}`;
  /** relicIdFor(rarity) from game-rules: one relicId per rarity tier. */
  relicId: string;
  /** Rarity index into CONFIG.rarities (uint8 on chain). */
  rarity: number;
  rarityName: Rarity;
  nonce: string;
  /** Unix seconds; the contract rejects the voucher after this. */
  expiry: number;
  signature: `0x${string}`;
}

/** A paid voucher that cannot be signed yet. It must remain visible to the player. */
export interface RecoverableRelicVoucher extends Omit<RelicVoucher, 'signature'> {
  signature: null;
  recoverable: true;
}
export type PendingRelicVoucher = RelicVoucher | RecoverableRelicVoucher;

/** The Relic forged (paid for) today, minted or not. */
export interface TodayRelic {
  claimId: string;
  recoverable?: true;
  relicId: string;
  rarityName: Rarity;
  /** True once the server has confirmed the mint on Fuji. */
  minted: boolean;
  /** The confirmed mint transaction, when known. */
  txHash: `0x${string}` | null;
}

/** Today's forge status. "Today" resets at midnight UTC+7. */
export interface ForgeStatus {
  /** Null when a forge is allowed now, otherwise why not (game-rules forgeBlock). */
  blockedBy: ForgeBlock | null;
  /** True once today's Relic has been forged (paid for), minted or not. */
  forgedToday: boolean;
  /**
   * The paid, not yet minted voucher, if any. Re-fetching never re-rolls: an expired one is
   * re-signed with the same relicId and rarity, a new nonce and a new expiry.
   */
  pending: PendingRelicVoucher | null;
  recoverable?: true;
  /** Today's forged Relic, or null when none was forged today. */
  today: TodayRelic | null;
}

/** Authoritative account snapshot. The server's numbers always win. */
export interface ServerState {
  gold: number;
  shards: number;
  /** Equipped gear only, at most one per slot. Drives power. */
  gear: Gear[];
  /** Every item the player owns, equipped ones included. */
  inventory: OwnedGear[];
  bossLevel: number;
  /** Unspent Boss Keys. */
  bossKeys: number;
  boss: BossStatus;
  forge: ForgeStatus;
  power: number;
  goldPerSecond: number;
  /** Unix seconds on the server clock. */
  serverTime: number;
}

export interface ClaimResult extends ServerState {
  /** Gear dropped since the previous claim, already added to inventory. */
  drops: OwnedGear[];
}

export interface BossFightResult {
  /** The server's fight; the client replays `result.log` and never re-simulates. */
  result: BossResult;
  /** True when this win granted today's Boss Key. */
  keyGranted: boolean;
  /** State after the fight (attempts, keys, boss level). */
  state: ServerState;
}

export interface ForgeResult {
  claimId: string;
  /** The voucher to mint (new, or today's pending one). */
  voucher: RelicVoucher;
  /** State after paying (shards and one Boss Key spent on a new forge). */
  state: ServerState;
}

/** Mint reports identify their claim even when it was forged on an earlier day. */
export interface MintReportResult extends ServerState {
  claimId: string;
}

/**
 * Seam between the client and the server. MockGameApi runs in the browser;
 * the Supabase implementation (B3, B4) calls the Edge Functions in docs/api.md.
 */
export interface GameApi {
  getState(): Promise<ServerState>;
  /** Credit everything earned since the last claim and return the new totals. */
  claim(): Promise<ClaimResult>;
  /** Equip an owned item, replacing whatever was in its slot. */
  equip(gearId: string): Promise<ServerState>;
  /** Fight the current boss once. Rejects with `no_attempts_left` at the daily limit. */
  fightBoss(): Promise<BossFightResult>;
  /**
   * Raise one owned item (equipped or not) by one level for `upgradeCost(item)` gold (game-rules).
   * Rejects with `not_owner`, `not_enough_gold` or `max_level`.
   */
  upgrade(gearId: string): Promise<ServerState>;
  /**
   * Forge today's Relic: spend CONFIG.relic.shardCost shards and one Boss Key, roll the rarity,
   * return a signed voucher. If a paid voucher is still unminted, returns it instead (no new spend,
   * no re-roll). Rejects with `forge_blocked` (message = the ForgeBlock reason). The demo mock
   * returns a voucher with a dummy signature that the contract would reject: demo mode never mints.
   */
  forgeRelic(): Promise<ForgeResult>;
  /**
   * Report the mint transaction for the pending voucher. The server reads the receipt on Fuji and
   * clears `forge.pending` once it sees RelicForged for that nonce. Rejects with `not_found` (unknown
   * nonce) or `mint_not_confirmed` (tx missing, failed or for another voucher; safe to retry).
   */
  reportMint(nonce: string, txHash: `0x${string}`): Promise<MintReportResult>;
}
