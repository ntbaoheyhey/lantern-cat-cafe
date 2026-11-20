import * as T from 'three';
import type { SpineActor } from './assets';
import type { SceneView } from '../../squad/turn3d/scene';
import type { PaintLight } from '../vfx-craft/paint-light';
import { enemyUniforms, patchEnemySurface, type EnemyUniforms } from '../vfx-craft/enemy-surface';
import { groundEnemy } from '../vfx-craft/enemy-ground';

export const ENEMY_LIGHT_BY_MOOD = {
  garden: { key: '#ffcb84', rim: '#b5acff', fill: '#a7a2bb' },
  rain:   { key: '#c7dded', rim: '#d4edff', fill: '#8195b3' },
  pantry: { key: '#ffbf72', rim: '#dac2c9', fill: '#ac826b' },
  tangle: { key: '#f3b5ce', rim: '#bda1ff', fill: '#b798ba' },
  storm:  { key: '#bad4f2', rim: '#a7e6ff', fill: '#8d9bb9' },
  crown:  { key: '#ffdc8a', rim: '#ffcc90', fill: '#ad8c78' },
} as const;
export type EnemyMood = keyof typeof ENEMY_LIGHT_BY_MOOD;

export function enemyLightEnabled(search: string) {
  return new URLSearchParams(search).get('enemyLight') !== '0';
}
export function enemyMood(chapter = 1, boss = false, bossAsset?: string): EnemyMood {
  if (boss) {
    if (bossAsset === 'yarn-giant') return 'tangle';
    if (bossAsset === 'rain-spool') return 'storm';
    if (bossAsset === 'pantry-crown') return 'crown';
    return chapter === 3 ? 'crown' : chapter === 2 ? 'storm' : 'tangle';
  }
  return chapter === 3 ? 'pantry' : chapter === 2 ? 'rain' : 'garden';
}
export function receivesEnemyLight(side: string, unit: SpineActor['unit']) {
  return side === 'enemy' && unit.side === 'enemy' && unit.tier !== 'cat';
}

interface LightEntry {
  asset: string;
  actor: SpineActor;
  craftLight?: PaintLight;
  shadow: T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
}
interface SharedMap {
  texture: T.Texture;
  ready: boolean;
  listeners: Set<() => void>;
}
const maps = new Map<string,SharedMap>();
function acquireMap(asset: string, repaint: () => void) {
  let item = maps.get(asset);
  if (!item) {
    const listeners = new Set<() => void>();
    const texture = new T.TextureLoader().load('/units/' + asset + '/relight-normal.webp', () => {
      shared.ready = true;
      for (const notify of listeners) notify();
    }, undefined, () => { /* Alternate or absent deliveries keep the alpha sampler. */ });
    texture.name = asset + ' enemy bevel';
    texture.colorSpace = T.NoColorSpace;
    texture.generateMipmaps = false;
    texture.minFilter = texture.magFilter = T.LinearFilter;
    const shared: SharedMap = { texture, ready: false, listeners };
    maps.set(asset, shared);
    item = shared;
  }
  item.listeners.add(repaint);
  return item;
}

interface ActorLight {
  uniforms: EnemyUniforms;
  map?: SharedMap;
  mood?: EnemyMood;
}
const lights = new WeakMap<SpineActor,ActorLight | null>();
const slots = { K0: 0, K1: 1, K2: 2, K4: 3, K5: 4 } as const;

function install(entry: LightEntry, renderer: T.WebGLRenderer, repaint: () => void): ActorLight | null {
  if (!enemyLightEnabled(typeof location === 'undefined' ? '' : location.search) ||
      !renderer.capabilities.isWebGL2 || renderer.capabilities.maxTextures < 4) return null;
  const { actor, asset } = entry, uniforms = enemyUniforms();
  const drawing = actor.mesh?.drawing;
  const native = actor.source === 'template' && actor.mesh?.data.pages[0]?.name === 'rig-depth.png';
  const map = drawing || native ? acquireMap(asset, repaint) : undefined;
  if (map) uniforms.enemyNormal.value = map.texture;
  let patched = false;
  actor.root.traverse(node => {
    if (!(node instanceof T.Mesh) || !(node.material instanceof T.MeshBasicMaterial) || !node.material.map) return;
    // A drawn actor's deferred native page has independent UVs and no decoded pixels.
    if (drawing && node !== drawing) return;
    patchEnemySurface(node.material, uniforms);
    patched = true;
  });
  if (map) {
    entry.shadow.material.addEventListener('dispose', () => {
      map.listeners.delete(repaint);
      if (!map.listeners.size) { maps.delete(asset); map.texture.dispose(); }
    });
  }
  if (!patched) return null;
  groundEnemy(entry.shadow, entry.craftLight, actor.unit.tier === 'boss');
  return { uniforms, map };
}

/** Called after deformation and world bounds, before any paint/mask capture. */
export function updateEnemyLight(entry: LightEntry, view: SceneView, side: string,
                                renderer: T.WebGLRenderer, repaint: () => void) {
  const { actor } = entry;
  if (!receivesEnemyLight(side, actor.unit)) return false;
  let light = lights.get(actor);
  if (light === undefined) {
    light = install(entry, renderer, repaint);
    lights.set(actor, light);
  }
  if (!light) return false;
  const u = light.uniforms, box = actor.opaqueWorld;
  if (box) u.enemyBox.value.set(box.x, box.y, 1/Math.max(1,box.width), 1/Math.max(1,box.height));
  const drawing = actor.mesh?.drawing;
  const key = drawing?.key;
  const slot = key && key in slots ? slots[key as keyof typeof slots] : undefined;
  if (slot !== undefined) u.enemyTile.value.set(slot%3/3, (1-Math.floor(slot/3))/2, 1/3, 1/2);
  u.enemyBaked.value = light.map?.ready && (!drawing || slot !== undefined) ? 1 : 0;
  const bossId = view.boss && Object.keys(view.bossPhases ?? {})[0];
  const mood = enemyMood(view.chapter, view.boss, bossId ? view.models?.[bossId] : undefined);
  if (mood !== light.mood) {
    const palette = ENEMY_LIGHT_BY_MOOD[mood];
    u.enemyKey.value.set(palette.key); u.enemyFill.value.set(palette.fill); u.enemyRim.value.set(palette.rim);
    light.mood = mood;
  }
  u.enemyRimPower.value = actor.unit.tier === 'boss' ? 1.5 : 1;
  return true;
}
