import type { Battle, DepthAccount, Run, RunNode } from './contract';
import { crewThresholds } from './gameplay-v4';

export interface NodeStarsV4 {
  key: string;
  chapter: number;
  band: number;
  nodeId: string;
  conditions: [boolean, boolean, boolean];
}
export interface StarGoalV4 { id: 'finish' | 'healthy' | 'challenge'; text: string }
const combatNode = (node: RunNode) => ['battle', 'elite', 'boss'].includes(node.kind);
export const starRoundBudgetV4 = (node: RunNode): number => node.kind === 'boss' ? 10 : node.kind === 'elite' ? 8 : 6;
export function nodeStarGoalsV4(node: RunNode): [StarGoalV4, StarGoalV4, StarGoalV4] {
  return combatNode(node)
    ? [{id:'finish',text:'Win this encounter.'},{id:'healthy',text:'Win without a cat falling.'},
      {id:'challenge',text:`Win within ${starRoundBudgetV4(node)} rounds.`}]
    : [{id:'finish',text:'Complete this stop.'},{id:'healthy',text:'Leave every cat with at least half HP.'},
      {id:'challenge',text:'Visit with a four-mark crew job active.'}];
}
/** A chapter/band/map position has three badges; replaying never creates a new reward identity. */
export function nodeStarKeyV4(run: Run, node: RunNode): string {
  return `${run.chapter}/${run.challengeLevel ?? 0}/${node.id}`;
}
/** Read only. Called with the committed encounter, before finishEncounter removes it. */
export function combatStarsV4(run: Run, node: RunNode, battle: Battle): NodeStarsV4 | null {
  if (!run.gameplayV4 || !battle.v4 || !combatNode(node) || !battle.result) return null;
  const won = battle.result === 'party';
  const ids = new Set(battle.initial.cats.map(cat => cat.id));
  const fell = battle.log.some(event => event.kind === 'defeat' && ids.has(event.targetId));
  const intact = battle.actors.filter(actor => actor.side === 'party').every(actor => actor.hp > 0);
  return {key:nodeStarKeyV4(run,node),chapter:run.chapter,band:run.challengeLevel ?? 0,nodeId:node.id,
    conditions:[won,won && intact && !fell,won && battle.round <= starRoundBudgetV4(node)]};
}
/** Read only. Invoke only after a successful noncombat resolution, never on a preview. */
export function stopStarsV4(state: DepthAccount, run: Run, node: RunNode, maxHp: Record<string,number>): NodeStarsV4 | null {
  if (!run.gameplayV4 || combatNode(node) || !run.visited.includes(node.id)) return null;
  const healthy = state.team.every(id => Number.isFinite(maxHp[id]) && maxHp[id]! > 0 && (run.hp[id] ?? 0) >= maxHp[id]! / 2);
  return {key:nodeStarKeyV4(run,node),chapter:run.chapter,band:run.challengeLevel ?? 0,nodeId:node.id,
    conditions:[true,healthy,crewThresholds(state.team).some(crew => crew.threshold === 4)]};
}
/** Badges are independent achievements. Merging is monotone and cannot award any badge twice. */
export function mergeNodeStarsV4(before: NodeStarsV4 | undefined, receipt: NodeStarsV4): {value:NodeStarsV4; added:number} {
  if (before && before.key !== receipt.key) throw Error('Different route positions cannot share stars.');
  const conditions = receipt.conditions.map((earned,index) => earned || !!before?.conditions[index]) as [boolean,boolean,boolean];
  const added = conditions.filter((earned,index) => earned && !before?.conditions[index]).length;
  return {value:{...receipt,conditions},added};
}
