import { describe, expect, it } from 'vitest';
import { clone } from '../internal';
import { act, createBattle, currentActor, enemyAct, legalChoices, replayBattle, skillById } from './battle';
import { chooseAction, playBattle } from './policies';
import { battleCats, createDepthAccount } from './state';

function fixture(seed = 11) {
  return createBattle({ seed, chapter: 1, cats: battleCats(createDepthAccount(seed)), enemies: ['button-guard', 'sock-skipper'] });
}

describe('automatic battle controller', () => {
  it('evaluates legal choices without changing the battle or consuming RNG', () => {
    const battle = fixture();
    const before = clone(battle);
    const choice = chooseAction(battle, 'auto');
    expect(legalChoices(battle)).toContainEqual(choice);
    expect(chooseAction(battle, 'auto')).toEqual(choice);
    expect(battle).toEqual(before);
  });

  it('heals a low-health ally and explains the action using pre-heal HP', () => {
    const battle = fixture();
    battle.queue = ['clover', ...battle.queue.filter(id => id !== 'clover')];
    const mochi = battle.actors.find(actor => actor.id === 'mochi')!;
    mochi.hp = Math.ceil(mochi.maxHp * .22);
    const choice = chooseAction(battle, 'auto');
    expect(skillById(choice.skillId)!.effects.some(effect => effect.kind === 'heal')).toBe(true);
    act(battle, choice);
    expect(mochi.hp).toBeGreaterThan(mochi.maxHp * .22);
    expect(battle.log.find(event => event.kind === 'action')?.text).toContain('22%');
  });

  it('finishes a weak reachable foe', () => {
    const battle = fixture();
    battle.queue = ['soot', ...battle.queue.filter(id => id !== 'soot')];
    const weak = battle.actors.find(actor => actor.catalogId === 'sock-skipper')!;
    weak.hp = 1;
    const choice = chooseAction(battle, 'auto');
    expect(choice.targetId).toBe(weak.id);
    act(battle, choice);
    expect(weak.hp).toBe(0);
  });

  it('uses a charged ultimate when it protects an injured team', () => {
    const battle = fixture();
    const clover = battle.actors.find(actor => actor.id === 'clover')!;
    clover.skills = ['clover-1', 'clover-2', 'clover-4'];
    clover.charge = 100;
    battle.queue = [clover.id, ...battle.queue.filter(id => id !== clover.id)];
    for (const actor of battle.actors.filter(actor => actor.side === 'party')) actor.hp = Math.ceil(actor.maxHp * .25);
    expect(chooseAction(battle, 'auto').skillId).toBe('clover-4');
  });

  it.each([1, 7, 11, 42, 10001])('matches watched, skipped and recorded replay for seed %i', seed => {
    const watched = fixture(seed);
    let steps = 0;
    while (!watched.result && steps++ < 900) {
      if (currentActor(watched)?.side === 'enemy') enemyAct(watched);
      else act(watched, chooseAction(watched, 'auto'));
    }
    expect(watched.result).toBeTruthy();
    expect(playBattle(fixture(seed), 'auto')).toEqual(watched);
    expect(replayBattle(watched.initial, watched.choices)).toEqual(watched);
  });
});
