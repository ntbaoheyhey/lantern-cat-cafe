import { fullRecipes, fullEnemyRecipes } from './look-full-recipes';
import { isLookArtV3 } from './look-art';
import { artEffectRecipes, artLightBeatProgress } from './look-art-effects';
import { showBodyMark } from './card-status-priority';
import { CARD_STATUS_LOOKS, CRUMB_BURST_LAYER, V5_CUE_LAYERS } from './card-status-looks';
import type { ReactionBeat, LandingBeat } from './card-v5-events';
import type { StatusPresentation } from './card-status-beats';
import type { VisualStatusId } from './card-status-data';
import { lookWarmQueue } from './look-warm-queue';
import { loadingFrame } from './loading';
import { isReadableBattle } from './look-b2';
import { LookVfx } from './look-vfx';
import { LAB_EFFECT_RECIPES } from './card-lab-effects';
import * as T from 'three';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectFrame } from './effects';
import type { Quality } from './post';
import { CARD_EFFECT_RECIPES, LEGACY_CARD_STATUS_LOOKS, type CardEffectLayer, type CardEffectRecipe } from './card-effect-data';
import { LOOK_PARTICLE_PRIMITIVES, CARD_EFFECT_PRIMITIVES, createCardPrimitive, type CardEffectPrimitive } from './card-effect-primitives';

export const FULL_VFX_CATS:readonly string[]=['soot','velvet','cinnamon','sorrel','inkcap','brioche','panko','mallow','clover','marigold','mochi','biscuit']; // batches enabled after individual review
const FULL_RECIPES=fullEnemyRecipes(fullRecipes(CARD_EFFECT_RECIPES,FULL_VFX_CATS));
const ART_RECIPES=artEffectRecipes(FULL_RECIPES);
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
const NO_REACTIONS:readonly ReactionBeat[]=[];
const NO_LANDINGS:readonly LandingBeat[]=[];
const NO_CUES:readonly string[]=[];
const nextTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));
const ease = (value: number) => value * value * (3 - 2 * value);
const effectBeatSpans = {
  anticipation: [0, .34], travel: [.34, .52], impact: [.52, .60],
  reaction: [.60, .82], residue: [.82, 1],
} as const;

export function cardRecipeFor(frame: EffectFrame | null, actors: TurnActor[]): CardEffectRecipe | undefined {
  if (!frame) return;
  const recipes=isReadableBattle()?(isLookArtV3()?ART_RECIPES:FULL_RECIPES):CARD_EFFECT_RECIPES;
  const skill = recipes[frame.plan.presentationId ?? frame.plan.skillId];
  if (skill) return skill;
  const actor = actors.find(candidate => candidate.id === frame.plan.actorId);
  return actor?.side === 'enemy' ? recipes[`enemy:${actor.cardRpg?.cardId}`] : undefined;
}

interface PrimitivePool {
  mesh: T.InstancedMesh<T.BufferGeometry, T.ShaderMaterial>;
  alpha: T.InstancedBufferAttribute;
  phase?: T.InstancedBufferAttribute;
  flash?: T.InstancedBufferAttribute;
  mark?: T.InstancedBufferAttribute;
  tile?: T.InstancedBufferAttribute;
}

