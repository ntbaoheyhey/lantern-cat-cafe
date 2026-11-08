import { expect, it, vi } from 'vitest';
import { clone } from '../internal';
import type { Battle } from './contract';
import { playBattle, type Policy } from './policies';
import { CHAPTERS, startRun } from './run';
import { playRun } from './run-bot';
import { createDepthAccount } from './state';

it.each<Policy>(['auto', 'greedy', 'random', 'smart'])(
  'preserves the complete route and observations with the native %s runner', policy => {
    for (const chapter of CHAPTERS) for (let seed = 1; seed <= 5; seed++) {
      const account = createDepthAccount(seed);
      account.cleared = [1, 2];
      const initial = startRun(account, chapter.id, seed).state;
      const originalBattles: Battle[] = [];
      const injectedBattles: Battle[] = [];
      const original = playRun(clone(initial), policy, battle => originalBattles.push(clone(battle)));
      const runner = vi.fn(playBattle);
      const injected = playRun(clone(initial), policy, battle => injectedBattles.push(clone(battle)), runner);
      expect(injected).toEqual(original);
      expect(injectedBattles).toEqual(originalBattles);
      expect(runner).toHaveBeenCalledTimes(originalBattles.length);
      expect(runner.mock.calls.every(([, receivedPolicy]) => receivedPolicy === policy)).toBe(true);
    }
  }, 30000,
);

it('settles and observes the battle returned by an isolated runner', () => {
  const initial = startRun(createDepthAccount(19), 1, 19).state;
  const completed: Battle[] = [];
  const observed: Battle[] = [];
  const result = playRun(clone(initial), 'auto', battle => observed.push(battle), (battle, policy) => {
    const outcome = playBattle(clone(battle), policy);
    completed.push(outcome);
    return outcome;
  });
  expect(result).toEqual(playRun(clone(initial), 'auto'));
  expect(observed.length).toBeGreaterThan(0);
  expect(observed.every((battle, index) => battle === completed[index])).toBe(true);
});
