import { expect, it } from 'vitest';
import * as R from './index';
import { clone } from '../internal';
const fresh = () => R.setFormationC2(R.setGameplayA6(R.createDepthAccount(80001, 0), true));
it('keeps a fixed C2 encounter budget when the crew upgrades or earns better gear', () => {
  const s = fresh(), trained = clone(s);
  trained.account.cards.forEach(c => { c.level = 10; c.stars = 3; });
  trained.gear.forEach(g => { g.enhancement = 12; });
  const encounter = (state: R.DepthAccount) => {
    const run = R.startRun(state, 1, 80001, 'campaign', '2026-11-12', 1).state.run!;
    return R.campaignEnemyStatsA6(run, run.nodes[0]!);
  };
  expect(encounter(trained)).toEqual(encounter(s));
});
it('changes only opted-in C2 campaign budgets, with different boss endurance per chapter', () => {
  for (const chapter of [1, 2, 3]) {
    const s = fresh(); s.cleared = [1, 2];
    const run = R.startRun(s, chapter, 80001, 'campaign', '2026-11-12', 1).state.run!;
    for (const node of run.nodes.filter(n => n.enemies.length)) {
      const old = R.campaignEnemyStatsA6({ ...run, formationC2: undefined }, node);
      const current = R.campaignEnemyStatsA6(run, node);
      for (const id of node.enemies) {
        const budget = R.ENEMY_BY_ID[id]!.tier === 'boss' ? R.BALANCE_C2.campaign.boss : R.BALANCE_C2.campaign.ordinary;
        expect(current[id]!.hp).toBe(Math.max(1, Math.round(old[id]!.hp * budget.hp[chapter - 1]!)));
        expect(current[id]!.attack).toBe(Math.max(1, Math.round(old[id]!.attack * budget.attack[chapter - 1]!)));
      }
    }
    const daily = { ...run, mode: 'daily' as const };
    expect(R.campaignEnemyStatsA6(daily, daily.nodes[0]!)).toEqual(R.campaignEnemyStatsA6({ ...daily, formationC2: undefined }, daily.nodes[0]!));
  }
});
it('retains committed enemy stats through preparation, save import and replay', () => {
  const s = R.enterNode(R.startRun(fresh(), 1, 80001).state, '0-0').state;
  const enemyStats = clone(s.run!.battle!.initial.enemyStats);
  const prepared = R.configurePreparation(s, s.team, s.rows, s.v4!.plan).state;
  expect(prepared.run!.battle!.initial.enemyStats).toEqual(enemyStats);
  expect(R.importSave(R.exportSave(prepared)).run!.battle!.initial.enemyStats).toEqual(enemyStats);
  const played = R.playBattle(prepared.run!.battle!, 'auto');
  expect(R.replayBattle(played.initial, played.choices)).toEqual(played);
});
