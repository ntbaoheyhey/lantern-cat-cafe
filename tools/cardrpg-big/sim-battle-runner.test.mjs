import assert from 'node:assert/strict';
import { test } from 'node:test';
import { simulationBattleRunner } from './sim-battle-runner.mjs';

test('native simulations retain the native runner without loading experimental modules', async () => {
  const native = () => {};
  const result = await simulationBattleRunner(() => { throw Error('Unexpected import'); }, native);
  assert.equal(result.runBattle, native);
  assert.deepEqual(result.evidence, { mode: 'native', modulePath: null, options: null });
});

for (const mode of ['on', 'off']) test(`${mode} records every actual factory option`, async () => {
  const factoryRunner = () => {};
  let actualOptions;
  const result = await simulationBattleRunner(async path => {
    assert.equal(path, 'packages/game-rules/src/cardrpg/depth/auto-extras/runner.ts');
    return { createAutoExtrasRunner(options) { actualOptions = options; return factoryRunner; } };
  }, () => {}, mode);
  assert.equal(result.runBattle, factoryRunner);
  const enabled = mode === 'on';
  assert.deepEqual(actualOptions, {
    autoExtras: enabled, teaCloud: enabled, frontRelay: enabled, intentLens: enabled,
  });
  assert.deepEqual(result.evidence.options, actualOptions);
  assert.equal(result.evidence.mode, mode);
});

test('rejects unknown modes and missing experimental modules', async () => {
  await assert.rejects(simulationBattleRunner(() => {}, () => {}, 'yes'), /native, off or on/);
  await assert.rejects(simulationBattleRunner(() => { throw Error('Missing source'); }, () => {}, 'on'),
    /Missing source/);
});
