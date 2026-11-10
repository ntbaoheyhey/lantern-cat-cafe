import { EQUIPMENT_SLOTS } from '../contract';
import { CAT_BY_ID } from './catalog';
import { enhanceGear, equipGear, GEAR_BY_ID } from './equipment';
import { teamPowerV4 } from './equipment-v4';
import { gameplayA6 } from './gameplay-a6';
import { metaCommand } from './state';
import { adviceBuildKeyV4 } from './recommendation-v4';
import type { DepthAccount, RuleResult } from './contract';

export type UpgradeChangeA6 = { kind: 'level' | 'ascend'; cardId: string } | { kind: 'enhance'; gearId: string };
export interface UpgradeOptionA6 {
  change: UpgradeChangeA6;
  label: string;
  cost: Record<string, number>;
  before: number;
  after: number;
  value: number;
  expectedBuild: string;
}
const atHome = (s: DepthAccount) => gameplayA6(s) && (!s.run || s.run.complete);
export function applyUpgradeA6(state: DepthAccount, change: UpgradeChangeA6, expectedBuild?: string): RuleResult<DepthAccount> {
  if (!atHome(state)) return { ok: false, state, error: 'Finish your route before upgrading.' };
  if (expectedBuild && expectedBuild !== adviceBuildKeyV4(state)) return { ok: false, state, error: 'Your crew changed. Review the new upgrade first.' };
  return change.kind === 'enhance' ? enhanceGear(state, change.gearId) : metaCommand(state, { type: change.kind, cardId: change.cardId });
}
/** Preview legal purchases on copies. The displayed gain and cost come from the real transaction. */
export function upgradeOptionsA6(state: DepthAccount): UpgradeOptionA6[] {
  if (!atHome(state)) return [];
  const options: UpgradeOptionA6[] = [], before = Math.round(teamPowerV4(state));
  const add = (change: UpgradeChangeA6, label: string) => {
    const result = applyUpgradeA6(state, change);
    if (!result.ok) return;
    const after = Math.round(teamPowerV4(result.state));
    if (after <= before) return;
    const cost = Object.fromEntries(Object.entries(state.account.currencies).flatMap(([id, amount]) => {
      const used = amount - result.state.account.currencies[id as keyof typeof state.account.currencies];
      return used > 0 ? [[id, used]] : [];
    }));
    if (change.kind === 'ascend') {
      const old = state.account.cards.find(card => card.id === change.cardId)!;
      cost.shards = old.shards - result.state.account.cards.find(card => card.id === old.id)!.shards;
    }
    const weights: Record<string, number> = { threads: 3, essence: 20, shards: 25 };
    const weight = Object.entries(cost).reduce((sum, [id, n]) => sum + n * (weights[id] ?? 1), 0);
    options.push({ change, label, cost, before, after, value: (after - before) / Math.max(1, weight), expectedBuild: adviceBuildKeyV4(state) });
  };
  for (const id of state.team) {
    const card = state.account.cards.find(c => c.cardId === id)!;
    add({ kind: 'level', cardId: card.id }, `Raise ${CAT_BY_ID[id]!.name} to level ${card.level + 1}`);
    add({ kind: 'ascend', cardId: card.id }, `Raise ${CAT_BY_ID[id]!.name} to ${card.stars + 1} stars`);
  }
  const worn = new Set(state.team.flatMap(id => Object.values(state.equipment[id] ?? {})));
  for (const gear of state.gear.filter(item => worn.has(item.id)))
    add({ kind: 'enhance', gearId: gear.id }, `Enhance ${GEAR_BY_ID[gear.templateId]!.name} to +${gear.enhancement + 1}`);
  return options.sort((a, b) => b.value - a.value || b.after - a.after || a.label.localeCompare(b.label));
}
/** Equip improvements without moving an item away from another active teammate. */
export function autoEquipA6(state: DepthAccount): RuleResult<DepthAccount> {
  if (!atHome(state)) return { ok: false, state, error: 'Finish your route before changing gear.' };
  let next = state;
  for (const id of state.team) for (const slot of EQUIPMENT_SLOTS) {
    const teammateGear = new Set(state.team.filter(other => other !== id).flatMap(other => Object.values(next.equipment[other] ?? {})));
    let best = next, score = teamPowerV4(next);
    for (const gear of next.gear.filter(item => GEAR_BY_ID[item.templateId]!.slot === slot && !teammateGear.has(item.id)).sort((a, b) => a.id.localeCompare(b.id))) {
      const candidate = equipGear(next, id, gear.id);
      if (!candidate.ok) continue;
      const candidateScore = teamPowerV4(candidate.state);
      if (candidateScore > score) { best = candidate.state; score = candidateScore; }
    }
    next = best;
  }
  return next === state ? { ok: false, state, error: 'Your team already wears its strongest available gear.' } : { ok: true, state: next, error: '' };
}
