import { routesBossV2 } from "./boss.ts";
import { routesForgeV2 } from "./forge.ts";
import { v2 } from "@taskbar-hero/game-rules";
import type { TodayRelic, ItemViewV2, PendingRelicVoucher } from "@taskbar-hero/api-contract";
import { dayDate, MIN_CLAIM_INTERVAL_SECONDS, recoverableVoucher } from "../game.ts";
import type { VoucherSigner, ChainReader } from "../relic.ts";
import { HTTP_STATUS_V2 as HTTP_CODES, V2Error, type GameApiErrorCodeV2Like } from "./http.ts";
import { toPlayerStateV2, viewOf, ownedItemV2, type ServerStateV2Like } from "./snapshot.ts";
import { signedVoucherV2, type VoucherRowV2 } from "./voucher.ts";
import { v2ClaimSeed } from "./seeds.ts";

export type { ServerStateV2Like } from "./snapshot.ts";
export type { VoucherRowV2 } from "./voucher.ts";
export type ItemV2Raw = ItemViewV2;

/** Exact keys emitted by v2_snapshot; item and voucher rows use their SQL JSON helpers. */
export interface RawSnapshotV2 {
  classId: string | null;
  level: number;
  xp: number;
  chapter: number;
  round: number;
  kills: number;
  bestStage: number;
  fights: number;
  progressRev: number;
  lastClaimMicros: number;
  lastDailyKeyDay: string | null;
  cooldownUntil: number | null;
  serverTime: number;
  stacks: Record<string, number>;
  inventory: ItemV2Raw[];
  equipped: Record<string, string>;
  bossClears: { chapter: number; wins: number }[];
  founder: boolean;
  forgedToday: boolean;
  pending: VoucherRowV2 | null;
  today: TodayRelic | null;
}

export interface V2Store {
  actionResult(playerId: string, route: "v2-craft" | "v2-boss-fight", requestId: string, intent: object): Promise<Record<string, unknown> | null>;
  snapshot(playerId: string, day: string): Promise<RawSnapshotV2 | null>;
  chooseClass(playerId: string, classId: string, weaponType: string, starter: unknown[]): Promise<{ status: "ok" } | { error: string }>;
  claim(args: { playerId: string; expectedLastMicros: number; expectedRev: number; nowIso: string; progress: object; stackDeltas: object; caps: object; items: unknown[]; bagLimit: number; dailyKeyDay: string | null }): Promise<Record<string, unknown> | null>;
  bossFight(args: { playerId: string; chapter: number; expectedRev: number; won: boolean; fightNo: number; keyCost: number; cooldownS: number;
    chest: { first: { stacks: Record<string, number>; items: unknown[] }; rematch: { stacks: Record<string, number>; items: unknown[] } };
    bagLimit: number; caps: object; bossRound: number; requestId?: string; intent?: object; timeline?: unknown[] }): Promise<Record<string, unknown>>;
  equip(playerId: string, itemId: string | null, slot: string, expectedClass: string | null, weaponType: string | null, unlocked: string[]): Promise<{ status: "ok" } | { error: string }>;
  craft(playerId: string, cost: Record<string, number>, item: object, bagLimit: number, requestId?: string, intent?: object): Promise<{ status: "ok"; item: ItemV2Raw } | { error: string; stack?: string }>;
  salvage(playerId: string, itemIds: string[], gains: Record<string, number>, caps: object): Promise<{ status: "ok"; added: Record<string, number> } | { error: string }>;
  lock(playerId: string, itemId: string, locked: boolean): Promise<{ status: "ok" } | { error: string }>;
  relicForge(args: { playerId: string; day: string; relicId: number; rarity: string; yarnCost: number; pearlCost: number; expiresAt: string }): Promise<{ status: "pending" | "new"; voucher: VoucherRowV2 } | { status: "blocked"; reason: string }>;
  voucherReissue(playerId: string, nonce: string, nowIso: string, expiresAt: string): Promise<VoucherRowV2 | null>;
  voucherResolveReissue(playerId: string, nonce: string, token: string, used: boolean): Promise<VoucherRowV2 | null>;
  voucherMinted(playerId: string, nonce: string, txHash: string | null): Promise<void>;
  voucherCancelReissue(playerId: string, nonce: string, expiresAt: string): Promise<VoucherRowV2 | null>;
  voucherSign(playerId: string, nonce: string, signature: string): Promise<boolean>;
}
export interface V2Deps { store: V2Store; seedSecret: string; now?: () => number; relic?: { signer?: VoucherSigner; chain?: ChainReader } }

