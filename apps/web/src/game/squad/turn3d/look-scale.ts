/** Shared semantic body scale. Accessories never set a character's height. */
import manifest from '../../../../../../assets/cardrpg-look/v3-real/manifest.json';
import type { PuppetRig } from './look-puppet-rig';
export const MODEL_TO_STAGE = 1 / manifest.unitsPerStageUnit;
export const UNIT_SCALE = Object.fromEntries(manifest.units.map(unit => [unit.id, unit]));
export function fallbackScale(rig: PuppetRig) {
  const unit = UNIT_SCALE[rig.id];
  if (!unit) throw Error(`Missing scale standard for ${rig.id}`);
  const [left, top, right, feet] = unit.fallbackBodyRect as [number, number, number, number];
  const bodyHeight = (feet - top) * rig.height;
  const scale = unit.height * MODEL_TO_STAGE / bodyHeight;
  const bodyWidth = (right - left) * rig.aspect * rig.height * scale / MODEL_TO_STAGE;
  return { scale, widthScale: unit.kind === 'boss' ? Math.min(1, 2.2 / bodyWidth) : 1,
    feet, min: [(left - .5) * rig.height * rig.aspect, (1 - feet) * rig.height, 0],
    max: [(right - .5) * rig.height * rig.aspect, (1 - top) * rig.height, .10] };
}
