import { describe, expect, it } from 'vitest';
import * as R from './index';

const state = () => R.setGameplayA6(R.createDepthAccount(3, 0), true);
function fixture(seed = 3, enemies = ['yarn-giant']) {
  const s = state();
  for (const card of s.account.cards) card.level = 6;
  const cats = R.battleCats(s).map(c => ({ ...c, skills: R.CAT_BY_ID[c.id]!.skills.map(k => k.id) }));
  return R.createBattle({ seed, chapter: 1, gameplayV4: true, skillsV5: true, gameplayA6: true, cats, enemies });
}
describe('A6 opted-in automatic combat', () => {
  it('leaves OFF snapshots and save bytes unchanged', () => {
    const s = R.createDepthAccount(3, 0);
    expect(R.exportSave(R.setGameplayA6(s, false))).toBe(R.exportSave(s));
    const { gameplayA6: ignored, ...setup } = fixture().initial;
    void ignored;
    expect(R.playBattle(R.createBattle({ ...setup, gameplayA6: false }), 'auto')).toEqual(R.playBattle(R.createBattle(setup), 'auto'));
  });
  it('requires V5 and retains committed rules across preference changes and save reload', () => {
    const s = R.enterNode(R.startRun(state(), 1, 3).state, '0-0').state;
    expect(R.importSave(R.exportSave(s))).toEqual(s);
    expect(R.gameplayA6(R.setGameplayA6(s, false))).toBe(true);
    expect(() => R.createBattle({ ...fixture().initial, skillsV5: false })).toThrow();
  });
  it('accumulates bounded rage, emits a single full event and spends it on automatic ultimates', () => {
    const b = fixture(), cat = b.actors[0]!;
    expect(R.legalChoices(b).some(c => c.skillId.endsWith('-4'))).toBe(false);
    R.gainRageA6(b, cat, 500); R.gainRageA6(b, cat, 500);
    expect(cat.charge).toBe(100);
    expect(b.v4!.events.filter(e => e.kind === 'rage.full')).toHaveLength(1);
    const choice = R.chooseAction(b, 'auto');
    expect(choice.skillId).toMatch(/-4$/);
    expect(R.act(b, choice)).toBe(true);
    expect(cat.charge).toBeLessThan(100);
    expect(b.v4!.events.some(e => e.kind === 'ultimate.cast' && !!e.displayName && e.version === 2)).toBe(true);
    expect(b.v4!.events.every((e, i) => R.validBattleEventV5(e, i, true))).toBe(true);
  });
  it('replays the exact result and triggers both boss phase thresholds', () => {
    const b = fixture(), boss = b.actors.find(a => a.catalogId === 'yarn-giant')!;
    boss.hp = Math.floor(boss.maxHp * .65); R.phaseBossA6(b, boss);
    expect(boss.shield).toBeGreaterThan(0);
    R.phaseBossA6(b, boss);
    expect(b.v4!.events.filter(e => e.kind === 'boss-phase')).toHaveLength(1);
    boss.hp = Math.floor(boss.maxHp * .32); R.phaseBossA6(b, boss);
    expect(boss.phase).toBe(2);
    const played = R.playBattle(fixture(), 'auto');
    expect(R.replayBattle(played.initial, played.choices)).toEqual(played);
  });
  it('retains enemy rage through Daze and casts only on an unsuppressed action', () => {
    for (const dazed of [true, false]) {
      const b = fixture(), boss = b.actors.find(a => a.catalogId === 'yarn-giant')!;
      boss.charge = 100; b.queue = [boss.id];
      if (dazed) boss.statuses.push({ id: 'drowsy', stacks: 1, remaining: 1, source: b.actors[0]!.id, appliedRound: b.round });
      expect(R.enemyAct(b)).toBe(true);
      expect(b.v4!.events.some(e => e.kind === 'ultimate.cast' && e.actorId === boss.id)).toBe(!dazed);
      expect(boss.charge === 100).toBe(dazed);
    }
  });
});
