/** V5 timing is independent of texture availability and uses the rules action clock. */
import {PAINT} from '../spine/style';
import {SKILL_MAX_COUNT, SKILL_MAX_LAYERS} from './skill-budget';
import {selectedSkillTexture} from './skill-texture-selection';
import {createEnemySkillTimelines} from './enemy-skill-timelines';
import type {Glyph} from '../spine/vfx-registry';
export type SkillBeat = 'anticipation' | 'impact' | 'dissipation';
export type SkillShape = 'charge' | 'slash' | 'projectile' | 'flash' | 'burst' | 'mote' | 'decal';
export interface SkillLayer {
  id: string;
  beat: SkillBeat;
  shape: SkillShape;
  anchor: 'caster' | 'target' | 'ground' | 'contact';
  startMs: number;
  durationMs: number;
  blend: 'normal' | 'screen' | 'add';
  easing: 'linear' | 'outCubic' | 'smooth';
  texture: string;
  size: number;
  alpha: number;
  count: number;
  glyph?: Glyph;
  travel?: 'rain' | 'weave' | 'pour' | 'thrust';
}
export interface SkillTimeline {
  id: string;
  owner: string;
  tier: 'basic' | 'skill' | 'ultimate';
  color: string;
  motif: Glyph;
  impactMs: number;
  durationMs: number;
  hitStopMs: number;
  shakePx: number;
  layers: readonly SkillLayer[];
}
export interface SkillLayerSample {progress: number; eased: number; alpha: number; scale: number; rotation: number}
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const heroes = [
  {owner: 'mochi', color: PAINT.honey, motif: 'shield', ranged: false},
  {owner: 'soot', color: PAINT.iris, motif: 'lantern', ranged: true},
  {owner: 'clover', color: PAINT.sage, motif: 'leaf', ranged: true},
  {owner: 'panko', color: PAINT.ember, motif: 'bread', ranged: false},
] as const;

export function validateSkillTimeline(timeline: SkillTimeline): SkillTimeline {
  const ids = new Set<string>();
  let previous = -Infinity, end = 0;
  if (timeline.layers.length > SKILL_MAX_LAYERS) throw Error(`Too many skill layers: ${timeline.id}`);
  if (!Number.isFinite(timeline.impactMs) || timeline.impactMs <= 0 ||
      timeline.hitStopMs < 40 || timeline.hitStopMs > 80) throw Error(`Invalid skill timing: ${timeline.id}`);
  for (const layer of timeline.layers) {
    if (ids.has(layer.id) || layer.startMs < previous || layer.startMs < 0 || layer.durationMs <= 0 ||
        ![layer.startMs, layer.durationMs, layer.alpha, layer.size, layer.count].every(Number.isFinite) ||
        layer.alpha < 0 || layer.alpha > 1 || layer.size <= 0 || !Number.isInteger(layer.count) || layer.count < 1 || layer.count > SKILL_MAX_COUNT ||
        layer.startMs + layer.durationMs > timeline.durationMs) throw Error(`Invalid skill layer: ${timeline.id}/${layer.id}`);
    ids.add(layer.id); previous = layer.startMs; end = Math.max(end, layer.startMs + layer.durationMs);
    if (layer.beat === 'anticipation' && (layer.durationMs < 120 || layer.durationMs > 250 ||
        layer.startMs + layer.durationMs !== timeline.impactMs)) throw Error(`Invalid anticipation: ${timeline.id}`);
    if (layer.beat !== 'anticipation' && layer.shape !== 'slash' && layer.shape !== 'projectile' &&
        layer.startMs < timeline.impactMs) throw Error(`Early contact: ${timeline.id}`);
    if (layer.beat === 'dissipation' && (layer.durationMs < 300 || layer.durationMs > 600)) throw Error(`Invalid decay: ${timeline.id}`);
  }
  if (end !== timeline.durationMs || !['anticipation', 'impact', 'dissipation'].every(beat => timeline.layers.some(l => l.beat === beat))) {
    throw Error(`Incomplete skill timeline: ${timeline.id}`);
  }
  return timeline;
}