/** Pooled geometry compositions. No geometry/material/particle creation during playback. */
export class CardEffects {
  readonly root = new T.Group();
  readonly recipes:Record<string,CardEffectRecipe>;
  readonly ready: Promise<void>;
  readonly stats = { instances: 0, primitiveCalls: 0, truncated: 0 };
  readonly protectedHeadTops = new Float32Array(CARD_EFFECT_BUDGET.protectedFaces);
  readonly protectedFaces = Array.from({ length: CARD_EFFECT_BUDGET.protectedFaces }, () => new T.Vector4());
  private material: T.ShaderMaterial;
  private pools = new Map<CardEffectPrimitive, PrimitivePool>();
  private poolList:PrimitivePool[]=[];
  private disposed = false;
  private deferred:PrimitivePool[]=[];
  private deferredRenderer?:T.WebGLRenderer;
  private deferredCamera?:T.Camera;
  private warmed=new Set<PrimitivePool>();
  private compiled=new Set<T.Material>();
  private deferScene=new T.Scene();
  private deferredTarget=new T.WebGLRenderTarget(1,1);
  private deferredViewport=new T.Vector4();
  private look?: LookVfx;
  private flash = 0;
  private mark = 0;
  private statusHeight = 1.6;
  private side = new T.Vector3();
  private forward = new T.Vector3();
  private playbackSpeed=1;
  private sizeFactor = 1;
  private alphaFactor = 1;
  private position = new T.Vector3();
  private lifeColor=new T.Color();
  private caster = new T.Vector3();
  private propOrigin?: T.Vector3;
  private emissionOrigin?: T.Vector3;
  private casterVelocity=new T.Vector3();
  private previousCaster=new T.Vector3();
  private previousElapsed=-1;
  private previousPlan:EffectFrame['plan']|null=null;
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
  private colorCache = new Map<string,T.Color>();

  private setColor(target:T.Color,value:string) {
    const cached=this.colorCache.get(value);
    if(cached)target.copy(cached);else target.set(value);
  }

  constructor(private scene: T.Scene, private atelier = false) {
    this.recipes=atelier?(isLookArtV3()?ART_RECIPES:FULL_RECIPES):CARD_EFFECT_RECIPES;
    if(atelier){
      // Parse CSS colours once while preparing, never on a warmed cast path.
      for(const recipe of [...Object.values(this.recipes),...Object.values(LAB_EFFECT_RECIPES)]){
        this.colorCache.set(recipe.color,new T.Color(recipe.color));
        this.colorCache.set(recipe.accent,new T.Color(recipe.accent));
      }
      for(const look of Object.values(CARD_STATUS_LOOKS))this.colorCache.set(look.color,new T.Color(look.color));
      for(const value of ['#e6c392','#d9616b','#efaa73'])this.colorCache.set(value,new T.Color(value));
    }
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
    if(this.atelier) {
      if(isLookArtV3())await lookWarmQueue.enqueue('geometry:painted-light',()=>this.createPool('painted-light'),()=>this.disposed);
      await Promise.all([...CARD_EFFECT_PRIMITIVES,...LOOK_PARTICLE_PRIMITIVES].map(primitive =>
        lookWarmQueue.enqueue(`geometry:${primitive}`,()=>this.createPool(primitive),()=>this.disposed)));
    } else for(const primitive of CARD_EFFECT_PRIMITIVES) {
      await nextTask();if(this.disposed)return;this.createPool(primitive);
    }
  }

