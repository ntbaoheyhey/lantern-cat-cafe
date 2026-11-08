import { forecastV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/forecast-v4';
import type { BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';

self.onmessage = (event: MessageEvent<{ key: string; setup: BattleSetup }>) => {
  const { key, setup } = event.data;
  try { self.postMessage({ key, result: forecastV4(setup, () => performance.now()) }); }
  catch (error) { self.postMessage({ key, error: String(error) }); }
};
