import { useEffect, useRef, useState } from 'react';
import type { BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type { ForecastV4 as Forecast } from '@taskbar-hero/game-rules/src/cardrpg/depth/forecast-v4';
import { forecastKeyV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/forecast-key-v4';
import ForecastWorker from './forecast-worker?worker&inline';
import { CAT_BY_ID } from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { forecastAdviceA6 } from '../ui-v3/guide-a6';

// This module lifetime is the rules-build lifetime. Never persist forecasts into a save.
const cache = new Map<string, Forecast>();
type ForecastState = { key: string; result: Forecast; cached: boolean; elapsedMs: number };
export function ForecastV4({ setup, label = "Rough forecast", unavailableMessage = "The forecast is unavailable. Read their plan below.", showChance = false, compact = false }: { setup: BattleSetup; label?: string; unavailableMessage?: string; showChance?: boolean; compact?: boolean }) {
  const key = forecastKeyV4(setup);
  const [forecast, setForecast] = useState<ForecastState | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const setupRef = useRef(setup);
  setupRef.current = setup;
  useEffect(() => {
    let active = true, worker: Worker | undefined;
    const started = performance.now(), cached = cache.get(key);
    setFailedKey(null);
    if (cached) {
      cache.delete(key); cache.set(key, cached);
      setForecast({ key, result: cached, cached: true, elapsedMs: 0 });
      return;
    }
    setForecast(null);
    const finish = (result?: Forecast) => {
      if (!active) return;
      active = false;
      clearTimeout(timer);
      worker?.terminate();
      if (result) {
        if (cache.size >= 32) cache.delete(cache.keys().next().value!);
        cache.set(key, result);
        setForecast({ key, result, cached: false, elapsedMs: performance.now() - started });
      } else setFailedKey(key);
    };
    const timer = setTimeout(() => finish(), 8_000);
    try {
      worker = new ForecastWorker();
      worker.onmessage = (event: MessageEvent<{ key: string; result?: Forecast; error?: string }>) => {
        if (!active || event.data?.key !== key) return;
        finish(event.data.error ? undefined : event.data.result);
      };
      worker.onerror = () => finish();
      worker.postMessage({ key, setup: setupRef.current });
    } catch { finish(); }
    // Changing a build cancels pending work and its deadline; completed workers cannot reply again.
    return () => { active = false; clearTimeout(timer); worker?.terminate(); };
  }, [key]);
  const current = forecast?.key === key ? forecast : null, failed = failedKey === key;
  return <section className="cr-panel dp-v4-forecast" aria-label={label} aria-live="polite"
    data-compact={compact} data-forecast-state={current ? 'ready' : failed ? 'unavailable' : 'checking'} data-forecast-ms={current?.elapsedMs} data-compute-ms={current?.result.computeMs} data-cache-hit={current?.cached}>
    <small>ROUGH FORECAST</small><h2>{showChance&&!setup.gameplayA6&&current?`${current.result.band} · ${Math.round(current.result.wins/current.result.samples*100)}%`:current?.result.band ?? (failed ? 'Scout their plan' : 'Reading the matchup…')}</h2>
    {compact&&setup.gameplayA6&&current ? current.result.firstFallen&&<p>{CAT_BY_ID[current.result.firstFallen]?.name??current.result.firstFallen} often falls first.</p> : <p>{current ? setup.gameplayA6 ? forecastAdviceA6(setup.enemies, current.result.firstFallen) : current.result.risk : failed ? unavailableMessage : 'Checking your crew, gear and formation.'}</p>}
    <small>A forecast, never a promise.</small>
  </section>;
}
