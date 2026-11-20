import historicalStats from './progression-smoothing-a5.fixture.json';
import { describe, expect, it } from 'vitest';
import * as R from './index';

describe('A5 early challenge progression', () => {
  it('preserves published enemy stats except the approved V4 class boss HP correction', () => {
    const levels = [1, 2, 3, 4, 5, ...Array.from({ length: 41 }, (_, i) => i + 10)];
    expect(R.ENEMY_BY_ID['yarn-giant']!.hp).toBe(1292);
    for(const level of levels){
      const actual=R.challengeStatsV4(level),historical=historicalStats.find(row=>row.level===level)!.stats;
      for(const [id,stats] of Object.entries(historical)){
        if(id==='yarn-giant'){
          // Only HP changes under U10; retain the published offense and defense.
          expect(actual[id]!.attack).toBe(stats.attack);expect(actual[id]!.defense).toBe(stats.defense);
          expect(actual[id]!.hp).toBeLessThan(stats.hp);
        }else expect(actual[id]).toEqual(stats);
      }
    }
  });

  it('bounds the former level6 boss attack jump and keeps every band monotonic', () => {
    for (const enemy of R.ENEMIES) {
      for (let level = 2; level <= 50; level++) {
        const before = R.challengeStatsV4(level - 1)[enemy.id]!;
        const after = R.challengeStatsV4(level)[enemy.id]!;
        expect(after.attack).toBeGreaterThanOrEqual(before.attack);
        expect(after.hp).toBeGreaterThanOrEqual(before.hp);
        expect(after.defense).toBe(before.defense);
        if (enemy.tier === 'boss') expect(after.attack / before.attack).toBeLessThanOrEqual(1.2);
      }
    }
  });

  it('honors an existing battle stat snapshot across export, import and replay', () => {
    const state = R.setGameplayV4(R.createDepthAccount(83), true);
    state.account.cards.forEach(cat => { cat.level = 6; });
    const stats = R.challengeStatsV4(6);
    // Published band6 Yarn Giant snapshot: active saved fights must retain these stats.
    stats['yarn-giant'] = { hp: 1022, attack: 135, defense: 22 };
    const battle = R.playBattle(R.createBattle({ seed: 83, chapter: 1, cats: R.battleCats(state),
      enemies: ['yarn-giant'], gameplayV4: true, challengeLevel: 6, enemyStats: stats }), 'auto');
    expect(battle.initial.enemyStats!['yarn-giant']).toEqual(stats['yarn-giant']);
    expect(R.replayBattle(battle.initial, battle.choices)).toEqual(battle);
    state.lastBattle = battle.initial;
    state.lastChoices = battle.choices;
    const imported = R.importSave(R.exportSave(state));
    expect(imported.lastBattle).toEqual(state.lastBattle);
    expect(R.replayBattle(imported.lastBattle!, imported.lastChoices)).toEqual(battle);
  });
});
