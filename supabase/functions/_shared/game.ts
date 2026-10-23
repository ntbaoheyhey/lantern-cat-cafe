// Server logic for the game-state, idle-claim and equip Edge Functions (docs/api.md).
// Runtime-neutral (no Deno or Node globals besides WebCrypto) so supabase/tests can run it in
// Node against PGlite. Deno wiring lives in game-server.ts.
import {
  CONFIG,
  computeClaimGains,
  dayIndex,
  gearStat,
  goldPerSecond,
  heroPower,
  starterGear,
  type Gear,
  type Seed,
} from "@taskbar-hero/game-rules";
import type {
  ClaimResult,
  GameApiErrorCode,
  OwnedGear,
  ServerState,
} from "../../../apps/web/src/api/GameApi.ts";

/** Minimum seconds between two claims that count (docs/api.md). */
export const MIN_CLAIM_INTERVAL_SECONDS = 10;

const STATUS: Record<GameApiErrorCode, number> = {
  unauthenticated: 401,
  not_owner: 403,
  not_found: 404,
  rate_limited: 429,
  no_attempts_left: 409,
  server_error: 500,
};

export class GameError extends Error {
  readonly status: number;
  constructor(readonly code: GameApiErrorCode, message: string = code) {
    super(message);
    this.name = "GameError";
    this.status = STATUS[code];
  }
}

/** Gear as stored: a game-rules Gear plus its stored power. */
export type GearRow = Gear & { power: number };

/** What `game_snapshot` returns (supabase/migrations/20260104000000_game_api.sql). */
export interface Snapshot {
  gold: number;
  shards: number;
  bossLevel: number;
  /** last_claim_at in whole microseconds since the Unix epoch. */
  lastClaimMicros: number;
  bossKeys: number;
  attemptsToday: number;
  keyEarnedToday: boolean;
  gear: OwnedGear[];
}

/** The SQL functions, called as service_role. */
export interface GameStore {
  snapshot(playerId: string, day: string, starter: GearRow[]): Promise<Snapshot | null>;
  claim(args: {
    playerId: string;
    expectedLastMicros: number;
    now: string;
    gold: number;
    shards: number;
    drops: GearRow[];
  }): Promise<OwnedGear[] | null>;
  equip(playerId: string, gearId: string): Promise<boolean>;
}

export interface GameDeps {
  store: GameStore;
  /** Secret mixed into claim seeds so clients cannot predict drops. */
  seedSecret: string;
  /** Server clock in milliseconds. */
  now?: () => number;
}

const toRow = (g: Gear): GearRow => ({ slot: g.slot, rarity: g.rarity, level: g.level, power: Math.round(gearStat(g)) });

/** Game day as a SQL date: 1970-01-01 plus dayIndex (UTC+7 days). */
export function dayDate(unixSeconds: number): string {
  return new Date(dayIndex(unixSeconds) * 86_400_000).toISOString().slice(0, 10);
}

/**
 * Seed for the claim that starts at `lastClaimMicros` (last_claim_at in microseconds): the first
 * 4 bytes, big-endian, of HMAC-SHA256(secret, "<playerId>:<lastClaimMicros>"). One seed per claim
 * window, and
 * unknown to the client, so it cannot pick a claim time with better drops.
 */
