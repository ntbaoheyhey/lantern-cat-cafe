/** Local-only turn format. No verified replay, save, economy or renderer dependencies. */
import type { Hero, Preset, Role, Side, StatusKind } from '../types';
export type { Hero, Preset, Role, Side, StatusKind } from '../types';
export type TurnEncounter = 'campaign' | 'patrol' | 'boss' | 'group' | 'dummy';
export type TurnPhase = 'ready' | 'choose' | 'chosen' | 'resolved' | 'finished';
export type TurnTargetRule = 'enemy' | 'row' | 'allEnemies' | 'ally' | 'allAllies' | 'self';
export interface TurnStatus { kind: StatusKind; source: string; turns: number; strength: number; appliedTurn: number }
export interface TurnActor {
  id: string; role: Role; name: string; side: Side; slot: number; row: 'front' | 'rear';
  hp: number; maxHp: number; shield: number; shieldTurns: number; charge: number;
  attack: number; defense: number; speed: number; crit: number; auto: boolean;
  statuses: TurnStatus[]; cooldowns: Record<string, number>; turnsTaken: number;
  break: number; controlCount: number; passiveReady: number; boundAlly?: string;
}
export interface TurnSkill {
  id: string; name: string; description: string; target: TurnTargetRule;
  power: number; cooldown: number; chargeCost: number; heal?: number; shield?: number;
  status?: StatusKind; duration?: number; delay?: number; hits?: number; cleanse?: boolean;
  heavy?: boolean; melee?: boolean; icon: string;
}
export interface TurnIntent {
  actorId: string; skillId: string; targetId: string; targetIds: string[];
  icon: string; label: string; countdown: number; interrupted: boolean;
}
export interface TurnChoice { actorId: string; skillId: string; targetId: string }
export interface LegalTurnAction { skill: TurnSkill; legal: boolean; reason: string }
export interface LegalTurnTarget { actorId: string; legal: boolean; reason: string; affectedIds: string[] }
export interface TimelineSlot { actorId: string; at: number; intent?: TurnIntent }
export interface TurnResult {
  winner: Side; turns: number; deaths: string[]; firstDeath: Role | null;
  wavesCleared: number; fishFound: number; cause: string;
}
export type TurnEventKind = 'turn_start' | 'action_start' | 'travel' | 'damage' | 'heal'
  | 'shield' | 'status_apply' | 'status_expire' | 'interrupt' | 'passive' | 'death'
  | 'intent' | 'wave_clear' | 'wave_start' | 'boss_phase' | 'victory' | 'defeat'
  | 'turn_end' | 'charge' | 'delay' | 'spawn' | 'fizzle' | 'snapshot';
export interface TurnEvent {
  version: 2; seq: number; turn: number; actionId: number; beat: number;
  type: TurnEventKind; actorId: string; skillId: string; targetIds: string[];
  amount: number; critical?: boolean; note?: string; status?: StatusKind;
  actors?: TurnActor[]; intents?: Record<string, TurnIntent>; wave?: number;
  bossPhase?: number; result?: TurnResult;
}
export interface TurnBattle {
  version: 2; seed: number; rng: number; encounter: TurnEncounter; preset: Preset;
  actors: TurnActor[]; queue: TimelineSlot[]; clock: number; turn: number;
  activeId: string | null; phase: TurnPhase; selected: TurnChoice | null;
  events: TurnEvent[]; history: TurnChoice[]; intents: Record<string, TurnIntent>;
  wave: number; bossPhase: number; bossTurns: number; bossCountdown: number;
  settledWaves: number[]; fishFound: number; deaths: string[]; result: TurnResult | null;
  totals: Record<string, { damage: number; healing: number; shielding: number }>;
}
export interface TurnOptions { seed?: number; preset?: Preset; encounter?: TurnEncounter; wave?: number }

/** Stable integration API implemented in engine.ts:
 * createTurnBattle(options?), getTimeline(b, n=8), startTurn(b): TurnActor|null,
 * getLegalActions(b, actorId?), getLegalTargets(b, skillId, actorId?),
 * chooseAction(b, choice): boolean, resolveAction(b): TurnEvent[], endTurn(b): void,
 * getAutoAction(b, policy='auto'|'active'): TurnChoice|null,
 * replayTurns(options, choices): TurnBattle, delayActor(b, id, slots), advanceActor(b,id,slots).
 * config.ts exports TURN_CONFIG, TURN_SKILLS, TURN_KITS (basic + two skills + ultimate).
 * Mutating calls are synchronous and deterministic. Only this core writes rules state.
 */
