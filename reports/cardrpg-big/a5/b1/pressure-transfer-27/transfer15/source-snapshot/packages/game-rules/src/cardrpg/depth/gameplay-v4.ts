import { emptyJourneyV4, type JourneyV4 } from './journey-v4';
import { clone } from '../internal';
import type { Stats } from '../contract';
import { CAT_BY_ID, ENEMY_BY_ID, SKILLS, STATUS_BY_ID } from './catalog';
import type { Actor, Battle, DepthAccount, Skill } from './contract';
import type { CollectionJournalV4 } from './meta-v4';
import type { IssuanceLedger } from './scarcity';
import type { ShiftLoadoutV4 } from './loadouts-v4';
import type { GameplayEventV4 } from './events-v4';

export type CrewJob = 'door' | 'kettle' | 'table' | 'lantern';
export interface StandingPlan { focus: 'finish' | 'support' | 'leader'; care: 'steady' | 'protect' }
export interface GameplayV4State { version: 1; journey?: JourneyV4; plan: StandingPlan; loadouts?: Array<ShiftLoadoutV4 | null>; selectorMarks?:number; revealSequence?:number; reveals?:GameplayEventV4[]; issuance?:IssuanceLedger; legacySealCount?:number; spentEffortIds?:string[]; journal?:CollectionJournalV4; clockWatermark?:number; lessons?:string[] }
export interface BattleV4State { version: 1; plan: StandingPlan; events: GameplayEventV4[]; committed: boolean }
export const DEFAULT_PLAN: StandingPlan = { focus: 'finish', care: 'steady' };
export const CREW_JOBS: { id: CrewJob; name: string; small: string; full: string }[] = [
  { id: 'door', name: 'Door team', small: '+3% maximum HP', full: '+6% maximum HP; front cats start with 8 shield' },
  { id: 'kettle', name: 'Kettle team', small: '+4% healing', full: '+8% healing; first cleanse grants 8 shield' },
  { id: 'table', name: 'Table team', small: '+3% direct attack', full: '+6% direct attack; +3 raw damage to marked foes' },
  { id: 'lantern', name: 'Lantern team', small: '+4% effect accuracy', full: '+8% effect accuracy; first softened or stopped enemy action heals its controller 8' },
];
export const CAT_CREWS: Record<string, readonly [CrewJob, CrewJob]> = {
  mochi: ['door', 'kettle'], panko: ['door', 'table'], brioche: ['door', 'lantern'],
  clover: ['kettle', 'door'], cinnamon: ['kettle', 'table'], marigold: ['kettle', 'lantern'],
  soot: ['table', 'lantern'], mallow: ['table', 'door'], biscuit: ['table', 'kettle'],
  sorrel: ['lantern', 'kettle'], inkcap: ['lantern', 'door'], velvet: ['lantern', 'table'],
};
export function crewThresholds(ids: string[]) {
  return CREW_JOBS.map(job => {
    const contributors = [...new Set(ids)].filter(id => CAT_CREWS[id]?.includes(job.id));
    const marks = contributors.reduce((n, id) => n + (CAT_CREWS[id]![0] === job.id ? 2 : 1), 0);
    const threshold: 0 | 2 | 4 = contributors.length < 2 ? 0 : marks >= 4 ? 4 : marks >= 2 ? 2 : 0;
    return { ...job, contributors, marks, threshold, description: threshold === 4 ? job.full : threshold === 2 ? job.small : 'Needs two contributing cats and at least two marks' };
  });
}
/** Active routes retain their committed mode even after next-run preferences change. */
export function gameplayV4(state: DepthAccount): boolean {
  return state.run && !state.run.complete ? state.run.gameplayV4 === true : state.gameplayV4 === true;
}
export function validPlan(value: unknown): value is StandingPlan {
  if (!value || typeof value !== 'object') return false;
  const plan = value as StandingPlan;
  return ['finish', 'support', 'leader'].includes(plan.focus) && ['steady', 'protect'].includes(plan.care);
}
export function setGameplayV4(state: DepthAccount, enabled: boolean): DepthAccount {
  const next = clone(state);
  if (!enabled && !next.v4 && next.gameplayV4 === undefined) return next;
  next.gameplayV4 = enabled;
  if (enabled) next.v4 ??= { version: 1, plan: { ...DEFAULT_PLAN }, journey: emptyJourneyV4() };
  return next;
}
export function crewStats(stats: Stats, ids: string[]): Stats {
  const next = { ...stats }, crew = crewThresholds(ids);
  const tier = (id: CrewJob) => crew.find(c => c.id === id)!.threshold;
  next.hp = Math.round(next.hp * (1 + tier('door') * .015));
  next.attack = Math.round(next.attack * (1 + tier('table') * .015));
  next.healingBp += tier('kettle') * 200;
  next.effectHitBp += tier('lantern') * 200;
  return next;
}
export function openingCrewBonus(ids: string[], actor: Actor): void {
  for (const crew of crewThresholds(ids).filter(c => c.threshold === 4)) {
    if (crew.id === 'door' && actor.row === 'front') actor.shield += 8;
    if (crew.id === 'table') actor.bonuses.markedDamage = (actor.bonuses.markedDamage ?? 0) + 3;
    if (crew.id === 'kettle') actor.bonuses.crewCleanse = 8;
    if (crew.id === 'lantern') actor.bonuses.crewSuppress = 8;
  }
}
export function planPreference(battle: Battle, choice: { skillId: string; targetId: string }): number {
  const plan = battle.v4?.plan;
  if (!plan) return 0;
  const target = battle.actors.find(a => a.id === choice.targetId);
  if (!target) return 0;
  if (target.side === 'enemy') {
    if (plan.focus === 'finish') return 28 * (1 - target.hp / target.maxHp);
    if (plan.focus === 'support') return ['heal', 'shield', 'summon'].includes(ENEMY_BY_ID[target.catalogId]?.mechanic ?? '') ? 40 + (battle.actors.find(a=>a.id===battle.queue[0])?.setEffects.includes('opening-decoy')?3:0) : 0;
    return ENEMY_BY_ID[target.catalogId]?.tier === 'boss' ? 40 : 0;
  }
  const skill = SKILLS[choice.skillId];
  const actor=battle.actors.find(a=>a.id===battle.queue[0]);
  if(actor?.setEffects.includes('unique:tidetray')&&skill?.effects.some(e=>e.kind==='shield'))return 8*(1-target.hp/target.maxHp);
  const care = plan.care === 'protect' ? .65 : .45;
  return target.hp / target.maxHp < care && (skill?.effects.some(e => ['heal', 'shield', 'cleanse', 'transfer'].includes(e.kind)) || choice.skillId === 'defend')
    ? (care - target.hp / target.maxHp) * 100 : 0;
}
export function skillDescriptionV4(skill: Skill): string {
  const replacements: Record<string, string> = {
    'sorrel-1': 'A light hit grants the most injured ally 6 shield.',
    'sorrel-4': 'Heal and protect the table; grant the most injured ally 18 extra shield.',
    'biscuit-1': 'A heavy basic can Rattle its target, lowering its direct damage.',
    'inkcap-1': 'Tangle any row to lower its direct attack by 4% per stack.',
    'inkcap-4': 'Soften enemy signatures and lower direct attack with Tangle.',
    'velvet-3': 'Remove buffs and grant the most injured ally 12 shield.',
    'marigold-4': 'Clear debuffs, restore health and grant the most injured ally 12 shield.',
  };
  return (replacements[skill.id] ?? skill.description) + (skill.type === 'ultimate' ? ` Ready after two own turns; ${skill.cooldown + 1}-turn cooldown.` : '');
}
export function passiveDescriptionV4(id: string): string {
  return ({ soot: 'A successful detonation grants 6 shield, once per turn.', mallow: 'The first hit each round on a Scalded foe heals 4 HP.', sorrel: 'On odd rounds, grant the weakest ally 6 shield.', velvet: 'Defeating a foe restores 6 missing HP.' } as Record<string, string>)[id] ?? CAT_BY_ID[id]!.passive.description;
}
export function statusDescriptionV4(id: string): string {
  return ({ tangle: 'Direct attack falls by 4% per stack.', hush: 'Enemy heal, shield or summon actions are suppressed; cat support skills stay on cooldown normally.' } as Record<string, string>)[id] ?? STATUS_BY_ID[id as keyof typeof STATUS_BY_ID]?.description ?? id;
}
export function enemyGuideV4(id: string): { intent: string; counter: string; exception: string } {
  const enemy = ENEMY_BY_ID[id]!;
  const byMechanic: Record<string, { intent: string; counter: string; exception: string }> = {
    heal: { intent: 'Every third round restores 65 HP to the most injured foe.', counter: 'Hush prevents the refill; focus support before its next signature.', exception: 'Basic pressure between refills' },
    shield: { intent: 'Every third round grants 45 shield to its row.', counter: 'Hush prevents the brace; Brittle strips its shield.', exception: 'Basic pressure between braces' },
    steal: { intent: 'Reaches a rear cat and removes 6 shield.', counter: 'Cover the vulnerable rear cat with healing or a decoy.', exception: 'Rear reach bypasses cover' },
    snare: { intent: 'Knots weaken the most injured reachable cat.', counter: 'Cleanse Tangle or focus the small thread.', exception: 'Front row while it lives' },
    dot: { intent: 'Needle rain applies Scald to the rear row.', counter: 'Bring cleanse and patient healing.', exception: 'Row attacks ignore cover' },
    charge: { intent: 'Every third round sweeps the front row.', counter: 'Spread your rows, shield the front, or apply Drowsy.', exception: 'Row attacks ignore cover' },
    bind: { intent: 'Loomfall sweeps the front and summons threads. Closing patterns widen from the next round.', counter: 'Keep a sturdy front, cleanse Tangle, and focus the leader.', exception: 'Row attacks ignore cover' },
    storm: { intent: 'Cloudburst strips shields before hitting the front row. Closing patterns widen from the next round.', counter: 'Prefer healing and Steep; Drowsy softens the signature.', exception: 'Row attacks ignore cover' },
    banquet: { intent: 'Empty Banquet strips shield and applies Hush. Closing patterns widen and summon from the next round.', counter: 'Cleanse Hush and focus the leader; linked threads leave with it.', exception: 'Row attacks ignore cover' },
    bomb: { intent: 'Every third round detonates Crumb trails.', counter: 'Cleanse trails before the signature or soften it with Drowsy.', exception: 'Front row while it lives' },
    lesson: { intent: 'A gentle third-round bump tests your preparation.', counter: 'Put a guardian in front and watch its protection.', exception: 'Front row while it lives' },
  };
  return byMechanic[enemy.mechanic] ?? { intent: enemy.intent, counter: enemy.counter, exception: 'Front row while it lives' };
}

/** A short description of each kit's job, not a promised win or a power ranking. */
export const CAT_SPECIALTIES_V4: Readonly<Record<string, string>> = {
  "mochi": "Shielding the crew against front-row pressure.",
  "soot": "Detonating stacked Crumb trails.",
  "clover": "Cleansing Scald and healing over time.",
  "panko": "Returning damage when enemies hit the front row.",
  "mallow": "Burning several foes through their shields.",
  "sorrel": "Weakening rear attackers and sharing spare shields.",
  "biscuit": "Finishing wounded foes through row cover.",
  "inkcap": "Quieting healers and tangling dangerous targets.",
  "cinnamon": "Rescuing a hurt ally with healing and Cozy.",
  "brioche": "Building shields and lending them to an ally.",
  "velvet": "Marking rear targets so the whole crew can reach them.",
  "marigold": "Keeping several allies healthy over long fights."
};