export async function claimSeed(secret: string, playerId: string, lastClaimMicros: number): Promise<Seed> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${playerId}:${lastClaimMicros}`)));
  return ((mac[0]! << 24) | (mac[1]! << 16) | (mac[2]! << 8) | mac[3]!) >>> 0;
}

function toState(s: Snapshot, nowMs: number): ServerState {
  const inventory = s.gear.map((g) => ({ ...g }));
  const gear: Gear[] = inventory.filter((g) => g.equipped).map(({ slot, rarity, level }) => ({ slot, rarity, level }));
  const power = heroPower(gear);
  const attemptsToday = Number(s.attemptsToday);
  return {
    gold: Number(s.gold),
    shards: Number(s.shards),
    gear,
    inventory,
    bossLevel: s.bossLevel,
    bossKeys: Number(s.bossKeys),
    boss: {
      level: s.bossLevel,
      attemptsToday,
      attemptsLeft: Math.max(0, CONFIG.boss.maxAttemptsPerDay - attemptsToday),
      keyEarnedToday: s.keyEarnedToday,
    },
    power,
    goldPerSecond: goldPerSecond(power),
    serverTime: nowMs / 1000,
  };
}

async function load(deps: GameDeps, playerId: string, nowMs: number): Promise<Snapshot> {
  const s = await deps.store.snapshot(playerId, dayDate(nowMs / 1000), starterGear().map(toRow));
  if (!s) throw new GameError("not_found");
  return s;
}

/** POST game-state */
export async function getState(deps: GameDeps, playerId: string): Promise<ServerState> {
  const nowMs = (deps.now ?? Date.now)();
  return toState(await load(deps, playerId, nowMs), nowMs);
}

/**
 * POST idle-claim: credit computeClaimGains(equipped gear, boss level, now - last_claim_at, seed):
 * full rate for the first CONFIG.idle.onlineWindowSeconds, offline rate after, capped at
 * CONFIG.idle.offlineCapSeconds. Within 10 s of the previous claim, or
 * when a concurrent claim wins, nothing is added and drops is empty.
 */
export async function claim(deps: GameDeps, playerId: string): Promise<ClaimResult> {
  const nowMs = (deps.now ?? Date.now)();
  const before = await load(deps, playerId, nowMs);
  const elapsed = nowMs / 1000 - before.lastClaimMicros / 1e6;
  if (elapsed < MIN_CLAIM_INTERVAL_SECONDS) return { ...toState(before, nowMs), drops: [] };

  const { gear } = toState(before, nowMs);
  const seed = await claimSeed(deps.seedSecret, playerId, before.lastClaimMicros);
  const gains = computeClaimGains({ gear, bossLevel: before.bossLevel }, elapsed, seed);
  const drops = await deps.store.claim({
    playerId,
    expectedLastMicros: before.lastClaimMicros,
    now: new Date(nowMs).toISOString(),
    gold: gains.gold,
    shards: gains.shards,
    drops: gains.drops.map(toRow),
  });
  return { ...toState(await load(deps, playerId, nowMs), nowMs), drops: drops ?? [] };
}

/** POST equip { gearId } */
export async function equip(deps: GameDeps, playerId: string, gearId: unknown): Promise<ServerState> {
  // Anything that is not a uuid cannot be one of the player's items.
  if (typeof gearId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gearId)) {
    throw new GameError("not_owner");
  }
  const nowMs = (deps.now ?? Date.now)();
  await load(deps, playerId, nowMs);
  if (!(await deps.store.equip(playerId, gearId))) throw new GameError("not_owner");
  return toState(await load(deps, playerId, nowMs), nowMs);
}

export interface HttpDeps {
  /** Player id from the request's session JWT; throws GameError("unauthenticated") otherwise. */
  authenticate(req: Request): Promise<string>;
  /** JSON response with the function's CORS headers. */
  json(req: Request, body: unknown, status?: number): Response;
}

/**
 * Wrap a POST handler: CORS preflight, method check, JWT -> player id, GameError -> its status.
 * Only `fn` sees the body, and only equip reads it (gearId); player, wallet and time come from
 * the JWT and the server clock.
 */
export function gameHandler(
  http: HttpDeps,
  fn: (playerId: string, body: Record<string, unknown>) => Promise<unknown>,
): (req: Request) => Promise<Response> {
  return async (req) => {
    // Preflight: the CORS headers json() sets, with no body.
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: http.json(req, {}).headers });
    if (req.method !== "POST") return http.json(req, { error: "method_not_allowed" }, 405);
    try {
      const player = await http.authenticate(req);
      const body: unknown = await req.json().catch(() => ({}));
      return http.json(req, await fn(player, body && typeof body === "object" ? (body as Record<string, unknown>) : {}));
    } catch (e) {
      if (e instanceof GameError) return http.json(req, { error: e.code }, e.status);
      console.error(e);
      return http.json(req, { error: "server_error" }, 500);
    }
  };
}

/** The three B3 endpoints, keyed by Edge Function name. */
export function routes(deps: GameDeps): Record<"game-state" | "idle-claim" | "equip", (playerId: string, body: Record<string, unknown>) => Promise<unknown>> {
  return {
    "game-state": (player) => getState(deps, player),
    "idle-claim": (player) => claim(deps, player),
    equip: (player, body) => equip(deps, player, body.gearId),
  };
}