async function load(deps: V2Deps, playerId: string, nowMs: number) {
  const nowS = Math.floor(nowMs / 1000);
  const day = dayDate(nowS);
  const raw = await deps.store.snapshot(playerId, day);
  if (!raw) throw new V2Error("not_found");
  const state = toPlayerStateV2(raw, day);
  const row = raw.pending;
  const signer = deps.relic?.signer;
  let pending: PendingRelicVoucher | null = row ? recoverableVoucher(row) : null;
  if (row && !row.reissuePending) {
    try { pending = await signedVoucherV2(deps.store, signer, playerId, row); }
    catch { /* Keep the paid voucher visible even while signing is unavailable. */ }
  }
  const dayIndex = Date.parse(`${day}T00:00:00Z`) / 86_400_000;
  const forge = { blockedBy: row ? null : v2.relicForgeBlockV2({ stacks: state.stacks, lastRelicDay: raw.forgedToday ? dayIndex : -1 }, dayIndex),
    forgedToday: raw.forgedToday, pending,
    ...(pending?.signature === null ? { recoverable: true as const } : {}),
    today: raw.today ? { ...raw.today,
      ...(pending?.signature === null && pending.claimId === raw.today.claimId ? { recoverable: true as const } : {}),
    } : null };
  return { raw, state, forge, nowS, day };
}
function view(loaded: Awaited<ReturnType<typeof load>>, gate?: v2.GateV2): ServerStateV2Like {
  return viewOf(loaded.raw, loaded.state, loaded.nowS, loaded.forge, gate);
}
function refusal(error: string, stack?: string): never {
  if (error.startsWith("not_enough:")) throw new V2Error("not_enough", { stack: error.slice("not_enough:".length) });
  // RPC refusals are trusted server values; guard unknown ones as internal errors.
  if (!(error in HTTP_CODES)) throw new V2Error("server_error");
  throw new V2Error(error as GameApiErrorCodeV2Like, stack === undefined ? {} : { stack });
}

export async function getStateV2(deps: V2Deps, playerId: string): Promise<ServerStateV2Like> {
  return view(await load(deps, playerId, (deps.now ?? Date.now)()));
}

