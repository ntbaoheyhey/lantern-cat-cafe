import { expect, it } from 'vitest';
import fc from 'fast-check';
import { CARDS } from '../catalog';
import { clone } from '../internal';
import { CATS } from './catalog';
import { act, createBattle, legalChoices } from './battle';
import { createDepthAccount, grantDepth, DEPTH_CAPS } from './state';

for (const cat of CATS) for (const skill of cat.skills) it(`resolves ${cat.name} / ${skill.name} through the legal action entry point`, () => {
  const team = [cat, ...CATS.filter(c => c.id !== cat.id).slice(0, 2)];
  const cats = team.map(c => ({ id: c.id, stats: { ...CARDS.find(old => old.id === c.id)!.baseStats }, row: c.row,
    skills: c.id === cat.id ? [skill.id, ...c.skills.filter(s => s.id !== skill.id).slice(0, 2).map(s => s.id)] : c.skills.slice(0, 3).map(s => s.id) }));
  const battle = createBattle({ seed: 29, chapter: 2, cats, enemies: ['rain-spool', 'button-guard'] });
  battle.energy = 10;
  battle.actors[0]!.charge = 100;
  for (const actor of battle.actors) actor.hp = Math.floor(actor.maxHp * .65);
  if (skill.target === 'fallen') battle.actors[1]!.hp = 0;
  const choice = legalChoices(battle).find(c => c.skillId === skill.id)!;
  expect(choice).toBeDefined();
  const repeated = clone(battle);
  expect(act(battle, choice)).toBe(true);
  expect(act(repeated, choice)).toBe(true);
  expect(battle).toEqual(repeated);
  expect(battle.choices).toContainEqual(choice);
  expect(battle.log.some(e => e.kind === 'action' && e.skillId === skill.id)).toBe(true);
});
it('keeps every repeatable currency within its shared cap for arbitrary grant sequences', () => {
  fc.assert(fc.property(fc.array(fc.integer({ min: 0, max: 10000 }), { maxLength: 30 }), amounts => {
    const state = createDepthAccount();
    for (const amount of amounts) grantDepth(state, { fish: amount, threads: amount, stamps: amount, essence: amount });
    for (const id of Object.keys(DEPTH_CAPS) as Array<keyof typeof DEPTH_CAPS>) expect(state.account.daily.earned[id]).toBeLessThanOrEqual(DEPTH_CAPS[id]);
  }), { seed: 43113, numRuns: 100 });
});
