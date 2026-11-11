import { expect, it } from 'vitest';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { displayedBossPhase, snapshotBattle, splitPresentation } from './battle-presentation';
import { DepthModel } from './model';
import { galleryFixture, GALLERY_ACTIONS } from './feel-lab';

function encounter() {
  const model = new DepthModel(true);
  model.watchNow();
  model.sceneReady = true;
  return model;
}

it('presents all three A6 boss phases from the real thresholds while retaining the two legacy phases', () => {
  const battle = R.createBattle({ ...encounter().battle!.initial, enemies: ['yarn-giant'], gameplayV4: true, skillsV5: true, gameplayA6: true });
  const boss = battle.actors.find(actor => actor.catalogId === 'yarn-giant')!;
  expect(displayedBossPhase(battle, boss)).toBe(1);
  boss.hp = Math.floor(boss.maxHp * .65); R.phaseBossA6(battle, boss);
  expect(displayedBossPhase(battle, boss)).toBe(2);
  expect(boss.phase).toBe(1);
  boss.hp = Math.floor(boss.maxHp * .32); R.phaseBossA6(battle, boss);
  expect(displayedBossPhase(battle, boss)).toBe(3);
  battle.initial.gameplayA6 = false;
  expect(displayedBossPhase(battle, boss)).toBe(2);
});

it.each([2, 3])('holds Burn-triggered phase %s and its helpers until the round beat', phase => {
  const battle = R.createBattle({ ...galleryFixture('mochi-1').battle.initial, enemies: ['yarn-giant'], gameplayV4: true, skillsV5: true, gameplayA6: true });
  const cat = battle.actors.find(actor => actor.catalogId === 'mochi')!;
  const boss = battle.actors.find(actor => actor.catalogId === 'yarn-giant')!;
  boss.hp = Math.ceil(boss.maxHp * (phase === 2 ? .66 : .33)) + 5;
  boss.shield = 0;
  if (phase === 3) boss.bonuses.a6FirstPhase = 1;
  boss.statuses = [{id: 'scald', stacks: 1, remaining: 3, source: cat.id, appliedRound: battle.round}];
  battle.queue = [cat.id]; battle.acted = battle.actors.filter(actor => actor !== cat).map(actor => actor.id);
  battle.v4!.committed = true;
  const before = snapshotBattle(battle);
  expect(R.act(battle, {actorId: cat.id, skillId: 'defend', targetId: cat.id})).toBe(true);
  expect(displayedBossPhase(battle, boss)).toBe(phase);
  const resolved = JSON.stringify(battle), {impact, roundPlan} = splitPresentation(before, battle, 'defend');
  const shown = impact.actors.find(actor => actor.id === boss.id)!;
  expect(shown.hp).toBe(before.actors.find(actor => actor.id === boss.id)!.hp);
  expect(displayedBossPhase(impact, shown)).toBe(phase - 1);
  expect(impact.actors.map(actor => actor.id)).toEqual(before.actors.map(actor => actor.id));
  expect(roundPlan?.events.some(event => event.type === 'damage' && event.targetIds.includes(boss.id))).toBe(true);
  expect(JSON.stringify(battle)).toBe(resolved);
});

it.each([2, 3])('keeps direct-hit phase %s and its helpers on the action impact', phase => {
  const battle = R.createBattle({ ...galleryFixture('mochi-1').battle.initial, enemies: ['yarn-giant'], gameplayV4: true, skillsV5: true, gameplayA6: true });
  const cat = battle.actors.find(actor => actor.catalogId === 'mochi')!;
  const boss = battle.actors.find(actor => actor.catalogId === 'yarn-giant')!;
  boss.hp = Math.ceil(boss.maxHp * (phase === 2 ? .66 : .33)) + 5; boss.shield = 0;
  if (phase === 3) boss.bonuses.a6FirstPhase = 1;
  battle.queue = [cat.id, ...battle.queue.filter(id => id !== cat.id)]; battle.v4!.committed = true;
  const before = snapshotBattle(battle);
  expect(R.act(battle, {actorId: cat.id, skillId: 'mochi-1', targetId: boss.id})).toBe(true);
  const {impact} = splitPresentation(before, battle, 'mochi-1');
  expect(displayedBossPhase(impact, impact.actors.find(actor => actor.id === boss.id)!)).toBe(phase);
  expect(impact.actors.map(actor => actor.id)).toEqual(battle.actors.map(actor => actor.id));
});

it('preserves an action phase when its following round tick reaches the next phase', () => {
  const before = R.createBattle({ ...galleryFixture('mochi-1').battle.initial, enemies: ['yarn-giant'], gameplayV4: true, skillsV5: true, gameplayA6: true });
  const after = snapshotBattle(before), boss = after.actors.find(actor => actor.catalogId === 'yarn-giant')!, cat = after.actors[0]!;
  after.procRounds = {...after.procRounds, v5ActionSequence: 1};
  const log = (kind: string, amount: number) => after.log.push({round: after.round, actorId: cat.id, targetId: boss.id, skillId: 'mochi-1', kind, amount, text: ''});
  const contactHP = Math.floor(boss.maxHp * .5);
  log('damage', boss.hp - contactHP); boss.hp = contactHP; R.phaseBossA6(after, boss); log('action', 0);
  after.procRounds.v5RoundEnd = 1;
  const roundHP = Math.floor(boss.maxHp * .32);
  log('dot', boss.hp - roundHP); boss.hp = roundHP; R.phaseBossA6(after, boss); after.round++;
  const {impact} = splitPresentation(before, after, 'mochi-1'), shown = impact.actors.find(actor => actor.id === boss.id)!;
  expect(shown.hp).toBe(contactHP); expect(displayedBossPhase(impact, shown)).toBe(2);
  expect(displayedBossPhase(after, boss)).toBe(3);
});

