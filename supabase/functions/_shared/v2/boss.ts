import { actionRequestId, priorAction } from "./actions.ts";
import { deriveSeed, v2 } from "@taskbar-hero/game-rules";
import { dayDate } from "../game.ts";
import { getStateV2, type ItemV2Raw, type V2Deps } from "./game.ts";
import { HTTP_STATUS_V2, V2Error, type GameApiErrorCodeV2Like } from "./http.ts";
import { ownedItemV2, toPlayerStateV2 } from "./snapshot.ts";
import { v2BossSeed } from "./seeds.ts";

function refusal(error: string, cooldownUntil?: number): never {
  if (!Object.hasOwn(HTTP_STATUS_V2, error)) throw new V2Error("server_error");
  throw new V2Error(error as GameApiErrorCodeV2Like, cooldownUntil === undefined ? {} : { cooldownUntil });
}

export async function fightBossV2(deps: V2Deps, playerId: string, body: Record<string, unknown>) {
  const { chapter } = body;
  if (typeof chapter !== "number" || !Number.isInteger(chapter) || chapter < 1 || chapter > v2.CHAPTERS.length) throw new V2Error("invalid_request");
  const requestId = actionRequestId(body);
  const intent = { chapter };
  const finish = async (saved: Record<string, unknown>) => {
    let chest: v2.LootViewV2 | undefined;
    if (saved.won) {
      const granted = saved.chest as { added: v2.StacksV2; salvaged: v2.StacksV2; items: ItemV2Raw[]; autoSalvaged: v2.AutoSalvagedViewV2[] };
      const credited = { ...granted.added };
      for (const [id, qty] of Object.entries(granted.salvaged)) {
        const key = id as v2.StateStackIdV2;
        credited[key] = (credited[key] ?? 0) + qty;
      }
      chest = v2.lootViewV2(credited, granted.items.map(ownedItemV2), []);
      chest.items = granted.items;
    chest.autoSalvaged = granted.autoSalvaged;
    }
    return { won: saved.won as boolean, timeline: saved.timeline as ReturnType<typeof v2.timelineViewV2>, ...(chest === undefined ? {} : { chest }),
      keySpent: saved.keySpent as boolean, state: await getStateV2(deps, playerId) };
  };
  const prior = await priorAction(deps.store, playerId, "v2-boss-fight", requestId, intent);
  if (prior) return finish(prior);
  const nowMs = (deps.now ?? Date.now)();
  const nowS = Math.floor(nowMs / 1000);
  const day = dayDate(nowS);
  const raw = await deps.store.snapshot(playerId, day);
  if (!raw) throw new V2Error("not_found");
  const state = toPlayerStateV2(raw, day);
  const classId = state.classId;
  if (!classId) throw new V2Error("no_class");
  const keyCost = v2.V2_CONFIG.boss.keyCost;
  const cooldownS = v2.V2_CONFIG.boss.lossCooldownSeconds;
  const preview = v2.applyBossResult(state, { won: true, chapter, chest: { stackDeltas: {}, items: [] }, keyCost, cooldownS, now: nowS });
  if (!preview.ok) {
    const raced = await priorAction(deps.store, playerId, "v2-boss-fight", requestId, intent);
    if (raced) return finish(raced);
    refusal(preview.code, preview.cooldownUntil);
  }

  const seed = await v2BossSeed(deps.seedSecret, playerId, raw.fights);
  const equipped = v2.claimInputV2(state, { today: day, offline: false }).equipped;
  const stats = v2.deriveStats({ classId, level: state.level }, equipped);
  const result = v2.simulateBossV2(stats, classId, v2.bossOfChapter(chapter), seed);
  const roll = (firstClear: boolean, chestSeed: number) => {
    const chest = v2.rollChestV2({ chapter, firstClear, classId, level: state.level }, chestSeed);
    return { stacks: chest.stackDeltas, items: chest.items.map(item => ({ itemKey: item.itemKey, slot: item.slot,
      ...(item.weaponType === undefined ? {} : { weaponType: item.weaponType }), rarity: item.rarity, level: item.level,
      bonus: item.bonus.map(line => ({ ...line })), salvage: v2.salvage(item) })) };
  };
  const committed = await deps.store.bossFight({ playerId, chapter, expectedRev: raw.progressRev, won: result.won, fightNo: raw.fights,
    keyCost, cooldownS, chest: { first: roll(true, deriveSeed(seed, 1)), rematch: roll(false, deriveSeed(seed, 2)) },
    bagLimit: v2.V2_CONFIG.bag.limit, caps: v2.STACK_CAPS_V2, bossRound: v2.CHAPTERS.find(ch => ch.index === chapter)!.roundsPerChapter,
    requestId, intent, timeline: v2.timelineViewV2(result.log) });
  const saved: Record<string, unknown> = { ...committed, timeline: committed.timeline ?? v2.timelineViewV2(result.log) };
  // Never retry stale fights: the new fight counter would select a different seed.
  if (typeof saved.error === "string") refusal(saved.error, typeof saved.cooldownUntil === "number" ? saved.cooldownUntil : undefined);
  return finish(saved);
}

export function routesBossV2(deps: V2Deps) {
  return { "v2-boss-fight": (playerId: string, body: Record<string, unknown>) => fightBossV2(deps, playerId, body) };
}
