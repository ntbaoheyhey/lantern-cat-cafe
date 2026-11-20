// QR pilot only: authored key poses on original cut-out geometry, not a new rig.
import type {SpineActor} from '../../apps/web/src/game/cardrpg/spine/assets';
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t);};
export const timing={basic:{duration:800,impact:350,release:250},ultimate:{duration:2200,impact:1100,release:600},hold:200/3} as const;
export function authorPilotPoses(actor:SpineActor){
 const data=actor.mesh!.data;
 const node=(names:string[])=>names.map(n=>data.nodes.findIndex(b=>b.name===n)).find(n=>n>=0)!;
 const bones={hip:node(['hip']),head:node(['head']),hand:node(['arm-r','arm_upper_r']),other:node(['arm-l','arm_upper_l']),tail:node(['tail','tail_1'])};
 for(const kind of ['basic','ultimate'] as const){
  const {duration,impact,release}=timing[kind],max=kind==='ultimate'?1.3:1;
  // An explicit early compression makes the silhouette readable before release,
  // rather than letting the entire wind-up happen in the last interpolation span.
  const times=[0,release*.52/1000,release/1000,impact/1000,(impact+timing.hold)/1000,(impact+200)/1000,duration/1000];
  const rotate=(bone:number,angles:number[])=>({node:bone,property:'rotate',keys:times.map((time,i)=>({time,value:angles[i]!*max,curve:[.25,0,.3,1]}))});
  data.clips['feel-'+kind]={duration:duration/1000,tracks:[
   rotate(bones.hip,[0,-5,-8,6,6,3,0]),rotate(bones.head,[0,6,9,-5,-5,-2,0]),
   rotate(bones.hand,[0,19,28,-28,-28,-10,0]),rotate(bones.other,[0,8,15,-13,-13,-6,0]),
   rotate(bones.tail,[0,-5,-12,14,14,20,0]),
   {node:bones.hip,property:'scale',keys:times.map((time,i)=>({time,x:[1,1.025,1.04,.98,.98,1.02,1][i]!,y:[1,.97,.94,1.04,1.04,.99,1][i]!,curve:[.25,0,.3,1]}))},
  ],visibility:[],events:[{name:'hit',time:impact/1000}]};
  actor.clips.set('feel-'+kind,{duration:duration/1000,cues:[]});
 }
 const times=Array.from({length:17},(_,i)=>i/4);
 data.clips['feel-idle']={duration:4,tracks:[
  {node:bones.hip,property:'scale',keys:times.map(time=>({time,x:1-Math.sin(time*Math.PI/2)*.012,y:1+Math.sin(time*Math.PI/2)*.026}))},
  {node:bones.head,property:'rotate',keys:times.map(time=>({time,value:Math.sin(time*Math.PI/2-.2)*1.4}))},
  {node:bones.hand,property:'rotate',keys:times.map(time=>({time,value:Math.sin(time*Math.PI/2-.5)*3}))},
  {node:bones.tail,property:'rotate',keys:times.map(time=>({time,value:Math.sin(time*Math.PI/2-.8)*7}))},
 ],visibility:[],events:[]};
 actor.clips.set('feel-idle',{duration:4,cues:[]});
 return bones;
}
export function poseClock(t:number,kind:'basic'|'ultimate'){
 const hit=timing[kind].impact;return t>=hit&&t<hit+timing.hold?hit:t;
}
