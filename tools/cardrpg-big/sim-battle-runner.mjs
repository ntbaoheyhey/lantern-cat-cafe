const modulePath = 'packages/game-rules/src/cardrpg/depth/auto-extras/runner.ts';

export async function simulationBattleRunner(load, nativeRunner, mode = 'native') {
  if (!['native', 'off', 'on'].includes(mode)) {
    throw Error('BIG_AUTO_EXTRAS must be native, off or on');
  }
  if (mode === 'native') {
    return { runBattle: nativeRunner, evidence: { mode, modulePath: null, options: null } };
  }
  const enabled = mode === 'on';
  const options = { autoExtras: enabled, teaCloud: enabled, frontRelay: enabled, intentLens: enabled };
  const { createAutoExtrasRunner } = await load(modulePath);
  return { runBattle: createAutoExtrasRunner(options), evidence: { mode, modulePath, options } };
}
