import { expect, it } from 'vitest';
import { CARDS } from '../catalog';
import { act, createBattle, legalChoices, stacks } from './battle';
import { CATS, CAT_BY_ID } from './catalog';
import type { Actor, Battle, StatusId } from './contract';
import { AFFIXES, equipmentEffects, equipGear, GEAR, makeGear, reforgeGear, SETS, UNIQUES } from './equipment';
import { createDepthAccount } from './state';

it.each(SETS)('$name activates its two-piece and four-piece rules through equipment commands', set => {
  let state = createDepthAccount();
  state.equipment = {};
  for (const [index, slot] of ['weapon', 'outfit', 'charm', 'relic'].entries()) {
    const gear = makeGear(state, `${set.id}-${slot}-common`, 43113);
    state.gear.push(gear);
    const equipped = equipGear(state, 'mochi', gear.id);
    expect(equipped.ok).toBe(true);
    state = equipped.state;
    const effects = equipmentEffects(state, 'mochi').effects;
    expect(effects.includes(set.twoEffect)).toBe(index >= 1);
    expect(effects.includes(set.fourEffect)).toBe(index === 3);
  }
});

it.each(AFFIXES)('$name can be reforged into a compatible slot and reaches the combat bonus map', affix => {
  let state = createDepthAccount();
  state.equipment = {};
  state.account.currencies.fish = 1000;
  state.account.currencies.threads = 1000;
  const template = GEAR.find(gear => gear.slot === affix.slots[0] && gear.rarity === 'legendary' && !gear.affixes.includes(affix.id))!;
  expect(template).toBeDefined();
  const gear = makeGear(state, template.id, 43113);
  state.gear.push(gear);
  const result = reforgeGear(state, gear.id, 0, affix.id);
  expect(result.ok).toBe(true);
  state = equipGear(result.state, 'mochi', gear.id).state;
  expect(equipmentEffects(state, 'mochi').bonuses[affix.stat]).toBe(affix.tiers[gear.tier - 1]![0]);
  expect(result.state.account.currencies.fish).toBe(910);
  expect(result.state.account.currencies.threads).toBe(985);
});

function addStatus(actor: Actor, id: StatusId, source: string) {
  actor.statuses.push({ id, source, stacks: 1, remaining: 3, appliedRound: 1 });
}
function fixture(catId: string, skillId: string, effect: string) {
  const cat = CAT_BY_ID[catId]!;
  const team = [cat, ...CATS.filter(other => other.id !== catId).slice(0, 2)];
  const cats = team.map((entry, index) => ({ id: entry.id, row: entry.row,
    stats: { ...CARDS.find(card => card.id === entry.id)!.baseStats },
    effects: index === 0 ? [`unique:${effect}`] : [],
    skills: index === 0 && !['defend', 'wait'].includes(skillId)
      ? [skillId, ...entry.skills.filter(skill => skill.id !== skillId).slice(0, 2).map(skill => skill.id)]
      : entry.skills.slice(0, 3).map(skill => skill.id) }));
  return createBattle({ seed: 29, chapter: 2, cats, enemies: ['rain-spool', 'button-guard'] });
}
interface UniqueCase {
  id: string;
  cat: string;
  skill: string;
  prepare?: (battle: Battle) => void;
  verify: (battle: Battle, actor: Actor, target: Actor) => void;
  ally?: boolean;
}
const cases: UniqueCase[] = [
  { id: 'doorstop', cat: 'mochi', skill: 'defend', verify: (battle, actor) => {
    expect(battle.log.some(event => event.kind === 'heal' && event.targetId === actor.id && event.amount >= 25)).toBe(true);
  } },
  { id: 'nightglass', cat: 'mochi', skill: 'mochi-1', prepare: battle => addStatus(battle.actors[3]!, 'scent', 'mochi'), verify: (battle, actor) => {
    expect(actor.bonuses.nightglassRound).toBe(1);
    expect(battle.energy).toBe(6);
  } },
  { id: 'seedcup', cat: 'cinnamon', skill: 'cinnamon-2', ally: true, verify: (_battle, actor, target) => {
    expect(stacks(target, 'sprout')).toBe(1);
    expect(actor.bonuses.seedcupUsed).toBe(1);
  } },
  { id: 'rainbell', cat: 'biscuit', skill: 'biscuit-2', ally: true, prepare: battle => addStatus(battle.actors[0]!, 'scald', 'foe'), verify: (_battle, actor) => {
    expect(stacks(actor, 'scald')).toBe(0);
  } },
  { id: 'crumbbook', cat: 'soot', skill: 'soot-3', prepare: battle => addStatus(battle.actors[3]!, 'crumb', 'soot'), verify: (battle, actor) => {
    expect(battle.log.some(event => event.kind === 'shield' && event.targetId === actor.id && event.amount >= 35)).toBe(true);
  } },
  { id: 'panlid', cat: 'mochi', skill: 'defend', verify: (_battle, actor) => expect(stacks(actor, 'riposte')).toBe(2) },
  { id: 'warmwick', cat: 'mallow', skill: 'mallow-1', verify: (battle, actor) => {
    expect(battle.log.some(event => event.kind === 'heal' && event.targetId === actor.id && event.amount >= 6)).toBe(true);
  } },
  { id: 'silkspool', cat: 'mochi', skill: 'mochi-4', verify: (_battle, actor) => {
    expect(stacks(actor, 'decoy')).toBe(1);
    expect(actor.bonuses.silkspoolUsed).toBe(1);
  } },
  { id: 'starladle', cat: 'mochi', skill: 'mochi-4', verify: (_battle, actor) => {
    expect(actor.charge).toBe(51);
    expect(actor.bonuses.starladleUsed).toBe(1);
  } },
  { id: 'softcollar', cat: 'mochi', skill: 'wait', verify: (_battle, actor) => expect(stacks(actor, 'sprout')).toBe(1) },
  { id: 'tidetray', cat: 'mochi', skill: 'wait', prepare: battle => { battle.actors[1]!.hp = 1; }, verify: (battle) => {
    expect(battle.log.some(event => event.kind === 'shield' && event.targetId === battle.actors[1]!.id && event.amount >= 30)).toBe(true);
  } },
  { id: 'gardenkey', cat: 'cinnamon', skill: 'cinnamon-3', ally: true, prepare: battle => addStatus(battle.actors[1]!, 'scald', 'foe'), verify: (battle, _actor, target) => {
    expect(stacks(target, 'scald')).toBe(0);
    expect(battle.log.some(event => event.kind === 'heal' && event.targetId === target.id && event.amount >= 25)).toBe(true);
  } },
];
it('keeps a scripted combat scenario for every legendary unique effect', () => {
  expect(cases.map(entry => entry.id).sort()).toEqual(UNIQUES.map(entry => entry.id).sort());
});
it.each(cases)('$id changes combat through an equipped skill action', entry => {
  const battle = fixture(entry.cat, entry.skill, entry.id);
  const actor = battle.actors[0]!;
  actor.hp -= 100;
  actor.charge = 100;
  battle.actors[1]!.hp -= 100;
  battle.energy = 5;
  entry.prepare?.(battle);
  const target = entry.ally ? battle.actors[1]! : battle.actors[3]!;
  const choices = legalChoices(battle).filter(choice => choice.skillId === entry.skill);
  const choice = choices.find(choice => choice.targetId === target.id) ?? choices[0]!;
  expect(choice).toBeDefined();
  expect(act(battle, choice)).toBe(true);
  entry.verify(battle, actor, target);
});
