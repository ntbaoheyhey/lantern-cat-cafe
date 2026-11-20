import {afterEach, describe, expect, it, vi} from 'vitest';
import {getV5Timeline, V5_SKILL_TIMELINES, validateSkillTimeline, type SkillTimeline} from './skill-timeline';
import {V5SkillPlayer} from './skill-player';
import {pilotFixture} from './fixture';
import {configureSequence} from '../battle-v3/sequence';
import {FX_COLORS, GLYPHS} from '../spine/vfx-registry';
import type {PaintedStamps} from '../spine/vfx-stamps';
import type {SceneView} from '../../squad/turn3d/scene';

const owners = ['needle-moth', 'binding-thread', 'teacup-healer', 'kettle-knight'];
const timelines = V5_SKILL_TIMELINES as Map<string, SkillTimeline>;
afterEach(() => timelines.delete('enemy-travel-test'));

describe('enemy material variants', () => {
  it.each(owners)('keeps both %s forms aligned to real rules events and prewarmed art', owner => {
    for (const suffix of [':basic', '']) {
      const id = `enemy:${owner}${suffix}`, timeline = getV5Timeline(id)!;
      const fixture = pilotFixture(id), events = JSON.stringify(fixture.plan.events);
      const plan = configureSequence(fixture.plan);
      expect(validateSkillTimeline(timeline)).toBe(timeline);
      expect(timeline.impactMs).toBe(plan.beats[2]!.start);
      expect(JSON.stringify(plan.events)).toBe(events);
      const damage = plan.events.some(e => e.actorId === plan.actorId && e.type === 'damage');
      if (!damage && plan.events.some(e => e.actorId === plan.actorId && e.type === 'heal')) {
        expect(timeline.layers.some(l => l.shape === 'flash')).toBe(false);
        expect(timeline.shakePx).toBe(0);
      }
      expect(FX_COLORS).toContain(timeline.color);
      for (const layer of timeline.layers) {
        expect(GLYPHS).toContain(layer.glyph);
        expect(layer.texture).toBe('');
        if (layer.id === 'contact') expect(layer.startMs).toBe(timeline.impactMs);
      }
    }
  });

  it('gives signatures distinct material travel and more decay detail than basics', () => {
    const travel = owners.map(owner => getV5Timeline(`enemy:${owner}`)!.layers.find(l => l.id === 'release')!.travel);
    expect(new Set(travel).size).toBe(4);
    for (const owner of owners) {
      const full = getV5Timeline(`enemy:${owner}`)!, basic = getV5Timeline(`enemy:${owner}:basic`)!;
      expect(full.layers.find(l => l.id === 'motes')!.count).toBeGreaterThan(basic.layers.find(l => l.id === 'motes')!.count);
    }
    expect(getV5Timeline('enemy:teacup-healer')!.layers.some(l => l.shape === 'flash')).toBe(false);
    expect(getV5Timeline('enemy:teacup-healer')!.shakePx).toBe(0);
  });

  it.each(owners)('lands every %s trail at the resolved recipient and disables travel in reduced motion', owner => {
    const timeline = getV5Timeline(`enemy:${owner}`)!, release = timeline.layers.find(l => l.id === 'release')!;
    timelines.set('enemy-travel-test', {...timeline, id: 'enemy-travel-test', layers: [release]});
    const fixture = pilotFixture(`enemy:${owner}`), plan = {...configureSequence(fixture.plan), presentationId: 'enemy-travel-test'};
    const stamp = document.createElement('canvas');
    const player = new V5SkillPlayer((id, socket) => ({x: id === plan.actorId ? 500 : 100, y: socket === 'head' ? 0 : 100}),
      {get: () => stamp} as unknown as PaintedStamps);
    const c = {save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn()} as unknown as CanvasRenderingContext2D;
    const view = {frame: {plan, elapsed: timeline.impactMs}, actors: fixture.battle.actors, quality: 'high', reducedMotion: false} as unknown as SceneView;
    player.render(c, view);
    const calls = vi.mocked(c.translate).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const recipients = plan.events.filter(e => e.actorId === plan.actorId && (e.type === 'damage' || e.type === 'heal')).flatMap(e => e.targetIds);
    const expectedX = new Set<number>(recipients.map(id => id === plan.actorId ? 500 : owner === 'kettle-knight' ? 100 + 100 / .77 * .34 : 100));
    const expectedY = owner === 'kettle-knight' ? 52 : 100;
    for (const [x, y] of calls) {expect([...expectedX].some(expected => Math.abs(x - expected) < 1e-6)).toBe(true); expect(y).toBeCloseTo(expectedY);}
    vi.mocked(c.translate).mockClear(); vi.mocked(c.rotate).mockClear();
    view.reducedMotion = true; view.frame!.elapsed = release.startMs + 30;
    player.render(c, view);
    expect(vi.mocked(c.translate).mock.calls.length).toBeGreaterThan(0);
    for (const [x, y] of vi.mocked(c.translate).mock.calls) {expect(expectedX.has(x)).toBe(true); expect(y).toBeCloseTo(expectedY);}
    expect(vi.mocked(c.rotate).mock.calls.every(([angle]) => angle === 0)).toBe(true);
  });
});