function createTimeline(hero: typeof heroes[number], action: number): SkillTimeline {
  const ultimate = action === 4, basic = action === 1;
  const impactMs = ultimate ? 1100 : 350, charge = ultimate ? 250 : basic ? 160 : 220;
  const fade = ultimate ? 540 : 390, strength = ultimate ? 1.35 : basic ? .8 : 1;
  const layer = (id: string, shape: SkillShape, beat: SkillBeat, anchor: SkillLayer['anchor'], startMs: number,
    durationMs: number, size: number, alpha: number, texture: string, count = 1): SkillLayer => ({
    id, shape, beat, anchor, startMs, durationMs, size: size * strength, alpha, count,
    texture: selectedSkillTexture(`${hero.owner}-${texture}`), blend: shape === 'decal' || shape === 'mote' ? 'normal' : 'screen',
    easing: shape === 'charge' ? 'smooth' : 'outCubic',
  });
  return validateSkillTimeline({
    id: `${hero.owner}-${action}`, owner: hero.owner, tier: ultimate ? 'ultimate' : basic ? 'basic' : 'skill',
    color: hero.color, motif: hero.motif, impactMs, durationMs: impactMs + 60 + fade,
    hitStopMs: ultimate ? 70 : basic ? 45 : 55, shakePx: ultimate ? 3 : basic ? 1.25 : 1.8,
    layers: [
      layer('charge', 'charge', 'anticipation', 'caster', impactMs - charge, charge, ultimate ? .65 : .38, .48, ultimate ? 'ult-charge' : 'anticipation'),
      layer('release', hero.ranged ? 'projectile' : 'slash', 'impact', 'target', impactMs - 100, 160, .32, .62, hero.ranged ? 'projectile' : 'slash'),
      layer('contact', 'flash', 'impact', 'target', impactMs, 60, .24, .65, 'impact'),
      layer('burst', 'burst', 'impact', 'target', impactMs, ultimate ? 320 : 280, ultimate ? .85 : .5, ultimate ? .48 : .60, ultimate ? 'ult-release' : 'impact'),
      layer('ground', 'decal', 'dissipation', 'ground', impactMs + 60, fade, .72, .26, 'decal'),
      layer('motes', 'mote', 'dissipation', 'target', impactMs + 60, fade, .075, .64, `particle-${action === 3 ? 3 : action === 2 ? 2 : 1}`, ultimate ? 10 : basic ? 4 : 7),
    ],
  });
}

export const V5_SKILL_TIMELINES: ReadonlyMap<string, SkillTimeline> = new Map(
  [...heroes.flatMap(hero => [1, 2, 3, 4].map(action => createTimeline(hero, action))),
    ...createEnemySkillTimelines().map(validateSkillTimeline)].map(timeline => [timeline.id, timeline] as const),
);
export const getV5Timeline = (id: string) => V5_SKILL_TIMELINES.get(id);

/** Caller supplies scratch storage so the render loop does not allocate samples. */
export function sampleSkillLayer(layer: SkillLayer, elapsedMs: number, reduced: boolean, out: SkillLayerSample): boolean {
  if (!Number.isFinite(elapsedMs) || elapsedMs < layer.startMs || elapsedMs >= layer.startMs + layer.durationMs) return false;
  const p = (elapsedMs - layer.startMs) / layer.durationMs;
  const eased = layer.easing === 'outCubic' ? 1 - (1 - p) ** 3 : layer.easing === 'smooth' ? p * p * (3 - 2 * p) : p;
  out.progress = p; out.eased = eased;
  const alpha = layer.shape === 'charge' ? Math.sin(p * Math.PI / 2) : layer.shape === 'flash' ? 1 - p :
    layer.beat === 'dissipation' ? (1 - p) ** 1.4 : Math.sin(Math.min(1, p * 6) * Math.PI / 2) * (1 - p);
  out.alpha = Math.min(reduced && layer.shape === 'flash' ? .3 : 1, layer.alpha * alpha);
  out.scale = reduced ? 1 : layer.shape === 'charge' ? .65 + eased * .35 : layer.shape === 'burst' ? .6 + eased * .65 : 1;
  out.rotation = reduced ? 0 : layer.shape === 'slash' ? (eased - .5) * 1.2 : layer.shape === 'mote' ? p * 1.5 : 0;
  return true;
}

/** Local contact feedback; global screen flash remains disabled. */
export function skillFeedback(timeline: SkillTimeline, elapsedMs: number, reduced: boolean, support = false) {
  const since = elapsedMs - timeline.impactMs;
  return {
    hitStopMs: reduced || support ? 0 : timeline.hitStopMs,
    shake: reduced || support || since < 0 || since >= 120 ? 0 : timeline.shakePx * (1 - since / 120),
    flash: since < 0 || since >= 60 ? 0 : Math.min(reduced ? .3 : .65, .65 * (1 - since / 60)),
  };
}

/** Hold only the visual pose, then catch up smoothly; rules and event timestamps never move. */
export function skillPoseTime(timeline: SkillTimeline | undefined, elapsedMs: number, impactMs: number, reduced: boolean, fallbackHoldMs = 0): number {
  const hold = timeline?.hitStopMs ?? fallbackHoldMs;
  if (hold <= 0 || reduced || elapsedMs < impactMs) return elapsedMs;
  const since = elapsedMs - impactMs;
  if (since < hold) return impactMs;
  const catchUp = clamp((since - hold) / 140);
  return elapsedMs - hold * (1 - catchUp * catchUp * (3 - 2 * catchUp));
}
