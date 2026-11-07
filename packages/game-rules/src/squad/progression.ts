import { GEAR, PRESETS, defaultLoadout, validLoadout } from './gear';
import { parseReplay, type BattleReplay } from './battle';
import type { Battle, EnemyRole, HeroRole, Loadout } from './types';

export interface SquadPreset { name: string; team: Loadout[] }
export interface Profile {
  coins: number; xp: number; clears: number; vacuumClears: number; restoration: number;
  recruited: HeroRole[]; patterns: string[]; team: Loadout[]; presets: SquadPreset[];
  seen: EnemyRole[]; rewardPending: boolean;
}
export interface LabSave { version: 2; profile: Profile; run: { replay: BattleReplay; eligible: boolean; settled: boolean } | null }
export const SAVE_KEY = 'tbh.squad.lab.v2';
export const RESTORATIONS = [
  { name: 'Repair the hearth', cost: 40, help: 'Warm light returns to the patrol room.' },
  { name: 'Plant the window garden', cost: 70, help: 'A leafy corner for every returning cat.' },
  { name: 'Reopen the cat café', cost: 100, help: 'The whole crew has a cozy place to call home.' },
] as const;
export function newProfile(): Profile {
  return { coins: 0, xp: 0, clears: 0, vacuumClears: 0, restoration: 0, recruited: ['guardian', 'witch', 'alchemist'], patterns: ['starter', 'plain'], team: PRESETS.hearth.map(defaultLoadout), presets: [], seen: [], rewardPending: false };
}
export const squadLevel = (p: Profile) => Math.min(10, 1 + Math.floor(p.xp / 100));
export const canRecruit = (p: Profile, role: HeroRole) => !p.recruited.includes(role) && (role === 'rogue' ? p.clears >= 1 : role === 'archer' && p.clears >= 2);
export function recruit(p: Profile, role: HeroRole): Profile { return canRecruit(p, role) ? { ...p, recruited: [...p.recruited, role] } : p; }
export function equipTeam(p: Profile, team: Loadout[]): Profile {
  if (team.length !== 3 || !team.every(x => validLoadout(x) && p.recruited.includes(x.role) && p.patterns.includes(x.weapon) && p.patterns.includes(x.charm))) return p;
  return { ...p, team: team.map(x => ({ ...x })) };
}
export function unlockPattern(p: Profile, id: string, reward = false): Profile {
  const item = GEAR.find(g => g.id === id);
  if (!item || p.patterns.includes(id) || (reward ? !p.rewardPending || !['counter', 'cinder', 'overflow'].includes(id) : p.coins < item.cost)) return p;
  return { ...p, coins: p.coins - (reward ? 0 : item.cost), patterns: [...p.patterns, id], rewardPending: reward ? false : p.rewardPending };
}
export function restoreCafe(p: Profile): Profile {
  const next = RESTORATIONS[p.restoration];
  return next && p.coins >= next.cost ? { ...p, coins: p.coins - next.cost, restoration: p.restoration + 1 } : p;
}
export function savePreset(p: Profile, name: string): Profile {
  const trimmed = name.trim().slice(0, 32); if (!trimmed) return p;
  const entry = { name: trimmed, team: p.team.map(x => ({ ...x })) };
  const index = p.presets.findIndex(x => x.name === trimmed);
  if (index < 0 && p.presets.length >= 5) return p;
  return { ...p, presets: index < 0 ? [...p.presets, entry] : p.presets.map((x, i) => i === index ? entry : x) };
}
/** A single atomic save marks settlement before it can be claimed again after reload. */
export function settleRun(save: LabSave, battle: Battle): LabSave {
  if (!save.run || save.run.settled || !['won', 'lost'].includes(battle.phase)) return save;
  const run = { ...save.run, settled: true };
  if (!run.eligible || battle.version !== 2) return { ...save, run };
  const p = save.profile, seen = new Set(p.seen);
  for (const event of battle.events) if (event.type === 'spawn' && event.role) seen.add(event.role as EnemyRole);
  let profile = { ...p, seen: [...seen] };
  if (battle.phase === 'won' && ['patrol', 'vacuum'].includes(battle.options.scenario)) {
    const patrol = battle.options.scenario === 'patrol';
    const reward = patrol ? battle.options.route === 'challenge' ? 60 : battle.options.route === 'supplies' ? 50 : 35 : 50;
    profile = { ...profile, coins: p.coins + reward, xp: p.xp + (patrol ? 80 : 100), clears: p.clears + (patrol ? 1 : 0), vacuumClears: p.vacuumClears + (patrol ? 0 : 1), rewardPending: p.rewardPending || patrol && p.clears === 0 && ['counter', 'cinder', 'overflow'].some(id => !p.patterns.includes(id)) };
  }
  return { ...save, profile, run };
}
function profileFrom(value: unknown): Profile {
  if (!value || typeof value !== 'object') throw new Error('Invalid squad profile');
  const p = value as Profile;
  for (const key of ['coins', 'xp', 'clears', 'vacuumClears', 'restoration'] as const) if (!Number.isSafeInteger(p[key]) || p[key] < 0 || p[key] > (key === 'restoration' ? 3 : 1e9)) throw new Error('Invalid progression values');
  if (!Array.isArray(p.recruited) || !['guardian', 'witch', 'alchemist'].every(x => p.recruited.includes(x as HeroRole)) || p.recruited.some(x => !['guardian', 'witch', 'alchemist', 'rogue', 'archer'].includes(x)) || !Array.isArray(p.patterns) || !['starter', 'plain'].every(x => p.patterns.includes(x)) || p.patterns.some(x => !GEAR.some(g => g.id === x)) || !Array.isArray(p.team) || equipTeam(p, p.team) === p) throw new Error('Invalid saved squad');
  if (!Array.isArray(p.presets) || p.presets.length > 5 || p.presets.some(x => !x || typeof x.name !== 'string' || !x.name.trim() || x.name.length > 32 || !Array.isArray(x.team) || equipTeam(p, x.team) === p)) throw new Error('Invalid team presets');
  if (!Array.isArray(p.seen) || p.seen.some(x => !['guard', 'flanker', 'slinger', 'mender', 'charger', 'yarn', 'knot', 'vacuum'].includes(x)) || typeof p.rewardPending !== 'boolean') throw new Error('Invalid field guide');
  return JSON.parse(JSON.stringify(p));
}
export function parseSave(value: unknown): LabSave {
  if (!value || typeof value !== 'object') throw new Error('Invalid save file');
  const data = value as LabSave & { version: number; replay?: unknown };
  // Stage-one exports were replay-only. Import them as viewing sessions, never progression rewards.
  if ('ticks' in data) return { version: 2, profile: newProfile(), run: { replay: parseReplay(data), eligible: false, settled: true } };
  if (data.version !== 2) throw new Error('This save version is not supported. The original file has been preserved.');
  const profile = profileFrom(data.profile);
  if (data.run === null) return { version: 2, profile, run: null };
  if (!data.run || typeof data.run.eligible !== 'boolean' || typeof data.run.settled !== 'boolean') throw new Error('Invalid saved encounter');
  return { version: 2, profile, run: { ...data.run, replay: parseReplay(data.run.replay) } };
}
