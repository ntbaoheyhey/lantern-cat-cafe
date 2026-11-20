import { createBattle } from './battle';
import { battleCats } from './state';
import { clone } from '../internal';
import { CAT_BY_ID } from './catalog';
import type { DepthAccount, Row } from './contract';
import { depthStats } from './equipment';
import { powerScoreA6 } from './power-a6';

/** C2 is recorded on each encounter; an old committed replay retains its rules. */
export const FORMATION_C2 = {
  partySize: 4, rowCapacity: 2, starterFourth: 'panko',
  rearCoverMultiplier: .9, rowMultiplier: .6, areaMultiplier: .6, splashMultiplier: .4,
} as const;
export const partySize = (state: Pick<DepthAccount, 'formationC2'>) => state.formationC2 ? FORMATION_C2.partySize : 3;
export function validRowsC2(team: readonly string[], rows: Record<string, Row>, hp?: Record<string, number>): boolean {
  return team.length === 4 && new Set(team).size === 4
    && team.every(id => rows[id] === 'front' || rows[id] === 'rear')
    && team.filter(id => rows[id] === 'front').length === 2
    && team.some(id => rows[id] === 'front' && (hp?.[id] ?? 1) > 0);
}
/** Preserve legal choices; fill an overfull/empty row deterministically, without touching health. */
export function balancedRowsC2(team: readonly string[], rows: Record<string, Row>, hp?: Record<string, number>): Record<string, Row> {
  const ordered = [...team].sort((a,b) => Number(rows[b] === 'front') - Number(rows[a] === 'front')
    || Number(CAT_BY_ID[b]?.role === 'guardian') - Number(CAT_BY_ID[a]?.role === 'guardian') || team.indexOf(a) - team.indexOf(b));
  const front = ordered.slice(0, 2);
  if (hp && !front.some(id => (hp[id] ?? 1) > 0)) {
    const living = ordered.slice(2).find(id => (hp[id] ?? 1) > 0);
    if (living) front[1] = living;
  }
  return Object.fromEntries(team.map(id => [id, front.includes(id) ? 'front' : 'rear']));
}
export function formationSeatsC2(team: readonly string[], rows: Record<string, Row>): Array<string | undefined> {
  return [0,1,2,3].map(slot => team.filter(id => rows[id] === (slot < 2 ? 'front' : 'rear'))[slot % 2]);
}
/** Moving to an occupied seat swaps both cats, so the two-per-row invariant always holds. */
export function placeInSlotC2(team: readonly string[], rows: Record<string, Row>, catId: string, slot: number) {
  const seats = formationSeatsC2(team, rows), from = seats.indexOf(catId);
  if (from < 0 || !Number.isInteger(slot) || slot < 0 || slot > 3) return null;
  [seats[from], seats[slot]] = [seats[slot], seats[from]];
  if (seats.some(id => !id)) return null;
  return { team: seats as string[], rows: { ...rows, ...Object.fromEntries(seats.map((id,i) => [id!, i < 2 ? 'front' : 'rear'])) } as Record<string, Row> };
}

/** One-time migration. Never removes a collected cat, item, currency, or recorded battle. */
export function setFormationC2(state: DepthAccount): DepthAccount {
  if (state.formationC2) return state;
  const s = clone(state), before = [...s.team];
  for (const id of ['panko', 'mochi', 'soot', 'clover']) {
    if (s.account.cards.length >= 4) break;
    if (!s.account.cards.some(card => card.cardId === id)) s.account.cards.push({ id, cardId: id, level: 1, stars: 1, shards: 0, soulbound: true });
  }
  const power = (id: string) => powerScoreA6(depthStats(s,id));
  const strongest = (ids: string[]) => [...new Set(ids)].sort((a,b) => power(b) - power(a) || a.localeCompare(b));
  const normalize = (ids: string[]) => {
    const owned = ids.filter(id => s.account.cards.some(card => card.cardId === id));
    const kept = owned.length > 4 ? strongest(owned).slice(0,4) : owned;
    return [...kept, ...strongest(s.account.cards.map(card => card.cardId).filter(id => !kept.includes(id)))].slice(0,4);
  };
  s.team = normalize(s.team);
  s.rows = { ...s.rows, ...balancedRowsC2(s.team,s.rows,s.run && !s.run.complete ? s.run.hp : undefined) };
  for (const card of s.account.cards) {
    s.rows[card.cardId] ??= CAT_BY_ID[card.cardId]!.row;
    s.skills[card.cardId] ??= CAT_BY_ID[card.cardId]!.skills.slice(0,3).map(skill => skill.id);
  }
  for (const preset of s.v4?.loadouts ?? []) if (preset) {
    preset.team = normalize(preset.team);
    preset.rows = balancedRowsC2(preset.team,preset.rows);
    preset.equipment = Object.fromEntries(preset.team.map(id => [id,preset.equipment[id] ?? clone(s.equipment[id] ?? {})]));
  }
  s.formationC2 = true;
  if (s.run && !s.run.complete) {
    s.run.formationC2 = true;
    s.run.gameplayA6 = true; s.run.skillsV5 = true; s.run.gameplayV4 = true;
    for (const id of s.team) s.run.hp[id] ??= depthStats(s,id).hp;
    const battle=s.run.battle;
    if(battle&&!battle.v4?.committed&&!battle.choices.length&&battle.actors.every(a=>a.turns===0)){
      s.run.battle=createBattle({...battle.initial,formationC2:true,gameplayA6:true,skillsV5:true,gameplayV4:true,cats:battleCats(s),hp:clone(s.run.hp)});
      s.lastBattle=clone(s.run.battle.initial);
    }
  }
  s.formationNoticeC2 = before.length > 4 ? 'bench' : 'four';
  return s;
}
