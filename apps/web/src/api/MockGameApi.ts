import {
  CONFIG,
  computeClaimGains,
  dayIndex,
  deriveSeed,
  forgeBlock,
  goldPerSecond,
  heroPower,
  newPlayer,
  rarityIndex,
  relicIdFor,
  rollRelicRarity,
  simulateBoss,
  upgradeCost,
  type Gear,
  type PlayerState,
  type Seed,
} from '@taskbar-hero/game-rules';
import {
  GameApiError,
  type BossFightResult,
  type ClaimResult,
  type ForgeResult,
  type GameApi,
  type OwnedGear,
  type RelicVoucher,
  type ServerState,
} from './GameApi';

/** Demo vouchers carry this all-zero signature; RelicNFT rejects it, so demo mode never mints. */
export const DEMO_SIGNATURE = `0x${'00'.repeat(65)}` as const;
const DEMO_PLAYER = '0x0000000000000000000000000000000000000000' as const;
const VOUCHER_TTL_SECONDS = 30 * 60;

export interface MockGameApiOptions {
  seed?: Seed;
  /** Clock in milliseconds; inject a fake one in tests. */
  now?: () => number;
  /** Extra unequipped items to start with (for UI tests and demos). */
  inventory?: Gear[];
  /** Starting balances (for UI tests and demos), e.g. enough to forge right away. */
  start?: Partial<Pick<PlayerState, 'gold' | 'shards' | 'bossKeys'>>;
}

/** In-memory stand-in for the server, computing with game-rules. Same rules as docs/api.md. */
export class MockGameApi implements GameApi {
  private readonly player: PlayerState = newPlayer();
  private readonly inventory: OwnedGear[];
  private readonly seed: Seed;
  private readonly now: () => number;
  private lastClaimMs: number;
  private claims = 0;
  private fights = 0;
  private nextId = 1;
  private attemptsDay = -1;
  private attemptsToday = 0;
  private forges = 0;
  private pending: RelicVoucher | null = null;

  constructor(opts: MockGameApiOptions = {}) {
    this.seed = opts.seed ?? 12345;
    this.now = opts.now ?? Date.now;
    Object.assign(this.player, opts.start);
    this.lastClaimMs = this.now();
    this.inventory = [
      ...this.player.gear.map((g) => this.own(g, true)),
      ...(opts.inventory ?? []).map((g) => this.own(g, false)),
    ];
  }

  private own(g: Gear, equipped: boolean): OwnedGear {
    return { ...g, id: `mock-${this.nextId++}`, equipped };
  }

  private today(): number {
    return dayIndex(Math.floor(this.now() / 1000));
  }

  private rollDay(): void {
    const today = this.today();
    if (this.attemptsDay !== today) {
      this.attemptsDay = today;
      this.attemptsToday = 0;
    }
  }

  private snapshot(): ServerState {
    this.rollDay();
    const gear = this.inventory.filter((g) => g.equipped).map(({ slot, rarity, level }) => ({ slot, rarity, level }));
    this.player.gear = gear;
    const power = heroPower(gear);
    return {
      gold: this.player.gold,
      shards: this.player.shards,
      gear,
      inventory: this.inventory.map((g) => ({ ...g })),
      bossLevel: this.player.bossLevel,
      bossKeys: this.player.bossKeys,
      boss: {
        level: this.player.bossLevel,
        attemptsToday: this.attemptsToday,
        attemptsLeft: Math.max(0, CONFIG.boss.maxAttemptsPerDay - this.attemptsToday),
        keyEarnedToday: this.player.lastBossKeyDay === this.today(),
      },
      forge: {
        blockedBy: this.pending ? null : forgeBlock(this.player, this.today()),
        forgedToday: this.player.lastForgeDay === this.today(),
        pending: this.pending ? { ...this.pending } : null,
      },
      power,
      goldPerSecond: goldPerSecond(power),
      serverTime: this.now() / 1000,
    };
  }

  getState(): Promise<ServerState> {
    return Promise.resolve(this.snapshot());
  }