it('holds HP, KO, round and order until their presentation beat while rules resolve once', () => {
  const model = encounter();
  const before = snapshotBattle(model.battle!);
  model.step();
  const resolved = JSON.stringify(model.battle);
  expect(model.visualBattle!.actors.map(actor => actor.hp)).toEqual(before.actors.map(actor => actor.hp));
  expect(model.visualBattle!.queue).toEqual(before.queue);
  const impact = model.plan!.beats[2]!.start;
  model.tick(impact - 1);
  expect(model.visualBattle!.actors.map(actor => actor.hp)).toEqual(before.actors.map(actor => actor.hp));
  model.tick(1);
  expect(model.visualBattle!.actors.map(actor => actor.hp)).toEqual(model.battle!.actors.map(actor => actor.hp));
  expect(JSON.stringify(model.battle)).toBe(resolved);
});

it('separates action HP, reflected damage and round ticks into a single bounded round beat', () => {
  const before = snapshotBattle(encounter().battle!);
  const [cat, , , enemy] = before.actors;
  const after = snapshotBattle(before);
  const event = (kind: string, targetId: string, amount: number) => ({ round: before.round,
    actorId: cat!.id, targetId, skillId: 'mochi-1', kind, amount, text: '' });
  after.log.push(event('damage', enemy!.id, 30), event('shared', cat!.id, 5),
    event('reflect', cat!.id, 10), event('action', enemy!.id, 0), event('dot', enemy!.id, 7),
    event('heal', cat!.id, 6));
  after.round++;
  after.actors[0]!.hp -= 9;
  after.actors[3]!.hp -= 37;
  const { impact, events, roundPlan } = splitPresentation(before, after, 'mochi-1');
  expect(impact.actors[0]!.hp).toBe(cat!.hp - 15);
  expect(impact.actors[3]!.hp).toBe(enemy!.hp - 30);
  expect(events.filter(event => event.type === 'damage')).toHaveLength(3);
  expect(impact.round).toBe(before.round);
  expect(roundPlan!.duration).toBeLessThanOrEqual(300);
  expect(roundPlan!.events.map(event => event.amount)).toEqual([7, 6]);
});

it('keeps an imminent KO visible during anticipation and handles revival values exactly', () => {
  const before = snapshotBattle(encounter().battle!);
  const enemy = before.actors.at(-1)!;
  const after = snapshotBattle(before);
  after.actors.at(-1)!.hp = 0;
  const base = { round: 1, actorId: before.actors[0]!.id, targetId: enemy.id, skillId: 'mochi-1', text: '' };
  after.log.push({ ...base, kind: 'damage', amount: enemy.hp }, { ...base, kind: 'defeat', amount: 0 }, { ...base, kind: 'action', amount: 0 });
  expect(splitPresentation(before, after, 'mochi-1').impact.actors.at(-1)!.hp).toBe(0);
  after.actors.at(-1)!.hp = 25;
  after.log.splice(after.log.length - 2, 1, { ...base, kind: 'survive', amount: 25 });
  expect(splitPresentation(before, after, 'mochi-1').impact.actors.at(-1)!.hp).toBe(25);
  expect(before.actors.at(-1)!.hp).toBe(enemy.hp);
});

it('restores a pending impact after preview, honors pause and skips a moment cleanly', () => {
  const model = encounter();
  model.step();
  const before = model.visualBattle;
  model.inspect('soot-4', .8, true);
  model.tick(100);
  model.closeGallery();
  expect(model.visualBattle).toBe(before);
  model.paused = true;
  model.tick(10000);
  expect(model.animationAt).toBe(0);
  model.finishMoment();
  expect(model.visualBattle).toBe(model.battle);
  model.paused = false;
  model.step();
  model.skip();
  expect(model.screen).toBe('result');
  expect(model.plan).toBeNull();
  expect(model.visualBattle).toBe(model.battle);
});

it('fits every gallery action inside the x1 pacing budget including hit stop and kill settle', () => {
  for (const action of GALLERY_ACTIONS) {
    const { plan } = galleryFixture(action.id);
    const limit = action.enemy ? 1400 : action.ultimate ? 2800 : action.id.endsWith('-1') ? 1200 : 1800;
    expect(plan.duration, action.id).toBeLessThanOrEqual(limit);
    expect(plan.beats.at(-1)!.start + plan.beats.at(-1)!.duration).toBe(plan.duration);
    expect(plan.beats[0]!.duration).toBeGreaterThanOrEqual(600);
  }
});

it.each([1, 2, 4])('advances presentation at %sx and preserves the watched rules result', speed => {
  const model = encounter();
  model.state.settings.speed = speed;
  const expected = R.playBattle(R.createBattle(model.battle!.initial), 'auto');
  model.step();
  model.tick(10);
  expect(model.animationAt).toBe(10 * speed);
  for (let index = 0; index < 900 && model.showBattle; index++) { model.step(); model.tick(10000); }
  expect(model.battle).toEqual(expected);
  expect(model.screen).toBe('result');
});
