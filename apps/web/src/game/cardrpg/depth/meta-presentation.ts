import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { Stats } from '@taskbar-hero/game-rules/cardrpg';

export const COMPANION_ROLES = [...new Set(R.CATS.map(cat => cat.role))];

/** The same descriptive score shown on the existing Prepare screen. */
export function powerScore(stats: Pick<Stats, 'hp' | 'attack' | 'defense'>) {
  return Math.round(stats.hp / 5 + stats.attack * 2 + stats.defense * 1.5);
}

export function teamPower(state: R.DepthAccount, team = state.team) {
  return team.reduce((sum, id) => sum + powerScore(R.depthStats(state, id)), 0);
}

export function nextChallenge(state: R.DepthAccount, selectedBand?: number) {
  const active = state.run && !state.run.complete ? state.run : null;
  const chapter = R.CHAPTERS[(active?.chapter ?? Math.min(3, state.cleared.length + 1)) - 1]!;
  const node = active
    ? R.availableNodes(active).find(candidate => candidate.enemies.length)
    : R.generateMap(state.account.seed, chapter.id)[0];
  const enemies = node?.enemies ?? chapter.pool.slice(0, 2);
  const battle = active?.battle ?? R.createBattle({ seed: state.account.seed, chapter: chapter.id,
    cats: [], enemies,...(R.gameplayV4(state)?{gameplayV4:true,...((active?.challengeLevel??(active?undefined:selectedBand??Math.min(...state.team.map(id=>state.account.cards.find(c=>c.cardId===id)!.level))))!==undefined?{challengeLevel:active?.challengeLevel??selectedBand??Math.min(...state.team.map(id=>state.account.cards.find(c=>c.cardId===id)!.level))}:{})}:{}) });
  const enemyPower = Math.round(battle.actors.filter(actor => actor.side === 'enemy')
    .reduce((sum, actor) => sum + powerScore(actor), 0));
  return { chapter, enemyPower, teamPower: teamPower(state), exact: !!active && !!(node || active.battle) };
}

export function bestRoleTeam(state: R.DepthAccount) {
  const offenseRoles = COMPANION_ROLES.filter(role => role !== 'guardian' && role !== 'healer');
  return [['guardian'], offenseRoles, ['healer']].map(roles => state.account.cards
    .filter(card => roles.includes(R.CAT_BY_ID[card.cardId]!.role))
    .sort((left, right) => powerScore(R.depthStats(state, right.cardId)) - powerScore(R.depthStats(state, left.cardId))
      || left.cardId.localeCompare(right.cardId))[0]?.cardId)
    .filter((id): id is string => !!id);
}

export interface TeamPreset { name: string; team: string[]; rows: Record<string, R.Row> }
export const TEAM_PRESETS_KEY = 'taskbar-hero:cardrpg-team-presets:v1';

/** UI preferences are validated before the rules validate current ownership. */
export function readTeamPresets(raw: string | null): Array<TeamPreset | null> {
  const empty = [null, null, null];
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !Array.isArray(value.slots)) return empty;
    return empty.map((_, index) => {
      const slot = value.slots[index];
      if (!slot || typeof slot.name !== 'string' || !Array.isArray(slot.team) || slot.team.length !== 3
        || new Set(slot.team).size !== 3 || !slot.rows || typeof slot.rows !== 'object'
        || !slot.team.every((id: unknown) => typeof id === 'string' && Object.hasOwn(R.CAT_BY_ID, id)
          && ['front', 'rear'].includes(slot.rows[id])) || !slot.team.some((id: string) => slot.rows[id] === 'front')) return null;
      return { name: slot.name.slice(0, 40), team: [...slot.team],
        rows: Object.fromEntries(slot.team.map((id: string) => [id, slot.rows[id]])) };
    });
  } catch { return empty; }
}

export function gearComparison(state: R.DepthAccount, cardId: string, itemId: string) {
  const result = R.equipGear(state, cardId, itemId);
  if (!result.ok) return { error: result.error, stats: null, delta: null };
  const before = R.depthStats(state, cardId);
  const stats = R.depthStats(result.state, cardId);
  const delta = Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, value - before[key as keyof Stats]])) as Stats;
  return { error: '', stats, delta };
}
