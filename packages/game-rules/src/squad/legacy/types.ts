export const SQUAD_VERSION = 1 as const;
export const STEP_MS = 50;
export type HeroRole = 'guardian' | 'witch' | 'alchemist';
export type EnemyRole = 'guard' | 'flanker' | 'slinger' | 'mender' | 'charger' | 'yarn' | 'knot';
export type Role = HeroRole | EnemyRole;
export type SkillId = 'basic' | 'bash' | 'rally' | 'hearthwall' | 'snare' | 'orb' | 'lanternstorm' | 'milk' | 'moss' | 'shelter' | 'volley' | 'mend' | 'charge' | 'sweep' | 'thread';
export type StatusKind = 'guard' | 'taunt' | 'snare' | 'burn' | 'exposed' | 'shield' | 'bound';
export interface Point { x: number; y: number }
export interface Status { kind: StatusKind; until: number; source: string; value: number; next?: number }
export interface Cast { skill: SkillId; start: number; release: number; impact: number; end: number; targets: string[]; point: Point; released: boolean }
export interface Actor extends Point {
  home: Point;
  id: string; name: string; role: Role; side: 'hero' | 'enemy'; maxHp: number; hp: number;
  attack: number; defense: number; interval: number; target: string | null;
  cooldowns: Partial<Record<SkillId, number>>; statuses: Status[]; cast: Cast | null;
  requestedUlt: boolean; break: number; controlImmuneUntil: number; linkedTo?: string;
  damage: number; healing: number; shielding: number; received: number; deaths: number;
}
export type EventType = 'cast' | 'release' | 'impact' | 'heal' | 'shield' | 'status' | 'expire' | 'death' | 'wave' | 'settle' | 'interrupt' | 'passive' | 'spawn' | 'finish' | 'command';
export interface BattleEvent {
  id: number; tick: number; type: EventType; source?: string; targets: string[];
  skill?: SkillId; amount?: number; status?: StatusKind; point?: Point; duration?: number; text?: string;
}
export type Command = { type: 'focus'; target: string | null } | { type: 'ultimate'; actor: string } | { type: 'auto'; enabled: boolean } | { type: 'tactic'; tactic: 'protect' | 'backline' } | { type: 'free'; target: string };
export interface RecordedCommand { tick: number; command: Command }
export interface BattleOptions { seed?: number; preset?: 'hearth' | 'cinders'; scenario?: 'patrol' | 'crowd' | 'boss' }
export interface Settlement { wave: number; budget: number; defeated: string[] }
export interface Patch extends Point { source: string; until: number; next: number; radius: number }
export interface Battle {
  version: typeof SQUAD_VERSION; options: Required<BattleOptions>; tick: number; remainder: number; rng: number;
  phase: 'fighting' | 'between' | 'won' | 'lost'; wave: number; nextWaveAt: number;
  actors: Actor[]; events: BattleEvent[]; commands: RecordedCommand[]; settlements: Settlement[];
  focus: string | null; auto: boolean; tactic: 'protect' | 'backline'; patches: Patch[];
  heavyReadyAt: number; bossAdds: boolean; nextId: number; diagnosis: string;
}
