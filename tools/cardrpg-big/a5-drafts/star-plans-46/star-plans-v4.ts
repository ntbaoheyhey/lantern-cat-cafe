import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

export interface StarCrewPlanV4 {
  outgoing: string;
  incoming: string;
  team: string[];
  rows: Record<string, R.Row>;
  bonuses: ReturnType<typeof R.crewThresholds>;
}

/** Available one-seat changes for a named job star; no combat ranking or account mutation. */
export function starCrewPlansV4(state: R.DepthAccount, goal: R.NodeStarsV4 | undefined, band: number): StarCrewPlanV4[] {
  if (!R.gameplayV4(state) || state.run && !state.run.complete || !goal || goal.band !== band
    || ['battle', 'elite', 'boss'].includes(goal.kind) || !goal.conditions[0] || !goal.conditions[1] || goal.conditions[2]
    || R.crewThresholds(state.team).some(crew => crew.threshold === 4)) return [];
  const plans: StarCrewPlanV4[] = [];
  for (const outgoing of state.team) for (const card of state.account.cards) {
    if (state.team.includes(card.cardId) || card.level < band) continue;
    const team = state.team.map(id => id === outgoing ? card.cardId : id);
    if (team.some(id => state.account.cards.find(card => card.cardId === id)!.level < band)) continue;
    const rows = { ...state.rows, [card.cardId]: state.rows[outgoing]! };
    const bonuses = R.crewThresholds(team).filter(crew => crew.threshold === 4);
    if (bonuses.length && R.configureTeam(state, team, rows, state.skills).ok)
      plans.push({ outgoing, incoming: card.cardId, team, rows, bonuses });
  }
  // Keep a current guardian and healer when possible; this is not a win prediction.
  const retainedRoles = (p: StarCrewPlanV4) => ['guardian', 'healer'].filter(role =>
    state.team.some(id => R.CAT_BY_ID[id]!.role === role) && p.team.some(id => R.CAT_BY_ID[id]!.role === role)).length;
  return plans.sort((a, b) => retainedRoles(b) - retainedRoles(a) || a.incoming.localeCompare(b.incoming) || a.outgoing.localeCompare(b.outgoing));
}

export function dailySuppliesFullV4(state: R.DepthAccount): boolean {
  const caps = R.depthCaps(state);
  return R.gameplayV4(state) && Object.entries(caps).every(([id, cap]) => state.account.daily.earned[id as keyof typeof caps] >= cap);
}
