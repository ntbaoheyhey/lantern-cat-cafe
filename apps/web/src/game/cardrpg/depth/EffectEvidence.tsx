import { useState } from 'react';
import { CARD_EFFECT_RECIPES } from '../../squad/turn3d/card-effect-data';

const images = import.meta.glob('../../../../../../reports/cardrpg-big/effects/sheets/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const results = import.meta.glob('../../../../../../reports/cardrpg-big/effects/uniqueness.json',
  { eager: true, import: 'default' }) as Record<string, {
    threshold: number; minimumDistance: number; pairs: unknown[]; offenders: unknown[];
  }>;
const measurement = Object.values(results)[0];
const sheets = Object.entries(images).map(([path, image]) => {
  const slug = path.split('/').at(-1)!.replace('.webp', '');
  const id = Object.keys(CARD_EFFECT_RECIPES).find(key => key.replaceAll(':', '-') === slug);
  return { id: slug, name: id ? CARD_EFFECT_RECIPES[id]!.name : slug, image };
});

export function EffectEvidence() {
  const [selected, setSelected] = useState(sheets[0]?.id ?? '');
  const sheet = sheets.find(item => item.id === selected);
  if (!sheet) return null;
  return <section className="cr-panel dp-motion-evidence">
    <h2>Effect silhouettes</h2>
    <label>Composition<select value={selected} onChange={event => setSelected(event.target.value)}>
      {sheets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select></label>
    <img src={sheet.image} alt={`Six fixed-camera frames of ${sheet.name}`} width={1200} height={574} />
    {measurement && <p>{sheets.length} compositions · {measurement.pairs.length} grayscale comparisons · minimum distance {measurement.minimumDistance.toFixed(3)} against {measurement.threshold} · {measurement.offenders.length} pairs below the acceptance gate</p>}
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/effects/uniqueness.json · reports/cardrpg-big/effects/features.npz · tools/cardrpg-big/effect-measure.mjs</p>
  </section>;
}
