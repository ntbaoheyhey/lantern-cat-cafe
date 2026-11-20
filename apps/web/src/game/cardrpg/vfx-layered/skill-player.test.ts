import {afterEach, describe, expect, it, vi} from 'vitest';
import {V5SkillPlayer} from './skill-player';
import {SkillBlendLayers} from './skill-blend-layers';
import {SKILL_BUDGETS, SKILL_MAX_COUNT, SKILL_MAX_LAYERS} from './skill-budget';
import {V5_SKILL_TIMELINES, getV5Timeline, validateSkillTimeline, type SkillTimeline} from './skill-timeline';
import {registerV5Texture, clearV5Textures} from './skill-textures';
import type {SceneView} from '../../squad/turn3d/scene';
import type {PaintedStamps} from '../spine/vfx-stamps';

const timelines = V5_SKILL_TIMELINES as Map<string, SkillTimeline>;
function context() {
  return {save: vi.fn(), restore: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    drawImage: vi.fn(), setTransform: vi.fn(), clearRect: vi.fn()} as unknown as CanvasRenderingContext2D;
}
function fixture(shape: 'burst' | 'mote' = 'burst', count = 32, quality = 'high', reducedMotion = false) {
  const original = getV5Timeline('mochi-1')!;
  timelines.set('budget-test', {...original, id: 'budget-test', layers: [{...original.layers[3]!,
    id: 'bounded', shape, startMs: 0, durationMs: 800, count, texture: 'budget-texture'}]});
  const targetIds = Array.from({length: 40}, (_, i) => 'enemy-' + i);
  const plan = {skillId: 'budget-test', actorId: 'caster', targetIds,
    beats: [{start: 0}, {start: 100}, {start: 350}],
    events: [{type: 'action_start', actorId: 'caster', targetIds}, {type: 'damage', actorId: 'caster', targetIds}]};
  const view = {frame: {plan, elapsed: 450}, quality, reducedMotion,
    actors: [{id: 'caster', side: 'party'}, ...targetIds.map(id => ({id, side: 'enemy'}))]} as unknown as SceneView;
  const stamp = document.createElement('canvas');
  const player = new V5SkillPlayer((_id, socket) => ({x: 100, y: socket === 'head' ? 0 : 100}),
    {get: () => stamp} as unknown as PaintedStamps);
  return {player, view, c: context()};
}
afterEach(() => { timelines.delete('budget-test'); clearV5Textures(); vi.restoreAllMocks(); });

describe('scene-wide skill limits', () => {
  it.each(['high', 'low', 'reduced'] as const)('bounds total draws across forty targets in %s', mode => {
    const {player, view, c} = fixture('burst', 32, mode === 'low' ? 'low' : 'high', mode === 'reduced');
    player.render(c, view);
    expect(c.drawImage).toHaveBeenCalledTimes(SKILL_BUDGETS[mode].draws);
    expect(player.audit.dropped).toBeGreaterThan(0);
    player.render(c, view);
    expect(player.audit.draws).toBe(SKILL_BUDGETS[mode].draws); // Fresh budget, no accumulated starvation.
  });
  it.each(['high', 'low', 'reduced'] as const)('bounds motes independently in %s', mode => {
    const {player, view, c} = fixture('mote', 32, mode === 'low' ? 'low' : 'high', mode === 'reduced');
    player.render(c, view);
    expect(player.audit.particles).toBe(SKILL_BUDGETS[mode].motes);
    expect(player.audit.draws).toBeLessThanOrEqual(SKILL_BUDGETS[mode].draws);
  });
  it('rejects oversized authored counts/layers and safely ignores nonfinite runtime counts', () => {
    const original = getV5Timeline('mochi-1')!;
    expect(() => validateSkillTimeline({...original, layers: original.layers.map(l => ({...l, count: SKILL_MAX_COUNT + 1}))})).toThrow();
    expect(() => validateSkillTimeline({...original, layers: Array(SKILL_MAX_LAYERS + 1).fill(original.layers[0])})).toThrow();
    const {player, view, c} = fixture('mote', Infinity); player.render(c, view);
    expect(c.drawImage).not.toHaveBeenCalled(); expect(player.audit.dropped).toBeGreaterThan(0);
  });
  it('reuses scratch arrays and releases the previous action on clear', () => {
    const {player, view, c} = fixture();
    const internals = player as unknown as {sample: unknown; rect: unknown; targets: string[]; plan: unknown};
    const sample = internals.sample, rect = internals.rect, targets = internals.targets;
    for (let i = 0; i < 20; i++) player.render(c, view);
    expect(internals.sample).toBe(sample); expect(internals.rect).toBe(rect); expect(internals.targets).toBe(targets);
    expect(targets.length).toBe(40); player.clear(); expect(targets).toHaveLength(0); expect(internals.plan).toBeUndefined();
  });
});

describe('emissive canvas lifecycle', () => {
  it('allocates only used passes, reuses/resizes them, clears and disposes both', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context() as unknown as ReturnType<HTMLCanvasElement['getContext']>);
    const host = document.createElement('div'), layers = new SkillBlendLayers(host);
    layers.begin(320, 180, 2); expect(host.children).toHaveLength(0);
    const add = layers.context('add'), screen = layers.context('screen');
    expect(layers.context('add')).toBe(add); expect(host.children).toHaveLength(2);
    expect(layers.passes.map(p => p.canvas.style.mixBlendMode)).toEqual(['plus-lighter', 'screen']);
    expect(layers.passes[0]!.canvas.width).toBe(640);
    layers.begin(640, 360, 1); expect(layers.context('screen')).toBe(screen);
    layers.clear(); expect(add.clearRect).toHaveBeenCalled(); expect(screen.clearRect).toHaveBeenCalled();
    const canvases = layers.passes.map(p => p.canvas); layers.dispose();
    expect(host.children).toHaveLength(0); expect(canvases.every(c => c.width === 1 && c.height === 1)).toBe(true);
  });
  it.each(['add', 'screen', 'normal'] as const)('honors decoded %s blend without rerouting normal materials', blend => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context() as unknown as ReturnType<HTMLCanvasElement['getContext']>);
    const {player, view, c} = fixture(), layers = new SkillBlendLayers(document.createElement('div'));
    registerV5Texture('budget-texture', {image: document.createElement('canvas'), width: 16, height: 16,
      cols: 1, rows: 1, frameMs: 50, blend});
    layers.begin(640, 360, 1); player.render(c, view, true, layers);
    if (blend === 'normal') { expect(layers.passes).toHaveLength(0); expect(c.drawImage).toHaveBeenCalled(); }
    else { expect(c.drawImage).not.toHaveBeenCalled(); expect(layers.passes[0]!.context.drawImage).toHaveBeenCalled(); }
    layers.dispose();
  });
});
