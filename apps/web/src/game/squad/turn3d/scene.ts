import { CardEnemyExpression } from './card-enemy-expression';
import { CardBossAtmosphere, BOSS_STYLES, bossPerformance } from './card-boss-performance';
/** Presentation only: projected snapshots and effect frames in, pixels/anchors out. */
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectFrame } from './effects';
import {SpellVfx} from './vfx';
import {EFFECT_DIRECTION} from './effect-direction';
import {CafePost,type Quality} from './post';
import type { LookPost } from './look-post';
import {stageTexture,prepareStageTexture} from './surfaces';
import {layoutLabels,intersects,type LabelInput} from './label-layout';
import {GearAttachments,GearResources} from './gear-visuals';
import type {ActorAppearance} from './appearance';
import { loadModel } from './assets';
import {screenBounds,auditBounds} from './scene-audit';
import {SKILL_MOTION,clipProgress,movementProgress} from './choreography';
import {formationPoint,figureScale,restYaw,targetYaw,blendYaw,stageHeight} from './formation';
import { CardFace, cardExpression } from './card-face';
import { groundCardContact, cardShieldGeometry } from './card-contact';
import { applyCardLighting } from './card-lighting';
import { CardSurfaces } from './card-surfaces';
import { CardEffects, cardRecipeFor } from './card-effects';
import { createCardClips, cardIdleFrame, cardTravelFraction, cardHitClip, cardSkillMotion } from './card-motion';
import { cardBodyYaw, cardFormation, cardFrameHeight, focusCardHead } from './card-staging';
import { loadingFrame, warmScene } from './loading';
import { CardUtensil } from './card-utensils';
import { isLookV2 } from './look-v2';
import { cardEntrancePose } from './card-entrance';

export interface SceneView {
  decorateStage?: (stage: T.Group, cancelled?: () => boolean) => void | Promise<void>;
  animateStage?: (stage: T.Group, time: number, reducedMotion: boolean) => void;
  autoBattle?: boolean;
  tableau?: boolean;
  effectOnly?: boolean;
  cardStatuses?: Record<string, readonly string[]>;
  rows?: Record<string, string>;
  chapter?: number;
  models?: Record<string,string>; warmModelIds?: string[];
  appearance?:ActorAppearance; actors: TurnActor[]; currentId: string | null; frame: EffectFrame | null;
  targetIds: string[]; legalIds: string[]; reducedMotion: boolean; paused: boolean; suspended?: boolean;
  bossPhases?: Record<string, number>;
  boss: boolean; model?: { role: TurnActor['role']; clip: string; angle: number };
  modelProgress?:number; quality?:Quality; autoQuality?:boolean; fixedTime?: number; camera?: 'wide' | 'close' | 'overhead' | 'far';
}
export interface Anchor { id: string; x: number; y: number; labelX: number; labelY: number; footY: number; visible: boolean }
interface Puppet { bossPhase:number; phaseAt:number; enteredAt:number; utensil?:CardUtensil; face?:CardFace|CardEnemyExpression; head?:T.Object3D; headRest:T.Quaternion; headPose:T.Quaternion; gaze:{yaw:number;pitch:number}; asset:string; height:number; baseColors:T.Color[]; gear:GearAttachments; root: T.Group; model: T.Group; mixer: T.AnimationMixer; actions: Map<string,T.AnimationAction>; clip: string; base: T.Vector3; shadow: T.Mesh; role: string; materials: T.Material[]; guard:T.Mesh; snare:T.Group }
const GOLD = '#f5cb7b', VIOLET = '#c3a4ff', TEAL = '#8adcc2';
const roleColor = (role: string) => role === 'guardian' ? GOLD : role === 'witch' ? VIOLET : role === 'alchemist' ? TEAL : '#f1a295';
const ease = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const lerp = T.MathUtils.lerp;
const point=(a:TurnActor,boss:boolean)=>{const p=formationPoint(a,boss);return new T.Vector3(p.x,p.y,p.z)};

