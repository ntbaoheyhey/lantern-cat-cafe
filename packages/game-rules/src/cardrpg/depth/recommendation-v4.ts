import { finishEncounter, abandonRun } from './run';
import { requireRule } from '../internal';
import { EQUIPMENT_SLOTS } from '../contract';
import { CAT_BY_ID } from './catalog';
import { createBattle } from './battle';
import { playBattle } from './policies';
import { battleCats, configureTeam, metaCommand, requireHome, transactDepth } from './state';
import { equipGear, GEAR_BY_ID } from './equipment';
import { itemUtilityV4 } from './equipment-v4';
import { gameplayV4, validPlan, type StandingPlan } from './gameplay-v4';
import type { BattleSetup, DepthAccount, Row, RuleResult } from './contract';

export type BuildChangeV4 =
  | { kind: 'cat'; catId: string; replacementId: string }
  | { kind: 'row'; catId: string; row: Row }
  | { kind: 'plan'; plan: StandingPlan }
  | { kind: 'equip'; catId: string; gearId: string }
  | { kind: 'level'; cardId: string };
export interface BuildAdviceV4 {
  change: BuildChangeV4;
  label: string;
  cost: Record<string, number>;
  expectedBuild: string;
  before: { wins: number; margin: number };
  after: { wins: number; margin: number };
  samples: 10;
}

/** Exact state projection, not a probabilistic hash. Timers/settings do not invalidate a build. */
export function adviceBuildKeyV4(s: DepthAccount): string {
  return JSON.stringify({ on: gameplayV4(s), cards: s.account.cards, currencies: s.account.currencies,
    team: s.team, rows: s.rows, skills: s.skills, gear: s.gear, equipment: s.equipment,
    awakened: s.awakened, plan: s.v4?.plan, run: s.run ? [s.run.id, s.run.complete] : null });
}

/** Public atomic build change; checks ownership, affordability and the home boundary. */
export function changeBuildV4(state: DepthAccount, change: BuildChangeV4): RuleResult<DepthAccount> {
  if (!gameplayV4(state) || !state.v4) return { ok: false, state, error: 'Open a Gameplay v4 crew first.' };
  if (change.kind === 'cat') {
    if (!state.team.includes(change.catId) || state.team.includes(change.replacementId)
      || !state.account.cards.some(card => card.cardId === change.replacementId))
      return { ok: false, state, error: 'Choose a collected cat outside your current crew.' };
    // The incoming cat takes the same slot; equipped items stay with their owners.
    return configureTeam(state, state.team.map(id => id === change.catId ? change.replacementId : id),
      { ...state.rows, [change.replacementId]: state.rows[change.catId]! }, state.skills);
  }
  if (change.kind === 'row') {
    if (!state.team.includes(change.catId) || !['front', 'rear'].includes(change.row))
      return { ok: false, state, error: 'Choose a cat in your crew and an available row.' };
    return configureTeam(state, state.team, { ...state.rows, [change.catId]: change.row }, state.skills);
  }
  if (change.kind === 'equip') return equipGear(state, change.catId, change.gearId);
  if (change.kind === 'level') return metaCommand(state, { type: 'level', cardId: change.cardId });
  return transactDepth(state, s => {
    requireHome(s);
    requireRule(validPlan(change.plan), 'INVALID_TEAM', 'Choose an available standing plan.');
    s.v4!.plan = { ...change.plan };
  });
}
export function applyAdviceV4(state: DepthAccount, advice: BuildAdviceV4): RuleResult<DepthAccount> {
  if (adviceBuildKeyV4(state) !== advice.expectedBuild)
    return { ok: false, state, error: 'Your crew changed. Check its new suggestion first.' };
  return changeBuildV4(state, advice.change);
}

/** Preserve the same missing HP, enemy snapshot, boons and challenge in both comparison arms. */
function setupFor(state: DepthAccount, encounter: BattleSetup): BattleSetup {
  const cats = battleCats(state);
  const hp = Object.fromEntries(cats.map(cat => {
    const old = encounter.cats.find(c => c.id === cat.id);
    const missing = old ? Math.max(0, old.stats.hp - (encounter.hp?.[cat.id] ?? old.stats.hp)) : 0;
    return [cat.id, Math.max(0, cat.stats.hp - missing)];
  }));
  return { ...encounter, cats, hp, plan: { ...state.v4!.plan } };
}
function sample(setup: BattleSetup) {
  let wins = 0, margin = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const b = playBattle(createBattle({ ...setup, seed }), 'auto');
    if (b.result === 'party') wins++;
    const party = b.actors.filter(a => a.side === 'party');
    const enemy = b.actors.filter(a => a.side === 'enemy');
    margin += party.reduce((n, a) => n + a.hp / a.maxHp, 0) / party.length
      - enemy.reduce((n, a) => n + a.hp / a.maxHp, 0) / enemy.length;
  }
  return { wins, margin: margin / 10 };
}