export async function claimV2(deps: V2Deps, playerId: string): Promise<{ gains: v2.GainsViewV2; state: ServerStateV2Like }> {
  const nowMs = (deps.now ?? Date.now)();
  for (let attempt = 0; attempt < 2; attempt++) {
    const before = await load(deps, playerId, nowMs);
    if (!before.state.classId) throw new V2Error("no_class");
    const elapsedS = nowMs / 1000 - before.raw.lastClaimMicros / 1e6;
    if (elapsedS < MIN_CLAIM_INTERVAL_SECONDS) return { gains: { ...v2.lootViewV2({}, [], []), xp: 0, levelsGained: 0 }, state: view(before) };
    const seed = await v2ClaimSeed(deps.seedSecret, playerId, before.raw.lastClaimMicros);
    const delta = v2.computeClaimV2(v2.claimInputV2(before.state, { today: before.day, offline: false }), elapsedS, seed);
    const preview = v2.applyClaim(before.state, delta);
    if (!preview.ok) refusal(preview.code, preview.stack);
    const result = await deps.store.claim({ playerId, expectedLastMicros: before.raw.lastClaimMicros, expectedRev: before.raw.progressRev,
      nowIso: new Date(nowMs).toISOString(), progress: delta.progress, stackDeltas: delta.stackDeltas, caps: v2.STACK_CAPS_V2,
      items: delta.items.map(item => ({ itemKey: item.itemKey, slot: item.slot,
        ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }), rarity: item.rarity, level: item.level,
        bonus: item.bonus.map(line => ({ ...line })), salvage: v2.salvage(item) })),
      bagLimit: v2.V2_CONFIG.bag.limit, dailyKeyDay: delta.dailyKeyDay ?? null });
    if (result === null) continue;
    if (typeof result.error === "string") refusal(result.error, typeof result.stack === "string" ? result.stack : undefined);
    const after = await load(deps, playerId, nowMs);
    const credited: v2.StacksV2 = { ...result.added as v2.StacksV2 };
    for (const [id, qty] of Object.entries(result.salvaged as v2.StacksV2)) {
      const key = id as v2.StateStackIdV2;
      credited[key] = (credited[key] ?? 0) + qty;
    }
    const loot = v2.lootViewV2(credited, (result.items as ItemV2Raw[]).map(ownedItemV2), []);
    // SQL overflow rows deliberately have no instance UUID or bonus fields.
    loot.autoSalvaged = result.autoSalvaged as v2.AutoSalvagedViewV2[];
    return { gains: v2.gainsViewV2(before.state, after.state, loot), state: view(after, { gated: delta.gated, neededPower: delta.neededPower ?? 0 }) };
  }
  throw new V2Error("stale");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function equipV2(deps: V2Deps, playerId: string, body: Record<string, unknown>): Promise<ServerStateV2Like> {
  const { itemId, slot } = body;
  if (!v2.GEAR_SLOT_IDS.some(id => id === slot) || !(itemId === null || (typeof itemId === "string" && UUID.test(itemId)))) throw new V2Error("invalid_request");
  const nowMs = (deps.now ?? Date.now)();
  const before = await load(deps, playerId, nowMs);
  if (!before.state.classId) throw new V2Error("no_class");
  const cls = v2.CLASSES.find(cls => cls.id === before.state.classId)!;
  const result = await deps.store.equip(playerId, itemId, slot as string, before.state.classId, cls.weaponType, v2.unlockedSlotsV2(before.state.level));
  if ("error" in result) refusal(result.error);
  return view(await load(deps, playerId, nowMs));
}

export async function chooseClassV2(deps: V2Deps, playerId: string, body: Record<string, unknown>): Promise<ServerStateV2Like> {
  const cls = v2.CLASSES.find(cls => cls.id === body.classId);
  if (!cls) throw new V2Error("invalid_request");
  const nowMs = (deps.now ?? Date.now)();
  await load(deps, playerId, nowMs);
  const item = v2.ITEMS.find(item => item.id === cls.starterWeaponId)!;
  const result = await deps.store.chooseClass(playerId, cls.id, cls.weaponType, [{ itemKey: item.id, slot: "weapon", weaponType: cls.weaponType, rarity: item.rarity, level: 1, bonus: [] }]);
  if ("error" in result) refusal(result.error);
  return view(await load(deps, playerId, nowMs));
}

export function routesV2(deps: V2Deps): Record<"v2-state" | "v2-claim" | "v2-equip" | "v2-choose-class" | keyof ReturnType<typeof routesForgeV2> | keyof ReturnType<typeof routesBossV2>, (playerId: string, body: Record<string, unknown>) => Promise<unknown>> {
  return { "v2-state": player => getStateV2(deps, player), "v2-claim": player => claimV2(deps, player),
    "v2-equip": (player, body) => equipV2(deps, player, body), "v2-choose-class": (player, body) => chooseClassV2(deps, player, body), ...routesForgeV2(deps), ...routesBossV2(deps) };
}
