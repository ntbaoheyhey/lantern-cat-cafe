// Server logic for the game Edge Functions (docs/api.md).
// Runtime-neutral (no Deno or Node globals besides WebCrypto) so supabase/tests can run it in
// Node against PGlite. Deno wiring lives in game-server.ts.
import {
  CONFIG,
  computeClaimGains,
  dayIndex,
  forgeBlock,
  gearStat,
  goldPerSecond,
  heroPower,
  newPlayer,
  rarityIndex,
  relicIdFor,
  rollRelicRarity,
  simulateBoss,
  upgradeCost,
  starterGear,
  type ForgeBlock,
  type Gear,
  type Rarity,
  type Seed,
} from "@taskbar-hero/game-rules";
import {
  HTTP_STATUS,
  type BossFightResult,
  type ClaimResult,
  type Endpoint,
  type ForgeResult,
  type GameApiErrorCode,
  type ForgeStatus,
  type OwnedGear,
  type RelicVoucher,
  type ServerState,
  type TodayRelic,
} from "@taskbar-hero/api-contract";
import {
  REISSUE_GRACE_SECONDS,
  VOUCHER_TTL_SECONDS,
  checksumAddress,
  receiptMintsVoucher,
  type ChainReader,
  type VoucherFields,
  type VoucherSigner,
} from "./relic.ts";

/** Minimum seconds between two claims that count (docs/api.md). */
export const MIN_CLAIM_INTERVAL_SECONDS = 10;

export class GameError extends Error {
  readonly status: number;
  /** Sent as `reason` next to `error` (forge_blocked: the ForgeBlock). */
  readonly reason: string | undefined;
  constructor(readonly code: GameApiErrorCode, reason?: string) {
    super(reason ? `${code}: ${reason}` : code);
    this.name = "GameError";
    this.status = HTTP_STATUS[code];
    this.reason = reason;
  }
}

/** Gear as stored: a game-rules Gear plus its stored power. */
export type GearRow = Gear & { power: number };

/** A relic_vouchers row as `game_voucher_json` returns it (20260106000000_relic_forge.sql). */
export interface VoucherRow {
  /** players.wallet, lowercase. */
  player: string;
  relicId: string;
  rarityName: Rarity;
  nonce: string;
  /** Unix seconds. */
  expiry: number;
  /** Null until the server signs it (right after the forge). */
  signature: string | null;
  status: "issued" | "minted" | "expired";
}

/** What `game_snapshot` returns (supabase/migrations/20260104000000_game_api.sql, 20260106000000_relic_forge.sql). */
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
  /** True once a Relic was forged (paid) today. */
  forgedToday?: boolean;
  /** The player's live (issued, not minted) voucher, if any. */
  pending?: VoucherRow | null;
  /** Today's forged Relic and its mint state (filled by B7); absent = none. */
  today?: TodayRelic | null;
}

/** A snapshot whose pending voucher is signed and in API form. */
type Loaded = Omit<Snapshot, "pending"> & { pending: RelicVoucher | null };

export type ForgeOutcome =
  | { status: "pending" | "new"; voucher: VoucherRow }
  | { status: "blocked"; reason: ForgeBlock };

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
  /** game_boss_fight: null when the daily limit is reached, else whether a Boss Key was granted. */
  bossFight(args: {
    playerId: string;
    day: string;
    bossLevel: number;
    won: boolean;
    maxAttempts: number;
    maxLevel: number;
  }): Promise<boolean | null>;
  /**
   * game_upgrade: raise an owned item from expectedLevel by one for `cost` gold, storing `power`.
   * 'stale' when its level is no longer expectedLevel.
   */
  upgrade(args: {
    playerId: string;
    gearId: string;
    expectedLevel: number;
    cost: number;
    maxLevel: number;
    power: number;
  }): Promise<"ok" | "not_owner" | "stale" | "max_level" | "not_enough_gold">;
  /** game_forge: pay for today's forge, or report the pending voucher or the block. */
  forge(args: {
    playerId: string;
    day: string;
    relicId: number;
    rarity: Rarity;
    shardCost: number;
    keyCost: number;
    expiresAt: string;
  }): Promise<ForgeOutcome>;
  /** game_voucher_sign: store the signature of an issued voucher (kept if already set). */
  voucherSign(playerId: string, nonce: string, signature: string): Promise<boolean>;
  /** game_voucher_reissue: replace an issued voucher that expired before `now`; null if it did not. */
  voucherReissue(playerId: string, nonce: string, now: string, expiresAt: string): Promise<VoucherRow | null>;
  /** game_voucher: the player's voucher by nonce, any status; null if not theirs. */
  voucher(playerId: string, nonce: string): Promise<VoucherRow | null>;
  /** game_voucher_minted: mark minted; false if the voucher is not theirs. */
  voucherMinted(playerId: string, nonce: string, txHash: string | null): Promise<boolean>;
}

