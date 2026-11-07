import { describe, expect, it } from 'vitest';
import { clone } from '../internal';
import { CARDS } from '../catalog';
import * as R from './index';

function prepared(seed = 73) {
  const state = R.setGameplayV4(R.createDepthAccount(seed), true);
  for (const cat of state.account.cards) cat.level = 6;
  return R.enterNode(R.startRun(state, 1, seed).state, '0-0').state;
}
function takeTurn(battle: R.Battle) {
  if (R.currentActor(battle)?.side === 'enemy') R.enemyAct(battle);
  else R.act(battle, R.chooseAction(battle, 'auto'));
}

describe('gameplay v4 preparation and compatibility', () => {
  it('keeps absent/OFF accounts and legacy export byte-identical', () => {
    const state = R.createDepthAccount(73), before = R.exportSave(state);
    expect(R.setGameplayV4(state, false)).toEqual(state);
    expect(R.exportSave(R.setGameplayV4(state, false))).toBe(before);
    expect(before.startsWith('THC7.')).toBe(true);
    const on = R.setGameplayV4(R.importSave(before), true);
    expect(on.account).toEqual(state.account);
    expect(on.gear).toEqual(state.gear);
    expect(R.exportSave(on).startsWith('THC9.')).toBe(true);
    expect(R.importSave(R.exportSave(on))).toEqual(on);
    const off = R.setGameplayV4(on, false);
    expect(off.v4).toEqual(on.v4);
    expect(R.importSave(R.exportSave(off))).toEqual(off);
  });
  it('keeps an active route and replay in the mode in which it began', () => {
    const old = R.enterNode(R.startRun(R.createDepthAccount(), 1, 73).state, '0-0').state;
    const enabled = R.setGameplayV4(old, true);
    expect(R.gameplayV4(enabled)).toBe(false);
    expect(enabled.run).toEqual(old.run);
    expect(R.battleCats(enabled)).toEqual(R.battleCats(old));
    const on = prepared(), disabled = R.setGameplayV4(on, false);
    expect(R.gameplayV4(disabled)).toBe(true);
    expect(disabled.run).toEqual(on.run);
    expect(R.importSave(R.exportSave(disabled))).toEqual(disabled);
  });
  it('requires distinct contributors and replaces the small crew tier', () => {
    expect(R.crewThresholds(['mochi', 'mochi']).every(c => !c.threshold)).toBe(true);
    expect(R.crewThresholds(['mochi', 'clover', 'soot']).find(c => c.id === 'door')!.threshold).toBe(2);
    expect(R.crewThresholds(['mochi', 'panko', 'clover']).find(c => c.id === 'door')!.threshold).toBe(4);
    const stats = CARDS[0]!.baseStats;
    expect(R.crewStats(stats, ['mochi', 'panko', 'clover']).hp).toBe(Math.round(stats.hp * 1.06));
    expect(R.crewStats(stats, ['mochi', 'clover', 'soot']).hp).toBe(Math.round(stats.hp * 1.03));
  });
  it('preserves seed, enemies, carried HP and inputs through repeated edits', () => {
    const state = prepared();
    state.run!.hp.mochi = 37;
    state.run!.battle = R.createBattle({ ...state.run!.battle!.initial, hp: clone(state.run!.hp) });
    const before = clone(state), rows = { ...state.rows, mochi: 'rear' as const, soot: 'front' as const };
    const edited = R.configurePreparation(state, state.team, rows, { focus: 'support', care: 'protect' });
    expect(edited.ok).toBe(true); expect(state).toEqual(before);
    const again = R.configurePreparation(edited.state, state.team, state.rows, R.DEFAULT_PLAN).state;
    expect(again.run!.battle!.initial.seed).toBe(before.run!.battle!.initial.seed);
    expect(again.run!.battle!.initial.enemyStats).toEqual(before.run!.battle!.initial.enemyStats);
    expect(again.run!.battle!.actors.find(a => a.id === 'mochi')!.hp).toBe(37);
    expect(again.run!.battle!.initial.enemies).toEqual(before.run!.battle!.initial.enemies);
    expect(again.run!.battle!.rng).toBe(before.run!.battle!.rng);
    expect(R.importSave(R.exportSave(again))).toEqual(again);
  });
  it('rejects invalid teams, all-rear and only-dead-front formations atomically', () => {
    const state = prepared();
    const invalid = [state.team.map(() => 'mochi'), ['mochi', 'soot', 'velvet']];
    for (const ids of invalid) expect(R.configurePreparation(state, ids, state.rows, R.DEFAULT_PLAN).state).toBe(state);
    const rear = Object.fromEntries(state.team.map(id => [id, 'rear' as const]));
    expect(R.configurePreparation(state, state.team, rear, R.DEFAULT_PLAN).ok).toBe(false);
    state.run!.hp.mochi = 0;
    expect(R.configurePreparation(state, state.team, { ...rear, mochi: 'front' }, R.DEFAULT_PLAN).ok).toBe(false);
    expect(R.configurePreparation(state, state.team, state.rows, { focus: 'bad', care: 'steady' } as unknown as R.StandingPlan).state).toBe(state);
  });
  it('permits collected roster changes only at the first untouched encounter', () => {
    const state = prepared();
    state.account.cards.push({ id: 'panko', cardId: 'panko', level: 6, stars: 1, shards: 0, soulbound: true });
    const team = ['panko', 'soot', 'clover'];
    expect(R.configurePreparation(state, team, { ...state.rows, panko: 'front' }, R.DEFAULT_PLAN).ok).toBe(true);
    state.run!.visited.push('earlier-node');
    expect(R.configurePreparation(state, team, { ...state.rows, panko: 'front' }, R.DEFAULT_PLAN).state).toBe(state);
    expect(R.configurePreparation(state, state.team, state.rows, { focus: 'leader', care: 'protect' }).ok).toBe(true);
  });
  it('locks at Fight and after any action, including a restored save', () => {
    const state = prepared(), committed = R.commitPreparation(state).state;
    expect(R.configurePreparation(committed, committed.team, committed.rows, R.DEFAULT_PLAN).ok).toBe(false);
    const restored = R.importSave(R.exportSave(committed));
    expect(R.configurePreparation(restored, restored.team, restored.rows, R.DEFAULT_PLAN).state).toBe(restored);
    takeTurn(state.run!.battle!);
    expect(R.configurePreparation(state, state.team, state.rows, R.DEFAULT_PLAN).ok).toBe(false);
  });
  it('rejects invalid extension plans and malformed event sequences on import', () => {
    const state = prepared();
    state.v4!.plan.focus = 'unknown' as R.StandingPlan['focus'];
    expect(() => R.exportSave(state)).toThrow('structure');
    state.v4!.plan.focus = 'finish';
    state.run!.battle!.v4!.events[0]!.sequence = 5;
    expect(() => R.exportSave(state)).toThrow('structure');
  });
});