  private createPool(primitive:CardEffectPrimitive) {
      const base = createCardPrimitive(primitive);
      const geometry = this.look?.geometry(base, primitive) ?? base;
      const phase = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      const flash = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      if (flash) {flash.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectFlash', flash);}
      if (phase) {phase.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectPhase', phase);}
      const mark = this.look ? new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive), 1) : undefined;
      if(mark){mark.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectMark',mark);}
      const tile=this.look?new T.InstancedBufferAttribute(new Float32Array(CARD_EFFECT_BUDGET.perPrimitive).fill(-1),1):undefined;
      if(tile){tile.setUsage(T.DynamicDrawUsage);geometry.setAttribute('effectTile',tile);}
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
      const pool={ mesh, alpha, phase, flash, mark, tile };
      this.pools.set(primitive,pool);this.poolList.push(pool);
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
      const essentials=new Set(Object.values(CARD_STATUS_LOOKS).flatMap(s=>[s.layer.primitive,s.apply.primitive,s.tick.primitive]));
      essentials.add('knock-ring');
      if(isLookArtV3())essentials.add('painted-light');
      for (const pool of this.poolList) {
        const { mesh, alpha, phase, flash, mark }=pool;
        if(this.atelier&&!essentials.has(mesh.name as CardEffectPrimitive)){
          this.deferred.push(pool);continue;
        }
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
          const start = performance.now();
          await renderer.compileAsync(this.atelier ? mesh : scene, camera, scene);
          if (this.atelier) performance.measure(`look-prewarm:pool:${mesh.name}`, { start });
          if (this.disposed) break;
          renderer.render(scene, camera);
          await (this.atelier ? loadingFrame() : nextTask());
        }
        this.warmed.add(pool);this.compiled.add(mesh.material);
        mesh.visible = false;
        mesh.count = 0;
        await (this.atelier ? loadingFrame() : nextTask());
      }
      if(this.atelier)for(const {mesh} of this.deferred){
        if(this.compiled.has(mesh.material))continue;
        for(const destination of [target,null]){
          renderer.setRenderTarget(destination);
          await renderer.compileAsync(mesh,camera,scene);
          await loadingFrame();if(this.disposed)return;
        }
        this.compiled.add(mesh.material);
      }
      this.deferredRenderer=renderer;this.deferredCamera=camera;
    } finally {
      renderer.setRenderTarget(previous);
      target.dispose();
      this.root.removeFromParent();
      if (parent && !this.disposed) parent.add(this.root);
    }
  }

  /** Optional reaction/shape and gallery geometry uploads run after Ready.
   * Shared family shaders, statuses and stagger impacts are already warm. */
  warmDeferred(){
    for(const pool of this.deferred)void lookWarmQueue.enqueue(`deferred:${pool.mesh.name}`,()=>this.warmOne(pool),()=>this.disposed).catch(()=>undefined);
  }
  private warmOne(pool:PrimitivePool){
    if(this.warmed.has(pool)||this.disposed||!this.deferredRenderer||!this.deferredCamera)return;
    const renderer=this.deferredRenderer,mesh=pool.mesh,parent=mesh.parent;
    const target=renderer.getRenderTarget(),viewport=renderer.getViewport(this.deferredViewport);
    const count=mesh.count,visible=mesh.visible;
    // Empty pools contain no live instances. First-use fallback runs before
    // the first instance is written, so its scratch matrix cannot erase a hit.
    this.deferScene.add(mesh);mesh.visible=true;mesh.count=1;
    this.transform.position.set(0,0,0);this.transform.rotation.set(0,0,0);this.transform.scale.setScalar(1);this.transform.updateMatrix();
    mesh.setMatrixAt(0,this.transform.matrix);mesh.instanceMatrix.needsUpdate=true;
    pool.alpha.setX(0,0);pool.alpha.needsUpdate=true;
    try{renderer.setRenderTarget(this.deferredTarget);renderer.setViewport(0,0,1,1);renderer.render(this.deferScene,this.deferredCamera);this.warmed.add(pool);}
    finally{mesh.count=count;mesh.visible=visible;if(parent)parent.add(mesh);renderer.setRenderTarget(target);renderer.setViewport(viewport);}
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
    presentation?: StatusPresentation, heights?: ReadonlyMap<string,number>, crowns?: ReadonlyMap<string,number>, playbackSpeed=1, propOrigin?:T.Vector3) {
    this.propOrigin=propOrigin;this.emissionOrigin=undefined;
    for (let i=0;i<this.poolList.length;i++) { const mesh=this.poolList[i]!.mesh;mesh.count = 0; mesh.visible = false; }
    this.look?.begin();this.flash = 0;
    this.stats.instances = 0;
    this.stats.primitiveCalls = 0;
    this.stats.truncated = 0;
    if (this.disposed) return;
    this.playbackSpeed=Math.max(1,playbackSpeed);
    this.mark=0;this.sizeFactor=1;this.alphaFactor=1;
    this.side.set(1,0,0).applyQuaternion(camera.quaternion);
    this.forward.set(0,0,1).applyQuaternion(camera.quaternion);
    this.actionFrame = frame; this.presentation = this.atelier ? presentation : undefined;
    if (!this.atelier && frame && recipe) this.renderAction(frame, recipe, actors, positions, camera, quality, calm);
    this.flash = 0;
    if (statuses) {
      for (let actorIndex=0;actorIndex<actors.length;actorIndex++) {
        const actor=actors[actorIndex]!;
        const position = positions.get(actor.id);
        const activeStatuses = statuses[actor.id];
        if (actor.hp <= 0 || !position || !activeStatuses) continue;
        for (let statusIndex=0;statusIndex<activeStatuses.length;statusIndex++) {
          if(this.atelier&&!showBodyMark(activeStatuses,statusIndex))continue;
          const status=activeStatuses[statusIndex]!;
          const id = typeof status === 'string' ? status : status.id;
          const look = this.atelier ? CARD_STATUS_LOOKS[id as VisualStatusId] : LEGACY_CARD_STATUS_LOOKS[id];
          if (!look) continue;
          this.focus.copy(position);
          this.statusHeight=heights?.get(actor.id)??1.6;
          this.mark=this.atelier?(id==='scald'?1:'crown' in look&&look.crown?2:(id==='cozy'||id==='glaze')?3:id==='snag'?5:4):0;
          if (this.atelier && id!=='bitter') this.focus.y += 'crown' in look && look.crown ? crowns?.get(actor.id) ?? (heights?.get(actor.id) ?? 1.6) + .18 : (heights?.get(actor.id) ?? 1.6) * .42;
          this.setColor(this.baseColor,look.color);
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
      this.renderV5Cues(frame, positions, camera, calm, heights);
      if (recipe) this.renderAction(frame, recipe, actors, positions, camera, quality, calm);
    }
    for (let i=0;i<this.poolList.length;i++) {
      const {mesh,alpha,phase,flash,mark,tile}=this.poolList[i]!;
      if (!mesh.count) continue;
      mesh.visible = true;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor!.needsUpdate = true;
      alpha.needsUpdate = true;
      if(mark)mark.needsUpdate = true;
      if(tile)tile.needsUpdate=true;
      if (phase) phase.needsUpdate = true;
      if (flash) flash.needsUpdate = true;
    }
  }

  private renderAction(frame: EffectFrame, recipe: CardEffectRecipe, actors: TurnActor[],
    positions: Map<string, T.Vector3>, camera: T.Camera, quality: Quality, calm: boolean) {
    let actor:TurnActor|undefined;for(let i=0;i<actors.length;i++)if(actors[i]!.id===frame.plan.actorId){actor=actors[i];break;}
    this.caster.copy(positions.get(frame.plan.actorId) ?? this.position.set(0, 0, 0));
    if(this.atelier&&frame.plan===this.previousPlan&&frame.elapsed>this.previousElapsed){this.casterVelocity.copy(this.caster).sub(this.previousCaster).multiplyScalar(1000/(frame.elapsed-this.previousElapsed));this.casterVelocity.clampLength(0,3);}else this.casterVelocity.set(0,0,0);
    this.previousCaster.copy(this.caster);this.previousElapsed=frame.elapsed;this.previousPlan=frame.plan;
    let targetCount=0;
    for (let targetIndex=0;targetIndex<frame.plan.targetIds.length;targetIndex++) {
      const id=frame.plan.targetIds[targetIndex]!;
      let target:TurnActor|undefined;for(let i=0;i<actors.length;i++)if(actors[i]!.id===id){target=actors[i];break;}
      const position = positions.get(id);
      const appropriateSide = recipe.target === 'friendly' ? target?.side === actor?.side : target?.side !== actor?.side;
      if (position && appropriateSide) { this.targets[targetCount]=position;this.targetIds[targetCount++]=id; }
    }
    if (!targetCount) { this.targets[0]=this.caster;this.targetIds[0]=frame.plan.actorId;targetCount=1; }
    this.targets.length=targetCount;this.targetIds.length=targetCount;
    const span = effectBeatSpans[frame.beat.kind];
    const cueProgress=this.atelier&&recipe.ultimate&&frame.beat.kind==='anticipation'?Math.max(0,1-(frame.beat.duration-frame.elapsed)/200):isLookArtV3()&&recipe.layers[0]?.primitive==='painted-light'?artLightBeatProgress(frame):frame.progress;
    const progress = span[0] + (span[1] - span[0]) * cueProgress;
    // A brief visual accent fits inside the existing impact beat; no timing change.
    this.flash = !calm && progress > .525 && progress < .558 ? Math.sin((progress - .525) / .033 * Math.PI) : 0;
    this.setColor(this.baseColor,recipe.color);this.setColor(this.accentColor,recipe.accent);
    this.look?.illuminate(recipe, progress, this.caster, this.targets, camera, calm, this.baseColor, this.accentColor);
    this.drawRecipe(recipe, progress, camera, quality, calm, true);
    if (isReadableBattle()) {
      // Existing pools, fixed action clock. The characteristic recipe stays on top.
      const gather = (frame.elapsed - frame.plan.beats[0]!.duration + 200) / 200;
      if (gather > 0 && gather < 1) {
        this.setColor(this.baseColor,recipe.color); this.setColor(this.accentColor,recipe.accent);
        this.focus.copy(this.caster);
        this.place(READABLE_GATHER, gather, 0, 1, camera, calm);
      }
      for (let i=0;i<(this.presentation ? this.targets.length : 1);i++) {
        const delay = this.presentation?.offsets.get(this.targetIds[i]!) ?? 0;
        const after = (frame.elapsed - frame.plan.beats[2]!.start - delay) / Math.min(500, frame.plan.duration-frame.plan.beats[2]!.start-delay);
        if (after > 0 && after < 1 && !recipe.authored) {
          this.setColor(this.baseColor,recipe.accent);
          this.focus.copy(this.presentation ? this.targets[i]! : recipe.target === 'friendly' ? this.caster : this.targets[0]!);
          this.place(recipe.ultimate ? READABLE_IMPACT : READABLE_SMALL_IMPACT, after, 0, 1, camera, calm);
        }
      }
    }
    const cues=frame.plan.presentationCues??NO_CUES;
    for (let cueIndex=0;cueIndex<cues.length;cueIndex++) {
      const id=cues[cueIndex]!;
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
    for (let i=0;i<frame.plan.beats.length;i++) {
      const beat=frame.plan.beats[i]!;
      if (elapsed < beat.start+beat.duration && beat.duration>0) {
        const span=effectBeatSpans[beat.kind];
        return span[0]+(span[1]-span[0])*Math.max(0,(elapsed-beat.start)/beat.duration);
      }
    }
    return 1;
  }

  private renderStatusBeats(frame:EffectFrame, positions:Map<string,T.Vector3>, camera:T.Camera, calm:boolean, heights?:ReadonlyMap<string,number>) {
    if (!this.presentation) return;
    for (let i=0;i<this.presentation.beats.length;i++) {
      const beat=this.presentation.beats[i]!;
      const progress=(frame.elapsed-beat.at)/beat.duration;
      if(progress<0||progress>=1)continue;
      const target=positions.get(beat.targetId),look=CARD_STATUS_LOOKS[beat.statusId];
      if(!target||!look)continue;
      this.focus.copy(target);
      this.caster.copy(positions.get(beat.sourceId)??target);
      this.setColor(this.baseColor,look.color);this.accentColor.copy(this.baseColor);this.flash=0;
      const layer=beat.kind==='burst'?CRUMB_BURST_LAYER:look[beat.kind==='trigger'?'tick':beat.kind];
      if(beat.kind!=='apply')this.focus.y+=(heights?.get(beat.targetId)??1.6)*.42;
      // Reduced motion keeps the identifying mark/badge, with no dart, flare or flash.
      if(calm)continue;
      for(let i=0;i<layer.count;i++)this.place(layer,progress,i,layer.count,camera,false);
    }
  }

  private renderV5Cues(frame:EffectFrame, positions:Map<string,T.Vector3>, camera:T.Camera, calm:boolean, heights?:ReadonlyMap<string,number>) {
    if(calm||!this.presentation)return;
    const reactions=this.presentation.reactions??NO_REACTIONS;
    for(let reactionIndex=0;reactionIndex<reactions.length;reactionIndex++){
      const reaction=reactions[reactionIndex]!;
      const progress=(frame.elapsed-reaction.at)/reaction.duration;
      if(progress<0||progress>=1)continue;
      const primer=positions.get(reaction.targetId);if(!primer)continue;
      this.focus.copy(primer);this.focus.y+=(heights?.get(reaction.targetId)??1.6)*.35;
      this.caster.copy(this.focus);this.flash=0;
      if(reaction.id==='crumb-burst'){
        this.setColor(this.baseColor,'#e6c392');this.accentColor.copy(this.baseColor);
        for(let i=0;i<CRUMB_BURST_LAYER.count;i++)this.place(CRUMB_BURST_LAYER,progress,i,CRUMB_BURST_LAYER.count,camera,false);
      }else if(reaction.id==='rupture'){
        this.setColor(this.baseColor,'#d9616b');this.accentColor.copy(this.baseColor);
        if(progress<.24){
          for(let i=0;i<2;i++)this.place(V5_CUE_LAYERS.tension,progress/.24,i,2,camera,false);
        }else{
          const snap=(progress-.24)/.76;
          this.alphaFactor=1-snap*.72;
          for(let i=0;i<2;i++)this.place(V5_CUE_LAYERS.thread,snap,i,2,camera,false);
          for(let i=0;i<4;i++)this.place(V5_CUE_LAYERS.consumed,1-snap,i,4,camera,false);
        }
      }else for(let targetIndex=0;targetIndex<reaction.targets.length;targetIndex++){
        const id=reaction.targets[targetIndex]!,target=positions.get(id);if(!target)continue;
        const travel=Math.min(1,(progress-targetIndex*.10)/.78);if(travel<0)continue;
        this.focus.copy(target);this.focus.y+=(heights?.get(id)??1.6)*.32;
        if(reaction.id==='wildfire'){
          // Low fire fronts cross the distance; a hot spark follows each front.
          this.setColor(this.baseColor,'#efaa73');this.accentColor.copy(this.baseColor);
          for(let i=0;i<3;i++){
            const front=Math.max(0,travel-i*.08);
            this.place(V5_CUE_LAYERS.fire,front,i,3,camera,false);
            this.place(V5_CUE_LAYERS.ember,Math.max(0,front-.10),i,3,camera,false);
          }
        }else for(let statusIndex=0;statusIndex<reaction.primerIds.length;statusIndex++){
          const look=CARD_STATUS_LOOKS[reaction.primerIds[statusIndex]!];if(!look)continue;
          const flight=Math.min(1,Math.max(0,travel-statusIndex*.06));
          this.setColor(this.baseColor,look.color);this.accentColor.copy(this.baseColor);
          this.place(look.flight,flight,0,1,camera,false);
        }
      }
      this.alphaFactor=1;
    }
    const landings=this.presentation.landings??NO_LANDINGS;
    for(let landingIndex=0;landingIndex<landings.length;landingIndex++){
      const landing=landings[landingIndex]!;
      const target=positions.get(landing.targetId),from=positions.get(landing.fromId);if(!target)continue;
      const progress=(frame.elapsed-landing.at)/landing.duration;
      this.focus.copy(target);this.caster.copy(from??target);this.setColor(this.baseColor,frame.plan.accent);this.accentColor.copy(this.baseColor);
      if(landing.shape==='bounce'){
        const travel=(frame.elapsed-landing.at+70)/70;
        if(travel>=0&&travel<1){this.focus.y+=.55;this.caster.y+=.55;this.place(V5_CUE_LAYERS.arc,travel,0,1,camera,false);this.focus.copy(target);}
      }
      if(progress<0||progress>=1)continue;
      this.sizeFactor=landing.scale;
      if(landing.shape==='multi-hit'){
        this.focus.y+=(heights?.get(landing.targetId)??1.6)*.35;
        for(let i=0;i<2;i++)this.place(V5_CUE_LAYERS.strike,progress,i,2,camera,false);
      }else this.place(V5_CUE_LAYERS.splash,progress,0,1,camera,false);
      this.sizeFactor=1;
    }
  }

  private drawRecipe(recipe: CardEffectRecipe, actionProgress: number,
    camera: T.Camera, quality: Quality, calm: boolean, stagger = false) {
    this.setColor(this.baseColor,recipe.color);
    this.setColor(this.accentColor,recipe.accent);
    const density = quality === 'low' ? .5 : quality === 'medium' ? .8 : 1;
    const emitterDensity=1/Math.sqrt(this.playbackSpeed);
    for (let layerIndex=0;layerIndex<recipe.layers.length;layerIndex++) {
      const layer=recipe.layers[layerIndex]!;
      const shape=this.presentation?.landings?.[0]?.shape;
      if(stagger&&!recipe.authored&&(shape==='splash'||shape==='multi-hit'||shape==='bounce')&&layer.anchor!=='caster')continue;
      const landings=stagger&&recipe.authored&&layer.anchor!=='caster'?this.presentation?.landings:undefined;
      const anchors = landings?.length || (layer.anchor === 'all-targets' ? this.targets.length : 1);
      const count = Math.max(1, Math.ceil(layer.count * density * (layer.emitter?emitterDensity:1)));
      for (let target = 0; target < anchors; target++) {
        const landing=landings?.[target];
        const targetIndex=landing?this.targetIds.indexOf(landing.targetId):target;
        if(targetIndex<0)continue;
        const delay=landing&&this.actionFrame?landing.at-this.actionFrame.plan.beats[2]!.start:stagger&&layer.anchor!=='caster'?this.presentation?.offsets.get(this.targetIds[targetIndex]!)??0:0;
        const localProgress = delay && this.actionFrame ? this.delayedProgress(this.actionFrame,delay) : actionProgress;
        const progress = (localProgress - layer.start) / (layer.end - layer.start);
        if (progress < 0 || progress > 1) continue;
        this.focus.copy(layer.anchor === 'caster' ? this.caster : this.targets[targetIndex]!);
        this.emissionOrigin=layer.propOrigin?this.propOrigin:undefined;
        if(layer.anchor==='caster'&&this.emissionOrigin)this.focus.copy(this.emissionOrigin);
        // The envelope is shared by this target's particles, not recomputed per instance.
        const burst = this.atelier && this.presentation?.bursts.includes(this.targetIds[target]!) && layer.primitive === 'lantern';
        const age = this.actionFrame ? this.actionFrame.elapsed-this.actionFrame.plan.beats[2]!.start-delay : 0;
        this.alphaFactor=burst ? .42*Math.max(.12,1-Math.max(0,age)/180) : 1;
        this.sizeFactor=burst ? .62 : landing?.scale??1;
        for (let index = 0; index < count; index++) this.place(layer, progress, index, count, camera, calm);
        this.alphaFactor=1;this.sizeFactor=1;
        this.emissionOrigin=undefined;
      }
    }
  }

  private place(layer: CardEffectLayer, progress: number, index: number, count: number,
    camera: T.Camera, calm: boolean, persistent = false) {
    const pool = this.pools.get(layer.primitive);
    if(pool&&this.atelier&&!this.warmed.has(pool)&&this.deferredRenderer){
      const start=performance.now();this.warmOne(pool);
      performance.measure(`look-prewarm:first-use:${layer.primitive}`,{start});
    }
    if (!pool) return;
    const newPrimitive = pool.mesh.count === 0;
    if (this.stats.instances >= (this.atelier ? CARD_EFFECT_BUDGET.lookInstances : CARD_EFFECT_BUDGET.instances) || pool.mesh.count >= CARD_EFFECT_BUDGET.perPrimitive
      || newPrimitive && this.stats.primitiveCalls >= (this.atelier ? CARD_EFFECT_BUDGET.lookPrimitiveCalls : CARD_EFFECT_BUDGET.primitiveCalls)) {
      this.stats.truncated++;
      return;
    }
    const offset = count > 1 ? index / (count - 1) : .5;
    let phase = Math.max(0, Math.min(1, progress * 1.16 - offset * .16));
    if(layer.emitter&&calm)phase=.45;
    else if(layer.emitter){const start=layer.emitter.mode==='rate'?offset*.55:offset*.08;phase=(progress-start)/layer.emitter.life;if(phase<0||phase>=1)return;}
    const travel = ease(phase);
    const angle = index * 2.399963 + (calm ? 0 : travel * layer.turns * Math.PI * 2);
    const radius = layer.spread;
    const height = layer.height;
    let size = layer.size;
    let spin = 0;
    this.position.copy(this.focus);
    this.position.y += height;
    switch (layer.motion) {
      case 'emit': {
        const emitter=layer.emitter;if(!emitter)return;
        const vx=Math.cos(angle)*emitter.velocity[0],vz=Math.sin(angle)*emitter.velocity[2];
        this.position.x+=vx*phase+Math.sin(phase*7+index)*emitter.curl*phase+this.casterVelocity.x*phase*emitter.inherit;
        this.position.z+=vz*phase+Math.cos(phase*5+index)*emitter.curl*phase+this.casterVelocity.z*phase*emitter.inherit;
        this.position.y+=emitter.velocity[1]*phase+.5*emitter.gravity*phase*phase;
        size*=Math.sin(Math.min(1,phase*5)*Math.PI/2)*(1-phase*.75);spin=angle+phase*layer.turns;break;
      }
      case 'hold':
        size *= .85 + .15 * ease(Math.min(1, phase * 5));
        break;
      case 'pulse':
        size *= .75 + .25 * Math.sin(phase * Math.PI);
        break;
      case 'shrink':
        size*=1.25-travel*.95;break;
      case 'expand':
        size *= .45 + travel * .9;
        this.position.x += Math.cos(angle) * radius * (count > 1 ? .4 : 0);
        this.position.z += Math.sin(angle) * radius * (count > 1 ? .4 : 0);
        break;
      case 'projectile':
        this.position.lerpVectors(this.emissionOrigin??this.caster, this.focus, travel);
        this.position.y += height*(this.emissionOrigin ? travel : 1) + Math.sin(phase * Math.PI) * (calm ? .1 : this.emissionOrigin ? .12 : .4);
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
    if(persistent && this.mark===5){
      this.position.copy(this.focus).addScaledVector(this.side,(index-1)*this.statusHeight*.15);
      this.position.addScaledVector(this.forward,this.statusHeight*.38);
      this.position.y+=this.statusHeight*.03;spin=-.65;size*=this.statusHeight/1.6;
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
    pool.mesh.setColorAt(instance, layer.emitter?this.lifeColor.copy(this.accentColor).lerp(this.baseColor,phase*phase):layer.accent ? this.accentColor : this.baseColor);
    const fade = persistent ? 1 : Math.min(1, phase * 12) * Math.min(1, (1 - phase) * 5);
    pool.alpha.setX(instance, fade * layer.opacity * this.alphaFactor);
    pool.phase?.setX(instance, phase);
    pool.mark?.setX(instance, this.mark);
    pool.tile?.setX(instance,layer.spriteRow??-1);
    pool.flash?.setX(instance, this.flash);
    this.stats.instances++;
  }

  dispose() {
    this.disposed = true;this.deferredTarget.dispose();
    this.root.removeFromParent();
    for (const { mesh } of this.poolList) {
      mesh.geometry.dispose();
      mesh.dispose();
    }
    this.pools.clear();
    this.material.dispose();
    this.look?.dispose();
  }
}
