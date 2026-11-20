/** Shared with route choices; preserve the existing battle multiplier. */
export const ROUTE_SKILL_POWER_PER_RANK = .2;
export const routeSkillPowerBonusPercent = (rank: number): number => Math.round(rank * ROUTE_SKILL_POWER_PER_RANK * 100);
