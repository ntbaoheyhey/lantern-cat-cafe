/** Local prototype format. Deliberately unrelated to verified v2 save/replay types. */
export type Hero = 'guardian' | 'witch' | 'alchemist';
export type Role = Hero | 'guard' | 'flanker' | 'ranger' | 'healer' | 'charger' | 'elite' | 'yarn' | 'thread' | 'dummy';
export type Side = 'party' | 'enemy';
export type Preset = 'hearthkeepers' | 'lanternbreakers';
export type Encounter = 'patrol' | 'boss' | 'dummy' | 'group';
export type StatusKind = 'stun' | 'snare' | 'taunt' | 'burn' | 'guard' | 'restrain' | 'exposed';
export type TargetRule = 'front' | 'injured' | 'caster' | 'self' | 'team' | 'rear';
export type Shape = 'slash' | 'bash' | 'rally' | 'wall' | 'thread' | 'orb' | 'storm' | 'flask' | 'patch' | 'shelter' | 'arrow' | 'charge' | 'sweep' | 'cross' | 'mend';
export interface Point { x: number; y: number }
export interface Stats { hp: number; attack: number; defense: number; intervalMs: number; crit: number; speed?: number; cdr?: number }
export interface Ability {
  name: string; shape: Shape; target: TargetRule; cooldownMs: number; windupMs: number; travelMs: number;
  power: number; radius?: number; heal?: number; shield?: number; status?: StatusKind; durationMs?: number;
  ultimate?: boolean; heavy?: boolean; melee?: boolean; retarget?: boolean; hits?: number; cleanse?: boolean;
  description: string;
}
export interface Status { kind: StatusKind; source: string; until: number; strength: number; nextTick: number }
export interface Actor extends Point {
  id: string; role: Role; name: string; side: Side; slot: number; row: 'front' | 'rear';
  hp: number; maxHp: number; shield: number; stats: Stats; statuses: Status[]; cooldowns: Record<string, number>;
  charge: number; auto: boolean; castId: number | null; nextBasic: number; controlCount: number;
  controlUntil: number; immuneUntil: number; passiveAt: number; boundAlly?: string; break: number;
}
export interface Cast {
  id: number; source: string; targets: string[]; skill: string; start: number; release: number; impact: number;
  origin: Point; zone: Point; released: boolean; canceled: boolean; hit: number;
}
export type CommandBody = { type: 'priority'; target: string | null } | { type: 'ultimate'; hero: Hero }
  | { type: 'auto'; hero: Hero; enabled: boolean } | { type: 'tactic'; value: 'protect' | 'caster' | 'opening' };
export type Command = CommandBody & { version: 1; tick: number; seq: number };
export interface Totals { damage: number; healing: number; shielding: number; kills: number }
export interface Result {
  winner: Side; durationMs: number; deaths: string[]; firstDeath: string | null; fishFound: number;
  totals: Record<string, Totals>; cause: string; suggestion: string;
}
export type EventKind = 'cast_start' | 'projectile_release' | 'impact' | 'status_applied' | 'status_expired'
  | 'heal' | 'shield' | 'interrupt' | 'death' | 'wave_transition' | 'boss_phase' | 'passive' | 'reward'
  | 'command' | 'fizzle' | 'retarget' | 'fight_end' | 'spawn' | 'enrage' | 'break' | 'charge';
export interface BattleEvent {
  version: 1; seq: number; tick: number; time: number; type: EventKind;
  source?: string; target?: string; skill?: string; amount?: number; critical?: boolean; note?: string;
  actor?: Actor; actors?: Actor[]; cast?: Cast; phase?: number; wave?: number; result?: Result;
}
export interface Battle {
  version: 1; seed: number; rng: number; tick: number; time: number; carry: number;
  encounter: Encounter; preset: Preset; actors: Actor[]; casts: Cast[]; events: BattleEvent[];
  commands: Command[]; commandSeq: number; nextCastId: number; priority: string | null;
  tactic: 'protect' | 'caster' | 'opening'; wave: number; transitionAt: number | null;
  phase: number; enraged: boolean; nextAddAt: number; nextThreadAt: number; nextChargeAt: number;
  settled: boolean; fishFound: number; deaths: string[]; totals: Record<string, Totals>;
  result: Result | null;
}
export interface Projection { actors: Record<string, Actor>; casts: Record<number, Cast>; wave: number; phase: number; result: Result | null; fishFound: number; time: number }