/** Run in a worker. Fixed TRAIN seeds; bounded candidates; never grants items or starts a route. */
export function recommendBuildV4(state: DepthAccount, encounter: BattleSetup): BuildAdviceV4 | null {
  if (!gameplayV4(state) || !state.v4 || !encounter.gameplayV4 || state.run && !state.run.complete) return null;
  const changes: Array<{ change: BuildChangeV4; label: string }> = [];
  for (const id of state.team) {
    const row: Row = state.rows[id] === 'front' ? 'rear' : 'front';
    changes.push({ change: { kind: 'row', catId: id, row }, label: `Place ${CAT_BY_ID[id]!.name} in ${row === 'front' ? 'Front' : 'Back'}` });
    const card = state.account.cards.find(c => c.cardId === id)!;
    changes.push({ change: { kind: 'level', cardId: card.id }, label: `Raise ${CAT_BY_ID[id]!.name} to level ${card.level + 1}` });
    const elsewhere = new Set(Object.entries(state.equipment).filter(([cat]) => cat !== id).flatMap(([, worn]) => Object.values(worn)));
    for (const slot of EQUIPMENT_SLOTS) {
      // One unborrowed candidate per slot keeps advice bounded and avoids stripping a teammate.
      const item = state.gear.filter(g => GEAR_BY_ID[g.templateId]!.slot === slot && !elsewhere.has(g.id)
        && g.id !== state.equipment[id]?.[slot]).map(g => ({ g, utility: itemUtilityV4(state, id, g) }))
        .sort((a, b) => b.utility - a.utility || a.g.id.localeCompare(b.g.id))[0]?.g;
      if (item) changes.push({ change: { kind: 'equip', catId: id, gearId: item.id }, label: `Give ${CAT_BY_ID[id]!.name} ${GEAR_BY_ID[item.templateId]!.name}` });
    }
  }
  const names = { finish: 'Finish weak foes', support: 'Stop their support', leader: 'Focus the boss' };
  for (const focus of ['finish', 'support', 'leader'] as const) for (const care of ['steady', 'protect'] as const)
    if (focus !== state.v4.plan.focus || care !== state.v4.plan.care)
      changes.push({ change: { kind: 'plan', plan: { focus, care } }, label: `${names[focus]} · ${care === 'protect' ? 'Protect' : 'Steady'}` });
  // At most 27 owned-cat alternatives for a three-cat crew and the twelve-cat roster.
  const reserves = state.account.cards.map(card => card.cardId).filter(id => !state.team.includes(id)).sort();
  for (const catId of state.team) for (const replacementId of reserves) {
    const row = state.rows[catId] === 'front' ? 'Front' : 'Back';
    changes.push({ change: { kind: 'cat', catId, replacementId },
      label: `Replace ${CAT_BY_ID[catId]!.name} with ${CAT_BY_ID[replacementId]!.name} in ${row}` });
  }
  const before = sample(setupFor(state, encounter)), expectedBuild = adviceBuildKeyV4(state);
  const options: BuildAdviceV4[] = [];
  for (const { change, label } of changes) {
    const applied = changeBuildV4(state, change);
    if (!applied.ok || adviceBuildKeyV4(applied.state) === expectedBuild) continue;
    const after = sample(setupFor(applied.state, encounter));
    // A little extra overkill alone never qualifies. Equal wins need a material survival margin.
    if (after.wins < before.wins || after.wins === before.wins && after.margin - before.margin < .05) continue;
    const cost = Object.fromEntries(Object.entries(state.account.currencies).flatMap(([id, n]) => {
      const spent = n - (applied.state.account.currencies[id as keyof typeof state.account.currencies] ?? n);
      return spent > 0 ? [[id, spent]] : [];
    }));
    options.push({ change, label, cost, expectedBuild, before, after, samples: 10 });
  }
  return options.sort((a, b) => b.after.wins - a.after.wins || b.after.margin - a.after.margin
    || Object.values(a.cost).reduce((n, v) => n + v, 0) - Object.values(b.cost).reduce((n, v) => n + v, 0)
    || a.label.localeCompare(b.label))[0] ?? null;
}

/** Settle a finished loss on a copy. The advice preview never spends or grants on the live account. */
export function resultAdviceStateV4(state: DepthAccount): RuleResult<DepthAccount> {
  if (!gameplayV4(state) || state.run?.battle?.result !== 'enemy')
    return { ok: false, state, error: 'Finish this route before changing the crew.' };
  const settled = finishEncounter(state);
  if (!settled.ok) return settled;
  return settled.state.run && !settled.state.run.complete ? abandonRun(settled.state) : settled;
}
/** Recheck the same settled build; a repeated or stale click leaves the original account intact. */
export function applyResultAdviceV4(state: DepthAccount, advice: BuildAdviceV4): RuleResult<DepthAccount> {
  const settled = resultAdviceStateV4(state);
  if (!settled.ok) return settled;
  const applied = applyAdviceV4(settled.state, advice);
  return applied.ok ? applied : { ...applied, state };
}
