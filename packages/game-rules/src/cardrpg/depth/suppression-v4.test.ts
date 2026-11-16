import { describe, expect, it } from 'vitest';
import * as R from './index';
import { CARD_BY_ID } from '../catalog';

function enemyTurn(id: string, gameplayV4: boolean, signature: boolean, quiet: boolean, drowsy = false) {
  const cat = R.CAT_BY_ID.mochi!;
  const battle = R.createBattle({ seed: 5, chapter: 1, gameplayV4,
    cats: [{ id: cat.id, stats: { ...CARD_BY_ID.mochi!.baseStats, hp: 10000 }, row: 'front',
      skills: cat.skills.slice(0, 3).map(skill => skill.id) }], enemies: [id] });
  while (R.currentActor(battle)?.side === 'party')
    expect(R.act(battle, R.legalChoices(battle).find(choice => choice.skillId === 'defend')!)).toBe(true);
  const enemy = R.currentActor(battle)!;
  battle.intents.find(intent => intent.actorId === enemy.id)!.signature = signature;
  enemy.hp -= 100; enemy.shield = 0;
  if (quiet) enemy.statuses.push({ id: 'hush', stacks: 1, remaining: 2, source: cat.id, appliedRound: battle.round });
  if (drowsy) enemy.statuses.push({ id: 'drowsy', stacks: 1, remaining: 2, source: cat.id, appliedRound: battle.round });
  return { battle, enemy };
}

describe('Hush respects the committed utility action in gameplay v4', () => {
  for (const id of ['teacup-healer', 'button-guard']) for (const gameplayV4 of [false, true]) {
    it.each(['quiet-signature', 'ordinary-signature', 'quiet-basic', 'drowsy-signature'] as const)(
      `${id}, V4=${gameplayV4}, %s`, scenario => {
        const { battle, enemy } = enemyTurn(id, gameplayV4, scenario !== 'quiet-basic',
          scenario !== 'ordinary-signature', scenario === 'drowsy-signature');
        const offset = battle.log.length, turns = enemy.turns;
        expect(R.enemyAct(battle)).toBe(true);
        expect(enemy.turns).toBe(turns + 1);
        const events = battle.log.slice(offset).filter(event => event.actorId === enemy.id);
        const hits = events.filter(event => event.kind === 'damage' || event.kind === 'absorbed');
        if (id==='teacup-healer'&&scenario!=='ordinary-signature'||scenario === 'quiet-signature' && gameplayV4) {
          expect(hits).toHaveLength(0);
          expect(events.some(event => event.kind === 'heal' || event.kind === 'shield')).toBe(false);
          expect(events.some(event => event.kind === 'suppressed')).toBe(true);
        } else if (scenario === 'ordinary-signature') {
          expect(hits).toHaveLength(0);
          expect(events.some(event => event.kind === (id === 'teacup-healer' ? 'heal' : 'shield') && event.amount > 0)).toBe(true);
        } else {
          // A shield may absorb all HP damage; an attack is still an attack.
          expect(hits.length).toBeGreaterThan(0);
        }
        expect(events.some(event => event.kind === 'enemy-action')).toBe(true);
      });
  }

  it.each(['pollen-scout', 'yarn-giant', 'pantry-crown'])(
    'suppresses %s summoning while preserving its attack', id => {
      for (const quiet of [false, true]) {
        const { battle, enemy } = enemyTurn(id, true, true, quiet);
        enemy.phase = 2;
        const offset = battle.log.length;
        expect(R.enemyAct(battle)).toBe(true);
        const events = battle.log.slice(offset).filter(event => event.actorId === enemy.id);
        expect(events.some(event => event.kind === 'damage' || event.kind === 'absorbed')).toBe(true);
        expect(events.some(event => event.kind === 'summon')).toBe(!quiet);
      }
    });
});