export class TurnScene {
  private cardSurfaces?: CardSurfaces;
  private cardEffects?: CardEffects;
  readonly loading = { completed: 0, total: 5, label: 'Preparing the cafe' };
  private facePoint = new T.Vector3();
  private faceEdge = new T.Vector3();
  ready=false;
  readonly renderer: T.WebGLRenderer;
  readonly scene = new T.Scene();
  private effectPreview = new T.Scene();
  readonly camera = new T.PerspectiveCamera(32,1,.1,80);
  readonly stats = { frames: 0, calls: 0, triangles: 0, geometries: 0, textures: 0, particles: 0, estimatedGpuBytes: 0, loaded: 0, hiddenFrames: 0,quality:'high' as Quality };
  readonly labelAudit:{heads:LabelInput['head'][];cards:LabelInput['head'][];missing:string[];overlaps:number}={heads:[],cards:[],missing:[],overlaps:0};
  private positions=new Map<string,T.Vector3>();private scratch=new T.Vector3();private zero=new T.Vector3();private labelsAt=0;
  private puppets = new Map<string,Puppet>();
  private gearResources = new GearResources();
  private pending = new Set<string>();
  private disposed = false;
  private warming: Promise<void>;
  private raf = 0;
  private last = 0;
  private renderAt = 0;
  private dirty = true;
  private time = 0;
  private litChapter = 0;
  private entrance?: { asset: string; startedAt: number };
  private width = 1;
  private height = 1;
  private resize: ResizeObserver;
  private ray = new T.Raycaster();
  private glow!: T.Texture;
  private contactTexture?: T.Texture;
  private stageTextures:T.Texture[]=[];private lookEnvironment?:T.WebGLRenderTarget;
  private post!:CafePost | LookPost;
  private spells!:SpellVfx;
  private activeRing!: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>;
  private targetRings: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>[] = [];
  private aura!: T.PointLight;
  private targetLines:T.Line<T.BufferGeometry,T.LineBasicMaterial>[]=[];
  private stage = new T.Group();
  private readonly lookStageEnabled: boolean;
  private bossBackdrop!: T.Group;
  private bossAtmosphere?: CardBossAtmosphere;
  private cameraTarget = new T.Vector3(0,.65,0);
  private blobMaterial!: T.MeshBasicMaterial;
  private geometryOwned = new Set<T.BufferGeometry>();
  private materialOwned = new Set<T.Material>();
  private pick = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.camera);
    const hits = this.ray.intersectObjects([...this.puppets.values()].map(p=>p.root),true);
    for (const hit of hits) { let node: T.Object3D|null=hit.object; while(node&&!node.userData.actorId)node=node.parent; if(node?.userData.actorId){this.onTarget(node.userData.actorId as string);break;} }
  };
  private lost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(this.raf); this.onFailure('WebGL context lost. Turn controls remain available.'); };
  private visibility = () => {
    cancelAnimationFrame(this.raf); this.last=0;
    if (!document.hidden && !this.disposed) { this.dirty=true; this.raf=requestAnimationFrame(this.loop); }
  };

  constructor(private host: HTMLElement, private view: ()=>SceneView, private onAnchors: (v:Anchor[])=>void, private onTarget:(id:string)=>void, private onFailure:(message:string)=>void) {
    this.lookStageEnabled = !!this.view().autoBattle && isLookV2();
    this.renderer = new T.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'low-power', preserveDrawingBuffer:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.04;
    this.renderer.setClearColor('#252332'); this.renderer.domElement.setAttribute('aria-label','Original 3D cafe battlefield');
    this.effectPreview.background=new T.Color('#000000');
    this.renderer.domElement.setAttribute('role','img'); host.appendChild(this.renderer.domElement);
    this.warming = this.warmModels();

    this.resize=new ResizeObserver(()=>this.scheduleResize());this.resize.observe(host);
    this.renderer.domElement.addEventListener('pointerup',this.pick);
    this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
    document.addEventListener('visibilitychange',this.visibility);
    this.raf=requestAnimationFrame(this.loop);
  }

  private ownSceneResources(){
    // Effect modules own their pools, including placeholders replaced at play.
    // Registering those here as well would dispose the same resources twice.
    const own=(o:T.Object3D)=>{
      if(o===this.spells?.root||o===this.cardEffects?.root||o===this.bossAtmosphere?.root)return;
      if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Points){this.geometryOwned.add(o.geometry);for(const material of Array.isArray(o.material)?o.material:[o.material])this.materialOwned.add(material);}
      if(o instanceof T.Sprite)this.materialOwned.add(o.material);
      for(const child of o.children)own(child);
    };
    own(this.scene);
  }

  private async preparePresentation(){
    if(this.view().autoBattle)this.cardSurfaces=new CardSurfaces(this.renderer);
    if(this.lookStageEnabled){const {LookPost}=await import('./look-post');if(this.disposed)return;this.post=new LookPost(this.renderer);}else this.post=new CafePost(this.renderer, this.view().autoBattle);this.post.setQuality(this.view().quality??'high');this.renderer.info.autoReset=false;this.post.resize(this.width,this.height);
    this.glow=this.makeGlow();
    if(this.lookStageEnabled)this.contactTexture=this.makeContact();
    this.blobMaterial=new T.MeshBasicMaterial({map:this.contactTexture??this.glow,color:this.lookStageEnabled?'#172D36':'#151222',transparent:true,opacity:this.lookStageEnabled?.56:.45,depthWrite:false});
    this.scene.fog=new T.Fog('#252332',15,27);
    this.scene.add(new T.HemisphereLight('#f4e9e8','#675166',1.35));
    const key=new T.DirectionalLight('#ffe0ba',3.3); key.name='cafe-key'; key.position.set(-4,8,5); this.scene.add(key);
    const rim=new T.DirectionalLight('#bdd2ff',2.3);rim.name='cafe-rim';rim.position.set(4,4,-5);this.scene.add(rim);
    this.aura=new T.PointLight(GOLD,0,7);this.scene.add(this.aura);

    this.ownSceneResources();
    await loadingFrame();if(this.disposed)return;
    this.bossBackdrop=new T.Group();
    for(let i=0;i<7;i++){const t=new T.Mesh(new T.TorusGeometry(2.5+i*.24,.025,4,60),new T.MeshBasicMaterial({color:'#d77889',transparent:true,opacity:.18}));t.rotation.x=Math.PI/2;t.position.set(2.3,.035+i*.004,0);this.bossBackdrop.add(t);}
    this.scene.add(this.bossBackdrop);
    if(this.view().autoBattle){this.bossAtmosphere=new CardBossAtmosphere();this.scene.add(this.bossAtmosphere.root);}
    this.ownSceneResources();
    await loadingFrame();if(this.disposed)return;
    const makeRing=(color:string)=>{const m=new T.Mesh(new T.RingGeometry(.54,.60,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.04;this.scene.add(m);return m;};
    this.activeRing=makeRing(GOLD);
    for(let i=0;i<12;i++){const r=makeRing(TEAL);r.visible=false;this.targetRings.push(r);}
    for(let i=0;i<9;i++){
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(6),3));
      const line=new T.Line(g,new T.LineBasicMaterial({color:GOLD,transparent:true,opacity:.75,depthTest:false}));line.visible=false;line.frustumCulled=false;line.renderOrder=4;this.targetLines.push(line);this.scene.add(line);
    }
    this.ownSceneResources();
    await loadingFrame();if(this.disposed)return;
    this.spells=new SpellVfx(this.scene,!!this.view().autoBattle);
    if(this.view().autoBattle){this.cardEffects=new CardEffects(this.scene,this.lookStageEnabled);if('setEffects' in this.post)this.post.setEffects(this.cardEffects);}
    this.ownSceneResources();
  }

  private async warmModels(){
    const warm=new T.Group();
    try{
      await loadingFrame();if(this.disposed)return;
      this.resizeToHost();await loadingFrame();if(this.disposed)return;
      await this.preparePresentation();if(this.disposed)return;
      await loadingFrame();if(this.disposed)return;
      if(this.view().autoBattle && !this.lookStageEnabled){
        for(const kind of ['wood','cloth','window'] as const){
          const texture=await prepareStageTexture(kind);
          texture.anisotropy=Math.min(16,this.renderer.capabilities.getMaxAnisotropy());
          if(this.disposed){texture.dispose();return;}
          this.stageTextures.push(texture);
          this.renderer.initTexture(texture);
          await loadingFrame();
        }
      }
      if(this.lookStageEnabled){
        const {createLookStage,disposeLookStage}=await import('./look-stage');
        if(this.disposed)return;
        const stage=await createLookStage(this.renderer);
        if(this.disposed){disposeLookStage(stage);return;}
        this.stage=stage;
      }else {for(const step of this.makeStage()){this.stage=step;this.ownStageResources();await loadingFrame();if(this.disposed)return;}}
      this.stageTextures.push(...(this.stage.userData.ownedTextures ?? []));
      await this.view().decorateStage?.(this.stage,()=>this.disposed);this.ownStageResources();if(this.disposed)return;this.scene.add(this.stage);
      this.stage.traverse(object=>{
        if(object instanceof T.Mesh||object instanceof T.Line||object instanceof T.Points){
          this.geometryOwned.add(object.geometry);
          const materials=Array.isArray(object.material)?object.material:[object.material];
          for(const material of materials)this.materialOwned.add(material);
        }
        if(object instanceof T.Sprite)this.materialOwned.add(object.material);
      });
      if(this.disposed)return;
      if(this.lookStageEnabled){const {createLookEnvironment}=await import('./look-environment');if(this.disposed)return;this.lookEnvironment=await createLookEnvironment(this.renderer,()=>this.disposed);if(this.disposed)return;this.scene.environment=this.lookEnvironment?.texture??null;this.scene.environmentIntensity=.35;}
      this.loading.completed=1;this.loading.label='Preparing miniature models';
      await new Promise(resolve=>setTimeout(resolve,0));
      await this.cardSurfaces?.ready;if(this.disposed)return;
      const warmMaterials=new Map<T.Material,T.Material>();
      for(const role of this.view().warmModelIds ?? ['guardian','witch','alchemist','guard','flanker','charger','ranger','healer','elite','yarn','thread','dummy']){
        const gltf=await loadModel(role);if(this.disposed)return;const model=gltf.scene.clone(true);
        if(this.lookStageEnabled){
          // Gallery actors may differ from the initial party. Warm their real
          // felt/atelier shader and utensils, including the direct Low variant.
          // Retain these material references until teardown: disposing them
          // here would evict the programs before the first gallery cast.
          let rigRole='';const originalNodes=new Set<T.Object3D>();
          model.traverse(o=>{
            originalNodes.add(o);if(o.name.endsWith('_head'))rigRole=o.name.slice(0,-5);
            if(o instanceof T.Mesh){
              const prepare=(source:T.Material)=>{
                let material=warmMaterials.get(source);
                if(!material){material=source.clone();if(material instanceof T.MeshStandardMaterial)this.cardSurfaces?.apply(material);warmMaterials.set(source,material);this.materialOwned.add(material);}
                return material;
              };
              o.material=Array.isArray(o.material)?o.material.map(prepare):prepare(o.material);
            }
          });
          if(rigRole)new CardUtensil(model,rigRole,role);
          model.traverse(o=>{if(!originalNodes.has(o)&&o instanceof T.Mesh){this.geometryOwned.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])this.materialOwned.add(m);}});
        }
        model.traverse(o=>{o.visible=true;o.frustumCulled=false});warm.add(model);
        await loadingFrame();
      }
      // A spare preview has never drawn its equipped actor. Prepare that
      // material variant too, before exposing it in the first item picker.
      this.loading.completed=2;this.loading.label='Preparing companion motion';
      const initial={...this.view(),frame:null};
      for(const actor of initial.actors){await this.ensure(actor,initial.boss);await loadingFrame();if(this.disposed)return;}
      for(const a of initial.actors)this.puppets.get(a.id)?.gear.update(a,initial.appearance?.(a));
      this.loading.completed=3;this.loading.label='Compiling lighting';
      await new Promise(resolve=>setTimeout(resolve,0));
      if(this.view().autoBattle){this.litChapter=this.view().chapter??1;applyCardLighting(this.scene,this.renderer,this.litChapter);}
      await this.cardEffects?.ready;if(this.disposed)return;
      this.scene.add(warm);
      // Direct-to-canvas and HDR-to-post use different tone-mapping programs.
      // Prepare both while loading so adaptive quality never links at a hit.
      await warmScene(this.renderer,this.scene,this.camera,()=>this.disposed,
        fraction=>{this.loading.completed=3+fraction;});
      if(this.disposed)return;
      this.scene.remove(warm);
      this.loading.completed=4;this.loading.label='Preparing skill effects';
      await this.spells.warm(this.renderer,this.camera,this.scene);if(this.disposed)return;
      await this.cardEffects?.warm(this.renderer,this.camera);if(this.disposed)return;
      this.loading.label='Preparing the final lighting';
      await this.post.warm(()=>this.disposed);if(this.disposed)return;
      await loadingFrame();
      this.loading.completed=5;this.loading.label='Ready';
      this.scene.remove(warm);this.render(initial);this.ready=true;this.host.dataset.ready='true';this.dirty=true;
    }catch(error){this.scene.remove(warm);if(!this.disposed)this.onFailure(`Models could not prepare: ${String(error).slice(0,100)}`)}
  }
  private makeContact():T.Texture {
    const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d')!;
    const gradient=ctx.createRadialGradient(57,68,8,64,64,62);
    gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.34,'#ffffffc4');gradient.addColorStop(.64,'#ffffff51');gradient.addColorStop(1,'#ffffff00');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
  }
  private makeGlow():T.Texture {
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;
    const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#ffffffe8');g.addColorStop(.42,'#ffffff50');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
  }
  private ownStageResources(){
    this.stage.traverse(object=>{if(object instanceof T.Mesh||object instanceof T.Line||object instanceof T.Points){this.geometryOwned.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])this.materialOwned.add(material);}if(object instanceof T.Sprite)this.materialOwned.add(object.material);});
  }
  private *makeStage(): Generator<T.Group> {
    const group=new T.Group();
    if(!this.stageTextures.length)this.stageTextures.push(stageTexture('wood'),stageTexture('cloth'),stageTexture('window'));
    const [wood,cloth,windowTexture]=this.stageTextures as [T.Texture,T.Texture,T.Texture];
    const mat=(c:string)=>new T.MeshStandardMaterial({color:c,roughness:c==='#f0ddbe'?.22:.84,metalness:0});
    const woodMat=new T.MeshStandardMaterial({map:wood,roughness:.57,color:'#e7c6a7'});
    const clothMat=new T.MeshStandardMaterial({map:cloth,roughness:.94,color:'#78677d',bumpMap:cloth,bumpScale:.018});
    const mesh=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);group.add(o);return o;};
    mesh(new RoundedBoxGeometry(13.4,.5,8.5,2,.15),mat('#725249'),0,-.36,0);
    mesh(new RoundedBoxGeometry(13.25,.12,8.35,2,.08),woodMat,0,-.08,0);
    const lineMat=mat('#a47760');for(let i=0;i<12;i++)mesh(new T.BoxGeometry(.012,.008,8.15),lineMat,-6.05+i*1.1,-.014,0);
    // A hand-authored woven oval rug; no external texture or copied pattern.
    const rug=mesh(new T.CylinderGeometry(4.85,4.85,.035,64),clothMat,0,.01,.1);rug.scale.z=.62;
    for(const [r,c] of [[4.7,'#e6b987'],[4.58,'#927489'],[4.4,'#e6b987']] as const){const edge=mesh(new T.TorusGeometry(r,.018,4,80),mat(c),0,.036,.1);edge.rotation.x=Math.PI/2;edge.scale.y=.62;}
    const motifMat=mat('#9d7a87');for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const m=mesh(new T.BoxGeometry(.10,.009,.10),motifMat,Math.cos(a)*4.1,.038,.1+Math.sin(a)*2.5);m.rotation.y=Math.PI/4;}
    yield group;
    const cup=(x:number,z:number)=>{const c=new T.Group();c.position.set(x,0,z);group.add(c);const white=mat('#f0ddbe');const body=new T.Mesh(new T.CylinderGeometry(.34,.26,.53,20),white);body.position.y=.32;c.add(body);const tea=new T.Mesh(new T.CircleGeometry(.29,20),mat('#9a6248'));tea.rotation.x=-Math.PI/2;tea.position.y=.59;c.add(tea);const handle=new T.Mesh(new T.TorusGeometry(.23,.06,6,16),white);handle.position.set(.36,.34,0);c.add(handle);const saucer=new T.Mesh(new T.CylinderGeometry(.48,.44,.05,24),white);saucer.position.y=.035;c.add(saucer);return c;};
    cup(-5.4,-2.7);cup(5.5,2.8);
    const book=new T.Group();book.position.set(4.85,0,-2.9);book.rotation.y=-.2;group.add(book);
    for(let i=0;i<3;i++){const b=new T.Mesh(new RoundedBoxGeometry(1.45,.20,.86,1,.035),mat(['#b87d78','#718f85','#e0c292'][i]!));b.position.y=.14+i*.23;b.rotation.y=i*.12;book.add(b);}
    const pot=mesh(new T.CylinderGeometry(.33,.23,.5,12),mat('#d2a580'),-5.35,.27,2.65);
    for(let i=0;i<7;i++){const leaf=mesh(new T.SphereGeometry(.2,8,5),mat(i%2?'#7eac8a':'#a6ba8b'),pot.position.x+Math.sin(i*2.4)*.22,.75+(i%3)*.12,2.65+Math.cos(i*2.4)*.18);leaf.scale.set(.5,1.7,.8);leaf.rotation.z=Math.sin(i)*.7;}
    yield group;
    mesh(new T.CylinderGeometry(.16,.19,.55,16),mat('#f8d6a1'),-1.1,.28,-3.2);
    const flame=mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:'#ffe6ad'}),-1.1,.67,-3.2);flame.scale.y=1.7;flame.name='cafe-candle-flame';
    const glow=new T.Sprite(new T.SpriteMaterial({map:this.glow,color:'#ffc27b',transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(flame.position);glow.scale.set(1.1,1.1,1);glow.name='cafe-candle-halo';group.add(glow);
    yield group;
    // Dark cafe backdrop with softly lit panes; props fall into the cool fog.
    mesh(new RoundedBoxGeometry(16,6,.15,2,.12),mat('#342d3c'),0,2.3,-5.7);
    const pane=new T.MeshBasicMaterial({map:windowTexture,color:'#b59491'});
    for(const x of [-4.6,0,4.6]){mesh(new RoundedBoxGeometry(2.8,3,.12,2,.12),mat('#211d2b'),x,2.3,-5.55);mesh(new T.PlaneGeometry(2.55,2.7),pane,x,2.3,-5.47);for(const offset of [-.55,.55])mesh(new T.BoxGeometry(.045,2.72,.04),mat('#3e2e3d'),x+offset,2.3,-5.42);mesh(new T.BoxGeometry(2.6,.05,.04),mat('#3e2e3d'),x,2.15,-5.4);}
    mesh(new RoundedBoxGeometry(15,.14,.6,2,.04),woodMat,0,.7,-5.25);
    yield group;
  }
  private resizing=false;
  private scheduleResize(){if(this.resizing||this.disposed)return;this.resizing=true;void loadingFrame().then(()=>{this.resizing=false;if(!this.disposed)this.resizeToHost();});}
  private resizeToHost(){
    const width=this.host.clientWidth,height=this.host.clientHeight;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    if(!width||!height||(width===this.width&&height===this.height&&ratio===this.renderer.getPixelRatio()))return;
    if(ratio!==this.renderer.getPixelRatio())this.renderer.setPixelRatio(ratio);
    this.width=width;this.height=height;this.renderer.setSize(width,height,false);this.post?.resize(width,height);
    this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.dirty=true;
  }
  invalidate(){this.dirty=true;}
  /** Call after setting the preview's selected cat. Resolves false on teardown,
   * failed preparation, or absent cat; no controls or account state are changed. */
  async playEntrance(catId: string): Promise<boolean> {
    await this.warming;
    if (this.disposed || !this.ready) return false;
    const view = this.view();
    const actor = view.actors.find(actor => (view.models?.[actor.id] ?? actor.role) === catId);
    if (!actor) return false;
    await this.ensure(actor, view.boss);
    if (this.disposed || !this.puppets.has(actor.id)) return false;
    this.entrance = { asset: catId, startedAt: this.time };
    this.dirty = true;
    return true;
  }
  private async ensure(a:TurnActor,boss:boolean){
    if(this.puppets.has(a.id)||this.pending.has(a.id))return;this.pending.add(a.id);
    try{
      const asset=this.view().models?.[a.id]??a.role;
      const gltf=await loadModel(asset);if(this.disposed)return;
      const model=gltf.scene.clone(true);const root=new T.Group();root.add(model);root.userData.actorId=a.id;
      const cardClips=this.view().autoBattle?await createCardClips(model,a.role,asset):[];
      if(this.disposed)return;
      const height=new T.Box3().setFromObject(model).max.y;
      const materials:T.Material[]=[];model.traverse(o=>{if(o instanceof T.Mesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();materials.push(...(Array.isArray(o.material)?o.material:[o.material]));for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial){this.cardSurfaces?.apply(m);for(const tex of [m.map,m.normalMap,m.roughnessMap])if(tex){tex.anisotropy=Math.min(this.view().autoBattle?16:8,this.renderer.capabilities.getMaxAnisotropy());tex.generateMipmaps=true;}}}});
      const mixer=new T.AnimationMixer(model);
      const clips=new Map([...gltf.animations,...cardClips].map(clip=>[clip.name,clip]));
      const actions=new Map([...clips].map(([name,clip])=>[name,mixer.clipAction(clip)]));
      const shadow=new T.Mesh(new T.PlaneGeometry(a.role==='yarn'?3:1.65,a.role==='yarn'?2.4:1.35),this.blobMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.026;root.add(shadow);
      const guard=new T.Mesh(this.view().autoBattle?cardShieldGeometry():new T.SphereGeometry(.9,18,10,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:this.view().autoBattle?.50:.12,depthWrite:false,side:T.DoubleSide}));guard.position.y=.09;guard.visible=false;root.add(guard);
      const snare=new T.Group();for(let i=0;i<2;i++){const thread=new T.Mesh(new T.TorusGeometry(.47+i*.08,.018,5,32),new T.MeshBasicMaterial({color:VIOLET,transparent:true,opacity:.85}));thread.rotation.x=Math.PI/2+i*.35;thread.position.y=.2+i*.22;snare.add(thread);}snare.visible=false;root.add(snare);
      const base=point(a,boss);root.position.copy(base);model.rotation.y=restYaw(a.side);this.scene.add(root);
      const head = model.getObjectByName(`${a.role}_head`);
      const face = this.view().autoBattle ? a.side === 'party' ? new CardFace(model, a.role, asset) : new CardEnemyExpression(model, a.role, asset) : undefined;
      const utensil = this.view().autoBattle ? new CardUtensil(model, a.role, asset) : undefined;
      this.puppets.set(a.id,{bossPhase:this.view().bossPhases?.[a.id]??1,phaseAt:-100,utensil,enteredAt:this.time,face,head,headRest:head?.quaternion.clone() ?? new T.Quaternion(),headPose:head?.quaternion.clone() ?? new T.Quaternion(),gaze:{yaw:0,pitch:0},asset,height,baseColors:materials.map(m=>m instanceof T.MeshStandardMaterial?m.color.clone():new T.Color()),gear:new GearAttachments(model,a.role,this.gearResources),root,model,mixer,actions,clip:'',base,shadow,role:a.role,materials,guard,snare});this.stats.loaded=this.puppets.size;this.dirty=true;
    }catch(error){if(!this.disposed)this.onFailure(`Model unavailable: ${a.name}. Turn controls remain available. ${String(error).slice(0,120)}`);}
    finally{this.pending.delete(a.id);}
  }
  private animatePuppet(p:Puppet,clip:string,delta:number,progress?:number){
    const actual=p.actions.has(clip)?clip:p.actions.has('idle')?'idle':'';
    if(p.clip!==actual){p.actions.get(p.clip)?.fadeOut(.08);const action=p.actions.get(actual);if(action){action.reset().setEffectiveWeight(1).fadeIn(.08).play();if(!['idle','ready'].includes(actual)){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}else action.setLoop(T.LoopRepeat,Infinity);}p.clip=actual;}
    if(progress!==undefined){const a=p.actions.get(actual);if(a){for(const other of p.actions.values())if(other!==a)other.setEffectiveWeight(0);a.enabled=true;a.stopFading();a.setEffectiveWeight(1);a.time=a.getClip().duration*Math.min(.999,Math.max(0,progress));p.mixer.update(0);}}else p.mixer.update(delta);
  }
  private loop=(now:number)=>{
    if(this.disposed||document.hidden)return;
    if(this.renderer.getPixelRatio()!==Math.min(window.devicePixelRatio||1,2))this.resizeToHost();
    this.raf=requestAnimationFrame(this.loop);const view=this.view();if(!this.ready||view.suspended){this.last=now;this.renderAt=now;return}const raw=this.last?Math.min(100,now-this.last):0;this.last=now;this.post.setQuality(view.quality??'high');if(!view.model&&!view.paused&&view.fixedTime===undefined)this.post.observe(raw,view.autoQuality!==false);
    const frameBudget=view.fixedTime!==undefined||view.paused?Infinity:view.reducedMotion?50:16;
    if(!this.dirty&&now-this.renderAt<frameBudget)return;const delta=view.paused?0:Math.min(.1,(now-this.renderAt)/1000||raw/1000);this.renderAt=now;this.dirty=false;
    this.time=view.fixedTime??this.time+delta;this.render(view,delta);
  };
  render(view:SceneView,delta=0){
    if(view.fixedTime!==undefined)this.time=view.fixedTime;
    const ids=new Set(view.actors.map(a=>a.id));
    for(const [id,p] of this.puppets)if(!ids.has(id)||view.actors.find(a=>a.id===id)?.role!==p.role||(view.models?.[id]??p.role)!==p.asset){this.scene.remove(p.root);this.disposePuppet(p);this.puppets.delete(id);}
    this.stats.loaded=this.puppets.size;
    for(const a of view.actors)if(!this.puppets.has(a.id)&&!this.pending.has(a.id))void this.ensure(a,view.boss);
    const frame=view.frame, cardRecipe=view.autoBattle?cardRecipeFor(frame,view.actors):undefined, source=frame?this.puppets.get(frame.plan.actorId):undefined;
    const targets=frame?frame.plan.targetIds.map(id=>this.puppets.get(id)).filter((p):p is Puppet=>!!p):[];
    for(const a of view.actors){const p=this.puppets.get(a.id);if(!p)continue;const slot=view.model?this.zero:view.autoBattle?cardFormation(a,view.rows?.[a.id]):formationPoint(a,view.boss);if(!view.autoBattle||a.hp>0)p.base.set(slot.x,slot.y,slot.z);p.root.position.copy(p.base);p.root.scale.setScalar(view.model?1:figureScale(a.role,a.side));p.model.rotation.y=view.model?view.model.angle:view.autoBattle?cardBodyYaw(a.side,0,0):restYaw(a.side);
      if (view.tableau) {
        p.base.set((a.slot - 1) * 2.1, 0, a.slot === 1 ? -.35 : .3);
        p.root.position.copy(p.base);
        p.model.rotation.y = (1 - a.slot) * .12;
      }
      p.gear.update(a,view.appearance?.(a));p.gear.animate(view.reducedMotion?0:this.time);
      let clip=a.hp<=0?'KO':view.model?.clip??(a.id===view.currentId?'ready':'idle');let progress:number|undefined;
      if(view.autoBattle&&!view.model&&clip==='idle'){
        const idle=cardIdleFrame(a.id,this.time,view.reducedMotion);
        if(p.actions.has(idle.clip)){clip=idle.clip;progress=idle.progress;}
      }
      if(view.autoBattle&&!view.model&&clip==='ready'&&a.side==='enemy'&&p.actions.has('telegraph'))clip='telegraph';
      if(view.autoBattle&&!view.model&&!view.reducedMotion&&a.hp>0&&this.time-p.enteredAt<1.14&&p.actions.has('walk-in')){
        clip='walk-in';progress=(this.time-p.enteredAt)/1.14;
      }
      if(frame&&source===p&&(!view.autoBattle||a.hp>0)){
        const identity=frame.plan.presentationId??frame.plan.skillId;
        const direction=(view.autoBattle?cardSkillMotion(p.asset,identity):undefined)??SKILL_MOTION[frame.plan.skillId];
        clip=p.actions.has(identity)?identity:p.actions.has(frame.plan.skillId)?frame.plan.skillId:frame.clip;progress=clipProgress(frame);
        if(!view.reducedMotion&&direction){const t=movementProgress(frame),target=targets[0]?.base??p.base;
          const distance=p.base.distanceTo(target);
          const travel=view.autoBattle?cardTravelFraction(distance,direction.travel):direction.travel;
          p.root.position.lerpVectors(p.base,this.scratch.copy(p.base).lerp(target,travel),t);
          const lift=Math.sin(frame.actionProgress*Math.PI);p.root.position.y+=Math.sin(t*Math.PI)*direction.arc+lift*direction.float;
          p.root.position.z+=Math.sin(t*Math.PI)*direction.side;
        }
      }
      if(frame&&targets.includes(p)&&(!view.autoBattle||source!==p)&&['impact','reaction'].includes(frame.beat.kind)&&a.hp>0){
        const hurt=frame.plan.events.some(e=>e.type==='damage'&&e.targetIds.includes(a.id));
        clip=hurt?(frame.plan.ultimate?'heavy-hit':'hit'):'heal-receive';
        if(hurt&&view.autoBattle&&source){
          const localDirection=(source.base.x-p.base.x)*Math.cos(p.model.rotation.y)
            -(source.base.z-p.base.z)*Math.sin(p.model.rotation.y);
          const reaction=cardHitClip(frame.plan.ultimate,localDirection);
          if(p.actions.has(reaction))clip=reaction;
        }
        progress=frame.beat.kind==='impact'?.45:frame.progress;
        if(hurt&&!view.reducedMotion){const recoil=Math.sin(frame.progress*Math.PI)*.16;p.root.position.x+=a.side==='party'?-recoil:recoil;}
      }
      if(frame&&!view.model&&!view.reducedMotion){
        const phase=frame.beat.kind,weight=phase==='anticipation'?ease(frame.progress):phase==='residue'?1-ease(frame.progress):1;
        const other=source===p?targets.find(t=>t!==p):targets.includes(p)?source:undefined;
        if(other)p.model.rotation.y=view.autoBattle?cardBodyYaw(a.side,targetYaw(p.base,other.base),weight):blendYaw(restYaw(a.side),targetYaw(p.base,other.base),weight);
      }
      if (this.entrance?.asset === p.asset && !frame) {
        const entrance = cardEntrancePose(this.time - this.entrance.startedAt, view.reducedMotion);
        if (p.actions.has('victory')) { clip = 'victory'; progress = entrance.progress; }
        p.root.position.y += entrance.lift;
        p.model.rotation.y = cardBodyYaw('party', 0, 0) + entrance.turn;
        if (entrance.finished) this.entrance = undefined;
      }
      const phase=view.bossPhases?.[a.id]??1;
      if(phase!==p.bossPhase){p.phaseAt=phase>p.bossPhase?this.time:-100;p.bossPhase=phase;}
      if(view.autoBattle&&!view.model&&BOSS_STYLES[p.asset]&&a.hp>0){
        const cue=bossPerformance(this.time-p.enteredAt,this.time-p.phaseAt,view.reducedMotion);
        if(cue&&(!frame||frame.plan.skillId==='round-status'||source!==p&&!targets.includes(p))){clip=cue.clip;progress=cue.progress;}
      }
      // Restore the last mixer pose before gaze. PropertyMixer skips unchanged values.
      if(view.autoBattle && p.head) p.head.quaternion.copy(p.headPose);
      this.animatePuppet(p,clip,view.fixedTime!==undefined?0:delta,view.fixedTime!==undefined?(view.modelProgress??progress??(clip==='idle'?.35:.45)):progress);
      if(view.autoBattle && p.head) p.headPose.copy(p.head.quaternion);
      p.face?.animate(cardExpression(clip, !!frame && source === p), this.time, p.gaze.yaw, view.reducedMotion);
      const involved=!frame||source===p||frame.plan.targetIds.includes(a.id);
      p.materials.forEach((m,i)=>{if(m instanceof T.MeshStandardMaterial)m.color.copy(p.baseColors[i]!).multiplyScalar(involved?1:.7)});
      p.guard.visible=a.hp>0&&a.shield>0;p.snare.visible=a.hp>0&&a.statuses.some(s=>['snare','restrain'].includes(s.kind));
      for(const child of p.snare.children)(child as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.color.set(a.statuses.some(s=>s.kind==='restrain')?'#ed869b':VIOLET);
      p.root.visible=a.hp>0||!!(frame&&frame.plan.targetIds.includes(a.id));
      if(a.hp<=0&&p.root.visible)p.root.scale.multiplyScalar(Math.max(.6,1-(frame?.progress??0)*.4));
      if(view.autoBattle)groundCardContact(p.shadow,p.root);
      const knot=p.model.getObjectByName(`${a.role}_exposed_knot`);if(knot)knot.scale.setScalar(a.statuses.some(s=>s.kind==='exposed')?1.25:1);
    }
    if(view.autoBattle && this.litChapter!==(view.chapter??1)){this.litChapter=view.chapter??1;applyCardLighting(this.scene,this.renderer,this.litChapter);}
    if('setChapter' in this.post)this.post.setChapter(view.chapter??1);
    this.stage.userData.setChapter?.(view.chapter??1);
    this.bossBackdrop.visible=view.boss&&!view.model&&!view.autoBattle;this.stage.visible=!view.model;
    const boss=view.actors.find(a=>a.hp>0&&BOSS_STYLES[this.puppets.get(a.id)?.asset??'']);
    const bossPuppet=boss?this.puppets.get(boss.id):undefined;
    const bossCue=bossPuppet?bossPerformance(this.time-bossPuppet.enteredAt,this.time-bossPuppet.phaseAt,view.reducedMotion):null;
    this.bossAtmosphere?.update(view.model?undefined:bossPuppet?.asset,bossPuppet?.base,bossPuppet?.bossPhase??1,bossCue?.progress??0,view.reducedMotion);
    for (const group of this.stage.children) {
      if (group.userData.chapter) group.visible = group.userData.chapter === view.chapter;
    }
    this.activeRing.visible=false;this.targetRings.forEach(r=>r.visible=false);
    const active=source??this.puppets.get(view.currentId??'');if(active&&!view.model){this.activeRing.visible=true;this.activeRing.position.set(active.base.x,.045,active.base.z);this.activeRing.material.color.set(roleColor(active.role));this.activeRing.scale.setScalar(1+.035*Math.sin(this.time*3));}
    this.aura.intensity=active&&!view.model?1.2:0;if(active)this.aura.position.set(active.root.position.x,active.root.position.y+1.4,active.root.position.z+.3);
    this.targetLines.forEach(l=>l.visible=false);
    if(active&&!view.model&&(!frame||frame.beat.kind==='anticipation'))view.targetIds.slice(0,9).forEach((id,i)=>{
      const p=this.puppets.get(id),line=this.targetLines[i];if(!p||!line||p===active)return;
      const a=active.root.position,b=p.root.position,attr=line.geometry.attributes.position!;attr.setXYZ(0,a.x,.1,a.z);attr.setXYZ(1,b.x,.1,b.z);attr.needsUpdate=true;line.visible=true;line.material.color.set(frame?.color??TEAL);
    });
    view.targetIds.slice(0,12).forEach((id,i)=>{const p=this.puppets.get(id),r=this.targetRings[i];if(p&&r){r.visible=true;r.position.set(p.base.x,.05,p.base.z);r.scale.setScalar(1.25);r.material.color.set(view.legalIds.includes(id)?TEAL:'#ec8996');}});
    this.camera.position.set(0,7.2,11.6);this.cameraTarget.set(0,.7,0);this.camera.zoom=!view.autoBattle&&view.camera==='close'?1.05:1;
    if(this.lookStageEnabled&&!view.model){this.camera.position.set(0,6.4,12);this.cameraTarget.set(0,1.1,0);}
    const distance=this.camera.position.distanceTo(this.cameraTarget),frameHeight=view.model?(view.model.role==='yarn'?3.3:2.25):view.tableau?Math.max(4,7.5/this.camera.aspect):view.autoBattle?cardFrameHeight(this.camera.aspect,view.camera==='close'?'close':view.camera==='far'?'far':'wide'):stageHeight(this.camera.aspect);
    this.camera.fov=T.MathUtils.radToDeg(2*Math.atan(frameHeight/2/distance));
    if(view.model){this.camera.position.set(0,3.7,11.3);this.cameraTarget.y=view.model.role==='yarn'?1.35:.94;this.camera.zoom=1.02;}
    if(view.camera==='overhead')this.camera.position.set(0,13,6);

    if(frame&&!view.reducedMotion&&!view.model){const push=view.autoBattle?Math.sin(frame.actionProgress*Math.PI)*(frame.plan.ultimate?1.2:frame.plan.events.some(event=>event.type==='death')?.9:.35):frame.camera||0;const crowded=view.actors.filter(a=>a.side==='enemy'&&a.hp>0).length>=5;this.camera.zoom+=push*(crowded?.025:.045);const focus=source?.base??this.zero;this.cameraTarget.x=focus.x*push*(crowded?.025:.06);const shake=frame.shake||0;this.camera.position.x+=Math.sin(frame.elapsed*.13)*shake*.035;this.camera.position.y+=Math.cos(frame.elapsed*.17)*shake*.025;}
    if(frame&&!view.reducedMotion&&!view.model){const shot=cardRecipe?.shot??EFFECT_DIRECTION[frame.plan.skillId]?.shot,motion=frame.plan.ultimate?.22:.08,phase=Math.sin(frame.actionProgress*Math.PI);if(shot==='left'||shot==='right')this.camera.position.x+=phase*motion*(shot==='left'?-1:1);if(shot==='rise')this.camera.position.y+=phase*motion;}
    if(frame?.plan.skillId==='victory'&&!view.reducedMotion){this.camera.position.x=Math.sin(frame.actionProgress*Math.PI)*1.25;this.camera.position.y+=Math.sin(frame.actionProgress*Math.PI)*.3;}
    if (this.entrance && !frame) this.camera.zoom += cardEntrancePose(this.time - this.entrance.startedAt, view.reducedMotion).zoom;
    if(bossCue&&!view.model&&!view.reducedMotion){const pulse=Math.sin(bossCue.progress*Math.PI);this.camera.zoom+=pulse*.03;this.cameraTarget.y+=pulse*.08;}
    this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
    if('setFocusDistance' in this.post)this.post.setFocusDistance(this.camera.position.distanceTo(this.cameraTarget));
    if(view.autoBattle && !view.model) {
      for(const actor of view.actors) {
        const puppet = this.puppets.get(actor.id);
        if(!puppet?.head || actor.hp <= 0) continue;
        const focus = puppet === source ? targets.find(target => target !== puppet) : source;
        focusCardHead(puppet.head, this.camera, focus?.root.position, puppet.gaze, delta, view.fixedTime !== undefined);
      }
    }
    view.animateStage?.(this.stage, this.time, view.reducedMotion);
    this.positions.clear();for(const [id,p] of this.puppets)this.positions.set(id,p.root.position);
    this.spells.render(cardRecipe?null:frame,view.actors,this.positions,this.camera,this.time,view.reducedMotion);
    if(this.cardEffects){
      let protectedCount=0;
      for(const puppet of this.puppets.values()){
        const mask=this.cardEffects.protectedFaces[protectedCount];
        if(!puppet.head||!mask)continue;
        puppet.head.getWorldPosition(this.facePoint);
        this.facePoint.y+=.20*puppet.root.scale.y;
        this.faceEdge.copy(this.facePoint);this.faceEdge.x+=.55*puppet.root.scale.x;
        this.facePoint.project(this.camera);this.faceEdge.project(this.camera);
        const radius=Math.max(.025,Math.abs(this.facePoint.x-this.faceEdge.x)*.5);
        mask.set(this.facePoint.x*.5+.5,this.facePoint.y*.5+.5,radius,radius*this.width/this.height);
        protectedCount++;
      }
      const ratio=this.renderer.getPixelRatio();
      this.cardEffects.protect(view.effectOnly?0:protectedCount,this.width*ratio,this.height*ratio);
      this.post.protectFaces(this.cardEffects.protectedFaces,view.effectOnly?0:protectedCount);
      this.cardEffects.render(frame,cardRecipe,view.actors,this.positions,this.camera,this.post.effectiveQuality,view.reducedMotion,
        view.effectOnly?undefined:view.cardStatuses,this.time);
    }
    this.stats.particles=this.spells.count+(this.cardEffects?.stats.instances??0);
    const display=view.effectOnly?this.effectPreview:this.scene;
    if(this.spells.root.parent!==display)display.add(this.spells.root);
    if(this.cardEffects&&!this.lookStageEnabled&&this.cardEffects.root.parent!==display)display.add(this.cardEffects.root);
    this.renderer.info.reset();this.post.render(display,this.camera,(frame?.shake??0)*.35,frame?.progress??0,frame?.color??'#ffe6d2',view.reducedMotion);this.stats.quality=this.post.effectiveQuality;this.renderer.domElement.dataset.quality=this.stats.quality;this.stats.frames++;const info=this.renderer.info;Object.assign(this.stats,{calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures});
    if(this.stats.frames%60===1){const geometries=new Set<T.BufferGeometry>();const collect=(o:T.Object3D)=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Points)geometries.add(o.geometry);};this.scene.traverse(collect);if(this.lookStageEnabled)this.cardEffects?.root.traverse(collect);let bytes=64*64*4;for(const g of geometries){for(const attr of Object.values(g.attributes))bytes+=attr.array.byteLength;bytes+=g.index?.array.byteLength??0;}this.stats.estimatedGpuBytes=bytes;}
    // Labels are DOM overlays; do not traverse every mesh at the GPU cadence.
    const now=performance.now();if(view.fixedTime===undefined&&now-this.labelsAt<50)return;this.labelsAt=now;
    const projected:Anchor[]=[],labels:LabelInput[]=[];
    const screen=(v:T.Vector3)=>{v.project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(-v.y*.5+.5)*this.height}};
    for(const a of view.actors){const p=this.puppets.get(a.id);if(!p||a.hp<=0||(view.autoBattle&&a.side==='party'))continue;
      if(frame?.plan.ultimate&&['anticipation','travel','impact'].includes(frame.beat.kind)&&a.id!==frame.plan.actorId&&!frame.plan.targetIds.includes(a.id))continue;
      const head=p.model.getObjectByName(`${a.role}_head`)??p.model,center=head.getWorldPosition(new T.Vector3());
      const top=screen(center.clone().add(new T.Vector3(0,.45,0))),foot=screen(p.root.position.clone());
      const aTop=p.root.position.clone().add(new T.Vector3(0,p.height*p.root.scale.y,0));const ideal=screen(aTop);ideal.y-=8;
      projected.push({id:a.id,x:top.x,y:top.y,labelX:ideal.x,labelY:ideal.y,footY:foot.y,visible:true});
      labels.push({id:a.id,x:ideal.x,y:ideal.y,height:view.autoBattle?48:a.side==='enemy'?a.statuses.length?41:29:a.statuses.length?30:18,head:screenBounds(p.model,this.camera,this.width,this.height)});
    }
    const obstacles = view.autoBattle ? view.actors.filter(actor => actor.side === 'party' && actor.hp > 0)
      .flatMap(actor => { const puppet = this.puppets.get(actor.id); return puppet ? [screenBounds(puppet.model,this.camera,this.width,this.height)] : []; }) : [];
    const placed=layoutLabels(labels,this.width,this.height,view.autoBattle?138:90,obstacles);
    this.labelAudit.heads=[...labels.map(p=>p.head),...obstacles];this.labelAudit.cards=[...placed.values()];this.labelAudit.missing=labels.filter(p=>!placed.has(p.id)).map(p=>p.id);this.labelAudit.overlaps=this.labelAudit.cards.reduce((sum,c,i)=>sum+this.labelAudit.cards.slice(i+1).filter(x=>intersects(c,x,0)).length+this.labelAudit.heads.filter(h=>intersects(c,h,0)).length,0);
    for(const a of projected){const box=placed.get(a.id);if(box){a.labelX=box.x+box.width/2;a.labelY=box.y}else a.visible=false;}
    this.onAnchors(projected);
  }
  audit(){
    const view=this.view();
    return auditBounds(view.actors.filter(a=>a.hp>0&&this.puppets.has(a.id)).map(a=>{const p=this.puppets.get(a.id)!;return {id:a.id,side:a.side,role:a.role,yaw:p.model.rotation.y,box:screenBounds(p.model,this.camera,this.width,this.height)}}),this.width,this.height);
  }
  private disposePuppet(p:Puppet){p.utensil?.dispose();p.face?.dispose();p.gear.dispose();p.mixer.stopAllAction();p.mixer.uncacheRoot(p.model);p.materials.forEach(m=>m.dispose());p.shadow.geometry.dispose();p.guard.geometry.dispose();(p.guard.material as T.Material).dispose();p.snare.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});}
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resize.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    this.renderer.domElement.removeEventListener('pointerup', this.pick);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.lost);
    this.renderer.domElement.remove();
    // compileAsync polls material programs. Keep them alive until its work
    // and render-target cleanup finish, even after the preview is unmounted.
    void this.warming.then(() => this.releaseResources(), () => this.releaseResources());
  }

  private releaseResources() {
    this.ownStageResources();
    for (const puppet of this.puppets.values()) this.disposePuppet(puppet);
    this.puppets.clear();
    this.gearResources.dispose();
    this.geometryOwned.forEach(geometry => geometry.dispose());
    this.materialOwned.forEach(material => material.dispose());
    this.stageTextures.forEach(texture => texture.dispose());
    this.glow?.dispose();
    this.contactTexture?.dispose();
    this.blobMaterial?.dispose();
    this.spells?.dispose();
    this.cardEffects?.dispose();
    this.cardSurfaces?.dispose();
    this.bossAtmosphere?.dispose();
    this.post?.dispose();
    this.lookEnvironment?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
