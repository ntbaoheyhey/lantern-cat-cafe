import { expect, it } from 'vitest';
import { clone } from '../internal';
import * as R from './index';

function fixture(legacy = false) {
  const state = R.setGameplayA6(R.createDepthAccount(917287, 0), !legacy);
  return R.createBattle({ seed: 917287, chapter: 1, cats: R.battleCats(state),
    enemies: ['button-guard', 'teacup-healer'], gameplayV4: true, skillsV5: !legacy,
    gameplayA6: !legacy, plan: { focus: 'support', care: 'protect' } });
}
function manualChoice(battle: R.Battle) {
  battle.queue = ['mochi', 'soot', 'clover', ...battle.queue.filter(id => id.startsWith('foe-'))];
  const target = battle.actors.find(actor => actor.catalogId === 'button-guard')!;
  expect(R.act(battle, { actorId: 'mochi', targetId: target.id, skillId: 'mochi-1' })).toBe(true);
  return battle.v4!.events.find(event => event.kind === 'plan-target')!;
}

it.each([false, true])('describes the selected plan without claiming it caused a manual action (legacy=%s)', legacy => {
  const battle = fixture(legacy), decision = manualChoice(battle);
  expect(battle.actors.find(actor => actor.id === decision.targetId)?.catalogId).toBe('button-guard');
  // The current plan is deliberately different from the receipt's support/protect plan.
  battle.v4!.plan = { focus: 'leader', care: 'steady' };
  const before = clone(battle), cause = R.outcomeV4(battle).causes.find(c => c.kind === 'plan');
  expect(cause?.amount).toBe(1);
  expect(cause?.text).toBe('Mochi took 1 action with “Their support · Protect” selected.');
  expect(battle).toEqual(before);
});

it('counts only matching actor, focus and care receipts for the displayed plan', () => {
  const battle = fixture(), decision = manualChoice(battle);
  battle.v4!.events = [decision,
    { ...decision, sequence: 101, plan: { focus: 'support', care: 'steady' } },
    { ...decision, sequence: 102, plan: { focus: 'finish', care: 'protect' } },
    { ...decision, sequence: 103 },
    { ...decision, sequence: 104, actorId: 'soot' },
    { ...decision, sequence: 105, actorId: battle.actors.find(a => a.side === 'enemy')!.id },
    { ...decision, sequence: 106, actorId: 'unrecorded-cat' },
    { ...decision, sequence: 107, plan: { focus: 'future', care: 'protect' } as unknown as R.StandingPlan },
  ];
  const before = clone(battle), cause = R.outcomeV4(battle).causes.find(c => c.kind === 'plan');
  expect(cause?.amount).toBe(2);
  expect(cause?.text).toBe('Mochi took 2 actions with “Their support · Protect” selected.');
  expect(battle).toEqual(before);
});

it('omits the tactic summary for absent or unfamiliar records', () => {
  const battle = fixture(), decision = manualChoice(battle);
  for (const plan of [null, { focus: 'future', care: 'protect' }, { focus: 'finish', care: 'future' }]) {
    battle.v4!.events = [{ ...decision, plan: plan as unknown as R.StandingPlan }];
    expect(R.outcomeV4(battle).causes.some(c => c.kind === 'plan')).toBe(false);
  }
  battle.v4!.events = [];
  expect(R.outcomeV4(battle).causes.some(c => c.kind === 'plan')).toBe(false);
});

it('preserves measured effects ahead of the optional plan summary', () => {
  const battle = fixture(); manualChoice(battle);
  const hit = battle.log.find(event => event.kind === 'damage')!;
  battle.log = ['mochi', 'clover', 'soot'].map((actorId, index) => ({ ...hit, actorId, amount: 20 + index }));
  const outcome = R.outcomeV4(battle);
  expect(outcome.causes.map(c => c.kind)).toEqual(['damage', 'damage', 'damage']);
  expect(outcome.causes.map(c => c.amount)).toEqual([22, 21, 20]);
});
