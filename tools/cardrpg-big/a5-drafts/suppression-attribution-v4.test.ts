import { describe, expect, it } from 'vitest';
import * as R from './index';
import { CARD_BY_ID } from '../catalog';

function setup(id: string, gameplayV4: boolean, signature: boolean, control: 'hush' | 'drowsy' | undefined) {
  const battle = R.createBattle({ seed: 5, chapter: 1, gameplayV4,
    cats: ['inkcap', 'sorrel', 'brioche'].map(catId => ({ id: catId,
      stats: { ...CARD_BY_ID[catId]!.baseStats, hp: 10000 }, row: R.CAT_BY_ID[catId]!.row,
      skills: R.CAT_BY_ID[catId]!.skills.slice(0, 3).map(skill => skill.id) })), enemies: [id] });
  while (R.currentActor(battle)?.side === 'party')
    expect(R.act(battle, R.legalChoices(battle).find(choice => choice.skillId === 'defend')!)).toBe(true);
  const enemy = R.currentActor(battle)!, controller = battle.actors.find(actor => actor.id === 'inkcap')!;
  battle.intents.find(intent => intent.actorId === enemy.id)!.signature = signature;
  enemy.phase = 2; enemy.hp -= 100; enemy.shield = 0; controller.hp -= 50;
  if (control) enemy.statuses.push({ id: control, stacks: 1, remaining: 2,
    source: controller.id, appliedRound: battle.round });
  return { battle, enemy, controller };
}

describe('Hush reports only an action it actually suppresses', () => {
  for (const id of ['teacup-healer', 'button-guard', 'pollen-scout', 'yarn-giant', 'pantry-crown']) {
    it.each([false, true])(`${id} basic turn, V4=%s: no control credit or Lantern heal`, gameplayV4 => {
      const { battle, enemy, controller } = setup(id, gameplayV4, false, 'hush');
      const offset = battle.log.length, hp = controller.hp;
      expect(R.enemyAct(battle)).toBe(true);
      const events = battle.log.slice(offset);
      expect(events.some(event => event.kind === 'suppressed')).toBe(false);
      expect(events.some(event => event.kind === 'heal' && event.actorId === controller.id)).toBe(false);
      expect(controller.hp).toBe(hp);
      expect(controller.bonuses.crewSuppressed).toBeUndefined();
      expect(events.some(event => event.actorId === enemy.id && ['damage', 'absorbed'].includes(event.kind))).toBe(true);
    });

    it(`${id} signature: credits a real suppression exactly once`, () => {
      const { battle, enemy, controller } = setup(id, true, true, 'hush');
      const offset = battle.log.length;
      expect(R.enemyAct(battle)).toBe(true);
      const events = battle.log.slice(offset);
      expect(events.filter(event => event.kind === 'suppressed')).toHaveLength(1);
      expect(events.filter(event => event.kind === 'heal' && event.actorId === controller.id)
        .reduce((total, event) => total + event.amount, 0)).toBe(8);
      expect(controller.bonuses.crewSuppressed).toBe(1);
      expect(events.some(event => event.kind === 'summon')).toBe(false);
      expect(events.some(event => event.actorId === enemy.id && ['damage', 'absorbed'].includes(event.kind)))
        .toBe(!['teacup-healer', 'button-guard'].includes(id));
    });
  }

  it.each([false, true])('Drowsy still weakens an attack and earns Lantern credit, signature=%s', signature => {
    const { battle, enemy, controller } = setup('teacup-healer', true, signature, 'drowsy');
    const offset = battle.log.length;
    expect(R.enemyAct(battle)).toBe(true);
    const events = battle.log.slice(offset);
    expect(events.filter(event => event.kind === 'suppressed')).toHaveLength(1);
    expect(events.some(event => event.actorId === enemy.id && ['damage', 'absorbed'].includes(event.kind))).toBe(true);
    expect(controller.bonuses.crewSuppressed).toBe(1);
  });

  it('does not consume Lantern credit before a real utility signature', () => {
    const { battle, enemy, controller } = setup('teacup-healer', true, false, 'hush');
    const hp = controller.hp;
    expect(R.enemyAct(battle)).toBe(true);
    expect(controller.hp).toBe(hp);
    expect(controller.bonuses.crewSuppressed).toBeUndefined();
    // Reach the same enemy's next turn through public actions, then isolate its committed intent.
    while (R.currentActor(battle)?.id !== enemy.id) {
      expect(R.currentActor(battle)?.side).toBe('party');
      expect(R.act(battle, R.legalChoices(battle).find(choice => choice.skillId === 'defend')!)).toBe(true);
    }
    battle.intents.find(intent => intent.actorId === enemy.id)!.signature = true;
    const hush = enemy.statuses.find(status => status.id === 'hush')!;
    hush.remaining = 3;
    const offset = battle.log.length;
    expect(R.enemyAct(battle)).toBe(true);
    expect(battle.log.slice(offset).filter(event => event.kind === 'suppressed')).toHaveLength(1);
    expect(controller.hp).toBe(hp + 8);
    expect(controller.bonuses.crewSuppressed).toBe(1);
    while (R.currentActor(battle)?.id !== enemy.id)
      expect(R.act(battle, R.legalChoices(battle).find(choice => choice.skillId === 'defend')!)).toBe(true);
    battle.intents.find(intent => intent.actorId === enemy.id)!.signature = true;
    const second = battle.log.length;
    expect(R.enemyAct(battle)).toBe(true);
    expect(battle.log.slice(second).filter(event => event.kind === 'suppressed')).toHaveLength(1);
    expect(battle.log.slice(second).some(event => event.kind === 'heal' && event.actorId === controller.id)).toBe(false);
    expect(controller.hp).toBe(hp + 8);
  });
});
