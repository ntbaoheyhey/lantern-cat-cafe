import {NUMBER_LIFETIME_MS} from './number-layout';

export interface NumberMotion {scale: number; rise: number; alpha: number; accent: number}
export const numberPeakScale = (critical: boolean, kind: string) => critical ? 1.28 : kind === 'heal' ? 1.08 : 1.12;
/** One event-age clock makes playback and scrubbing agree; caller reuses storage. */
export function sampleNumberMotion(age: number, critical: boolean, kind: string, reduced: boolean, out: NumberMotion) {
  const t = Math.max(0, Math.min(1, age / NUMBER_LIFETIME_MS));
  const peak = numberPeakScale(critical, kind), attack = kind === 'heal' ? 100 : 60;
  const settle = critical ? 220 : 180;
  const progress = Math.max(0, Math.min(1, age / attack));
  const tail = Math.max(0, Math.min(1, (age - attack) / (settle - attack)));
  out.scale = reduced ? 1 : age < attack ? .88 + (peak - .88) * (1 - (1 - progress) ** 3) : 1 + (peak - 1) * (1 - tail) ** 3;
  out.rise = reduced ? 0 : 24 * (1 - (1 - t) ** 2);
  out.alpha = age < 0 || age >= NUMBER_LIFETIME_MS ? 0 : Math.min(1, (1 - t) * 4);
  out.accent = reduced || !critical || age < 0 || age >= 140 ? 0 : Math.sin(age / 140 * Math.PI) * .75;
  return out;
}
