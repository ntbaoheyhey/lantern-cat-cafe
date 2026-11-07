/** Original socket attachments. One merged draw per item, independent of real inventory. */
import * as T from 'three';
import type {EquipmentAppearance, VisualItem} from './appearance';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ITEM_BY_ID} from '@taskbar-hero/game-rules/src/squad/gear/catalog';
import type {TurnActor} from '@taskbar-hero/game-rules/src/squad/turn/types';
const rarity={Common:'#bfb5a3',Uncommon:'#9aba8b',Rare:'#8fc2e5',Epic:'#c8a2f0',Legendary:'#ffce78'};
const colors={guardian:['#ebc189','#557b75','#e5a44e','#f3d992'],witch:['#765589','#b595c6','#586791','#9d7ac9'],alchemist:['#80bda2','#4b8f85','#e0b997','#a4cea0']};
const cardDesigns = new Set(['doorstop', 'nightglass', 'seedcup', 'rainbell', 'crumbbook', 'panlid', 'warmwick', 'silkspool', 'starladle', 'softcollar', 'tidetray', 'gardenkey']);
interface Piece {group:T.Group;geometry:T.BufferGeometry;material:T.MeshStandardMaterial}
function createPiece(item:VisualItem,role:string,atelier=false):Piece{
 const group=new T.Group(),parts:T.BufferGeometry[]=[];group.name=`gear_${item.id}`;group.userData.itemId=item.id;
 const color=(colors[role as keyof typeof colors]??colors.guardian)[item.visual%4]!,gold='#e6b875',ivory='#f8e7c5',dark='#3a3043',accent=rarity[item.rarity];
 const add=(g:T.BufferGeometry,c:string,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0])=>{const q=g.index?g.toNonIndexed():g.clone();g.dispose();q.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...pos),new T.Quaternion().setFromEuler(new T.Euler(...rot)),new T.Vector3(...scale)));q.deleteAttribute('uv');const a=new Float32Array(q.attributes.position!.count*3),rgb=new T.Color(c);for(let i=0;i<a.length;i+=3){a[i]=rgb.r;a[i+1]=rgb.g;a[i+2]=rgb.b}q.setAttribute('color',new T.BufferAttribute(a,3));parts.push(q)};
 const ball=(c:string,pos:number[],s:number[])=>add(new T.SphereGeometry(1,16,10),c,pos,s);
 const rod=(c:string,from:number[],to:number[],r=.025)=>{const a=new T.Vector3(...from),b=new T.Vector3(...to),d=b.clone().sub(a),g=new T.CylinderGeometry(r,r,d.length(),10);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()));add(g,c,a.add(b).multiplyScalar(.5).toArray())};
 const ring=(c:string,pos:number[],r:number,t=.025,rot=[0,0,0])=>add(new T.TorusGeometry(r,t,6,24),c,pos,[1,1,1],rot);
 const leaf=(c:string,pos:number[],size:number,angle=0)=>{const sh=new T.Shape();sh.moveTo(0,-size*.4);sh.bezierCurveTo(-size*.6,0,-size*.25,size*.5,0,size*.7);sh.bezierCurveTo(size*.25,size*.5,size*.6,0,0,-size*.4);add(new T.ExtrudeGeometry(sh,{depth:.025,bevelEnabled:true,bevelSize:.012,bevelThickness:.01,bevelSegments:2,steps:1,curveSegments:8}),c,pos,[1,1,1],[0,0,angle])};
 const star=(c:string,pos:number[],r=.15)=>{const s=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,rr=i%2?r*.45:r;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?s.lineTo(x,y):s.moveTo(x,y)}s.closePath();add(new T.ExtrudeGeometry(s,{depth:.04,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2,steps:1}),c,pos)};
 if(atelier && item.slot==='outfit'){
  // Equipment becomes a fitted enamel brooch, leaving the authored cloth visible.
  // The visual/rarity identity remains on the actor; inventory and rules are untouched.
  ball(color,[0,0,0],[.064,.074,.018]);
  ring(gold,[0,0,.013],.058,.008);
  if(item.visual%3===0)star(accent,[0,0,.031],.037);
  else if(item.visual%3===1)leaf(accent,[0,-.012,.031],.058,-.3);
  else {for(const x of [-.018,.018])ball(ivory,[x,0,.035],[.009,.009,.007]);}
  group.position.set(-.16,.17,.29);group.userData.cardDesign=item.cardDesign;
 }else if(item.cardDesign && cardDesigns.has(item.cardDesign)){
  // Each named card-RPG heirloom owns its silhouette. These are original cafe objects.
  const designs: Record<string, () => void> = {
   doorstop: () => {
    add(new RoundedBoxGeometry(.36,.18,.28,2,.025),color,[0,.15,0]);
    add(new T.ConeGeometry(.18,.28,3),gold,[0,.35,0],[1,1,.7],[0,0,Math.PI/2]);
    ring(ivory,[0,.14,.16],.065,.013);
   },
   nightglass: () => {
    rod(gold,[0,-.15,0],[0,.5,0],.018);
    add(new T.OctahedronGeometry(.18,0),accent,[0,.52,0],[.6,1.5,.5]);
    ring(ivory,[0,.38,0],.16,.012,[0,.7,0]);
   },
   seedcup: () => {
    add(new T.CylinderGeometry(.19,.13,.24,20),ivory,[0,.17,0]);
    ring(gold,[0,.3,0],.19,.016,[Math.PI/2,0,0]);
    rod(color,[0,.3,0],[0,.61,0],.02);
    leaf(accent,[-.07,.46,0],.18,-.8);leaf(color,[.07,.57,0],.17,.7);
   },
   rainbell: () => {
    add(new T.LatheGeometry([new T.Vector2(.24,0),new T.Vector2(.18,.07),new T.Vector2(.14,.27),new T.Vector2(0,.34)],24),gold,[0,.08,0]);
    ring(ivory,[0,.48,0],.07,.018);ball(accent,[0,.04,0],[.055,.08,.055]);
    for(const side of [-1,1])rod(accent,[side*.12,.22,0],[side*.26,-.12,0],.012);
   },
   crumbbook: () => {
    add(new RoundedBoxGeometry(.38,.46,.09,2,.025),color,[0,.25,0]);
    add(new RoundedBoxGeometry(.31,.39,.07,2,.015),ivory,[.02,.25,.045]);
    rod(gold,[-.14,.02,.09],[-.14,.48,.09],.025);
    for(let i=0;i<3;i++)ball(gold,[(i-1)*.085,.28,.1],[.025,.025,.015]);
   },
   panlid: () => {
    add(new T.CylinderGeometry(.27,.24,.07,32),color,[0,.24,0],[1,1,1],[Math.PI/2,0,0]);
    ring(gold,[0,.24,.05],.25,.02);ring(ivory,[0,.24,.08],.07,.024,[Math.PI/2,0,0]);
    rod(dark,[0,-.18,0],[0,.01,0],.035);
   },
   warmwick: () => {
    add(new T.CylinderGeometry(.12,.15,.33,16),ivory,[0,.19,0]);
    ring(gold,[0,.02,0],.19,.03,[Math.PI/2,0,0]);
    leaf('#ffbd76',[0,.49,0],.25);leaf(ivory,[0,.48,.035],.14);
   },
   silkspool: () => {
    add(new T.CylinderGeometry(.15,.15,.35,20),accent,[0,.22,0]);
    for(const y of [.03,.41])add(new T.CylinderGeometry(.23,.23,.055,20),gold,[0,y,0]);
    for(let i=0;i<5;i++)ring(ivory,[0,.08+i*.065,0],.153,.01,[Math.PI/2,0,0]);
    rod(gold,[.2,-.1,0],[-.12,.55,0],.014);
   },
   starladle: () => {
    rod(gold,[0,-.18,0],[0,.38,0],.022);
    ball(ivory,[0,.5,0],[.21,.15,.07]);star(accent,[0,.5,.075],.12);
    ring(gold,[0,.5,.04],.19,.015);
   },
   softcollar: () => {
    ring(color,[0,.23,0],.22,.055);ring(gold,[0,.23,.035],.22,.01);
    for(const side of [-1,1])leaf(ivory,[side*.12,.01,.03],.19,side*.9);
    ball(accent,[0,.01,.07],[.06,.06,.04]);
   },
   tidetray: () => {
    add(new RoundedBoxGeometry(.48,.32,.05,3,.08),ivory,[0,.24,0]);
    for(const side of [-1,1])ring(gold,[side*.29,.24,0],.075,.018);
    for(let i=0;i<3;i++)rod(accent,[-.14,.16+i*.07,.04],[.14,.20+i*.07,.04],.012);
   },
   gardenkey: () => {
    ring(gold,[0,.43,0],.14,.03);rod(gold,[0,-.13,0],[0,.3,0],.025);
    for(const y of [-.09,.01])rod(gold,[0,y,0],[.13,y,0],.027);
    leaf(color,[-.11,.48,.03],.16,-.7);leaf(accent,[.1,.5,.03],.15,.7);
   },
  };
  designs[item.cardDesign]?.();
  group.userData.cardDesign=item.cardDesign;
  if(item.slot==='outfit'){group.scale.setScalar(.85);group.position.set(0,-.2,.39);}
  if(item.slot==='charm'){group.scale.setScalar(.45);group.position.set(0,-.22,.08);}
  if(item.slot==='relic'){group.scale.setScalar(.6);group.position.y=-.3;}
 }else if(item.slot==='weapon'){
  const family=item.id[0],v=item.visual%4;
  if(family==='g'){
   rod(dark,[0,-.2,0],[0,.45,0],.035);
   if(v===0){ball(gold,[0,.47,0],[.15,.19,.065]);ball(ivory,[0,.47,.05],[.11,.14,.022])}
   if(v===1){add(new T.CylinderGeometry(.24,.22,.065,28),color,[0,.43,0],[1,1,1],[Math.PI/2,0,0]);ring(gold,[0,.43,.05],.22,.02);star(ivory,[0,.43,.07],.075)}
   if(v===2){add(new T.LatheGeometry([new T.Vector2(.2,0),new T.Vector2(.19,.05),new T.Vector2(.12,.25),new T.Vector2(0,.29)],24),gold,[0,.26,0]);ball(accent,[0,.27,0],[.06,.06,.06]);ring(color,[0,.59,0],.06,.02)}
   if(v===3){star(gold,[0,.55,0],.27);ring(ivory,[0,.55,.04],.12,.02);ball(accent,[0,.55,.05],[.06,.07,.035]);for(const s of [-1,1])rod(accent,[s*.17,.35,0],[s*.17,.10,0],.015)}
  }else if(family==='w'){
   rod(gold,[0,-.2,0],[0,.5,0],.027);
   if(v===0){leaf(color,[-.06,.42,0],.16,-.4);ball(accent,[0,.53,0],[.055,.08,.055])}
   if(v===1)for(let i=0;i<3;i++)ring(ivory,[0,.48,0],.13,.014,[0,i*Math.PI/3,0]);
   if(v===2){add(new RoundedBoxGeometry(.26,.31,.19,2,.025),color,[0,.43,0]);add(new RoundedBoxGeometry(.16,.19,.21,2,.015),ivory,[0,.43,0]);for(const s of [-1,1])rod(gold,[s*.12,.25,.11],[s*.12,.61,.11],.02);ring(gold,[0,.67,0],.06,.014)}
   if(v===3){for(let i=0;i<3;i++)ring(accent,[0,.51,0],.19,.015,[i*.9,i*.65,0]);star(ivory,[0,.51,0],.11);ball(color,[0,.51,0],[.06,.06,.06])}
  }else{
   const points=[new T.Vector2(0,-.18),new T.Vector2(.13,-.16),new T.Vector2(.17,-.02),new T.Vector2(.12,.16),new T.Vector2(.055,.23),new T.Vector2(.055,.34)];
   add(new T.LatheGeometry(points,24),v===3?'#a7d3ab':color,[0,.13,0]);add(new T.CylinderGeometry(.065,.065,.05,14),gold,[0,.47,0]);ball(ivory,[-.08,.15,.12],[.025,.09,.014]);ring(gold,[.17,.2,0],.11,.018,[0,Math.PI/2,0]);
   if(v===1){rod(gold,[.1,.22,0],[.24,.34,0],.04);ball(accent,[.25,.36,0],[.045,.04,.045])}
   if(v===2){rod(ivory,[-.12,.23,0],[-.27,.35,0],.05);leaf(gold,[0,.15,.15],.12)}
   if(v===3){for(let i=0;i<3;i++)leaf(accent,[(i-1)*.085,.5,0],.18,(i-1)*.7);ring(gold,[0,.04,0],.15,.018,[Math.PI/2,0,0])}
  }
 }else if(item.slot==='outfit'){
  const v=item.visual%4,shape=new T.Shape();shape.moveTo(-.22,.18);shape.quadraticCurveTo(0,.07,.22,.18);shape.lineTo(.30,-.36);for(let i=0;i<=6;i++){const x=.3-i*.1;shape.lineTo(x,-.36+(i%2?.04:0))}shape.closePath();
  add(new T.ExtrudeGeometry(shape,{depth:.05,bevelEnabled:true,bevelSize:.024,bevelThickness:.018,bevelSegments:3,steps:1,curveSegments:12}),color,[0,0,.33]);
  for(const x of [-.23,.23])rod(gold,[x,.12,.40],[x*1.12,-.3,.40],.011);
  if(v===0){add(new RoundedBoxGeometry(.23,.13,.035,2,.02),ivory,[0,-.2,.40]);for(let i=0;i<5;i++)rod(gold,[-.09+i*.045,-.22,.43],[-.08+i*.045,-.19,.43],.005)}
  if(v===1){for(let i=0;i<3;i++)for(let j=0;j<3;j++)add(new RoundedBoxGeometry(.10,.1,.026,1,.01),i%2?ivory:gold,[-.12+i*.12,-.25+j*.13,.40],[1,1,1],[0,0,.15]);}
  if(v===2){for(const side of [-1,1]){ball(color,[side*.32,.13,.02],[.22,.1,.28]);leaf(accent,[side*.18,-.2,.42],.17,side*.3)}star(gold,[0,.10,.43],.06)}
  if(v===3){for(const side of [-1,1]){ball(ivory,[side*.31,.17,.02],[.19,.08,.25]);for(let i=0;i<3;i++)star(accent,[side*.17,-.07-i*.11,.42],.035)}ring(gold,[0,.08,.42],.06,.012)}
 }else if(item.slot==='charm'){
  ring(gold,[0,0,0],.12,.012,[Math.PI/2,0,0]);
  if(item.id==='c-button'){add(new T.CylinderGeometry(.085,.085,.03,20),color,[0,-.07,.08],[1,1,1],[Math.PI/2,0,0]);for(const x of [-.025,.025])for(const y of [-.045,-.09])ball(dark,[x,y,.104],[.012,.012,.004])}
  if(item.id==='c-bell'){ball(gold,[0,-.08,.07],[.08,.095,.07]);ring(accent,[0,-.12,.07],.07,.012,[Math.PI/2,0,0]);ball(dark,[0,-.17,.07],[.025,.025,.025])}
  if(item.id==='c-leaf'){leaf(accent,[0,-.08,.1],.16,.3);rod(gold,[0,-.14,.125],[.025,.01,.125],.006)}
 }else{
  ring(gold,[0,0,0],.10,.015);rod(gold,[0,-.05,0],[0,-.16,0],.012);
  if(item.id==='r-wick'){star(accent,[0,-.23,0],.13);ball(ivory,[0,-.23,.04],[.04,.04,.025])}
  if(item.id==='r-cup'){add(new T.CylinderGeometry(.13,.10,.035,24),ivory,[0,-.23,0],[1,1,1],[Math.PI/2,0,0]);ring(gold,[0,-.23,.025],.10,.012)}
  if(item.id==='r-snow'){add(new T.OctahedronGeometry(.14,1),accent,[0,-.23,0],[.8,1.3,.7]);for(let i=0;i<3;i++)ring(ivory,[0,-.23,0],.17,.008,[i*Math.PI/3,0,0])}
 }
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingSphere();
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:item.slot==='outfit'?.86:.38,metalness:item.slot==='outfit'?0:.35,emissive:accent,emissiveIntensity:item.rarity==='Legendary'?.14:item.rarity==='Epic'?.07:0});group.add(new T.Mesh(geometry,material));return {group,geometry,material};
}
/** A renderer owns the prepared item resources until its run ends. Releasing a
 * preview must not evict the last gear shader just before the next preview. */
