import { useState } from 'react';
import { CATS, ENEMIES } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';

const images = import.meta.glob('../../../../../../reports/cardrpg-big/filmstrips/*.webp',
  { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
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
    <p className="dp-reference">REFERENCE — reports/cardrpg-big/motion/trajectories.json · reports/cardrpg-big/filmstrips · tools/cardrpg-big/motion-measure.mjs</p>
  </section>;
}
