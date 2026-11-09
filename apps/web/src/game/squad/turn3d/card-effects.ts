import { CARD_STATUS_LOOKS, CRUMB_BURST_LAYER } from './card-status-looks';
import type { StatusPresentation } from './card-status-beats';
import type { StatusId } from '@taskbar-hero/game-rules/src/cardrpg/depth/contract';
import { isReadableBattle } from './look-b2';
import { LookVfx } from './look-vfx';
import { LAB_EFFECT_RECIPES } from './card-lab-effects';
import * as T from 'three';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectFrame } from './effects';
import type { Quality } from './post';
import { CARD_EFFECT_RECIPES, LEGACY_CARD_STATUS_LOOKS, type CardEffectLayer, type CardEffectRecipe } from './card-effect-data';
import { CARD_EFFECT_PRIMITIVES, createCardPrimitive, type CardEffectPrimitive } from './card-effect-primitives';

export const CARD_EFFECT_BUDGET = { instances: 96, primitiveCalls: 8, lookInstances: 256, lookPrimitiveCalls: 16, perPrimitive: 64, protectedFaces: 12 };
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
const READABLE_GATHER: CardEffectLayer = { primitive:'knock-ring',motion:'pulse',anchor:'caster',count:1,start:0,end:1,size:.9,height:.045,spread:0,turns:0,offset:[0,0,0],aspect:[1,1,1],opacity:.60,ground:true,accent:false };
const READABLE_IMPACT: CardEffectLayer = {...READABLE_GATHER,motion:'expand',size:1.9,opacity:.85};
const READABLE_SMALL_IMPACT: CardEffectLayer = {...READABLE_IMPACT,size:.75,opacity:.65};
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
  phase?: T.InstancedBufferAttribute;
  flash?: T.InstancedBufferAttribute;
  mark?: T.InstancedBufferAttribute;
}

/** Pooled geometry compositions. No geometry/material/particle creation during playback. */
export class CardEffects {
  readonly root = new T.Group();
  readonly recipes = CARD_EFFECT_RECIPES;
  readonly ready: Promise<void>;
  readonly stats = { instances: 0, primitiveCalls: 0, truncated: 0 };
  readonly protectedHeadTops = new Float32Array(CARD_EFFECT_BUDGET.protectedFaces);
  readonly protectedFaces = Array.from({ length: CARD_EFFECT_BUDGET.protectedFaces }, () => new T.Vector4());
  private material: T.ShaderMaterial;
  private pools = new Map<CardEffectPrimitive, PrimitivePool>();
  private disposed = false;
  private look?: LookVfx;
  private flash = 0;
  private mark = 0;
  private statusHeight = 1.6;
  private side = new T.Vector3();
  private forward = new T.Vector3();
  private sizeFactor = 1;
  private alphaFactor = 1;
  private position = new T.Vector3();
  private caster = new T.Vector3();
  private focus = new T.Vector3();
  private targets: T.Vector3[] = [];
  private targetIds: string[] = [];
  private actionFrame: EffectFrame | null = null;
  private presentation?: StatusPresentation;
  private transform = new T.Object3D();
  private spin = new T.Quaternion();
  private axis = new T.Vector3(0, 0, 1);
  private color = new T.Color();
  private baseColor = new T.Color();
  private accentColor = new T.Color();
  private resolution = new T.Vector2(1, 1);