/** Relic forge wiring. Absent parts make relic-forge / relic-mint-report answer server_error. */
export interface RelicDeps {
  /** Signs with VOUCHER_SIGNER_PRIVATE_KEY for the deployed RelicNFT. */
  signer?: VoucherSigner;
  chain?: ChainReader;
  /** Deployed RelicNFT on Fuji. */
  nft?: `0x${string}`;
}

export interface GameDeps {
  store: GameStore;
  /** Secret mixed into claim seeds so clients cannot predict drops. */
  seedSecret: string;
  /** Server clock in milliseconds. */
  now?: () => number;
  relic?: RelicDeps;
}

const toRow = (g: Gear): GearRow => ({ slot: g.slot, rarity: g.rarity, level: g.level, power: Math.round(gearStat(g)) });

/** Game day as a SQL date: 1970-01-01 plus dayIndex (UTC+7 days). */
export function dayDate(unixSeconds: number): string {
  return new Date(dayIndex(unixSeconds) * 86_400_000).toISOString().slice(0, 10);
}

/** First 4 bytes, big-endian, of HMAC-SHA256(secret, message), as a uint32 seed. */
async function hmacSeed(secret: string, message: string): Promise<Seed> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return ((mac[0]! << 24) | (mac[1]! << 16) | (mac[2]! << 8) | mac[3]!) >>> 0;
}

/**
 * Seed for the claim that starts at `lastClaimMicros` (last_claim_at in microseconds):
 * hmacSeed(secret, "<playerId>:<lastClaimMicros>"). One seed per claim window, and unknown to the
 * client, so it cannot pick a claim time with better drops.
 */
export function claimSeed(secret: string, playerId: string, lastClaimMicros: number): Promise<Seed> {
  return hmacSeed(secret, `${playerId}:${lastClaimMicros}`);
}

/**
 * Seed for a boss fight: hmacSeed(secret, "boss:<playerId>:<day>:<attempt>"), where attempt is the
 * 1-based attempt number today. Each attempt has its own seed the client cannot know, and every
 * attempt is recorded, so a fight cannot be retried with the same seed.
 */
export function bossSeed(secret: string, playerId: string, day: string, attempt: number): Promise<Seed> {
  return hmacSeed(secret, `boss:${playerId}:${day}:${attempt}`);
}

/**
 * Seed for the day's Relic: hmacSeed(secret, "relic:<playerId>:<day>"). Fixed per player and day,
 * so concurrent forges roll the same rarity and a retry cannot re-roll.
 */
export function relicSeed(secret: string, playerId: string, day: string): Promise<Seed> {
  return hmacSeed(secret, `relic:${playerId}:${day}`);
}

function voucherFields(v: VoucherRow): VoucherFields {
  return {
    player: checksumAddress(v.player),
    relicId: BigInt(v.relicId),
    rarity: rarityIndex(v.rarityName),
    nonce: BigInt(v.nonce),
    expiry: BigInt(v.expiry),
  };
}

/** The voucher in API form, signing (and storing the signature) first if needed. */
async function signedVoucher(deps: GameDeps, signer: VoucherSigner | undefined, playerId: string, v: VoucherRow): Promise<RelicVoucher> {
  const fields = voucherFields(v);
  let signature = v.signature;
  if (!signature) {
    if (!signer) throw new GameError("server_error", "relic forge is not configured");
    signature = (await signer.sign(fields)).toLowerCase();
    await deps.store.voucherSign(playerId, v.nonce, signature);
  }
  return {
    player: fields.player,
    relicId: v.relicId,
    rarity: fields.rarity,
    rarityName: v.rarityName,
    nonce: v.nonce,
    expiry: Number(v.expiry),
    signature: signature as `0x${string}`,
  };
}

function forgeStatus(s: Loaded, nowMs: number): ForgeStatus {
  const today = dayIndex(nowMs / 1000);
  const pending = s.pending;
  const forgedToday = s.forgedToday ?? false;
  const player = { ...newPlayer(), shards: Number(s.shards), bossKeys: Number(s.bossKeys), lastForgeDay: forgedToday ? today : -1 };
  return { blockedBy: pending ? null : forgeBlock(player, today), forgedToday, pending, today: s.today ?? null };
}

