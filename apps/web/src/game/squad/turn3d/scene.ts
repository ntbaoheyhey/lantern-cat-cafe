/** Presentation only: projected snapshots and effect frames in, pixels/anchors out. */
import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { TurnActor } from '@taskbar-hero/game-rules/src/squad/turn/types';
import type { EffectFrame } from './effects';
import { loadModel } from './assets';

export interface SceneView {
  actors: TurnActor[]; currentId: string | null; frame: EffectFrame | null;
  targetIds: string[]; legalIds: string[]; reducedMotion: boolean; paused: boolean;
  boss: boolean; model?: { role: TurnActor['role']; clip: string; angle: number };
  fixedTime?: number; camera?: 'wide' | 'close' | 'overhead';
}
export interface Anchor { id: string; x: number; y: number; labelX: number; labelY: number; footY: number; visible: boolean }
interface Puppet { root: T.Group; model: T.Group; mixer: T.AnimationMixer; actions: Map<string,T.AnimationAction>; clip: string; base: T.Vector3; shadow: T.Mesh; role: string; materials: T.Material[]; guard:T.Mesh; snare:T.Group }
const GOLD = '#f5cb7b', VIOLET = '#c3a4ff', TEAL = '#8adcc2';
const roleColor = (role: string) => role === 'guardian' ? GOLD : role === 'witch' ? VIOLET : role === 'alchemist' ? TEAL : '#f1a295';
const ease = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const lerp = T.MathUtils.lerp;
const point = (a: TurnActor, boss: boolean): T.Vector3 => {
  if (a.side === 'party') return [new T.Vector3(-1.85, 0, .45),new T.Vector3(-3.35, 0, -1.25),new T.Vector3(-3.65, 0, 1.65)][a.slot % 3]!;
  if (a.role === 'yarn') return new T.Vector3(2.15, 0, -.25);
  if (a.role === 'thread') return new T.Vector3(.25 + (a.slot % 2) * .7, 0, 1.9);
  if (boss) return new T.Vector3(.5 + (a.slot % 3)*1.75,0,1.9);
  // Alternate rows so a front miniature never hides the one directly behind it.
  return new T.Vector3(1.05 + (a.slot % 3)*1.8 - (Math.floor(a.slot/3)%2)*.9,0,-1.15 + Math.floor(a.slot/3)*2.45);
};

