import { recommendBuildV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/recommendation-v4';
import type { BattleSetup, DepthAccount } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
self.onmessage = (event: MessageEvent<{ key: string; state: DepthAccount; setup: BattleSetup }>) => {
  const { key, state, setup } = event.data;
  try { self.postMessage({ key, result: recommendBuildV4(state, setup) }); }
  catch (error) { self.postMessage({ key, error: String(error) }); }
};