function toState(s: Loaded, nowMs: number): ServerState {
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
    forge: forgeStatus(s, nowMs),
    power,
    goldPerSecond: goldPerSecond(power),
    serverTime: nowMs / 1000,
  };
}

async function load(deps: GameDeps, playerId: string, nowMs: number): Promise<Loaded> {
  const s = await deps.store.snapshot(playerId, dayDate(nowMs / 1000), starterGear().map(toRow));
  if (!s) throw new GameError("not_found");
  const row = s.pending ?? null;
  // A voucher is unsigned only between game_forge and game_voucher_sign; sign it if we can, else
  // leave it out until relic-forge does.
  const signer = deps.relic?.signer;
  const pending = row && (row.signature || signer) ? await signedVoucher(deps, signer, playerId, row) : null;
  return { ...s, pending };
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

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** POST equip { gearId } */
export async function equip(deps: GameDeps, playerId: string, gearId: unknown): Promise<ServerState> {
  // Anything that is not a uuid cannot be one of the player's items.
  if (typeof gearId !== "string" || !UUID.test(gearId)) throw new GameError("not_owner");
  const nowMs = (deps.now ?? Date.now)();
  await load(deps, playerId, nowMs);
  if (!(await deps.store.equip(playerId, gearId))) throw new GameError("not_owner");
  return toState(await load(deps, playerId, nowMs), nowMs);
}

/**
 * POST upgrade { gearId }: one level for upgradeCost(item) gold. The price is computed from the level
 * read here; game_upgrade refuses if that level changed meanwhile, and we then price it again.
 */
export async function upgrade(deps: GameDeps, playerId: string, gearId: unknown): Promise<ServerState> {
  if (typeof gearId !== "string" || !UUID.test(gearId)) throw new GameError("not_owner");
  const nowMs = (deps.now ?? Date.now)();
  for (let attempt = 0; attempt < 3; attempt++) {
    const s = await load(deps, playerId, nowMs);
    const item = s.gear.find((g) => g.id === gearId);
    if (!item) throw new GameError("not_owner");
    const cost = upgradeCost(item);
    if (cost === null) throw new GameError("max_level");
    if (Number(s.gold) < cost) throw new GameError("not_enough_gold");
    const out = await deps.store.upgrade({
      playerId,
      gearId,
      expectedLevel: item.level,
      cost,
      maxLevel: CONFIG.gear.maxLevel,
      power: toRow({ ...item, level: item.level + 1 }).power,
    });
    if (out === "ok") return toState(await load(deps, playerId, nowMs), nowMs);
    if (out !== "stale") throw new GameError(out);
  }
  // Upgraded concurrently three times in a row; the client can simply retry.
  throw new GameError("server_error");
}

/**
 * POST boss-fight: simulateBoss(power, bossLevel, bossSeed) with the equipped gear, then record it.
 * The daily limit is checked again in SQL, so parallel fights cannot pass it.
 */
export async function fightBoss(deps: GameDeps, playerId: string): Promise<BossFightResult> {
  const nowMs = (deps.now ?? Date.now)();
  const day = dayDate(nowMs / 1000);
  const before = toState(await load(deps, playerId, nowMs), nowMs);
  if (before.boss.attemptsLeft <= 0) throw new GameError("no_attempts_left");

  const seed = await bossSeed(deps.seedSecret, playerId, day, before.boss.attemptsToday + 1);
  const result = simulateBoss(before.power, before.bossLevel, seed);
  const keyGranted = await deps.store.bossFight({
    playerId,
    day,
    bossLevel: before.bossLevel,
    won: result.won,
    maxAttempts: CONFIG.boss.maxAttemptsPerDay,
    maxLevel: CONFIG.boss.maxLevel,
  });
  if (keyGranted === null) throw new GameError("no_attempts_left");
  return { result, keyGranted, state: toState(await load(deps, playerId, nowMs), nowMs) };
}

function relicParts<K extends keyof RelicDeps>(deps: GameDeps, ...keys: K[]): Required<Pick<RelicDeps, K>> {
  const r = deps.relic ?? {};
  for (const k of keys) {
    if (!r[k]) {
      console.error(`relic: ${k} not configured`);
      throw new GameError("server_error", "relic forge is not configured");
    }
  }
  return r as Required<Pick<RelicDeps, K>>;
}

/**
 * POST relic-forge: return the pending voucher (re-signed with a new nonce and expiry if it
 * expired), or pay for today's forge and return its new voucher. Rarity comes from relicSeed, so
 * every voucher for a forge has the same relicId and rarity (docs/contracts.md rule 1).
 */
export async function forgeRelic(deps: GameDeps, playerId: string): Promise<ForgeResult> {
  const { signer, chain } = relicParts(deps, "signer", "chain");
  const nowMs = (deps.now ?? Date.now)();
  const nowS = Math.floor(nowMs / 1000);
  const day = dayDate(nowS);
  const expiresAt = new Date((nowS + VOUCHER_TTL_SECONDS) * 1000).toISOString();
  const done = async (voucher: RelicVoucher): Promise<ForgeResult> => ({ voucher, state: toState(await load(deps, playerId, nowMs), nowMs) });

  const before = await load(deps, playerId, nowMs);
  const pending = before.pending;
  if (pending) {
    if (nowS <= pending.expiry + REISSUE_GRACE_SECONDS) return done(pending);
    // Expired. If it was minted anyway (never reported), record that instead of signing a second
    // voucher for the same paid forge; the forge below then applies the daily limit.
    if (await chain.nonceUsed(BigInt(pending.nonce))) {
      await deps.store.voucherMinted(playerId, pending.nonce, null);
    } else {
      const fresh = await deps.store.voucherReissue(playerId, pending.nonce, new Date(nowMs).toISOString(), expiresAt);
      if (fresh) return done(await signedVoucher(deps, signer, playerId, fresh));
      // A concurrent call re-issued it first: fall through and pick that one up.
    }
  }

  const rarity = rollRelicRarity(await relicSeed(deps.seedSecret, playerId, day));
  const out = await deps.store.forge({
    playerId,
    day,
    relicId: relicIdFor(rarity),
    rarity,
    shardCost: CONFIG.relic.shardCost,
    keyCost: CONFIG.relic.bossKeyCost,
    expiresAt,
  });
  if (out.status === "blocked") throw new GameError("forge_blocked", out.reason);
  return done(await signedVoucher(deps, signer, playerId, out.voucher));
}

/** uint256 nonces we issue fit in a Postgres bigint. */
const MAX_NONCE = 2n ** 63n - 1n;

/**
 * POST relic-mint-report { nonce, txHash }: mark the caller's voucher minted once its tx on Fuji is
 * a successful RelicNFT call that emitted RelicForged for exactly this voucher.
 */
export async function reportMint(deps: GameDeps, playerId: string, nonce: unknown, txHash: unknown): Promise<ServerState> {
  if (typeof nonce !== "string" || !/^[1-9][0-9]{0,18}$/.test(nonce) || BigInt(nonce) > MAX_NONCE) {
    throw new GameError("not_found");
  }
  if (typeof txHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new GameError("mint_not_confirmed");
  const { chain, nft } = relicParts(deps, "chain", "nft");
  const nowMs = (deps.now ?? Date.now)();

  const v = await deps.store.voucher(playerId, nonce);
  if (!v) throw new GameError("not_found");
  if (v.status !== "minted") {
    let ok = false;
    try {
      ok = receiptMintsVoucher(await chain.receipt(txHash as `0x${string}`), nft, voucherFields(v));
    } catch (e) {
      // RPC trouble: the client may retry.
      console.error(e);
    }
    if (!ok) throw new GameError("mint_not_confirmed");
    await deps.store.voucherMinted(playerId, nonce, txHash.toLowerCase());
  }
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
 * Only `fn` sees the body, and only equip and upgrade (gearId) and relic-mint-report (nonce, txHash) read it;
 * player, wallet and time come from the JWT, the database and the server clock.
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
      if (e instanceof GameError) return http.json(req, e.reason && e.code !== "server_error" ? { error: e.code, reason: e.reason } : { error: e.code }, e.status);
      console.error(e);
      return http.json(req, { error: "server_error" }, 500);
    }
  };
}

/** The game endpoints, keyed by Edge Function name. */
export function routes(
  deps: GameDeps,
): Record<Endpoint, (playerId: string, body: Record<string, unknown>) => Promise<unknown>> {
  return {
    "game-state": (player) => getState(deps, player),
    "idle-claim": (player) => claim(deps, player),
    equip: (player, body) => equip(deps, player, body.gearId),
    "boss-fight": (player) => fightBoss(deps, player),
    upgrade: (player, body) => upgrade(deps, player, body.gearId),
    "relic-forge": (player) => forgeRelic(deps, player),
    "relic-mint-report": (player, body) => reportMint(deps, player, body.nonce, body.txHash),
  };
}
