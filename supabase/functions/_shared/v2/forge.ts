import { actionRequestId, priorAction } from "./actions.ts";
import { relicIdFor, rollRelicRarity, v2 } from "@taskbar-hero/game-rules";
import { dayDate, relicSeed } from "../game.ts";
import { REISSUE_GRACE_SECONDS, VOUCHER_TTL_SECONDS, type ChainReader } from "../relic.ts";
import { getStateV2, type V2Deps, type ItemV2Raw } from "./game.ts";
import { HTTP_STATUS_V2, V2Error, type GameApiErrorCodeV2Like } from "./http.ts";
import { toPlayerStateV2 } from "./snapshot.ts";
import { v2CraftSeed } from "./seeds.ts";
import { signedVoucherV2, type VoucherRowV2 } from "./voucher.ts";

/** Optional here so the existing state-only dependencies remain compatible. */
export type ForgeDepsV2 = V2Deps & { relic?: V2Deps["relic"] & { chain?: ChainReader } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: unknown): id is string => typeof id === "string" && UUID.test(id);
function refusal(error: string, stack?: string): never {
  if (!Object.hasOwn(HTTP_STATUS_V2, error)) throw new V2Error("server_error");
  throw new V2Error(error as GameApiErrorCodeV2Like, stack === undefined ? {} : { stack });
}
async function snapshot(deps: V2Deps, player: string, nowMs: number) {
  const raw = await deps.store.snapshot(player, dayDate(Math.floor(nowMs / 1000)));
  if (!raw) throw new V2Error("not_found");
  return raw;
}

export async function craftV2(deps: V2Deps, player: string, body: Record<string, unknown>) {
  const { recipeId, slot } = body;
  if (typeof recipeId !== "string" || !v2.RECIPES.some(recipe => recipe.id === recipeId) || !v2.GEAR_SLOT_IDS.some(id => id === slot)) throw new V2Error("invalid_request");
  const requestId = actionRequestId(body);
  const intent = { recipeId, slot };
  const finish = async (result: Record<string, unknown>) => ({ item: result.item as ItemV2Raw, state: await getStateV2(deps, player) });
  const prior = await priorAction(deps.store, player, "v2-craft", requestId, intent);
  if (prior) return finish(prior);
  const nowMs = (deps.now ?? Date.now)();
  const nowS = Math.floor(nowMs / 1000);
  const raw = await snapshot(deps, player, nowMs);
  const state = toPlayerStateV2(raw, dayDate(nowS));
  const seed = await v2CraftSeed(deps.seedSecret, player, `${raw.progressRev}:${raw.inventory.length}:${nowS}`);
  const preview = v2.applyCraft(state, recipeId, slot as string, seed, nowS);
  if (!preview.ok) {
    // A concurrent winner may have spent resources between the first lookup and snapshot.
    const raced = await priorAction(deps.store, player, "v2-craft", requestId, intent);
    if (raced) return finish(raced);
    refusal(preview.code, preview.stack);
  }
  const { item } = preview;
  const cost = Object.fromEntries(Object.entries(preview.spent).filter(([, amount]) => amount > 0));
  const result = await deps.store.craft(player, cost, { itemKey: item.itemKey, slot: item.slot,
    ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }), rarity: item.rarity, level: item.level, bonus: item.bonus }, v2.V2_CONFIG.bag.limit, requestId, intent);
  if ("error" in result) refusal(result.error, result.stack);
  return finish(result);
}

export async function salvageV2(deps: V2Deps, player: string, body: Record<string, unknown>) {
  const { itemIds } = body;
  if (!Array.isArray(itemIds) || itemIds.length < 1 || itemIds.length > v2.V2_CONFIG.bag.limit || !itemIds.every(isUuid)) throw new V2Error("invalid_request");
  // PostgreSQL normalizes UUID case and deduplicates before checking or deleting.
  const ids = [...new Set(itemIds.map(id => id.toLowerCase()))];
  const raw = await snapshot(deps, player, (deps.now ?? Date.now)());
  const preview = v2.applySalvage(toPlayerStateV2(raw), ids);
  if (!preview.ok) refusal(preview.code);
  const gains: Record<string, number> = {};
  for (const item of raw.inventory.filter(item => ids.includes(item.id))) {
    for (const [id, qty] of Object.entries(v2.salvage(item))) gains[id] = (gains[id] ?? 0) + qty;
  }
  const result = await deps.store.salvage(player, ids, gains, v2.STACK_CAPS_V2);
  if ("error" in result) refusal(result.error);
  const loot = v2.lootViewV2(result.added, [], []);
  return { gains: { fish: loot.fish, yarn: loot.yarn, materials: loot.materials }, state: await getStateV2(deps, player) };
}

export async function lockV2(deps: V2Deps, player: string, body: Record<string, unknown>) {
  if (!isUuid(body.itemId) || typeof body.locked !== "boolean") throw new V2Error("invalid_request");
  const result = await deps.store.lock(player, body.itemId, body.locked);
  if ("error" in result) refusal(result.error);
  return getStateV2(deps, player);
}

export async function forgeRelicV2(deps: ForgeDepsV2, player: string) {
  const signer = deps.relic?.signer;
  const chain = deps.relic?.chain;
  // Like v1, refuse before any spend if forge dependencies are missing.
  if (!signer || !chain) throw new V2Error("server_error");
  const nowMs = (deps.now ?? Date.now)();
  const nowS = Math.floor(nowMs / 1000);
  const day = dayDate(nowS);
  const expiresAt = new Date((nowS + VOUCHER_TTL_SECONDS) * 1000).toISOString();
  const done = async (row: VoucherRowV2) => ({ voucher: await signedVoucherV2(deps.store, signer, player, row), state: await getStateV2(deps, player) });
  const pending = (await snapshot(deps, player, nowMs)).pending;
  if (pending) {
    if (nowS <= Number(pending.expiry) + REISSUE_GRACE_SECONDS) return done(pending);
    if (await chain.nonceUsed(BigInt(pending.nonce))) {
      await deps.store.voucherMinted(player, pending.nonce, null);
    } else {
      const fresh = await deps.store.voucherReissue(player, pending.nonce, new Date(nowMs).toISOString(), expiresAt);
      if (fresh) return done(fresh);
      const reloaded = (await snapshot(deps, player, nowMs)).pending;
      if (reloaded) return done(reloaded);
    }
  }
  const rarity = rollRelicRarity(await relicSeed(deps.seedSecret, player, day));
  const result = await deps.store.relicForge({ playerId: player, day, relicId: relicIdFor(rarity), rarity,
    yarnCost: v2.RELIC_RECIPE.materials.yarn!, pearlCost: v2.RELIC_RECIPE.materials.moonPearl!, expiresAt });
  if (result.status === "blocked") throw new V2Error("forge_blocked", { reason: result.reason });
  return done(result.voucher);
}

export function routesForgeV2(deps: ForgeDepsV2) {
  return { "v2-craft": (player: string, body: Record<string, unknown>) => craftV2(deps, player, body),
    "v2-salvage": (player: string, body: Record<string, unknown>) => salvageV2(deps, player, body),
    "v2-lock": (player: string, body: Record<string, unknown>) => lockV2(deps, player, body),
    "v2-relic-forge": (player: string) => forgeRelicV2(deps, player) };
}
