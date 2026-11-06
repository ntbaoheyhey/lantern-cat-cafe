import * as T from 'three';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectFrame } from './effects';
import type { Quality } from './post';
import { CARD_EFFECT_RECIPES, CARD_STATUS_LOOKS, type CardEffectLayer, type CardEffectRecipe } from './card-effect-data';
import { CARD_EFFECT_PRIMITIVES, createCardPrimitive, type CardEffectPrimitive } from './card-effect-primitives';

export const CARD_EFFECT_BUDGET = { instances: 96, primitiveCalls: 8, perPrimitive: 64, protectedFaces: 12 };
const vertexShader = `
  attribute float effectAlpha;
  varying vec3 effectColor;
  varying float opacity;
  void main() {
    effectColor = instanceColor;
    opacity = effectAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  varying vec3 effectColor;
  varying float opacity;
  uniform vec2 resolution;
  uniform vec4 protectedFaces[12];
  uniform int protectedCount;
  uniform float overdraw;
  void main() {
    vec2 point = gl_FragCoord.xy / resolution;
    for (int index = 0; index < 12; index++) {
      if (index >= protectedCount) break;
      vec4 face = protectedFaces[index];
      vec2 local = (point - face.xy) / max(face.zw, vec2(0.00001));
      if (dot(local, local) < 1.0) discard;
    }
    gl_FragColor = overdraw > .5 ? vec4(vec3(1.0 / 255.0), 1.0)
      : vec4(effectColor * 1.45, opacity);
  }
`;
const nextTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const ease = (value: number) => value * value * (3 - 2 * value);
const effectBeatSpans = {
  anticipation: [0, .34], travel: [.34, .52], impact: [.52, .60],
  reaction: [.60, .82], residue: [.82, 1],
} as const;

export function cardRecipeFor(frame: EffectFrame | null, actors: TurnActor[]): CardEffectRecipe | undefined {
  if (!frame) return;
  const skill = CARD_EFFECT_RECIPES[frame.plan.presentationId ?? frame.plan.skillId];
  if (skill) return skill;
  const actor = actors.find(candidate => candidate.id === frame.plan.actorId);
  return actor?.side === 'enemy' ? CARD_EFFECT_RECIPES[`enemy:${actor.cardRpg?.cardId}`] : undefined;
}

interface PrimitivePool {
  mesh: T.InstancedMesh<T.BufferGeometry, T.ShaderMaterial>;
  alpha: T.InstancedBufferAttribute;
}

/** Pooled geometry compositions. No geometry/material/particle creation during playback. */
export class CardEffects {
  readonly root = new T.Group();
  readonly recipes = CARD_EFFECT_RECIPES;
  readonly ready: Promise<void>;
  readonly stats = { instances: 0, primitiveCalls: 0, truncated: 0 };
  readonly protectedFaces = Array.from({ length: CARD_EFFECT_BUDGET.protectedFaces }, () => new T.Vector4());
  private material: T.ShaderMaterial;
  private pools = new Map<CardEffectPrimitive, PrimitivePool>();
  private disposed = false;
  private position = new T.Vector3();
  private caster = new T.Vector3();
  private focus = new T.Vector3();
  private targets: T.Vector3[] = [];
  private transform = new T.Object3D();
  private spin = new T.Quaternion();
  private axis = new T.Vector3(0, 0, 1);
  private color = new T.Color();
  private baseColor = new T.Color();
  private accentColor = new T.Color();
  private resolution = new T.Vector2(1, 1);

