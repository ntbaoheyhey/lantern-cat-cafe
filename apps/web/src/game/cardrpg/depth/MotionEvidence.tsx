import { useState } from 'react';
import { CATS, ENEMIES } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';

const images = import.meta.glob('../../../../../../reports/cardrpg-big/filmstrips/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const measurements = import.meta.glob('../../../../../../reports/cardrpg-big/motion/variety.json',
  { eager: true, import: 'default' }) as Record<string, {
    thresholds: { angleRms: number; positionRms: number };
    pairs: Array<{ required: boolean; pass: boolean; angleRms: number; positionRms: number }>;
  }>;
const measurement = Object.values(measurements)[0];
const compared = measurement?.pairs.filter(pair => pair.required) ?? [];
const names = new Map([
  ...CATS.flatMap(cat => cat.skills.map(skill => [skill.id, `${cat.name} · ${skill.name}`] as const)),
  ...ENEMIES.map(enemy => [`enemy-${enemy.id}`, `${enemy.name} · ${enemy.intent}`] as const),
]);
const filmstrips = Object.entries(images).map(([path, image]) => {
  const id = path.split('/').at(-1)!.replace('.webp', '');
  return { id, name: names.get(id) ?? id, image };
});

export function MotionEvidence() {
  const [selected, setSelected] = useState(filmstrips[0]?.id ?? '');
  const strip = filmstrips.find(item => item.id === selected);
  if (!strip) return null;
  return <section className="cr-panel dp-motion-evidence">
    <h2>Motion studies</h2>
    <label>Skill or enemy action
      <select value={selected} onChange={event => setSelected(event.target.value)}>
        {filmstrips.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <img src={strip.image} alt={`Eight frames of ${strip.name}`} width={1280} height={720} />
    {measurement && compared.length > 0 && <p>F3 starter-slice matrix · {compared.filter(pair => pair.pass).length}/{compared.length} required pairs pass.
      Minimum angular RMS {Math.min(...compared.map(pair => pair.angleRms)).toFixed(3)} rad against {measurement.thresholds.angleRms},
      position RMS {Math.min(...compared.map(pair => pair.positionRms)).toFixed(3)} model heights against {measurement.thresholds.positionRms}.</p>}
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/motion/trajectories.json · reports/cardrpg-big/filmstrips · tools/cardrpg-big/motion-measure.mjs</p>
  </section>;
}
