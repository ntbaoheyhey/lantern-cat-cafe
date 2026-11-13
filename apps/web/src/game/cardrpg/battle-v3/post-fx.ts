import * as T from 'three';
import {EffectComposer,RenderPass,EffectPass,ShockWaveEffect,ChromaticAberrationEffect,VignetteEffect,LUT3DEffect,LookupTexture,BlendFunction} from 'postprocessing';
import {sequenceAt,SIGNATURES,type Signature} from './sequence';
import type {EffectPlan} from '../../squad/turn3d/effects';

/** One composer for the field; plates are pre-rendered and require no additional GPU stack. */
export class BattlePostFx {
 readonly composer:EffectComposer;
 private shock:ShockWaveEffect;
 private aberration=new ChromaticAberrationEffect({offset:new T.Vector2(),radialModulation:true,modulationOffset:.15});
 private vignette=new VignetteEffect({darkness:.2,offset:.35});
 private lut=new LUT3DEffect(LookupTexture.createNeutral(16));
 private colorPass:EffectPass;
 private grades=new Map<string,LookupTexture>();
 private impactPlan:EffectPlan|null=null;
 constructor(private renderer:T.WebGLRenderer,private scene:T.Scene,private camera:T.Camera){
  this.composer=new EffectComposer(renderer,{multisampling:0});
  this.shock=new ShockWaveEffect(camera,new T.Vector3(),{speed:3,maxRadius:.8,waveSize:.12,amplitude:.025});
  this.lut.blendMode.opacity.value=0;
  this.composer.addPass(new RenderPass(scene,camera));
  this.colorPass=new EffectPass(camera,this.aberration,this.vignette,this.lut);
  this.composer.addPass(new EffectPass(camera,this.shock));this.composer.addPass(this.colorPass);
 }
 resize(w:number,h:number){this.composer.setSize(w,h);}
 private grade(signature:Signature){
  const key=signature.element.grade;let lut=this.grades.get(key);if(lut)return lut;
  lut=LookupTexture.createNeutral(16);const data=lut.image.data as Float32Array;
  const color=new T.Color(signature.element.palette[1]);
  for(let i=0;i<data.length;i+=4){data[i]=Math.min(1,data[i]!*.96+color.r*.04);data[i+1]=Math.min(1,data[i+1]!*.96+color.g*.04);data[i+2]=Math.min(1,data[i+2]!*.96+color.b*.04);}
  lut.needsUpdate=true;this.grades.set(key,lut);return lut;
 }
 render(plan:EffectPlan|null,elapsed:number,delta:number,quality:string,reduced:boolean,_caster?:T.Object3D,impact?:T.Vector3){
  // The Low preset keeps full-resolution painted actors and numbers, while
  // avoiding offscreen colour/bloom buffers and secondary post-processing.
  if(quality==='low'){this.renderer.render(this.scene,this.camera);return;}
  const state=plan?sequenceAt(plan,elapsed,reduced):null,high=quality!=='low';
  // Bloom belongs to the isolated 2D effect canvas. Actor textures keep their
  // authored colour and opacity even during the brightest active skills.
  this.aberration.blendMode.blendFunction=high&&!reduced?BlendFunction.NORMAL:BlendFunction.SKIP;
  const since=elapsed-(state?.seq.impact??plan?.beats[2]?.start??Infinity),crit=plan?.events.some(e=>e.critical);
  const spike=crit&&since>=0&&since<100?.006*(1-since/100):0;
  this.aberration.offset.setScalar(high&&!reduced?Math.max(spike,state?.post.aberration??0):0);
  this.vignette.darkness=state?.post.vignette??.2;
  this.shock.amplitude=reduced?.0125:.025;
  if(state&&plan&&state.seq.tier==='ultimate'&&elapsed>=state.seq.impact&&this.impactPlan!==plan){if(impact)this.shock.position.copy(impact);this.shock.explode();this.impactPlan=plan;}
  const owner=plan?(plan.presentationId??plan.skillId).replace(/^enemy:/,'').replace(/-[1-4]$/,''):'';
  const signature=SIGNATURES.get(owner);this.lut.blendMode.opacity.value=signature&&state?.seq.tier==='ultimate'?1:0;
  if(signature)this.lut.lut=this.grade(signature);
  this.composer.render(delta);
 }
 dispose(){this.composer.dispose();for(const lut of this.grades.values())lut.dispose();}
}
