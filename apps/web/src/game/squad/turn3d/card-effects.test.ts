import { describe, expect, it } from 'vitest';
import * as T from 'three';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import { CARD_EFFECT_PRIMITIVES, createCardPrimitive } from './card-effect-primitives';
import { CARD_EFFECT_RECIPES, CARD_STATUS_LOOKS, cardEffectSignature } from './card-effect-data';
import { CARD_EFFECT_BUDGET, CardEffects, cardRecipeFor } from './card-effects';
import { sampleActionPlan } from './effects';
import { galleryFixture, GALLERY_ACTIONS } from '../../cardrpg/depth/feel-lab';

describe('original starter effect compositions', () => {
  it('builds at least thirty finite reusable geometry primitives', () => {
    expect(CARD_EFFECT_PRIMITIVES.length).toBeGreaterThanOrEqual(30);
    for (const name of CARD_EFFECT_PRIMITIVES) {
      const geometry = createCardPrimitive(name);
      expect(geometry.attributes.position!.count).toBeGreaterThan(0);
      expect([...geometry.attributes.position!.array].every(Number.isFinite)).toBe(true);
      expect(geometry.boundingSphere!.radius).toBeGreaterThan(0);
      geometry.dispose();
    }
  });

  it('covers the slice with unique structural signatures and valid layer intervals', () => {
    const signatures = new Set<string>();
    for (const [id, recipe] of Object.entries(CARD_EFFECT_RECIPES)) {
      expect(GALLERY_ACTIONS.some(action => action.id === id)).toBe(true);
      expect(signatures.has(cardEffectSignature(recipe)), id).toBe(false);
      signatures.add(cardEffectSignature(recipe));
      for (const layer of recipe.layers) {
        expect(layer.start).toBeGreaterThanOrEqual(0);
        expect(layer.end).toBeGreaterThan(layer.start);
        expect(layer.end).toBeLessThanOrEqual(1);
        expect(layer.count).toBeGreaterThan(0);
        expect(CARD_EFFECT_PRIMITIVES).toContain(layer.primitive);
      }
    }
    const original = CARD_EFFECT_RECIPES['mochi-1']!;
    expect(cardEffectSignature({ ...original, color: '#000000', accent: '#ffffff',
      layers: original.layers.map(layer => ({ ...layer, size: layer.size * 2, count: layer.count + 2 })) }))
      .toBe(cardEffectSignature(original));
  });

  it('uses pooled buffers and respects instance/draw budgets across all preview frames', async () => {
    const stage = new T.Scene();
    const effects = new CardEffects(stage);
    await effects.ready;
    const camera = new T.PerspectiveCamera();
    const resources = effects.root.children.map(child => {
      const mesh = child as T.InstancedMesh;
      return [mesh.geometry.uuid, mesh.material, mesh.instanceMatrix.array, mesh.instanceColor!.array];
    });
    const matrix = new T.Matrix4();
    for (const [id, recipe] of Object.entries(CARD_EFFECT_RECIPES)) {
      const { battle, plan } = galleryFixture(id);
      const actors = battle.actors as unknown as TurnActor[];
      const positions = new Map(actors.map((actor, index) => [actor.id, new T.Vector3(index * 2, 0, 0)]));
      for (const quality of ['high', 'medium', 'low'] as const) {
        for (let index = 0; index < 21; index++) {
          const frame = sampleActionPlan(plan, plan.duration * index / 21, false);
          expect(cardRecipeFor(frame, actors)).toBe(recipe);
          effects.render(frame, recipe, actors, positions, camera, quality, false);
          expect(effects.stats.instances).toBeLessThanOrEqual(CARD_EFFECT_BUDGET.instances);
          expect(effects.stats.primitiveCalls).toBeLessThanOrEqual(CARD_EFFECT_BUDGET.primitiveCalls);
          expect(effects.stats.truncated).toBe(0);
          for (const child of effects.root.children) {
            const mesh = child as T.InstancedMesh;
            for (let instance = 0; instance < mesh.count; instance++) {
              mesh.getMatrixAt(instance, matrix);
              expect(matrix.elements.every(Number.isFinite)).toBe(true);
            }
          }
        }
      }
    }
    effects.root.children.forEach((child, index) => {
      const mesh = child as T.InstancedMesh;
      expect(mesh.geometry.uuid).toBe(resources[index]![0]);
      expect(mesh.material).toBe(resources[index]![1]);
      expect(mesh.instanceMatrix.array).toBe(resources[index]![2]);
      expect(mesh.instanceColor!.array).toBe(resources[index]![3]);
    });
    effects.render(null, undefined, [], new Map(), camera, 'low', false);
    expect(effects.stats.instances).toBe(0);
    effects.dispose();
    expect(stage.children).toHaveLength(0);
  });

  it('cancels cooperative construction cleanly after disposal', async () => {
    const scene = new T.Scene();
    const effects = new CardEffects(scene);
    effects.dispose();
    await effects.ready;
    expect(scene.children).toHaveLength(0);
    expect(effects.root.children).toHaveLength(0);
  });

  it('caps stacked ambient status visuals and disables them for defeated actors', async () => {
    const effects = new CardEffects(new T.Scene());
    await effects.ready;
    const actors = Array.from({ length: 6 }, (_, index) => ({ id: String(index), hp: 10 })) as TurnActor[];
    const positions = new Map(actors.map(actor => [actor.id, new T.Vector3()]));
    const statuses = Object.fromEntries(actors.map(actor => [actor.id, Object.keys(CARD_STATUS_LOOKS)]));
    effects.render(null, undefined, actors, positions, new T.PerspectiveCamera(), 'medium', true, statuses);
    expect(effects.stats.instances).toBeGreaterThan(0);
    expect(effects.stats.instances).toBeLessThanOrEqual(CARD_EFFECT_BUDGET.instances);
    expect(effects.stats.primitiveCalls).toBeLessThanOrEqual(CARD_EFFECT_BUDGET.primitiveCalls);
    for (const actor of actors) actor.hp = 0;
    effects.render(null, undefined, actors, positions, new T.PerspectiveCamera(), 'medium', false, statuses);
    expect(effects.stats.instances).toBe(0);
    effects.dispose();
  });
});
