import {PAINT} from '../spine/style';
import type {SkillLayer, SkillTimeline} from './skill-timeline';

const enemies = [
  {owner: 'needle-moth', color: PAINT.iris, motif: 'needle', travel: 'rain', charge: 220, decay: 390},
  {owner: 'binding-thread', color: PAINT.rose, motif: 'thread', travel: 'weave', charge: 200, decay: 440},
  {owner: 'teacup-healer', color: PAINT.sage, motif: 'drop', travel: 'pour', charge: 220, decay: 420},
  {owner: 'kettle-knight', color: PAINT.honey, motif: 'needle', travel: 'thrust', charge: 160, decay: 360},
] as const;

/** Both enemy forms use the same event-aligned clock as hero skills. Craft
 * artwork remains the main silhouette; these are local material accents. */
export function createEnemySkillTimelines(): SkillTimeline[] {
  return enemies.flatMap(enemy => [true, false].map(basic => {
    const impactMs = basic ? 350 : 1100, charge = basic ? 160 : enemy.charge;
    const support = enemy.owner === 'teacup-healer';
    const strength = basic ? .8 : 1;
    const layer = (id: string, shape: SkillLayer['shape'], beat: SkillLayer['beat'], anchor: SkillLayer['anchor'],
      startMs: number, durationMs: number, size: number, alpha: number, glyph: SkillLayer['glyph'], count = 1): SkillLayer => ({
      id, shape, beat, anchor: enemy.travel === 'thrust' && anchor === 'target' ? 'contact' : anchor, startMs, durationMs, size: size * strength, alpha, glyph, count,
      texture: '', blend: shape === 'mote' || shape === 'decal' || shape === 'projectile' ? 'normal' : 'screen',
      easing: shape === 'charge' ? 'smooth' : 'outCubic',
    });
    const travelMs = enemy.travel === 'thrust' ? 100 : 150;
    return {
      id: `enemy:${enemy.owner}${basic ? ':basic' : ''}`, owner: enemy.owner,
      tier: basic ? 'basic' : 'skill', color: enemy.color, motif: enemy.motif,
      impactMs, durationMs: impactMs + 60 + enemy.decay, hitStopMs: basic ? 45 : 55,
      shakePx: support ? 0 : basic ? 1 : 1.6,
      layers: [
        layer('charge', 'charge', 'anticipation', 'caster', impactMs - charge, charge, .27, .48,
          support ? 'cup' : enemy.motif),
        {...layer('release', 'projectile', 'impact', 'target', impactMs - travelMs, travelMs + 60,
          enemy.travel === 'pour' ? .38 : enemy.travel === 'thrust' ? .66 : .52, .90,
          enemy.travel === 'rain' || enemy.travel === 'thrust' ? 'slice' : enemy.motif,
          basic || enemy.travel === 'weave' || enemy.travel === 'thrust' ? 1 : 3), travel: enemy.travel},
        layer('contact', support ? 'burst' : 'flash', 'impact', 'target', impactMs, support ? 180 : 60,
          support ? .28 : .18, support ? .36 : .48, support ? 'drop' : 'spark'),
        layer('material', 'burst', 'impact', 'target', impactMs, 250,
          enemy.travel === 'weave' ? .48 : enemy.travel === 'thrust' ? .52 : .30,
          enemy.travel === 'thrust' ? .72 : .40, support ? 'cup' : enemy.travel === 'thrust' ? 'slice' : enemy.motif),
        layer('ground', 'decal', 'dissipation', 'ground', impactMs + 60, enemy.decay, .45, .16,
          enemy.travel === 'weave' ? 'thread' : 'wind'),
        layer('motes', 'mote', 'dissipation', 'target', impactMs + 60, enemy.decay, .055, .46,
          enemy.motif, basic ? 3 : 6),
      ],
    };
  }));
}