  constructor(scene: T.Scene) {
    this.root.name = 'card-effect-compositions';
    scene.add(this.root);
    this.material = new T.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false,
      side: T.DoubleSide, blending: T.AdditiveBlending, forceSinglePass: true,
      uniforms: {
        resolution: { value: this.resolution },
        protectedFaces: { value: this.protectedFaces },
        protectedCount: { value: 0 },
        overdraw: { value: 0 },
      },
    });
    this.ready = this.prepare();
  }

  private async prepare() {
    for (const primitive of CARD_EFFECT_PRIMITIVES) {
      await nextTask();
      if (this.disposed) return;
      const geometry = createCardPrimitive(primitive);
      const alpha = new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1);
      alpha.setUsage(T.DynamicDrawUsage);
      geometry.setAttribute('effectAlpha', alpha);
      const mesh = new T.InstancedMesh(geometry, this.material, CARD_EFFECT_BUDGET.perPrimitive);
      mesh.name = primitive;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.setColorAt(0, this.color.set('#ffffff'));
      mesh.instanceColor!.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      mesh.visible = false;
      this.root.add(mesh);
      this.pools.set(primitive, { mesh, alpha });
    }
  }

  async warm(renderer: T.WebGLRenderer, camera: T.Camera) {
    await this.ready;
    if (this.disposed) return;
    const parent = this.root.parent;
    const scene = new T.Scene();
    scene.add(this.root);
    const previous = renderer.getRenderTarget();
    const target = new T.WebGLRenderTarget(2, 2);
    this.transform.position.set(0, 0, 0);
    this.transform.rotation.set(0, 0, 0);
    this.transform.scale.setScalar(1);
    this.transform.updateMatrix();
    try {
      renderer.setRenderTarget(target);
      for (const { mesh, alpha } of this.pools.values()) {
        if (this.disposed) break;
        mesh.visible = true;
        mesh.count = 1;
        mesh.setMatrixAt(0, this.transform.matrix);
        alpha.setX(0, 1);
        mesh.instanceMatrix.needsUpdate = true;
        alpha.needsUpdate = true;
        for (const destination of [target, null]) {
          renderer.setRenderTarget(destination);
          await renderer.compileAsync(scene, camera);
          if (this.disposed) break;
          renderer.render(scene, camera);
          await nextTask();
        }
        mesh.visible = false;
        mesh.count = 0;
        await nextTask();
      }
    } finally {
      renderer.setRenderTarget(previous);
      target.dispose();
      this.root.removeFromParent();
      if (parent && !this.disposed) parent.add(this.root);
    }
  }

  protect(count: number, width: number, height: number) {
    this.material.uniforms.protectedCount!.value = Math.min(CARD_EFFECT_BUDGET.protectedFaces, count);
    this.resolution.set(width, height);
  }

  render(frame: EffectFrame | null, recipe: CardEffectRecipe | undefined, actors: TurnActor[],
    positions: Map<string, T.Vector3>, camera: T.Camera, quality: Quality, calm: boolean,
    statuses?: Record<string, readonly string[]>, time = 0) {
    for (const { mesh } of this.pools.values()) { mesh.count = 0; mesh.visible = false; }
    this.stats.instances = 0;
    this.stats.primitiveCalls = 0;
    this.stats.truncated = 0;
    if (this.disposed) return;
    if (frame && recipe) this.renderAction(frame, recipe, actors, positions, camera, quality, calm);
    if (statuses) {
      for (const actor of actors) {
        const position = positions.get(actor.id);
        const activeStatuses = statuses[actor.id];
        if (actor.hp <= 0 || !position || !activeStatuses) continue;
        this.focus.copy(position);
        for (const status of activeStatuses) {
          const look = CARD_STATUS_LOOKS[status];
          if (!look) continue;
          this.baseColor.set(look.color);
          this.accentColor.copy(this.baseColor);
          const phase = calm ? .5 : .5 + Math.sin(time * 2) * .22;
          for (let index = 0; index < look.layer.count; index++) {
            this.place(look.layer, phase, index, look.layer.count, camera, calm);
          }
        }
      }
    }
    for (const { mesh, alpha } of this.pools.values()) {
      if (!mesh.count) continue;
      mesh.visible = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
      alpha.needsUpdate = true;
    }
  }

  private renderAction(frame: EffectFrame, recipe: CardEffectRecipe, actors: TurnActor[],
    positions: Map<string, T.Vector3>, camera: T.Camera, quality: Quality, calm: boolean) {
    const actor = actors.find(candidate => candidate.id === frame.plan.actorId);
    this.caster.copy(positions.get(frame.plan.actorId) ?? this.position.set(0, 0, 0));
    this.targets.length = 0;
    for (const id of frame.plan.targetIds) {
      const target = actors.find(candidate => candidate.id === id);
      const position = positions.get(id);
      const appropriateSide = recipe.target === 'friendly' ? target?.side === actor?.side : target?.side !== actor?.side;
      if (position && appropriateSide) this.targets.push(position);
    }
    if (!this.targets.length) this.targets.push(this.caster);
    const span = effectBeatSpans[frame.beat.kind];
    const progress = span[0] + (span[1] - span[0]) * frame.progress;
    this.drawRecipe(recipe, progress, camera, quality, calm);
    for (const id of frame.plan.presentationCues ?? []) {
      const cue = CARD_EFFECT_RECIPES[id];
      if (cue) this.drawRecipe(cue, (progress - .65) / .35, camera, quality, calm);
    }
  }

  private drawRecipe(recipe: CardEffectRecipe, actionProgress: number,
    camera: T.Camera, quality: Quality, calm: boolean) {
    this.baseColor.set(recipe.color);
    this.accentColor.set(recipe.accent);
    for (const layer of recipe.layers) {
      const progress = (actionProgress - layer.start) / (layer.end - layer.start);
      if (progress < 0 || progress > 1) continue;
      const anchors = layer.anchor === 'all-targets' ? this.targets.length : 1;
      const density = quality === 'low' ? .5 : quality === 'medium' ? .8 : 1;
      const count = Math.max(1, Math.ceil(layer.count * density));
      for (let target = 0; target < anchors; target++) {
        this.focus.copy(layer.anchor === 'caster' ? this.caster : this.targets[target]!);
        for (let index = 0; index < count; index++) {
          this.place(layer, progress, index, count, camera, calm);
        }
      }
    }
  }

  private place(layer: CardEffectLayer, progress: number, index: number, count: number,
    camera: T.Camera, calm: boolean) {
    const pool = this.pools.get(layer.primitive);
    if (!pool) return;
    const newPrimitive = pool.mesh.count === 0;
    if (this.stats.instances >= CARD_EFFECT_BUDGET.instances || pool.mesh.count >= CARD_EFFECT_BUDGET.perPrimitive
      || newPrimitive && this.stats.primitiveCalls >= CARD_EFFECT_BUDGET.primitiveCalls) {
      this.stats.truncated++;
      return;
    }
    const offset = count > 1 ? index / (count - 1) : .5;
    const phase = Math.max(0, Math.min(1, progress * 1.16 - offset * .16));
    const travel = ease(phase);
    const angle = index * 2.399963 + (calm ? 0 : travel * layer.turns * Math.PI * 2);
    const radius = layer.spread;
    const height = layer.height;
    let size = layer.size;
    let spin = 0;
    this.position.copy(this.focus);
    this.position.y += height;
    switch (layer.motion) {
      case 'hold':
        size *= .85 + .15 * ease(Math.min(1, phase * 5));
        break;
      case 'pulse':
        size *= .75 + .25 * Math.sin(phase * Math.PI);
        break;
      case 'expand':
        size *= .45 + travel * .9;
        this.position.x += Math.cos(angle) * radius * (count > 1 ? .4 : 0);
        this.position.z += Math.sin(angle) * radius * (count > 1 ? .4 : 0);
        break;
      case 'projectile':
        this.position.lerpVectors(this.caster, this.focus, travel);
        this.position.y += height + Math.sin(phase * Math.PI) * (calm ? .1 : .4);
        this.position.z += (offset - .5) * radius;
        spin = phase * layer.turns * Math.PI * 2;
        break;
      case 'orbit':
        this.position.x += Math.cos(angle) * radius;
        this.position.z += Math.sin(angle) * radius * .65;
        this.position.y += Math.sin(phase * Math.PI) * (calm ? .03 : .12);
        spin = angle * .2;
        break;
      case 'burst':
        this.position.x += Math.cos(angle) * radius * travel;
        this.position.z += Math.sin(angle) * radius * travel * .65;
        this.position.y += Math.sin(phase * Math.PI) * (calm ? .1 : .45);
        size *= 1 - phase * .45;
        spin = angle;
        break;
      case 'fall':
        this.position.x += (offset - .5) * radius * 2;
        this.position.y = this.focus.y + .12 + (1 - travel) * height;
        this.position.z += Math.sin(index * 2.4) * radius * .3;
        spin = layer.turns * Math.PI * 2;
        break;
      case 'rise':
        this.position.x += Math.cos(angle) * radius * (count > 1 ? 1 : 0);
        this.position.z += Math.sin(angle) * radius * (count > 1 ? .65 : 0);
        this.position.y += travel * (calm ? .08 : .4);
        size *= .35 + .65 * ease(Math.min(1, phase * 3));
        break;
      case 'cross':
        this.position.x += (index % 2 ? 1 : -1) * (1 - travel * 2) * radius;
        this.position.z += (index % 2 ? -.25 : .25);
        spin = (index % 2 ? -1 : 1) * Math.PI / 6;
        break;
      case 'pour':
        this.position.x += Math.sin(phase * Math.PI) * .45 + (offset - .5) * radius;
        this.position.y = this.focus.y + .15 + (1 - travel) * height;
        size *= .6 + .4 * Math.sin(phase * Math.PI);
        break;
      case 'sweep':
        this.position.x += (travel * 2 - 1) * radius;
        this.position.z += (offset - .5) * radius;
        spin = Math.sin(phase * Math.PI) * .2;
        break;
    }
    this.position.x += layer.offset[0];
    this.position.y += layer.offset[1];
    this.position.z += layer.offset[2];
    this.transform.position.copy(this.position);
    this.transform.quaternion.copy(camera.quaternion);
    if (layer.ground) this.transform.rotation.set(-Math.PI / 2, 0, 0);
    this.transform.quaternion.multiply(this.spin.setFromAxisAngle(this.axis, spin));
    this.transform.scale.set(size * layer.aspect[0], size * layer.aspect[1], size * layer.aspect[2]);
    this.transform.updateMatrix();
    const instance = pool.mesh.count++;
    if (newPrimitive) this.stats.primitiveCalls++;
    pool.mesh.setMatrixAt(instance, this.transform.matrix);
    pool.mesh.setColorAt(instance, layer.accent ? this.accentColor : this.baseColor);
    const fade = Math.min(1, phase * 12) * Math.min(1, (1 - phase) * 5);
    pool.alpha.setX(instance, fade * layer.opacity);
    this.stats.instances++;
  }

  dispose() {
    this.disposed = true;
    this.root.removeFromParent();
    for (const { mesh } of this.pools.values()) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    this.pools.clear();
    this.material.dispose();
  }
}
