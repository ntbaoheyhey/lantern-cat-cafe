import { v2 } from "@taskbar-hero/game-rules";
import type { ForgeStatus } from "@taskbar-hero/api-contract";
import { dayDate } from "../game.ts";
import type { RawSnapshotV2 } from "./game.ts";

export interface ForgeStatusV2Like extends Omit<ForgeStatus, "blockedBy"> {
  blockedBy: v2.RelicForgeBlockV2 | null;
}
export type ServerStateV2Like = v2.StateViewV2<ForgeStatusV2Like>;

export function ownedItemV2(item: v2.ItemViewV2): v2.StateOwnedItemV2 {
  return { ...item, itemId: item.itemKey, bonus: item.bonus.map(line => ({ ...line })), bonusLines: item.bonus.map(line => ({ ...line })), source: "drop" };
}

/** Snapshot JSON uses public item rows; the rule engine also needs combat catalog keys. */
export function toPlayerStateV2(raw: RawSnapshotV2, day = dayDate(raw.serverTime)): v2.PlayerStateV2 {
  return {
    classId: raw.classId as v2.ClassId | null,
    level: raw.level, xp: raw.xp, chapter: raw.chapter, round: raw.round, kills: raw.kills, bestStage: raw.bestStage,
    stacks: { ...raw.stacks }, items: raw.inventory.map(ownedItemV2),
    bossClears: Object.fromEntries(raw.bossClears.map(clear => [clear.chapter, { wins: clear.wins }])),
    bossCooldownUntil: raw.cooldownUntil, fights: raw.fights, progressRev: raw.progressRev,
    lastDailyKeyDay: raw.lastDailyKeyDay, lastRelicDay: raw.forgedToday ? day : null,
  };
}

export function viewOf(raw: RawSnapshotV2, state: v2.PlayerStateV2, nowS: number, forge: ForgeStatusV2Like,
  gate = v2.gateOfV2(state, dayDate(nowS))): ServerStateV2Like {
  return v2.stateViewV2(state, { nowS, forge, founder: raw.founder, gate });
}
