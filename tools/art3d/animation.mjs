// Original eased rigid-bone keyframes. No motion library or sampled animation.
import { THREE as T } from './geometry.mjs';
export const CLIPS=['idle','ready','walk-in','attack','skill1','skill2','skill3','ultimate','cast','hit','heavy-hit','guard','heal-receive','KO','victory','telegraph','spawn','taunt','step','special','stagger','down'];
function sample(times,values,quaternion=false){
 const outT=[],outV=[];
 for(let i=0;i<times.length-1;i++)for(let j=0;j<5;j++){
  const t=j/5,e=t*t*(3-2*t);outT.push(T.MathUtils.lerp(times[i],times[i+1],t));
  if(quaternion)outV.push(...new T.Quaternion(...values[i]).slerp(new T.Quaternion(...values[i+1]),e).toArray());
  else outV.push(...values[i].map((v,k)=>T.MathUtils.lerp(v,values[i+1][k],e)));
 }
 outT.push(times.at(-1));outV.push(...values.at(-1));return [outT,outV];
}
export function animate(r){
 const p=r.parts,tracks=[];
 const position=(node,times,offsets)=>{if(node){const [t,v]=sample(times,offsets.map(a=>a.map((n,i)=>n+node.position.toArray()[i])));tracks.push(new T.VectorKeyframeTrack(`${node.name}.position`,t,v))}};
 const rotation=(node,times,angles)=>{if(node){const [t,v]=sample(times,angles.map(a=>new T.Quaternion().setFromEuler(new T.Euler(...a)).toArray()),true);tracks.push(new T.QuaternionKeyframeTrack(`${node.name}.quaternion`,t,v))}};
 const scale=(node,times,values)=>{if(node){const [t,v]=sample(times,values.map(a=>a.map((n,i)=>n*node.scale.toArray()[i])));tracks.push(new T.VectorKeyframeTrack(`${node.name}.scale`,t,v))}};
 const face=(times,eyes,brow,mouth)=>{scale(p.eyes,times,eyes.map(y=>[1,y,1]));rotation(p.browL,times,brow.map(z=>[0,0,z]));rotation(p.browR,times,brow.map(z=>[0,0,-z]));scale(p.mouth,times,mouth.map(y=>[1,y,1]))};
 return CLIPS.map(name=>{
  tracks.length=0;let duration=1;
  const kind={step:'walk-in',special:'ultimate',stagger:'heavy-hit',down:'KO',spawn:'walk-in',taunt:'telegraph'}[name]??name;
  if(kind==='idle'||kind==='ready'){
   duration=2.8;position(p.spine,[0,1.4,2.8],[[0,0,0],[0,.018,0],[0,0,0]]);scale(p.body,[0,1.4,2.8],[[1,1,1],[1.018,1.02,1.018],[1,1,1]]);
   rotation(p.tail,[0,1.4,2.8],[[0,-.09,0],[0,.09,0],[0,-.09,0]]);rotation(p.tailMid,[0,.7,2,2.8],[[0,.07,0],[.05,-.08,0],[0,.1,0],[0,.07,0]]);rotation(p.tailTip,[0,1,2,2.8],[[0,0,.08],[0,0,-.1],[0,0,.12],[0,0,.08]]);
   rotation(p.earL,[0,.4,1,2.8],[[0,0,0],[.04,0,.06],[0,0,0],[0,0,0]]);rotation(p.earR,[0,1.5,1.7,2,2.8],[[0,0,0],[0,0,0],[.06,0,-.08],[0,0,0],[0,0,0]]);
   scale(p.eyes,[0,1.88,1.94,2.04,2.8],[[1,1,1],[1,1,1],[1,.08,1],[1,1,1],[1,1,1]]);
   rotation(p.head,[0,1.4,2.8],[[0,0,-.02],[.015,.025,.02],[0,0,-.02]]);
   for(const side of [-1,1])rotation(p[side<0?'wingL':'wingR'],[0,.7,1.4,2.1,2.8],[[0,-.12*side,0],[0,.16*side,0],[0,-.12*side,0],[0,.16*side,0],[0,-.12*side,0]]);
   if(kind==='ready'){rotation(p.armR,[0,1.4,2.8],[[-.18,0,-.1],[-.24,0,-.13],[-.18,0,-.1]]);rotation(p.browL,[0,2.8],[[0,0,-.12],[0,0,-.12]]);rotation(p.browR,[0,2.8],[[0,0,.12],[0,0,.12]])}
  }else if(kind==='walk-in'){
   duration=1.2;const t=[0,.2,.4,.6,.8,1,1.2];position(r.motion,t,[[0,0,-.35],[0,.06,-.28],[0,0,-.22],[0,.06,-.16],[0,0,-.1],[0,.035,-.03],[0,0,0]]);
   for(const side of [-1,1])rotation(p[side<0?'footL':'footR'],t,t.map((_,i)=>[i===6?0:Math.sin(i*Math.PI/2)*side*.35,0,0]));
   scale(p.body,[0,.9,1,1.2],[[1,1,1],[1,1,1],[1.05,.92,1.05],[1,1,1]]);
  }else if(['attack','cast','skill1','skill2','skill3','ultimate','telegraph'].includes(kind)){
   const variant={attack:0,cast:1,skill1:2,skill2:3,skill3:4,ultimate:5,telegraph:6}[kind];
   duration=kind==='ultimate'?1.65:kind==='telegraph'?1.25:1.05;const t=[0,duration*.24,duration*.46,duration*.57,duration*.76,duration];
   const arc=variant%2?1:-1,power=kind==='ultimate'?1.2:1;
   rotation(p.armR,t,[[0,0,0],[.2,.1,-.25],[-1.35,-.2,-.35*arc],[-1.65,.15,.15*arc],[.3,0,.14],[0,0,0]]);
   rotation(p.armL,t,[[0,0,0],[-.2,0,.15],[-.6,0,.5],[variant===0?-.3:-1.15,0,.65],[.2,0,-.1],[0,0,0]]);
   rotation(p.head,t,[[0,0,0],[.14,-.12,-.04],[-.08,.08,.03],[-.14,.12,0],[.05,-.04,0],[0,0,0]]);
   rotation(r.motion,t,[[0,0,0],[.12,-.18*arc,.04],[-.08,.2*arc,-.04],[-.15,.3*arc,0],[.07,-.08*arc,0],[0,0,0]]);
   position(r.motion,t,[[0,0,0],[0,-.055,-.1],[0,.04*power,.08],[0,.14*power,.18],[0,-.025,.04],[0,0,0]]);
   scale(p.body,t,[[1,1,1],[1.035,.94,1.03],[.98,1.03,.98],[.97,1.05,.97],[1.04,.95,1.04],[1,1,1]]);
   face(t,[1,.8,.65,.85,.95,1],[0,-.13,-.26,-.23,-.08,0],[1,.65,.45,1.4,.75,1]);
   rotation(p.launcher,t,[[0,0,0],[.1,0,0],[-.5,0,0],[-.7,0,0],[.2,0,0],[0,0,0]]);
   rotation(p.tail,t,[[0,0,0],[0,.12,0],[0,-.3,.05],[0,-.2,0],[0,.2,0],[0,0,0]]);
   rotation(p.tailMid,t,[[0,0,0],[.1,.03,0],[0,.12,.1],[0,-.2,0],[0,.15,-.1],[0,0,0]]);
   rotation(p.earL,t,[[0,0,0],[-.1,0,-.06],[-.15,0,-.13],[.12,0,.06],[0,0,.04],[0,0,0]]);
   rotation(p.earR,t,[[0,0,0],[-.1,0,.06],[-.15,0,.13],[.12,0,-.06],[0,0,-.04],[0,0,0]]);
  }else if(['hit','heavy-hit','KO'].includes(kind)){
   duration=kind==='KO'?1.15:.8;const t=[0,duration*.16,duration*.4,duration*.65,duration];const heavy=kind!=='hit';
   rotation(r.motion,t,[[0,0,0],[-.22,0,.16],[-.1,0,-.13],[.05,0,.06],kind==='KO'?[0,0,1.4]:[0,0,0]]);
   position(r.motion,t,[[0,0,0],[0,.07,-.17],[0,-.03,-.1],[0,.015,-.035],kind==='KO'?[.3,-.04,0]:[0,0,0]]);
   face(t,[1,.09,.15,.5,kind==='KO'?.08:1],[0,.35,.18,.06,kind==='KO'?.3:0],[1,2,1.6,.8,kind==='KO'?.4:1]);
   rotation(p.head,t,[[0,0,0],[-.2,0,.15],[.1,0,-.1],[0,0,.04],[0,0,0]]);rotation(p.earL,t,[[0,0,0],[-.3,0,-.2],[-.1,0,.1],[0,0,0],kind==='KO'?[-.2,0,-.2]:[0,0,0]]);
   if(heavy)scale(p.body,t,[[1,1,1],[1.08,.88,1.08],[.96,1.05,.96],[1.02,.97,1.02],[1,1,1]]);
  }else if(kind==='guard'){
   duration=1.1;const t=[0,.25,.7,1.1];rotation(p.armL,t,[[0,0,0],[-.6,-.3,.2],[-.65,-.25,.22],[0,0,0]]);rotation(p.head,t,[[0,0,0],[.1,0,-.05],[.08,0,0],[0,0,0]]);face(t,[1,.7,.7,1],[0,-.2,-.2,0],[1,.65,.65,1]);
  }else{
   duration=kind==='victory'?1.8:1.15;const t=[0,duration*.22,duration*.45,duration*.65,duration*.85,duration];
   position(r.motion,t,[[0,0,0],[0,-.03,0],[0,kind==='victory'?.17:.035,0],[0,-.025,0],[0,.02,0],[0,0,0]]);
   rotation(p.head,t,[[0,0,0],[-.08,0,-.10],[-.12,0,.11],[-.03,0,-.06],[0,0,.03],[0,0,0]]);
   face(t,[1,.7,.5,.65,.85,1],[0,.15,.18,.1,.04,0],[1,1.6,1.8,1.5,1.2,1]);
   if(kind==='victory')rotation(p.armR,t,[[0,0,0],[-.6,0,-.3],[-1.4,0,-.7],[-1.2,0,-.4],[-1.4,0,-.7],[0,0,0]]);
  }
  return new T.AnimationClip(name,duration,[...tracks]);
 });
}
