import { describe, expect, it } from 'vitest';
import { createBattle } from '../battle';
import { battleCats, createDepthAccount } from '../state';
import { playBattle } from '../policies';
import { DEFAULT_AUTO_EXTRAS, playAutoExtras, createAutoExtrasMemory } from './index';
import { createAutoExtrasRunner } from './runner';
const fixture = () => createBattle({ seed: 71, chapter: 1, cats: battleCats(createDepthAccount(71)), enemies: ['kettle-knight', 'yarn-giant'] });
describe('whole-run integration adapter', () => {
  it.each(['auto', 'greedy', 'random', 'smart'] as const)('off preserves %s exactly', policy => {
    expect(JSON.stringify(createAutoExtrasRunner()(fixture(), policy))).toBe(JSON.stringify(playBattle(fixture(), policy)));
  });
  it('owns independent encounter memory and captures options before a run', () => {
    const options = { ...DEFAULT_AUTO_EXTRAS, autoExtras: true, teaCloud: true, frontRelay: true };
    const run = createAutoExtrasRunner(options);
    const expected = JSON.stringify(playAutoExtras(fixture(), createAutoExtrasMemory(), options));
    options.autoExtras = false;
    expect(JSON.stringify(run(fixture(), 'auto'))).toBe(expected);
    expect(JSON.stringify(run(fixture(), 'auto'))).toBe(expected);
  });
  it('retains the action bound for both paths', () => {
    expect(() => createAutoExtrasRunner()(fixture(), 'auto', 0)).toThrow('action bound');
    expect(() => createAutoExtrasRunner({ ...DEFAULT_AUTO_EXTRAS, autoExtras: true })(fixture(), 'auto', 0)).toThrow('action bound');
  });
});