  claim(): Promise<ClaimResult> {
    const nowMs = this.now();
    const elapsed = Math.max(0, (nowMs - this.lastClaimMs) / 1000);
    this.lastClaimMs = nowMs;
    const gains = computeClaimGains(this.player, elapsed, deriveSeed(this.seed, ++this.claims));
    this.player.gold += gains.gold;
    this.player.shards += gains.shards;
    const drops = gains.drops.map((g) => this.own(g, false));
    this.inventory.push(...drops);
    return Promise.resolve({ ...this.snapshot(), drops: drops.map((g) => ({ ...g })) });
  }

  equip(gearId: string): Promise<ServerState> {
    const item = this.inventory.find((g) => g.id === gearId);
    if (!item) return Promise.reject(new GameApiError('not_owner'));
    for (const g of this.inventory) if (g.slot === item.slot) g.equipped = false;
    item.equipped = true;
    return Promise.resolve(this.snapshot());
  }

  upgrade(gearId: string): Promise<ServerState> {
    const item = this.inventory.find((g) => g.id === gearId);
    if (!item) return Promise.reject(new GameApiError('not_owner'));
    const cost = upgradeCost(item);
    if (cost === null) return Promise.reject(new GameApiError('max_level'));
    if (this.player.gold < cost) return Promise.reject(new GameApiError('not_enough_gold'));
    this.player.gold -= cost;
    item.level += 1;
    return Promise.resolve(this.snapshot());
  }

  fightBoss(): Promise<BossFightResult> {
    this.rollDay();
    if (this.attemptsToday >= CONFIG.boss.maxAttemptsPerDay) {
      return Promise.reject(new GameApiError('no_attempts_left'));
    }
    this.attemptsToday++;
    const before = this.snapshot();
    const result = simulateBoss(before.power, this.player.bossLevel, deriveSeed(this.seed, 1000 + ++this.fights));
    let keyGranted = false;
    if (result.won) {
      this.player.bossLevel = Math.min(CONFIG.boss.maxLevel, this.player.bossLevel + 1);
      if (this.player.lastBossKeyDay !== this.today()) {
        this.player.lastBossKeyDay = this.today();
        this.player.bossKeys += 1;
        keyGranted = true;
      }
    }
    return Promise.resolve({ result, keyGranted, state: this.snapshot() });
  }

  forgeRelic(): Promise<ForgeResult> {
    const nowS = Math.floor(this.now() / 1000);
    if (this.pending) {
      // Same relic, fresh nonce and expiry once expired; never re-roll or charge again.
      if (this.pending.expiry <= nowS) {
        this.pending = { ...this.pending, nonce: String(++this.forges), expiry: nowS + VOUCHER_TTL_SECONDS };
      }
      return Promise.resolve({ voucher: { ...this.pending }, state: this.snapshot() });
    }
    const blocked = forgeBlock(this.player, this.today());
    if (blocked) return Promise.reject(new GameApiError('forge_blocked', blocked));
    this.player.shards -= CONFIG.relic.shardCost;
    this.player.bossKeys -= CONFIG.relic.bossKeyCost;
    this.player.lastForgeDay = this.today();
    const rarity = rollRelicRarity(deriveSeed(this.seed, 2000 + ++this.forges));
    this.pending = {
      player: DEMO_PLAYER,
      relicId: String(relicIdFor(rarity)),
      rarity: rarityIndex(rarity),
      rarityName: rarity,
      nonce: String(this.forges),
      expiry: nowS + VOUCHER_TTL_SECONDS,
      signature: DEMO_SIGNATURE,
    };
    return Promise.resolve({ voucher: { ...this.pending }, state: this.snapshot() });
  }

  reportMint(nonce: string, _txHash: `0x${string}`): Promise<ServerState> {
    if (!this.pending || this.pending.nonce !== nonce) return Promise.reject(new GameApiError('not_found'));
    this.pending = null;
    return Promise.resolve(this.snapshot());
  }
}
