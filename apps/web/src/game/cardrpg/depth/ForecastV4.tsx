import { useEffect, useRef, useState } from 'react';
import type { BattleSetup } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import type { ForecastV4 as Forecast } from '@taskbar-hero/game-rules/src/cardrpg/depth/forecast-v4';
import { forecastKeyV4 } from '@taskbar-hero/game-rules/src/cardrpg/depth/forecast-key-v4';
import ForecastWorker from './forecast-worker?worker&inline';

// This module lifetime is the rules-build lifetime. Never persist forecasts into a save.
const cache = new Map<string, Forecast>();
type ForecastState = { key: string; result: Forecast; cached: boolean; elapsedMs: number };
export function ForecastV4({ setup, label = "Rough forecast", unavailableMessage = "The forecast is unavailable. Read their plan below.", showChance = false }: { setup: BattleSetup; label?: string; unavailableMessage?: string; showChance?: boolean }) {
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
    try {
      worker = new ForecastWorker();
      worker.onmessage = (event: MessageEvent<{ key: string; result?: Forecast; error?: string }>) => {
        if (!active || event.data.key !== key) return;
        const result = event.data.result;
        if (result) {
          if (cache.size >= 32) cache.delete(cache.keys().next().value!);
          cache.set(key, result);
          setForecast({ key, result, cached: false, elapsedMs: performance.now() - started });
        } else setFailedKey(key);
        worker?.terminate();
      };
      worker.onerror = () => { if (active) setFailedKey(key); worker?.terminate(); };
      worker.postMessage({ key, setup: setupRef.current });
    } catch { setFailedKey(key); worker?.terminate(); }
    // Changing a build cancels pending CPU work, rather than queuing obsolete forecasts.
    return () => { active = false; worker?.terminate(); };
  }, [key]);
  const current = forecast?.key === key ? forecast : null, failed = failedKey === key;
  return <section className="cr-panel dp-v4-forecast" aria-label={label} aria-live="polite"
    data-forecast-ms={current?.elapsedMs} data-compute-ms={current?.result.computeMs} data-cache-hit={current?.cached}>
    <small>ROUGH FORECAST</small><h2>{showChance&&current?`${current.result.band} · ${Math.round(current.result.wins/current.result.samples*100)}%`:current?.result.band ?? (failed ? 'Scout their plan' : 'Reading the matchup…')}</h2>
    <p>{current?.result.risk ?? (failed ? unavailableMessage : 'Checking your crew, gear and formation.')}</p>
    <small>A forecast, never a promise.</small>
  </section>;
}
