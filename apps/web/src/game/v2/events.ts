import type {
  BossFightResultV2, CraftResultV2, ForgeResultV2, GainsV2, SalvageResultV2, ServerStateV2,
} from '../../api/GameApiV2';

export type ActionNameV2 = 'chooseClass' | 'equip' | 'fightBoss' | 'craft' | 'salvage' | 'setLocked' | 'forgeRelic';

export type LoopEventV2 =
  | { type: 'claimed'; gains: GainsV2; at: number }
  | { type: 'levelUp'; from: number; to: number; at: number }
  | { type: 'roundUp'; chapter: number; round: number; at: number }
  | { type: 'chapterUp'; chapter: number; at: number }
  | { type: 'bossFight'; result: BossFightResultV2; at: number }
  | { type: 'crafted'; result: CraftResultV2; at: number }
  | { type: 'salvaged'; result: SalvageResultV2; at: number }
  | { type: 'forged'; result: ForgeResultV2; at: number }
  | { type: 'refused'; action: ActionNameV2; code: string; at: number }
  | { type: 'error'; action: ActionNameV2 | 'load' | 'claim'; message: string; at: number };

export function diffProgressEventsV2(before: ServerStateV2 | null, after: ServerStateV2, at: number): LoopEventV2[] {
  if (!before) return [];
  const events: LoopEventV2[] = [];
  if (after.cat.level > before.cat.level) {
    events.push({ type: 'levelUp', from: before.cat.level, to: after.cat.level, at });
  }
  if (after.progress.chapter === before.progress.chapter && after.progress.round > before.progress.round) {
    events.push({ type: 'roundUp', chapter: after.progress.chapter, round: after.progress.round, at });
  }
  if (after.progress.chapter > before.progress.chapter) {
    events.push({ type: 'chapterUp', chapter: after.progress.chapter, at });
  }
  return events;
}
