import { isReadableBattle } from './look-b2';
import * as T from 'three';
import { createCardPrimitive, type CardEffectPrimitive } from './card-effect-primitives';
export const BOSS_PERFORMANCE_SECONDS = { intro: 1.14, phase: .30 } as const;
export const BOSS_STYLES:Record<string,{primitive:CardEffectPrimitive;color:string}>={
 'yarn-giant':{primitive:'spindle',color:'#c899b0'},
 'rain-spool':{primitive:'droplet',color:'#92c7e5'},
 'pantry-crown':{primitive:'serving-bell',color:'#dcc48c'},
};
/** Read-only beat selection; never changes battle clocks, HP or phase rules. */
export function bossPerformance(age:number,phaseAge:number,reduced:boolean){
 if(reduced)return null;
 if(phaseAge>=0&&phaseAge<BOSS_PERFORMANCE_SECONDS.phase)return{clip:'boss-phase',progress:phaseAge/BOSS_PERFORMANCE_SECONDS.phase};
 if(age>=0&&age<BOSS_PERFORMANCE_SECONDS.intro)return{clip:'boss-intro',progress:age/BOSS_PERFORMANCE_SECONDS.intro};
 return null;
}
/** One active instanced draw replaces seven continuously drawn generic rings. */
export class CardBossAtmosphere{
 private disposed=false;
 private motes:T.InstancedMesh<T.BufferGeometry,T.MeshBasicMaterial>;
 readonly root=new T.Group();private meshes=new Map<string,T.InstancedMesh<T.BufferGeometry,T.MeshBasicMaterial>>();private transform=new T.Object3D();
 constructor(){
  this.root.name='original-boss-floor-emblems';
  this.motes=new T.InstancedMesh(createCardPrimitive('spark'),new T.MeshBasicMaterial({color:'#ffd899',transparent:true,opacity:.62,depthWrite:false,blending:T.AdditiveBlending}),7);
  this.motes.name='illustrated-boss-embers';this.motes.frustumCulled=false;this.motes.visible=false;this.root.add(this.motes);
  for(const [id,style]of Object.entries({...BOSS_STYLES,...(isReadableBattle()?{'kettle-knight':{primitive:'teapot' as const,color:'#d9a2b6'}}:{})})){
   const mesh=new T.InstancedMesh(createCardPrimitive(style.primitive),new T.MeshBasicMaterial({color:style.color,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide}),5);
   mesh.frustumCulled=false;mesh.visible=false;this.meshes.set(id,mesh);this.root.add(mesh);
  }
 }
 update(asset:string|undefined,position:T.Vector3|undefined,phase:number,beat:number,reduced:boolean,illustratedTime?:number){
  this.motes.visible=!!asset&&this.meshes.has(asset)&&!!position&&!reduced&&illustratedTime!==undefined;
  if(this.motes.visible){
   this.motes.material.color.set(asset==='rain-spool'?'#9ce7ff':'#ffd899');
   for(let i=0;i<7;i++){
    const t=illustratedTime!*.16+i*.143,life=t%1,angle=i*2.4+illustratedTime!*.17;
    this.transform.position.set(position!.x+Math.cos(angle)*(1.0+life*.35),.25+life*2.65,position!.z+Math.sin(angle)*.45+.25);
    this.transform.rotation.set(0,0,angle);this.transform.scale.setScalar(.035+.045*Math.sin(life*Math.PI));
    this.transform.updateMatrix();this.motes.setMatrixAt(i,this.transform.matrix);
   }
   this.motes.instanceMatrix.needsUpdate=true;
  }
  for(const [id,mesh]of this.meshes){
   mesh.visible=id===asset&&!!position;if(!mesh.visible)continue;
   mesh.material.opacity=phase>1?.24:.13;
   const pulse=reduced?0:Math.sin(Math.max(0,Math.min(1,beat))*Math.PI)*.25;
   for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5;this.transform.position.set(position!.x+Math.cos(angle)*(1.35+pulse),.047,position!.z+Math.sin(angle)*(1.35+pulse));
    this.transform.rotation.set(-Math.PI/2,0,angle+Math.PI/2);this.transform.scale.setScalar(.25+pulse*.2);this.transform.updateMatrix();mesh.setMatrixAt(i,this.transform.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;
  }
 }
 dispose(){
  if(this.disposed)return;
  this.disposed=true;
  this.motes.geometry.dispose();this.motes.material.dispose();this.motes.dispose();
  for(const mesh of this.meshes.values()){mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();}
  this.root.removeFromParent();this.meshes.clear();
 }
}