  constructor(private scene: T.Scene, private atelier = false) {
    this.root.name = 'card-effect-compositions';
    scene.add(this.root);
    this.material = new T.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false,
      side: T.DoubleSide, blending: T.AdditiveBlending, forceSinglePass: true,
      uniforms: {
        resolution: { value: this.resolution },
        protectedFaces: { value: this.protectedFaces },
        protectedCount: { value: 0 },
        protectedHeadTops: { value: this.protectedHeadTops },
        overdraw: { value: 0 },
      },
    });
    this.ready = this.prepare();
    // Scene preparation awaits this promise; suppress an early unhandled event
    // if navigation cancels while a texture request is still in flight.
    void this.ready.catch(() => undefined);
  }

  private async prepare() {
    if (this.atelier) {
      if (this.disposed) return;
      this.look = new LookVfx(this.scene, this.material.uniforms);
      await this.look.prepare(() => this.disposed);
      if (this.disposed) return;
    }
    for (const primitive of CARD_EFFECT_PRIMITIVES) {
      await nextTask();
      if (this.disposed) return;
      const base = createCardPrimitive(primitive);
      const geometry = this.look?.geometry(base, primitive) ?? base;
      const phase = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      const flash = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      if (flash) {flash.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectFlash', flash);}
      if (phase) {phase.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectPhase', phase);}
      const mark = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      if(mark){mark.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectMark',mark);}
      const alpha = new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1);
      alpha.setUsage(T.DynamicDrawUsage);
      geometry.setAttribute('effectAlpha', alpha);
      const mesh = new T.InstancedMesh(geometry, this.look?.material(primitive) ?? this.material, CARD_EFFECT_BUDGET.perPrimitive);
      mesh.name = primitive;
      mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
      mesh.setColorAt(0, this.color.set('#ffffff'));
      mesh.instanceColor!.setUsage(T.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      mesh.visible = false;
      this.root.add(mesh);
      this.pools.set(primitive, { mesh, alpha, phase, flash, mark });
    }
  }

  async warm(renderer: T.WebGLRenderer, camera: T.Camera) {
    await this.ready;
    if (this.disposed) return;
    await this.look?.warm(renderer, () => this.disposed);
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
      for (const { mesh, alpha, phase, flash, mark } of this.pools.values()) {
        if (this.disposed) break;
        mesh.visible = true;
        mesh.count = 1;
        mesh.setMatrixAt(0, this.transform.matrix);
        alpha.setX(0, 1);
        if (flash) {flash.setX(0, .5);flash.needsUpdate = true;}
        if (phase) {phase.setX(0, .5);phase.needsUpdate = true;}
        mesh.instanceMatrix.needsUpdate = true;
        alpha.needsUpdate = true;
        if(mark)mark.needsUpdate = true;
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

  get impactCenter() {return this.look?.impact;}
  setDepth(texture: T.Texture | null, camera: T.PerspectiveCamera) {this.look?.setDepth(texture, camera);}
  setLightsEnabled(enabled: boolean) {this.look?.setLightsEnabled(enabled);}

  protect(count: number, width: number, height: number) {
    this.material.uniforms.protectedCount!.value = Math.min(CARD_EFFECT_BUDGET.protectedFaces, count);
    this.resolution.set(width, height);
  }

  render(frame: EffectFrame | null, recipe: CardEffectRecipe | undefined, actors: TurnActor[],
    positions: Map<string, T.Vector3>, camera: T.Camera, quality: Quality, calm: boolean,
    statuses?: Record<string, readonly (string | {id:string;stacks:number})[]>, time = 0,
    presentation?: StatusPresentation, heights?: ReadonlyMap<string,number>, crowns?: ReadonlyMap<string,number>) {
    for (const { mesh } of this.pools.values()) { mesh.count = 0; mesh.visible = false; }
    this.look?.begin();this.flash = 0;
    this.stats.instances = 0;
    this.stats.primitiveCalls = 0;
    this.stats.truncated = 0;
    if (this.disposed) return;
    this.mark=0;this.sizeFactor=1;this.alphaFactor=1;
    this.side.set(1,0,0).applyQuaternion(camera.quaternion);
    this.forward.set(0,0,1).applyQuaternion(camera.quaternion);
    this.actionFrame = frame; this.presentation = this.atelier ? presentation : undefined;
    if (!this.atelier && frame && recipe) this.renderAction(frame, recipe, actors, positions, camera, quality, calm);
    this.flash = 0;
    if (statuses) {
      for (const actor of actors) {
        const position = positions.get(actor.id);
        const activeStatuses = statuses[actor.id];
        if (actor.hp <= 0 || !position || !activeStatuses) continue;
        for (const status of activeStatuses) {
          const id = typeof status === 'string' ? status : status.id;
          const look = this.atelier ? CARD_STATUS_LOOKS[id as StatusId] : LEGACY_CARD_STATUS_LOOKS[id];
          if (!look) continue;
          this.focus.copy(position);
          this.statusHeight=heights?.get(actor.id)??1.6;
          this.mark=this.atelier?(id==='scald'?1:'crown' in look&&look.crown?2:(id==='cozy'||id==='glaze')?3:4):0;
          if (this.atelier) this.focus.y += 'crown' in look && look.crown ? crowns?.get(actor.id) ?? (heights?.get(actor.id) ?? 1.6) + .18 : (heights?.get(actor.id) ?? 1.6) * .42;
          this.baseColor.set(look.color);
          this.accentColor.copy(this.baseColor);
          const phase = calm ? .5 : .5 + Math.sin(time * 2) * .22;
          const count = this.atelier && id === 'scald' ? Math.max(1,Math.min(5,typeof status === 'string' ? 1 : status.stacks)) : look.layer.count;
          for (let index = 0; index < count; index++) {
            this.place(look.layer, phase, index, count, camera, calm, this.atelier);
          }
        }
      }
    }
    this.mark=0;
    if (this.atelier && frame) {
      this.renderStatusBeats(frame, positions, camera, calm, heights);
      if (recipe) this.renderAction(frame, recipe, actors, positions, camera, quality, calm);
    }
    for (const { mesh, alpha, phase, flash, mark } of this.pools.values()) {
      if (!mesh.count) continue;
      mesh.visible = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
      alpha.needsUpdate = true;
      if(mark)mark.needsUpdate = true;
      if (phase) phase.needsUpdate = true;
      if (flash) flash.needsUpdate = true;
    }
  }

  private renderAction(frame: EffectFrame, recipe: CardEffectRecipe, actors: TurnActor[],
    positions: Map<string, T.Vector3>, camera: T.Camera, quality: Quality, calm: boolean) {
    const actor = actors.find(candidate => candidate.id === frame.plan.actorId);
    this.caster.copy(positions.get(frame.plan.actorId) ?? this.position.set(0, 0, 0));
    this.targets.length = 0; this.targetIds.length = 0;
    for (const id of frame.plan.targetIds) {
      const target = actors.find(candidate => candidate.id === id);
      const position = positions.get(id);
      const appropriateSide = recipe.target === 'friendly' ? target?.side === actor?.side : target?.side !== actor?.side;
      if (position && appropriateSide) { this.targets.push(position); this.targetIds.push(id); }
    }
    if (!this.targets.length) { this.targets.push(this.caster); this.targetIds.push(frame.plan.actorId); }
    const span = effectBeatSpans[frame.beat.kind];
    const progress = span[0] + (span[1] - span[0]) * frame.progress;
    // A brief visual accent fits inside the existing impact beat; no timing change.
    this.flash = !calm && progress > .525 && progress < .558 ? Math.sin((progress - .525) / .033 * Math.PI) : 0;
    this.look?.illuminate(recipe, progress, this.caster, this.targets, camera, calm);
    this.drawRecipe(recipe, progress, camera, quality, calm, true);
    if (isReadableBattle()) {
      // Existing pools, fixed action clock. The characteristic recipe stays on top.
      const gather = (frame.elapsed - frame.plan.beats[0]!.duration + 200) / 200;
      if (gather > 0 && gather < 1) {
        this.baseColor.set(recipe.color); this.accentColor.set(recipe.accent);
        this.focus.copy(this.caster);
        this.place(READABLE_GATHER, gather, 0, 1, camera, calm);
      }
      for (let i=0;i<(this.presentation ? this.targets.length : 1);i++) {
        const delay = this.presentation?.offsets.get(this.targetIds[i]!) ?? 0;
        const after = (frame.elapsed - frame.plan.beats[2]!.start - delay) / Math.min(500, frame.plan.duration-frame.plan.beats[2]!.start-delay);
        if (after > 0 && after < 1) {
          this.baseColor.set(recipe.accent);
          this.focus.copy(this.presentation ? this.targets[i]! : recipe.target === 'friendly' ? this.caster : this.targets[0]!);
          this.place(recipe.ultimate ? READABLE_IMPACT : READABLE_SMALL_IMPACT, after, 0, 1, camera, calm);
        }
      }
    }
    for (const id of frame.plan.presentationCues ?? []) {
      const cue = CARD_EFFECT_RECIPES[id] ?? LAB_EFFECT_RECIPES[id];
      if (cue) {
        const target = positions.get(frame.plan.presentationCueTargets?.[id] ?? '');
        if (target) { this.targets.length = 0; this.targets.push(target); }
        this.drawRecipe(cue, (progress - .65) / .35, camera, quality, calm);
      }
    }
  }

  private delayedProgress(frame:EffectFrame, delay:number) {
    const elapsed=frame.elapsed-delay;
    for (const beat of frame.plan.beats) {
      if (elapsed < beat.start+beat.duration && beat.duration>0) {
        const span=effectBeatSpans[beat.kind];
        return span[0]+(span[1]-span[0])*Math.max(0,(elapsed-beat.start)/beat.duration);
      }
    }
    return 1;
  }

  private renderStatusBeats(frame:EffectFrame, positions:Map<string,T.Vector3>, camera:T.Camera, calm:boolean, heights?:ReadonlyMap<string,number>) {
    if (!this.presentation) return;
    for (const beat of this.presentation.beats) {
      const progress=(frame.elapsed-beat.at)/beat.duration;
      if(progress<0||progress>=1)continue;
      const target=positions.get(beat.targetId),look=CARD_STATUS_LOOKS[beat.statusId];
      if(!target||!look)continue;
      this.focus.copy(target);
      this.caster.copy(positions.get(beat.sourceId)??target);
      this.baseColor.set(look.color);this.accentColor.copy(this.baseColor);this.flash=0;
      const layer=beat.kind==='burst'?CRUMB_BURST_LAYER:look[beat.kind];
      if(beat.kind!=='apply')this.focus.y+=(heights?.get(beat.targetId)??1.6)*.42;
      // Reduced motion keeps the identifying mark/badge, with no dart, flare or flash.
      if(calm)continue;
      for(let i=0;i<layer.count;i++)this.place(layer,progress,i,layer.count,camera,false);
    }
  }

  private drawRecipe(recipe: CardEffectRecipe, actionProgress: number,
    camera: T.Camera, quality: Quality, calm: boolean, stagger = false) {
    this.baseColor.set(recipe.color);
    this.accentColor.set(recipe.accent);
    for (const layer of recipe.layers) {
      const anchors = layer.anchor === 'all-targets' ? this.targets.length : 1;
      const density = quality === 'low' ? .5 : quality === 'medium' ? .8 : 1;
      const count = Math.max(1, Math.ceil(layer.count * density));
      for (let target = 0; target < anchors; target++) {
        const delay = stagger && layer.anchor !== 'caster' ? this.presentation?.offsets.get(this.targetIds[target]!) ?? 0 : 0;
        const localProgress = delay && this.actionFrame ? this.delayedProgress(this.actionFrame,delay) : actionProgress;
        const progress = (localProgress - layer.start) / (layer.end - layer.start);
        if (progress < 0 || progress > 1) continue;
        this.focus.copy(layer.anchor === 'caster' ? this.caster : this.targets[target]!);
        for (let index = 0; index < count; index++) {
          // Midnight service's lavender lanterns used to hide bodies throughout recovery.
          const burst = this.atelier && this.presentation?.bursts.includes(this.targetIds[target]!) && layer.primitive === 'lantern';
          const age = this.actionFrame ? this.actionFrame.elapsed-this.actionFrame.plan.beats[2]!.start-delay : 0;
          this.alphaFactor=burst ? .42*Math.max(.12,1-Math.max(0,age)/180) : 1;
          this.sizeFactor=burst ? .62 : 1;
          this.place(layer, progress, index, count, camera, calm);
          this.alphaFactor=1;this.sizeFactor=1;
        }
      }
    }
  }

  private place(layer: CardEffectLayer, progress: number, index: number, count: number,
    camera: T.Camera, calm: boolean, persistent = false) {
    const pool = this.pools.get(layer.primitive);
    if (!pool) return;
    const newPrimitive = pool.mesh.count === 0;
    if (this.stats.instances >= (this.atelier ? CARD_EFFECT_BUDGET.lookInstances : CARD_EFFECT_BUDGET.instances) || pool.mesh.count >= CARD_EFFECT_BUDGET.perPrimitive
      || newPrimitive && this.stats.primitiveCalls >= (this.atelier ? CARD_EFFECT_BUDGET.lookPrimitiveCalls : CARD_EFFECT_BUDGET.primitiveCalls)) {
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
    if(persistent && this.mark===1){
      // Alternate shoulders/sides in camera space. No flame is behind the torso;
      // each additional stack adds a distinct lower flame on the next side.
      const side=index%2===0?-1:1, row=Math.floor(index/2);
      this.position.copy(this.focus).addScaledVector(this.side,side*this.statusHeight*(.33+row*.07));
      this.position.y+=this.statusHeight*(.16-row*.20);
      this.position.addScaledVector(this.forward,this.statusHeight*.34);
      size=layer.size*(this.statusHeight/1.6);
      spin=0;
    }else if(persistent && this.mark===2){
      this.position.y=this.focus.y;
    }else if(persistent && this.mark===3){
      this.position.addScaledVector(this.forward,this.statusHeight*.22);
      size*=this.statusHeight/1.6;
    }
    size*=this.sizeFactor;
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
    const fade = persistent ? 1 : Math.min(1, phase * 12) * Math.min(1, (1 - phase) * 5);
    pool.alpha.setX(instance, fade * layer.opacity * this.alphaFactor);
    pool.phase?.setX(instance, phase);
    pool.mark?.setX(instance, this.mark);
    pool.flash?.setX(instance, this.flash);
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
    this.look?.dispose();
  }
}
