import { useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { ForecastV4 } from './ForecastV4';
import { equipmentForecast } from './equipment-forecast';

export function EquipmentForecastV4({ state, cardId, instanceId }: { state: R.DepthAccount; cardId: string; instanceId: string }) {
  const available = R.CHAPTERS.filter(chapter => chapter.id === 1 || state.cleared.includes(chapter.id - 1));
  const next = available.find(chapter => !state.cleared.includes(chapter.id)) ?? available.at(-1)!;
  const [selected, setSelected] = useState(next.id), [selectedBand, setSelectedBand] = useState<number | null>(null);
  const chapter = available.some(route => route.id === selected) ? selected : next.id;
  const ceiling = Math.min(...state.team.map(id => state.account.cards.find(card => card.cardId === id)!.level));
  const band = Math.min(selectedBand ?? ceiling, ceiling);
  const preview = equipmentForecast(state, cardId, instanceId, chapter, band);
  if (!R.gameplayV4(state)) return null;
  const name = R.GEAR_BY_ID[state.gear.find(item => item.id === instanceId)!.templateId]!.name;
  return <section className="cr-panel dp-v4-equipment-forecast" aria-label="Equipment boss comparison">
    <h2>Try your gear against a boss</h2>
    <div className="cr-tabs" role="group" aria-label="Compare against boss">{available.map(route => <button key={route.id}
      aria-pressed={route.id === chapter} onClick={() => setSelected(route.id)}>{R.ENEMY_BY_ID[route.boss]!.name}</button>)}</div>
    <label>Comparison band <select aria-label="Comparison band" value={band} onChange={event => setSelectedBand(Number(event.target.value))}>
      {Array.from({ length: ceiling }, (_, i) => <option key={i} value={i + 1}>Band {i + 1}</option>)}</select></label>
    {'error' in preview ? <p role="status">{preview.error}</p> : <>
      <p>{preview.boss} · Full health, before route rewards. Your current crew, rows and plan.</p>
      {preview.benched && <p>{R.CAT_BY_ID[cardId]!.name} is on the bench. Only transfers affect your current crew.</p>}
      {preview.transfer && <p>Includes {R.CAT_BY_ID[preview.transfer]!.name} giving this piece to {R.CAT_BY_ID[cardId]!.name}.</p>}
      <div className="dp-v4-equipment-forecast-pair"><div><h3>Current crew</h3><ForecastV4 setup={preview.before} label="Current crew forecast" unavailableMessage="The forecast is unavailable. Compare the stats and set bonuses." /></div>
        <div><h3>With {name} on {R.CAT_BY_ID[cardId]!.name}</h3>{preview.sameCrew
          ? <p>Same crew in this matchup.</p> : <ForecastV4 setup={preview.after} label="Equipped crew forecast" unavailableMessage="The forecast is unavailable. Compare the stats and set bonuses." />}</div></div>
      <small>Compare with the same boss and band. Close results can share a forecast band.</small>
    </>}
  </section>;
}
