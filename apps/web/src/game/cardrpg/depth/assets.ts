import { registerModelSources } from '../../squad/turn3d/assets';
import { EFFECT_REGISTRY } from '../../squad/turn3d/effects';
import { SKILL_MOTION } from '../../squad/turn3d/choreography';
import { CARD_EFFECT_RECIPES } from '../../squad/turn3d/card-effect-data';
import { CATS } from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';

const models = import.meta.glob('../../../../../../assets/cardrpg2/models/*.glb', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const portraits = import.meta.glob('../../../../../../assets/cardrpg3/portraits/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const icons = import.meta.glob('../../../../../../assets/cardrpg3/icons/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const name = (path: string) => path.split('/').at(-1)!.split('.')[0]!;
registerModelSources(Object.fromEntries(Object.entries(models).map(([path, url]) => [name(path), url])));
export const portrait = (id: string) => portraits[`../../../../../../assets/cardrpg3/portraits/${id}.webp`];
export const skillIcon = (id: string) => icons[`../../../../../../assets/cardrpg3/icons/${id}.svg`];
export const MODEL_IDS = Object.keys(models).map(name);

const palettes = ['#f1c884', '#bba3e9', '#9bd4b5', '#e9b47d', '#f29f89', '#8bc7dc'];
for (const [catIndex, cat] of CATS.entries()) {
  for (const [skillIndex, skill] of cat.skills.entries()) {
    const base = skill.type === 'support' ? 'mossFlask' : skill.type === 'defend' ? 'rally'
      : skill.type === 'control' ? 'threadSnare' : skill.type === 'ultimate' ? 'lanternstorm' : 'guardianBasic';
    EFFECT_REGISTRY[skill.id] = { ...EFFECT_REGISTRY[base]!, name: skill.name, color: palettes[catIndex % palettes.length]!,
      ultimate: skill.type === 'ultimate', duration: [320 + skillIndex * 40, 200, 80, 200, 200],
      clip: ['support', 'control'].includes(skill.type) ? 'cast' : skill.type === 'defend' ? 'guard' : 'attack' };
    SKILL_MOTION[skill.id] = { ...SKILL_MOTION[base]!, side: (catIndex % 3 - 1) * .12, arc: skillIndex * .025 };
  }
}

for (const [id, effect] of Object.entries(CARD_EFFECT_RECIPES)) {
  const previous = EFFECT_REGISTRY[id];
  if (!previous) continue;
  EFFECT_REGISTRY[id] = { ...previous, color: effect.color, accent: effect.accent,
    name: effect.name, duration: effect.durations, ultimate: effect.ultimate,
    shake: effect.shake, motifs: effect.layers.map(layer => layer.primitive) };
  if (effect.shake >= .9 || effect.ultimate) {
    SKILL_MOTION[id] = { ...SKILL_MOTION[id]!, hold: Math.min(110, effect.durations[2] * .95) };
  }
}