export class TurnScene {
  readonly renderer: T.WebGLRenderer;
  readonly scene = new T.Scene();
  readonly camera = new T.OrthographicCamera(-7,7,3.6,-3.6,.1,80);
  readonly stats = { frames: 0, calls: 0, triangles: 0, geometries: 0, textures: 0, particles: 0, estimatedGpuBytes: 0, loaded: 0, hiddenFrames: 0 };
  private puppets = new Map<string,Puppet>();
  private pending = new Set<string>();
  private disposed = false;
  private raf = 0;
  private last = 0;
  private renderAt = 0;
  private dirty = true;
  private time = 0;
  private width = 1;
  private height = 1;
  private resize: ResizeObserver;
  private ray = new T.Raycaster();
  private glow: T.Texture;
  private particles: T.InstancedMesh<T.PlaneGeometry,T.MeshBasicMaterial>;
  private particleMatrix=new T.Matrix4();
  private particleColor=new T.Color();
  private particleScale=new T.Vector3();
  private rings: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>[] = [];
  private streaks: T.Line<T.BufferGeometry,T.LineBasicMaterial>[] = [];
  private signature:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>[]=[];
  private signatureGeometry:Record<string,T.BufferGeometry>={};
  private activeRing: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>;
  private targetRings: T.Mesh<T.RingGeometry,T.MeshBasicMaterial>[] = [];
  private aura: T.PointLight;
  private stage: T.Group;
  private bossBackdrop: T.Group;
  private cameraTarget = new T.Vector3(0,.65,0);
  private blobMaterial: T.MeshBasicMaterial;
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
    this.renderer = new T.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'low-power', preserveDrawingBuffer:true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping; this.renderer.toneMappingExposure=1.08;
    this.renderer.setClearColor('#252332'); this.renderer.domElement.setAttribute('aria-label','Original 3D cafe battlefield');
    this.renderer.domElement.setAttribute('role','img'); host.appendChild(this.renderer.domElement);
    this.glow=this.makeGlow();
    this.blobMaterial=new T.MeshBasicMaterial({map:this.glow,color:'#151222',transparent:true,opacity:.45,depthWrite:false});
    this.scene.fog=new T.Fog('#252332',20,35);
    this.scene.add(new T.HemisphereLight('#eee7ff','#76606a',1.8));
    const key=new T.DirectionalLight('#ffe0ad',2.8); key.position.set(-4,8,5); this.scene.add(key);
    const rim=new T.DirectionalLight('#b3c9ff',2.6);rim.position.set(4,4,-5);this.scene.add(rim);
    this.aura=new T.PointLight(GOLD,0,7);this.scene.add(this.aura);
    this.stage=this.makeStage();this.scene.add(this.stage);
    this.bossBackdrop=new T.Group();
    for(let i=0;i<7;i++){const t=new T.Mesh(new T.TorusGeometry(2.5+i*.24,.025,4,60),new T.MeshBasicMaterial({color:'#d77889',transparent:true,opacity:.18}));t.rotation.x=Math.PI/2;t.position.set(2.3,.035+i*.004,0);this.bossBackdrop.add(t);}
    this.scene.add(this.bossBackdrop);
    const makeRing=(color:string)=>{const m=new T.Mesh(new T.RingGeometry(.54,.60,40),new T.MeshBasicMaterial({color,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.04;this.scene.add(m);return m;};
    this.activeRing=makeRing(GOLD);
    for(let i=0;i<12;i++){const r=makeRing(TEAL);r.visible=false;this.targetRings.push(r);}
    this.particles=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:this.glow,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide}),96);this.particles.count=0;this.particles.frustumCulled=false;this.particles.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(this.particles);
    for(let i=0;i<8;i++){const r=makeRing(GOLD);r.visible=false;r.material.blending=T.AdditiveBlending;this.rings.push(r);}
    for(let i=0;i<4;i++){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(24*3),3));const line=new T.Line(g,new T.LineBasicMaterial({color:GOLD,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));line.visible=false;this.scene.add(line);this.streaks.push(line);}
    // Original silhouette ribbons. Shared geometry keeps the effect pool bounded.
    const outline=(points:T.Vector2[])=>{const shape=new T.Shape(points);shape.closePath();const hole=new T.Path(points.map(p=>p.clone().multiplyScalar(.84)).reverse());hole.closePath();shape.holes.push(hole);return new T.ShapeGeometry(shape);};
    const star=Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,r=i%2?.16:.7;return new T.Vector2(Math.cos(a)*r,Math.sin(a)*r);});
    const flower=Array.from({length:60},(_,i)=>{const a=i*Math.PI/30,r=.46+.13*Math.cos(a*5);return new T.Vector2(Math.cos(a)*r,Math.sin(a)*r);});
    const drop=new T.Shape();drop.moveTo(0,.64);drop.bezierCurveTo(-.06,.35,-.43,.02,-.3,-.24);drop.bezierCurveTo(-.16,-.5,.2,-.5,.3,-.24);drop.bezierCurveTo(.43,.02,.06,.35,0,.64);
    const shield=[[-.5,.42],[0,.62],[.5,.42],[.43,-.16],[0,-.64],[-.43,-.16]].map(([x,y])=>new T.Vector2(x,y));
    const flame=new T.Shape();flame.moveTo(0,-.45);flame.bezierCurveTo(-.62,-.28,-.32,.22,-.12,.42);flame.quadraticCurveTo(-.19,.04,.03,.08);flame.quadraticCurveTo(.35,.35,.11,.78);flame.bezierCurveTo(.68,.3,.6,-.3,0,-.45);
    const flask=[[-.13,.52],[.13,.52],[.13,.18],[.38,-.23],[.32,-.42],[-.32,-.42],[-.38,-.23],[-.13,.18]].map(([x,y])=>new T.Vector2(x,y));
    this.signatureGeometry={star:outline(star),flower:outline(flower),drop:new T.ShapeGeometry(drop),shield:outline(shield),flame:outline(flame.getPoints(16)),flask:outline(flask),hex:new T.RingGeometry(.52,.60,6),arc:new T.RingGeometry(.53,.64,32,1,0,Math.PI*1.3),thread:new T.TorusGeometry(.6,.024,4,32)};
    Object.values(this.signatureGeometry).forEach(g=>this.geometryOwned.add(g));
    for(let i=0;i<9;i++){const m=new T.Mesh(this.signatureGeometry.thread!,new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:0,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false}));m.visible=false;this.scene.add(m);this.signature.push(m);}
    this.scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line){this.geometryOwned.add(o.geometry);const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>this.materialOwned.add(m));}if(o instanceof T.Sprite)this.materialOwned.add(o.material);});
    this.resize=new ResizeObserver(()=>this.resizeToHost());this.resize.observe(host);this.resizeToHost();
    this.renderer.domElement.addEventListener('pointerup',this.pick);
    this.renderer.domElement.addEventListener('webglcontextlost',this.lost);
    document.addEventListener('visibilitychange',this.visibility);
    this.raf=requestAnimationFrame(this.loop);
  }

  private makeGlow():T.Texture {
    const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d')!;
    const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'#ffffff');g.addColorStop(.12,'#ffffffe8');g.addColorStop(.42,'#ffffff50');g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
  }
  private makeStage(): T.Group {
    const group=new T.Group();
    const mat=(c:string)=>new T.MeshStandardMaterial({color:c,roughness:.88,metalness:0});
    const mesh=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);group.add(o);return o;};
    mesh(new RoundedBoxGeometry(13.4,.5,8.5,2,.15),mat('#725249'),0,-.36,0);
    mesh(new RoundedBoxGeometry(13.25,.12,8.35,2,.08),mat('#bd8c6c'),0,-.08,0);
    const lineMat=mat('#a47760');for(let i=0;i<12;i++)mesh(new T.BoxGeometry(.012,.008,8.15),lineMat,-6.05+i*1.1,-.014,0);
    // A hand-authored woven oval rug; no external texture or copied pattern.
    const rug=mesh(new T.CylinderGeometry(4.85,4.85,.035,64),mat('#65556f'),0,.01,.1);rug.scale.z=.62;
    for(const [r,c] of [[4.7,'#e6b987'],[4.58,'#927489'],[4.4,'#e6b987']] as const){const edge=mesh(new T.TorusGeometry(r,.018,4,80),mat(c),0,.036,.1);edge.rotation.x=Math.PI/2;edge.scale.y=.62;}
    const motifMat=mat('#9d7a87');for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const m=mesh(new T.BoxGeometry(.10,.009,.10),motifMat,Math.cos(a)*4.1,.038,.1+Math.sin(a)*2.5);m.rotation.y=Math.PI/4;}
    const cup=(x:number,z:number)=>{const c=new T.Group();c.position.set(x,0,z);group.add(c);const white=mat('#f0ddbe');const body=new T.Mesh(new T.CylinderGeometry(.34,.26,.53,20),white);body.position.y=.32;c.add(body);const tea=new T.Mesh(new T.CircleGeometry(.29,20),mat('#9a6248'));tea.rotation.x=-Math.PI/2;tea.position.y=.59;c.add(tea);const handle=new T.Mesh(new T.TorusGeometry(.23,.06,6,16),white);handle.position.set(.36,.34,0);c.add(handle);const saucer=new T.Mesh(new T.CylinderGeometry(.48,.44,.05,24),white);saucer.position.y=.035;c.add(saucer);return c;};
    cup(-5.4,-2.7);cup(5.5,2.8);
    const book=new T.Group();book.position.set(4.85,0,-2.9);book.rotation.y=-.2;group.add(book);
    for(let i=0;i<3;i++){const b=new T.Mesh(new RoundedBoxGeometry(1.45,.20,.86,1,.035),mat(['#b87d78','#718f85','#e0c292'][i]!));b.position.y=.14+i*.23;b.rotation.y=i*.12;book.add(b);}
    const pot=mesh(new T.CylinderGeometry(.33,.23,.5,12),mat('#d2a580'),-5.35,.27,2.65);
    for(let i=0;i<7;i++){const leaf=mesh(new T.SphereGeometry(.2,8,5),mat(i%2?'#7eac8a':'#a6ba8b'),pot.position.x+Math.sin(i*2.4)*.22,.75+(i%3)*.12,2.65+Math.cos(i*2.4)*.18);leaf.scale.set(.5,1.7,.8);leaf.rotation.z=Math.sin(i)*.7;}
    mesh(new T.CylinderGeometry(.16,.19,.55,16),mat('#f8d6a1'),-1.1,.28,-3.2);
    const flame=mesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:'#ffe6ad'}),-1.1,.67,-3.2);flame.scale.y=1.7;
    const glow=new T.Sprite(new T.SpriteMaterial({map:this.glow,color:'#ffc27b',transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));glow.position.copy(flame.position);glow.scale.set(1.1,1.1,1);group.add(glow);
    return group;
  }
  private resizeToHost(){this.width=Math.max(1,this.host.clientWidth);this.height=Math.max(1,this.host.clientHeight);this.renderer.setSize(this.width,this.height,false);const aspect=this.width/this.height;const halfWidth=6.85;this.camera.left=-halfWidth;this.camera.right=halfWidth;this.camera.top=halfWidth/aspect;this.camera.bottom=-halfWidth/aspect;this.camera.updateProjectionMatrix();this.dirty=true;}
  invalidate(){this.dirty=true;}
  private async ensure(a:TurnActor,boss:boolean){
    if(this.puppets.has(a.id)||this.pending.has(a.id))return;this.pending.add(a.id);
    try{
      const gltf=await loadModel(a.role);if(this.disposed)return;
      const model=gltf.scene.clone(true);const root=new T.Group();root.add(model);root.userData.actorId=a.id;
      const materials:T.Material[]=[];model.traverse(o=>{if(o instanceof T.Mesh){o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();materials.push(...(Array.isArray(o.material)?o.material:[o.material]));}});
      const mixer=new T.AnimationMixer(model);const actions=new Map(gltf.animations.map(c=>[c.name,mixer.clipAction(c)]));
      const shadow=new T.Mesh(new T.PlaneGeometry(a.role==='yarn'?3:1.65,a.role==='yarn'?2.4:1.35),this.blobMaterial);shadow.rotation.x=-Math.PI/2;shadow.position.y=.026;root.add(shadow);
      const guard=new T.Mesh(new T.SphereGeometry(.9,18,10,0,Math.PI*2,0,Math.PI/2),new T.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}));guard.position.y=.1;guard.visible=false;root.add(guard);
      const snare=new T.Group();for(let i=0;i<2;i++){const thread=new T.Mesh(new T.TorusGeometry(.47+i*.08,.018,5,32),new T.MeshBasicMaterial({color:VIOLET,transparent:true,opacity:.85}));thread.rotation.x=Math.PI/2+i*.35;thread.position.y=.2+i*.22;snare.add(thread);}snare.visible=false;root.add(snare);
      const base=point(a,boss);root.position.copy(base);model.rotation.y=a.side==='party'?.4:-.4;this.scene.add(root);
      this.puppets.set(a.id,{root,model,mixer,actions,clip:'',base,shadow,role:a.role,materials,guard,snare});this.stats.loaded=this.puppets.size;this.dirty=true;
    }catch(error){if(!this.disposed)this.onFailure(`Model unavailable: ${a.name}. Turn controls remain available. ${String(error).slice(0,120)}`);}
    finally{this.pending.delete(a.id);}
  }
  private animatePuppet(p:Puppet,clip:string,delta:number,progress?:number){
    const actual=p.actions.has(clip)?clip:p.actions.has('idle')?'idle':'';
    if(p.clip!==actual){p.actions.get(p.clip)?.fadeOut(.08);const action=p.actions.get(actual);if(action){action.reset().setEffectiveWeight(1).fadeIn(.08).play();if(['hit','stagger','down','victory','attack','cast','special','step','telegraph'].includes(actual)){action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;}else action.setLoop(T.LoopRepeat,Infinity);}p.clip=actual;}
    if(progress!==undefined){const a=p.actions.get(actual);if(a){for(const other of p.actions.values())if(other!==a)other.setEffectiveWeight(0);a.enabled=true;a.stopFading();a.setEffectiveWeight(1);a.time=a.getClip().duration*Math.min(.999,Math.max(0,progress));p.mixer.update(0);}}else p.mixer.update(delta);
  }
  private loop=(now:number)=>{
    if(this.disposed||document.hidden)return;
    this.raf=requestAnimationFrame(this.loop);const view=this.view();const raw=this.last?Math.min(100,now-this.last):0;this.last=now;
    const interval=view.fixedTime!==undefined||view.paused?Infinity:view.reducedMotion?50:16;
    if(!this.dirty&&now-this.renderAt<interval)return;const delta=view.paused?0:Math.min(.1,(now-this.renderAt)/1000||raw/1000);this.renderAt=now;this.dirty=false;
    this.time=view.fixedTime??this.time+delta;this.render(view,delta);
  };
  render(view:SceneView,delta=0){
    if(view.fixedTime!==undefined)this.time=view.fixedTime;
    const ids=new Set(view.actors.map(a=>a.id));
    for(const [id,p] of this.puppets)if(!ids.has(id)||view.actors.find(a=>a.id===id)?.role!==p.role){this.scene.remove(p.root);this.disposePuppet(p);this.puppets.delete(id);}
    this.stats.loaded=this.puppets.size;
    for(const a of view.actors)void this.ensure(a,view.boss);
    const frame=view.frame, source=frame?this.puppets.get(frame.plan.actorId):undefined;
    const targets=frame?frame.plan.targetIds.map(id=>this.puppets.get(id)).filter((p):p is Puppet=>!!p):[];
    for(const a of view.actors){const p=this.puppets.get(a.id);if(!p)continue;p.base=view.model?new T.Vector3(0,0,0):point(a,view.boss);p.root.position.copy(p.base);p.root.scale.setScalar(1);p.model.rotation.y=view.model?view.model.angle:a.side==='party'?.4:-.4;
      let clip=a.hp<=0?'down':view.model?.clip??'idle';let progress:number|undefined;
      if(frame&&source===p){clip=frame.clip;progress=frame.beat.kind==='impact'?.45:frame.progress;if(!view.reducedMotion){const phase=frame.beat.kind;const target=targets[0]?.base??p.base;const melee=['slash','bash','charge','sweep','cross'].includes(frame.plan.shape);if(melee&&['travel','impact','reaction'].includes(phase)){const t=phase==='travel'?ease(frame.progress):phase==='reaction'?1-ease(frame.progress):1;const dest=p.base.clone().lerp(target,.68);p.root.position.lerpVectors(p.base,dest,t);}if(phase==='anticipation')p.root.scale.set(1+Math.sin(frame.progress*Math.PI)*.055,1-Math.sin(frame.progress*Math.PI)*.07,1+.025*Math.sin(frame.progress*Math.PI));}}
      if(frame&&targets.includes(p)&&['impact','reaction'].includes(frame.beat.kind)&&a.hp>0){const hurt=frame.plan.events.some(e=>e.type==='damage'&&e.targetIds.includes(a.id));clip=hurt?'hit':'cast';progress=frame.beat.kind==='impact'?.45:frame.progress;if(hurt&&!view.reducedMotion){const recoil=Math.sin(frame.progress*Math.PI)*.16;p.root.position.x+=a.side==='party'?-recoil:recoil;}}
      this.animatePuppet(p,clip,view.fixedTime!==undefined?0:delta,view.fixedTime!==undefined?(progress??(clip==='idle'?.35:.45)):progress);
      p.guard.visible=a.hp>0&&a.shield>0;p.snare.visible=a.hp>0&&a.statuses.some(s=>['snare','restrain'].includes(s.kind));
      for(const child of p.snare.children)(child as T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>).material.color.set(a.statuses.some(s=>s.kind==='restrain')?'#ed869b':VIOLET);
      p.root.visible=a.hp>0||!!(frame&&frame.plan.targetIds.includes(a.id));
      if(a.hp<=0&&p.root.visible)p.root.scale.setScalar(Math.max(.6,1-(frame?.progress??0)*.4));
      const knot=p.model.getObjectByName(`${a.role}_exposed_knot`);if(knot)knot.scale.setScalar(a.statuses.some(s=>s.kind==='exposed')?1.25:1);
    }
    this.bossBackdrop.visible=view.boss&&!view.model;this.stage.visible=!view.model;
    this.activeRing.visible=false;this.targetRings.forEach(r=>r.visible=false);
    const active=this.puppets.get(view.currentId??'');if(active&&!view.model){this.activeRing.visible=true;this.activeRing.position.set(active.base.x,.045,active.base.z);this.activeRing.material.color.set(roleColor(active.role));this.activeRing.scale.setScalar(1+.035*Math.sin(this.time*3));}
    view.targetIds.slice(0,12).forEach((id,i)=>{const p=this.puppets.get(id),r=this.targetRings[i];if(p&&r){r.visible=true;r.position.set(p.base.x,.05,p.base.z);r.scale.setScalar(1.25);r.material.color.set(view.legalIds.includes(id)?TEAL:'#ec8996');}});
    this.camera.position.set(0,6.5,13);this.cameraTarget.set(0,.95,0);this.camera.zoom=view.model?2.3:view.camera==='close'?1.13:view.camera==='overhead'?.9:1;
    if(view.camera==='overhead')this.camera.position.set(0,13,6);
    if(view.model)this.cameraTarget.y=1;
    if(frame&&!view.reducedMotion&&!view.model){const push=frame.camera||0;const crowded=view.actors.filter(a=>a.side==='enemy'&&a.hp>0).length>=5;this.camera.zoom+=push*(crowded?.055:.16);const focus=source?.base??new T.Vector3();this.cameraTarget.x=focus.x*push*(crowded?.08:.24);const shake=frame.shake||0;this.camera.position.x+=Math.sin(frame.elapsed*.13)*shake*.035;this.camera.position.y+=Math.cos(frame.elapsed*.17)*shake*.025;}
    if(frame?.plan.skillId==='victory'&&!view.reducedMotion){this.camera.position.x=Math.sin(frame.actionProgress*Math.PI)*1.25;this.camera.position.y+=Math.sin(frame.actionProgress*Math.PI)*.3;}
    this.camera.lookAt(this.cameraTarget);this.camera.updateProjectionMatrix();
    this.renderEffects(frame,source,targets,view);
    this.renderer.render(this.scene,this.camera);this.stats.frames++;const info=this.renderer.info;Object.assign(this.stats,{calls:info.render.calls,triangles:info.render.triangles,geometries:info.memory.geometries,textures:info.memory.textures});
    if(this.stats.frames%60===1){const geometries=new Set<T.BufferGeometry>();this.scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line)geometries.add(o.geometry);});let bytes=64*64*4;for(const g of geometries){for(const attr of Object.values(g.attributes))bytes+=attr.array.byteLength;bytes+=g.index?.array.byteLength??0;}this.stats.estimatedGpuBytes=bytes;}
    const projected:Anchor[]=[];for(const a of view.actors){const p=this.puppets.get(a.id);if(!p||a.hp<=0)continue;const top=p.root.position.clone().add(new T.Vector3(0,a.role==='yarn'?2.75:1.9,0)).project(this.camera),foot=p.root.position.clone().project(this.camera);projected.push({id:a.id,x:(top.x*.5+.5)*this.width,y:(-top.y*.5+.5)*this.height,labelX:(top.x*.5+.5)*this.width,labelY:Math.max(52,(-top.y*.5+.5)*this.height),footY:(-foot.y*.5+.5)*this.height,visible:top.z>-1&&top.z<1});}
    // Resolve labels in screen space; the hairline still points at the real head.
    for(const side of ['party','enemy']){
      const sorted=projected.filter(p=>view.actors.find(a=>a.id===p.id)?.side===side).sort((a,b)=>a.y-b.y||a.x-b.x);
      const placed:Anchor[]=[];
      for(const a of sorted){
        a.labelX=Math.max(58,Math.min(this.width-58,a.x));
        for(let attempt=0;attempt<12;attempt++){
          const clash=placed.find(b=>Math.abs(a.labelX-b.labelX)<114&&Math.abs(a.labelY-b.labelY)<52);
          if(!clash)break;
          const right=clash.labelX+114;
          if(right<this.width-58)a.labelX=right;
          else {a.labelX=Math.max(58,Math.min(this.width-58,a.x));a.labelY=clash.labelY+53;}
        }
        placed.push(a);
      }
    }
    this.onAnchors(projected);
  }
  private renderEffects(frame:EffectFrame|null,source:Puppet|undefined,targets:Puppet[],view:SceneView){
    this.particles.count=0;this.rings.forEach(r=>r.visible=false);this.streaks.forEach(l=>l.visible=false);this.signature.forEach(m=>m.visible=false);this.aura.intensity=0;let used=0;
    const sprite=(pos:T.Vector3,size:number,color:string,opacity:number)=>{if(used>=96)return;this.particleScale.set(size,size,1);this.particleMatrix.compose(pos,this.camera.quaternion,this.particleScale);this.particles.setMatrixAt(used,this.particleMatrix);this.particles.setColorAt(used,this.particleColor.set(color).multiplyScalar(Math.max(0,opacity)));used++;};
    const ring=(index:number,pos:T.Vector3,size:number,color:string,opacity:number,vertical=false)=>{const r=this.rings[index];if(!r)return;r.visible=true;r.position.copy(pos);r.scale.setScalar(size);r.rotation.x=vertical?0:-Math.PI/2;r.material.color.set(color);r.material.opacity=Math.max(0,opacity);};
    // Status residue remains readable even between actions, independent of frame rate.
    for(const a of view.actors){if(a.hp<=0)continue;const p=this.puppets.get(a.id);if(!p)continue;for(const s of a.statuses.slice(0,3)){if(s.kind==='burn'){for(let i=0;i<2;i++){const q=p.base.clone().add(new T.Vector3(Math.sin(this.time*2+i*3)*.3,.25+(this.time*.25+i*.3)%1,.1));sprite(q,.25,'#fc9c73',.65);}}else if(s.kind==='guard'){sprite(p.base.clone().add(new T.Vector3(0,.65,0)),1.5,GOLD,.10);}else if(s.kind==='snare'||s.kind==='restrain'){sprite(p.base.clone().add(new T.Vector3(0,.12,0)),1.4,s.kind==='snare'?VIOLET:'#ef8194',.35);}}}
    if(frame&&source){const start=source.root.position.clone().add(new T.Vector3(0,1,0));const end=(targets[0]?.root.position??source.root.position).clone().add(new T.Vector3(0,.8,0));const t=frame.progress,color=frame.color,kind=frame.beat.kind;
      this.aura.position.copy(start);this.aura.color.set(color);this.aura.intensity=view.reducedMotion?0:(kind==='impact'?3:frame.plan.ultimate?2:1);
      if(kind==='anticipation'){ring(0,source.base.clone().add(new T.Vector3(0,.08,0)),.5+t*.6,color,.4+t*.35);sprite(start,.4+t*.8,color,.3+t*.35);for(let i=0;i<8;i++){const a=i*Math.PI/4+this.time*1.2,r=(1-t)*.7+.2;sprite(start.clone().add(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.1)),.12,color,.65);}}
      if(kind==='travel'){const q=start.clone().lerp(end,ease(t));q.y+=Math.sin(t*Math.PI)*(frame.plan.shape==='flask'||frame.plan.shape==='patch'?1.3:.25);sprite(q,frame.plan.ultimate?.9:.46,color,.9);for(let j=0;j<16;j++){const u=Math.max(0,t-j*.015),r=start.clone().lerp(end,ease(u));r.y+=Math.sin(u*Math.PI)*(frame.plan.shape==='flask'||frame.plan.shape==='patch'?1.3:.25);sprite(r,.24*(1-j/18),color,(1-j/18)*.6);}const l=this.streaks[0]!;l.visible=true;l.material.color.set(color);const arr=l.geometry.attributes.position!;for(let i=0;i<24;i++){const u=t*i/23;const v=start.clone().lerp(end,ease(u));v.y+=Math.sin(u*Math.PI)*.5;arr.setXYZ(i,v.x,v.y,v.z);}arr.needsUpdate=true;l.geometry.computeBoundingSphere();}
      if(['impact','reaction','residue'].includes(kind)){const k=kind==='impact'?t*.25:kind==='reaction'?.25+t*.4:.65+t*.35;const points=targets.length?targets.map(p=>p.base):[source.base];points.slice(0,6).forEach((pos,j)=>{ring(j,pos.clone().add(new T.Vector3(0,.08,0)),.4+ease(k)*2,color,(1-k)*.9);sprite(pos.clone().add(new T.Vector3(0,.75,0)),(frame.plan.ultimate?1.9:1.3)*(1-k*.3),color,(1-k)*.36);for(let i=0;i<(frame.plan.ultimate?9:6);i++){const a=i*2.399+j,r=.2+ease(k)*(frame.plan.ultimate?1.5:.9);const q=pos.clone().add(new T.Vector3(Math.cos(a)*r,.45+Math.sin(k*Math.PI)*.9+(i%3)*.12,Math.sin(a)*r*.6));sprite(q,.1+(1-k)*.2,color,(1-k)*.85);}});}
      const shape=frame.plan.shape;
      if(kind==='travel'&&['flask','patch','shelter'].includes(shape)){const bottle=this.signature[0]!;bottle.geometry=this.signatureGeometry.flask!;bottle.visible=true;bottle.material.color.set(frame.plan.accent);bottle.material.opacity=.9;bottle.position.copy(start).lerp(end,ease(t));bottle.position.y+=Math.sin(t*Math.PI)*1.3;bottle.quaternion.copy(this.camera.quaternion);bottle.rotation.z=-t*Math.PI*1.5;bottle.scale.setScalar(.8);}
      if(kind!=='anticipation'&&kind!=='travel'){
        const centers=targets.length?targets.map(p=>p.base):[source.base];
        const family=['wall','rally','bash'].includes(shape)?'shield':['orb','storm'].includes(shape)?'flame':['shelter','patch'].includes(shape)?'flower':['flask','mend'].includes(shape)?'drop':shape==='thread'?'thread':'arc';
        centers.slice(0,3).forEach((pos,j)=>{for(let i=0;i<3;i++){const mesh=this.signature[j*3+i]!;mesh.geometry=this.signatureGeometry[family]!;mesh.visible=true;mesh.material.color.set(color);mesh.material.opacity=(kind==='residue'?1-t:1)*.7;mesh.position.copy(pos).add(new T.Vector3(0,.35+i*.28,0));mesh.scale.setScalar(.7+i*.15+t*.2);mesh.rotation.set(0,0,0);
          if(family==='shield'){mesh.quaternion.copy(this.camera.quaternion);mesh.scale.setScalar(.85+i*.16);mesh.position.y=.75;mesh.material.opacity*=i===0?1:.22;mesh.rotation.z=0;}
          else if(['shelter','mend','patch'].includes(shape)){mesh.rotation.x=shape==='patch'?Math.PI/2:Math.PI*.16;mesh.rotation.z=i*.4;mesh.position.y=.5+i*.25;}
          else if(family==='drop'){mesh.scale.setScalar(.23+(1-t)*.12);mesh.position.add(new T.Vector3(Math.sin(i*2.4)*.6,.7+t*.7,Math.cos(i*2.4)*.3));mesh.quaternion.copy(this.camera.quaternion);}
          else if(['thread','orb','storm'].includes(shape)){mesh.rotation.set(i*Math.PI/3,t*2+i,t+i);if(family==='flame'){mesh.quaternion.copy(this.camera.quaternion);mesh.rotation.z=Math.sin(t*Math.PI+i)*.14;mesh.scale.setScalar(.55+i*.14);mesh.position.x+=(i-1)*.42;mesh.position.y=.65+Math.sin(t*Math.PI)*.3;mesh.material.color.set(i===1?frame.plan.accent:color);}if(shape==='storm')mesh.position.y=.8+i*.18;}
          else {mesh.rotation.z=(shape==='cross'?i%2?-.7:.7:-.5)+t*.9;mesh.scale.y=.45;mesh.position.y=.8+i*.10;}
        }});
      }
    }
    this.particles.count=used;this.particles.instanceMatrix.needsUpdate=true;if(this.particles.instanceColor)this.particles.instanceColor.needsUpdate=true;
    this.stats.particles=used;
  }
  private disposePuppet(p:Puppet){p.mixer.stopAllAction();p.mixer.uncacheRoot(p.model);p.materials.forEach(m=>m.dispose());p.shadow.geometry.dispose();p.guard.geometry.dispose();(p.guard.material as T.Material).dispose();p.snare.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();o.material.dispose();}});}
  dispose(){this.disposed=true;cancelAnimationFrame(this.raf);this.resize.disconnect();document.removeEventListener('visibilitychange',this.visibility);this.renderer.domElement.removeEventListener('pointerup',this.pick);this.renderer.domElement.removeEventListener('webglcontextlost',this.lost);for(const p of this.puppets.values())this.disposePuppet(p);this.puppets.clear();this.geometryOwned.forEach(g=>g.dispose());this.materialOwned.forEach(m=>m.dispose());this.glow.dispose();this.blobMaterial.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
