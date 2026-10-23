import {
  CONFIG,
  computeIdleGains,
  dayIndex,
  deriveSeed,
  goldPerSecond,
  heroPower,
  newPlayer,
  simulateBoss,
  type Gear,
  type PlayerState,
  type Seed,
} from '@taskbar-hero/game-rules';
import {
  GameApiError,
  type BossFightResult,
  type ClaimResult,
  type GameApi,
  type OwnedGear,
  type ServerState,
} from './GameApi';

export interface MockGameApiOptions {
  seed?: Seed;
  /** Clock in milliseconds; inject a fake one in tests. */
  now?: () => number;
  /** Extra unequipped items to start with (for UI tests and demos). */
  inventory?: Gear[];
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

  constructor(opts: MockGameApiOptions = {}) {
    this.seed = opts.seed ?? 12345;
    this.now = opts.now ?? Date.now;
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
    const gains = computeIdleGains(this.player, elapsed, deriveSeed(this.seed, ++this.claims));
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
}