export class GearResources{
 private items=new Map<string,Piece>();
 acquire(item:VisualItem,role:string,atelier=false):Piece{
  const key=JSON.stringify([role,item,atelier]);let piece=this.items.get(key);
  if(!piece){piece=createPiece(item,role,atelier);this.items.set(key,piece)}
  return {...piece,group:piece.group.clone(true)};
 }
 dispose(){for(const piece of this.items.values()){piece.geometry.dispose();piece.material.dispose()}this.items.clear()}
}
export class GearAttachments{
 private pieces:Piece[]=[];private key='';private lastEquipment:TurnActor["equipment"]={};private lastSets:string[]=[];private lastAppearance?:EquipmentAppearance;private aura:T.Mesh|null=null;
 constructor(private model:T.Group,private role:string,private resources:GearResources){}
 update(actor:TurnActor,appearance?:EquipmentAppearance){
  let sameSets=actor.setBonuses.length===this.lastSets.length;for(let i=0;sameSets&&i<this.lastSets.length;i++)sameSets=actor.setBonuses[i]===this.lastSets[i];
  const e=actor.equipment,o=this.lastEquipment;if(this.key&&sameSets&&appearance===this.lastAppearance&&e.weapon===o.weapon&&e.outfit===o.outfit&&e.charm===o.charm&&e.relic===o.relic)return;
  this.lastEquipment={...e};this.lastSets=[...actor.setBonuses];this.lastAppearance=appearance;
  const key=JSON.stringify([actor.equipment,actor.setBonuses,appearance]);if(key===this.key)return;this.clear();this.key=key;
  const atelier=this.model.userData.lookV2===true;
  // Atelier props are part of the authored silhouette; fitted equipment tokens
  // preserve the selected item without replacing the hands with legacy geometry.
  if(!atelier){
   for(const name of ['ladle','wand','lantern','satchel']){const o=this.model.getObjectByName(`${this.role}_${name}`);if(o)o.visible=false}
   this.model.traverse(o=>{if(o.name.includes('armR_flask'))o.visible=false});
  }
  for(const [slot,value] of Object.entries(appearance??actor.equipment)){const item=typeof value==='string'?ITEM_BY_ID[value]:value;const id=item?.id;if(!item)continue;const p=this.resources.acquire(item,this.role,atelier);const socket=slot==='weapon'?'mainHand':slot==='charm'?'neck':slot==='relic'?'tail':'back';
   if(atelier && slot==='weapon'){p.group.scale.multiplyScalar(.28);p.group.position.add(new T.Vector3(.13,-.12,.12));}
   const parent=this.model.getObjectByName(slot==='outfit'?`${this.role}_body`:`${this.role}_socket_${socket}`)??this.model;parent.add(p.group);this.pieces.push(p);
   if(slot==='outfit'){
    // Tint the original garment consistently while preserving fur/face vertex color.
    const cloak=this.model.getObjectByName(`${this.role}_hat`);if(cloak)cloak.userData.outfitId=id;
   }
  }
  if(actor.setBonuses.length){const count=Math.max(...actor.setBonuses.map(x=>Number(x.split(':')[1]))),material=new T.MeshBasicMaterial({color:actor.role==='witch'?'#bea1ed':actor.role==='alchemist'?'#9bd9b4':'#edc57d',transparent:true,opacity:.22,depthWrite:false});this.aura=new T.Mesh(new T.TorusGeometry(.42,.012,5,count===3?6:32),material);this.aura.rotation.x=Math.PI/2;this.aura.position.y=.09;this.model.add(this.aura)}
 }
 animate(time:number){if(this.aura)this.aura.rotation.z=time*.22;for(const p of this.pieces)if(p.group.name.includes('gear_r-'))p.group.rotation.z=Math.sin(time*1.2)*.08}
 private clear(){for(const p of this.pieces){p.group.removeFromParent()}this.pieces=[];if(this.aura){this.aura.removeFromParent();this.aura.geometry.dispose();(this.aura.material as T.Material).dispose();this.aura=null}}
 dispose(){this.clear()}
}
export function gearAccent(actor:TurnActor|undefined):string|undefined{if(!actor)return;const item=ITEM_BY_ID[actor.equipment.weapon??''];return item&&['Legendary','Epic'].includes(item.rarity)?rarity[item.rarity]:undefined}
