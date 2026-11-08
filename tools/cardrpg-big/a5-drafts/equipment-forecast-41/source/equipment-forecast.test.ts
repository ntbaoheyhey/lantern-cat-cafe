import { expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { firstInvitation } from '@taskbar-hero/game-rules/src/cardrpg/depth/onboarding';
import { equipmentForecast } from './equipment-forecast';
const account = () => R.setGameplayV4(R.createDepthAccount(11, 0), true);

it('previews the actual whole-crew transfer without equipping or changing progress', () => {
  const state = account(), before = R.exportSave(state);
  const item = state.equipment.mochi!.weapon!;
  const expected = R.equipGear(state, 'soot', item); expect(expected.ok).toBe(true);
  const preview = equipmentForecast(state, 'soot', item, 1, 1);
  expect('error' in preview).toBe(false); if ('error' in preview) return;
  expect(preview.before.cats).toEqual(R.battleCats(state));
  expect(preview.after.cats).toEqual(R.battleCats(expected.state));
  expect(preview.transfer).toBe('mochi'); expect(preview.benched).toBe(false);
  expect(preview.sameCrew).toBe(false);
  expect(preview.before.plan).toEqual(state.v4!.plan);
  expect(preview.after.plan).toEqual(preview.before.plan);
  expect(R.exportSave(state)).toBe(before);
});

it('uses the named boss and exact band pressure at all three unlocked chapters', () => {
  const state = account(); state.cleared = [1,2,3];
  state.account.cards.forEach(card => { card.level = 5; });
  for (const chapter of R.CHAPTERS) for (const band of [1,5]) {
    const preview = equipmentForecast(state, 'mochi', state.gear[0]!.id, chapter.id, band);
    expect('error' in preview).toBe(false); if ('error' in preview) continue;
    expect(preview.before.enemies).toEqual([chapter.boss]);
    expect(preview.before.enemyStats).toEqual(R.challengeStatsV4(band));
    expect(preview.after.enemyStats).toEqual(preview.before.enemyStats);
    expect(preview.before.challengeLevel).toBe(band);
    expect(preview.before.hp).toBeUndefined(); expect(preview.before.boons).toBeUndefined();
    expect(R.createBattle(preview.before).actors.filter(a => a.side === 'party').every(a => a.hp === a.maxHp)).toBe(true);
  }
});

it('includes loss of gear on active cats when transferring to a reserve', () => {
  let state = account(); const invite = firstInvitation(state, 11);
  expect(invite.ok).toBe(true); state = invite.state;
  const reserve = state.account.cards.find(card => !state.team.includes(card.cardId))!;
  expect(reserve).toBeTruthy();
  const preview = equipmentForecast(state, reserve.cardId, state.equipment.mochi!.weapon!, 1, 1);
  expect('error' in preview).toBe(false); if ('error' in preview) return;
  expect(preview.benched).toBe(true); expect(preview.transfer).toBe('mochi'); expect(preview.sameCrew).toBe(false);
  expect(preview.after.cats.map(c => c.id)).toEqual(preview.before.cats.map(c => c.id));
  expect(preview.after.cats.find(c => c.id === 'mochi')!.stats.attack).toBeLessThan(preview.before.cats.find(c => c.id === 'mochi')!.stats.attack);
});

it('does not manufacture a different matchup for an already-equipped piece', () => {
  const state = account(), preview = equipmentForecast(state, 'mochi', state.equipment.mochi!.weapon!, 1, 1);
  expect('error' in preview).toBe(false); if ('error' in preview) return;
  expect(preview.sameCrew).toBe(true); expect(preview.transfer).toBeUndefined();
});

it('rejects OFF, locked routes, missing gear and ineligible bands without mutations', () => {
  const state = account(), before = R.exportSave(state), item = state.gear[0]!.id;
  for (const [chapter,band] of [[2,1],[4,1],[1,0],[1,2],[1,1.5]])
    expect(equipmentForecast(state, 'mochi', item, chapter!, band!)).toHaveProperty('error');
  expect(equipmentForecast(state, 'mochi', 'missing', 1, 1)).toHaveProperty('error');
  const off = R.setGameplayV4(state, false);
  expect(equipmentForecast(off, 'mochi', item, 1, 1)).toHaveProperty('error');
  expect(R.exportSave(state)).toBe(before);
  const started = R.startRun(state, 1, 11); expect(started.ok).toBe(true);
  const active = R.exportSave(started.state);
  expect(equipmentForecast(started.state, 'mochi', item, 1, 1)).toHaveProperty('error');
  expect(R.exportSave(started.state)).toBe(active);
});
