import type { PackedSupplyV4 } from './items-v4';
import type { AccountState, Slot, Rarity, Stats } from '../contract';
import type { BattleV4State, GameplayV4State, StandingPlan } from './gameplay-v4';

/** Battle snapshots retain enemy stats across later balance changes. */
export const CONTRACT_VERSION = '0.7.0' as const;
export type Flavour = 'hearth' | 'moon' | 'garden' | 'tide' | 'ember';
export type CatRole = 'guardian' | 'striker' | 'witch' | 'healer' | 'controller' | 'hexer';
export type Row = 'front' | 'rear';
export type SkillType = 'attack' | 'defend' | 'support' | 'control' | 'ultimate';
export type TargetRule = 'foe' | 'pierce' | 'row' | 'foes' | 'ally' | 'allies' | 'self' | 'fallen';
export type StatusId = 'snag' | 'bitter' | 'cozy' | 'scald' | 'tangle' | 'steep' | 'crumb' | 'scent' | 'rattled' | 'drowsy' | 'glaze' | 'shelter' | 'riposte' | 'hush' | 'brittle' | 'link' | 'sprout' | 'decoy';
export interface StatusRule {
  id: StatusId; name: string; description: string; kind: 'buff' | 'debuff'; cap: number;
  duration: number; dispellable: boolean; tick: 'damage' | 'heal' | 'none'; strength: number;
}
export interface Status { id: StatusId; stacks: number; remaining: number; source: string; appliedRound: number }
export type Mechanic = 'hit' | 'shield' | 'heal' | 'cleanse' | 'dispel' | 'detonate' | 'transfer' | 'revive' | 'execute' | 'chain' | 'energy' | 'swap' | 'drain' | 'consume' | 'break' | 'rally';
export interface Effect { kind: Mechanic; power?: number; status?: StatusId; stacks?: number; self?: boolean }
export interface Skill {
  id: string; catId: string; name: string; description: string; type: SkillType; target: TargetRule;
  cost: number; cooldown: number; charge: number; breakPower: number; effects: Effect[]; unlockLevel: number; unlockStars: number;
}
export interface Cat {
  id: string; name: string; role: CatRole; flavour: Flavour; row: Row; tags: string[];
  passive: { id: string; name: string; description: string }; skills: Skill[];
}
export interface Enemy {
  id: string; name: string; role: string; flavour: Flavour; row: Row; tier: 'regular' | 'elite' | 'boss';
  hp: number; attack: number; defense: number; breakCap: number; mechanic: string;
  intent: string; counter: string; status?: StatusId; phases: string[]; chapter: number;
}
export interface Actor {
  linkedBossId?: string;
  id: string; catalogId: string; name: string; side: 'party' | 'enemy'; role: string; row: Row;
  flavour: Flavour; hp: number; maxHp: number; attack: number; defense: number; initiative: number;
  effectHit: number; effectResist: number; shield: number; charge: number; break: number; breakCap: number;
  statuses: Status[]; cooldowns: Record<string, number>; skills: string[]; passiveUsed: boolean;
  phase: number; equipment: string[]; setEffects: string[]; bonuses: Record<string, number>; turns: number;
}
export interface Intent { actorId: string; targetId: string; label: string; counter: string; power: number; status?: StatusId; signature: boolean; interrupted: boolean }
export interface Choice { actorId: string; skillId: string; targetId: string }
export interface BattleEvent { round: number; actorId: string; targetId: string; skillId: string; kind: string; amount: number; text: string }
export interface Battle {
  v4?: BattleV4State;
  version: typeof CONTRACT_VERSION; seed: number; rng: number; chapter: number; actors: Actor[];
  round: number; queue: string[]; acted: string[]; energy: number; maxEnergy: number; intents: Intent[];
  log: BattleEvent[]; choices: Choice[]; result: 'party' | 'enemy' | null; firstDeath: string | null;
  boons: Record<string, number>; procRounds: Record<string, number>; mutator: string; initial: BattleSetup;
}
export interface BattleSetup {
  challengeLevel?: number;
  packedSupply?: PackedSupplyV4;
  gameplayA6?: boolean; skillsV5?: boolean; gameplayV4?: boolean; plan?: StandingPlan;
  seed: number; chapter: number; cats: Array<{ id: string; stats: Stats; skills: string[]; row: Row; equipment?: string[]; effects?: string[]; bonuses?: Record<string, number> }>;
  enemies: string[]; upgrades?: Record<string, number>; hp?: Record<string, number>; boons?: Record<string, number>; mutator?: string; tutorial?: boolean;
  enemyStats?: Record<string, Pick<Enemy, 'hp' | 'attack' | 'defense'>>;
}
export type NodeKind = 'battle' | 'elite' | 'campfire' | 'shop' | 'event' | 'treasure' | 'boss';
export interface RunNode { id: string; depth: number; lane: number; kind: NodeKind; next: string[]; enemies: string[]; eventId?: string }
export interface Boon { id: string; name: string; archetype: string; description: string; cap: number; trigger: string; value: number }
export interface Run {
  towerA6?: { enemyStats: NonNullable<BattleSetup['enemyStats']> };
  challengeLevel?: number;
  packedSupply?: PackedSupplyV4;
  gameplayA6?: boolean; skillsV5?: boolean; gameplayV4?: boolean;
  id: number; seed: number; chapter: number; mode: 'campaign' | 'daily' | 'tower'; nodes: RunNode[];
  visited: string[]; current: string | null; points: number; boons: Record<string, number>;
  hp: Record<string, number>; upgrades: Record<string, number>; rewardChoices: string[];
  battle: Battle | null; complete: boolean; won: boolean; floor: number; mutator: string;
  supplies: number; earnedItems: string[]; date: string;
}
export interface GearTemplate {
  id: string; name: string; slot: Slot; rarity: Rarity; setId: string; level: number; chapter: number;
  source: string; main: keyof Stats; value: number; affixes: string[]; unique?: string; story: string;
}
export interface AffixRule { id: string; name: string; slots: Slot[]; stat: string; tiers: [number, number][]; description: string }
export interface GearInstance { id: string; templateId: string; enhancement: number; tier: 1 | 2 | 3; affixes: string[]; rolls: Record<string, number> }
export interface DepthAccount {
  gameplayA6?: boolean; skillsV5?: boolean; gameplayV4?: boolean; v4?: GameplayV4State;
  version: typeof CONTRACT_VERSION; account: AccountState; team: string[]; rows: Record<string, Row>; skills: Record<string, string[]>;
  run: Run | null; nextRunId: number; cleared: number[]; towerBest: number; lastBattle: BattleSetup | null; lastChoices: Choice[];
  gear: GearInstance[]; equipment: Record<string, Partial<Record<Slot, string>>>; awakened: Record<string, number>;
  materials: number; seals: number; masteries: number[]; challengeClaims: string[]; claimedRuns: number[];
  idle: { lastAt: number; dayKey?: number; receiptIds: string[]; a6?: { fastDay: number; fastClaims: number } }; tutorial: number; freeInvite: boolean;
  settings: { sound: boolean; speed: number; reducedMotion: boolean; quality: 'low' | 'medium' | 'high' };
  relics: number[]; selectedRelic: number | null; designClaims: string[];
}
export interface RuleResult<T> { ok: boolean; state: T; error?: string }
