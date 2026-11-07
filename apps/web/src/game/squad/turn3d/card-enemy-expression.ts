import * as T from 'three';
import { CARD_EXPRESSIONS, type CardExpression } from './card-face';
/** Expressive existing sockets: zero new draw calls and each enemy keeps its silhouette. */
export class CardEnemyExpression {
 private eyes?:T.Object3D;private mouth?:T.Object3D;private left?:T.Object3D;private right?:T.Object3D;
 private eyeScale=new T.Vector3();private mouthScale=new T.Vector3();private eyeX=0;private offset=0;
 constructor(model:T.Object3D,role:string,asset:string){
  this.eyes=model.getObjectByName(`${role}_eyes`);this.mouth=model.getObjectByName(`${role}_mouth`);
  this.left=model.getObjectByName(`${role}_browL`);this.right=model.getObjectByName(`${role}_browR`);
  this.offset=[...asset].reduce((n,c)=>n+c.charCodeAt(0),0)%17/4;
  if(this.eyes){this.eyeScale.copy(this.eyes.scale);this.eyeX=this.eyes.position.x;}
  if(this.mouth)this.mouthScale.copy(this.mouth.scale);
 }
 animate(expression:CardExpression,time:number,yaw:number,reduced:boolean){
  const shape=CARD_EXPRESSIONS[expression],cycle=(time+this.offset)%5.7;
  const blink=reduced?1:1-.90*Math.exp(-Math.pow((cycle-5.2)/.07,2));
  if(this.eyes){this.eyes.scale.set(this.eyeScale.x,this.eyeScale.y*shape.eye*blink,this.eyeScale.z);this.eyes.position.x=this.eyeX+T.MathUtils.clamp(yaw,-.6,.6)*.024;}
  if(this.left)this.left.rotation.z=shape.brow;if(this.right)this.right.rotation.z=-shape.brow;
  if(this.mouth)this.mouth.scale.set(this.mouthScale.x*shape.width,this.mouthScale.y*shape.mouth,this.mouthScale.z);
 }
 dispose(){/* Existing model sockets are released by the puppet owner. */}
}