describe('automatic v4 battles', () => {
  it('removes energy, break, charge and wait while unlocking fixed-delay ultimates', () => {
    const b = prepared().run!.battle!;
    expect(R.legalChoices(b).some(c => c.skillId.endsWith('-4'))).toBe(false);
    let ultimateSeen = false;
    for (let i = 0; i < 150 && !b.result; i++) {
      if (R.currentActor(b)?.side === 'party') {
        const choices = R.legalChoices(b);
        expect(choices.some(c => c.skillId === 'wait')).toBe(false);
        if (choices.some(c => c.skillId.endsWith('-4'))) {
          ultimateSeen = true; expect(R.currentActor(b)!.turns).toBeGreaterThanOrEqual(2);
        }
      }
      takeTurn(b);
      expect(b.energy).toBe(0); expect(b.maxEnergy).toBe(0);
      expect(b.actors.every(a => a.charge === 0 && a.break === 0)).toBe(true);
    }
    expect(ultimateSeen).toBe(true);
    expect(b.log.some(e => ['energy', 'break'].includes(e.kind))).toBe(false);
  });
  it('does not leak speculative choices, event counters or RNG from the AI', () => {
    const battle = prepared().run!.battle!, before = clone(battle);
    const choice = R.chooseAction(battle, 'auto');
    expect(R.chooseAction(battle, 'auto')).toEqual(choice);
    expect(battle).toEqual(before);
  });
  it('targets living front rows, while the declared rear exception stays reachable', () => {
    const state = prepared(), base = state.run!.battle!.initial;
    const battle = R.createBattle({ ...base, enemies: ['button-guard', 'sock-skipper'] });
    const ordinary = battle.intents.find(i => i.actorId.includes('button-guard'))!;
    expect(battle.actors.find(a => a.id === ordinary.targetId)!.row).toBe('front');
    const piercing = battle.intents.find(i => i.actorId.includes('sock-skipper'))!;
    expect(battle.actors.find(a => a.id === piercing.targetId)!.row).toBe('rear');
  });
  it('grants cover to an ordinary rear Shelter redirect but not to a row sweep', () => {
    const base = prepared().run!.battle!.initial;
    const b = R.createBattle({ ...base, enemies: ['spool-ram'] });
    const rear = b.actors.find(a => a.side === 'party' && a.row === 'rear')!;
    R.applyStatus(b, rear, rear, 'shelter');
    while (R.currentActor(b)?.side === 'party') R.act(b, R.legalChoices(b).find(c => c.skillId === 'defend')!);
    const wide = clone(b); wide.intents[0]!.signature = true;
    R.enemyAct(b);
    expect(b.v4!.events.some(e => e.kind === 'formation-cover' && e.targetId === rear.id)).toBe(true);
    R.enemyAct(wide);
    expect(wide.v4!.events.some(e => e.kind === 'formation-cover')).toBe(false);
    expect(wide.log.filter(e => e.kind === 'damage').every(e => e.targetId !== rear.id)).toBe(true);
  });
  it.each([19, 73, 301])('replays a complete v4 encounter exactly at seed %s', seed => {
    const start = prepared(seed).run!.battle!, input = clone(start.initial);
    const result = R.playBattle(start, 'auto');
    expect(R.replayBattle(input, result.choices)).toEqual(result);
    expect(input).toEqual(result.initial);
    expect(R.battleReasons(result).length).toBeGreaterThan(0);
    expect(result.v4!.events.filter(e => e.kind === 'plan-target')).toHaveLength(result.choices.length);
  });
});
