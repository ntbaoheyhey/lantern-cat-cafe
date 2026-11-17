import {describe, expect, it, afterEach} from 'vitest';
import {V5_SKILL_TIMELINES, getV5Timeline, validateSkillTimeline, sampleSkillLayer, skillFeedback, skillPoseTime} from './skill-timeline';
import {registerV5Texture, clearV5Textures, getV5Texture, v5TextureRect} from './skill-textures';
import {FX_COLORS, GLYPHS} from '../spine/vfx-registry';
import {V5_INTEGRATED_TEXTURES} from './skill-texture-selection';

describe('V5 skill timeline contract', () => {
  it('keeps unreviewed atlas entries procedural and uses distinct ultimate art', () => {
    for (const timeline of V5_SKILL_TIMELINES.values()) for (const layer of timeline.layers) {
      if (layer.texture) expect(V5_INTEGRATED_TEXTURES.has(layer.texture)).toBe(true);
      if (layer.shape === 'mote' || layer.shape === 'decal') expect(layer.texture).toBe('');
    }
    for (const owner of ['mochi', 'clover', 'panko', 'soot']) {
      expect(getV5Timeline(owner+'-4')!.layers.find(l=>l.id==='burst')!.texture).toBe(owner+'-ult-release');
    }
    expect(getV5Timeline('mochi-1')!.layers.find(l=>l.id==='burst')!.texture).toBe('');
  });
  it('covers four heroes, including both skill slots, with ordered three-beat timelines', () => {
    expect([...V5_SKILL_TIMELINES.keys()].filter(id => !id.startsWith('enemy:'))).toHaveLength(16);
    for (const owner of ['mochi', 'soot', 'clover', 'panko']) for (const slot of [1, 2, 3, 4]) {
      const timeline = getV5Timeline(`${owner}-${slot}`)!;
      expect(validateSkillTimeline(timeline)).toBe(timeline);
      // The procedural renderer draws from the existing prewarmed stamp cache.
      expect(FX_COLORS).toContain(timeline.color); expect(GLYPHS).toContain(timeline.motif);
      expect(timeline.layers.map(l => l.startMs)).toEqual(timeline.layers.map(l => l.startMs).sort((a, b) => a - b));
      expect(timeline.impactMs).toBe(slot === 4 ? 1100 : 350);
      expect(timeline.durationMs).toBe(slot === 4 ? 1700 : 800);
      expect(Math.max(...timeline.layers.map(l => l.startMs + l.durationMs))).toBe(timeline.durationMs);
      expect(new Set(timeline.layers.map(l => l.anchor))).toEqual(new Set(['caster', 'target', 'ground']));
    }
  });

  it('samples half-open windows and bounds reduced-motion flash without changing impact time', () => {
    const sample = {progress: 0, eased: 0, alpha: 0, scale: 0, rotation: 0};
    for (const timeline of V5_SKILL_TIMELINES.values()) {
      for (const layer of timeline.layers) {
        expect(sampleSkillLayer(layer, layer.startMs - 1, false, sample)).toBe(false);
        expect(sampleSkillLayer(layer, layer.startMs, false, sample)).toBe(true);
        expect(sampleSkillLayer(layer, layer.startMs + layer.durationMs, false, sample)).toBe(false);
        for (let ms = layer.startMs; ms < layer.startMs + layer.durationMs; ms += 5) {
          sampleSkillLayer(layer, ms, true, sample);
          expect(sample.rotation).toBe(0); expect(sample.scale).toBe(1);
          if (layer.shape === 'flash') expect(sample.alpha).toBeLessThanOrEqual(.3);
        }
      }
      for (let ms = timeline.impactMs - 1; ms <= timeline.impactMs + 150; ms++) {
        const feedback = skillFeedback(timeline, ms, true);
        expect(feedback.shake).toBe(0); expect(feedback.flash).toBeLessThanOrEqual(.3);
      }
      expect(skillFeedback(timeline, timeline.impactMs, false).hitStopMs).toBeGreaterThanOrEqual(40);
      expect(skillFeedback(timeline, timeline.impactMs, false).hitStopMs).toBeLessThanOrEqual(80);
      expect(skillFeedback(timeline, timeline.impactMs, false, true).shake).toBe(0);
    }
  });

  it('holds the contact pose deterministically and catches up without reversing or moving rules time', () => {
    for (const timeline of V5_SKILL_TIMELINES.values()) {
      const impact = timeline.impactMs, hold = timeline.hitStopMs;
      expect(skillPoseTime(timeline, impact - 1, impact, false)).toBe(impact - 1);
      expect(skillPoseTime(timeline, impact + hold - 1, impact, false)).toBe(impact);
      expect(skillPoseTime(timeline, impact + hold + 140, impact, false)).toBe(impact + hold + 140);
      let last = 0;
      for (let at = 0; at <= timeline.durationMs; at++) {
        const sampled = skillPoseTime(timeline, at, impact, false);
        expect(sampled).toBeGreaterThanOrEqual(last); expect(sampled).toBeLessThanOrEqual(at); last = sampled;
        expect(skillPoseTime(timeline, at, impact, true)).toBe(at);
      }
    }
  });

  it('holds native enemy contact without a hero texture timeline and bypasses reduced motion', () => {
    expect(skillPoseTime(undefined, 349, 350, false, 45)).toBe(349);
    expect(skillPoseTime(undefined, 383, 350, false, 45)).toBe(350);
    expect(skillPoseTime(undefined, 535, 350, false, 45)).toBe(535);
    expect(skillPoseTime(undefined, 1133, 1100, false, 70)).toBe(1100);
    expect(skillPoseTime(undefined, 383, 350, true, 45)).toBe(383);
    expect(skillPoseTime(undefined, 383, 350, false)).toBe(383);
  });

  it('rejects unsorted layers, bad timing and a missing dissipation beat', () => {
    const timeline = getV5Timeline('soot-4')!;
    expect(() => validateSkillTimeline({...timeline, layers: [...timeline.layers].reverse()})).toThrow();
    expect(() => validateSkillTimeline({...timeline, durationMs: 1200})).toThrow();
    expect(() => validateSkillTimeline({...timeline, layers: timeline.layers.filter(l => l.beat !== 'dissipation')})).toThrow();
  });
});

describe('V5 decoded texture registration', () => {
  afterEach(clearV5Textures);
  it('keeps procedural fallback until a valid sheet arrives, and samples first and last tiles', () => {
    const image = document.createElement('canvas'), texture = {image, width: 512, height: 512, cols: 4, rows: 4, frameMs: 40};
    expect(getV5Texture('mochi-impact')).toBeUndefined();
    expect(registerV5Texture('mochi-impact', {...texture, width: 511})).toBe(false);
    expect(registerV5Texture('mochi-impact', texture)).toBe(true);
    const rect = {x: 0, y: 0, width: 0, height: 0};
    v5TextureRect(texture, 0, rect); expect(rect).toEqual({x: 0, y: 0, width: 128, height: 128});
    v5TextureRect(texture, .5, rect); expect(rect).toEqual({x: 0, y: 256, width: 128, height: 128});
    v5TextureRect(texture, 1, rect); expect(rect).toEqual({x: 384, y: 384, width: 128, height: 128});
    expect(registerV5Texture('mochi-impact', {...texture, frameMs: NaN})).toBe(false);
    expect(getV5Texture('mochi-impact')?.frameMs).toBe(40);
  });
});
