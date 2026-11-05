// Original part animation, authored for these procedural rigs; no motion library.
import { THREE as T } from './geometry.mjs';
export const CLIPS = ['idle','step','attack','cast','special','hit','stagger','down','victory','telegraph'];
export function animate(r) {
  const p=r.parts, tracks=[];
  const position=(node,times,offsets)=>{if(node)tracks.push(new T.VectorKeyframeTrack(`${node.name}.position`,times,offsets.flatMap(v=>node.position.toArray().map((x,i)=>x+v[i]))));};
  const rotation=(node,times,angles)=>{if(node)tracks.push(new T.QuaternionKeyframeTrack(`${node.name}.quaternion`,times,angles.flatMap(v=>new T.Quaternion().setFromEuler(new T.Euler(...v)).toArray())));};
  const scale=(node,times,values)=>{if(node)tracks.push(new T.VectorKeyframeTrack(`${node.name}.scale`,times,values.flat()));};
  return CLIPS.map(name=>{
    tracks.length=0;let duration=1;
    if(name==='idle'){
      duration=2.4;position(p.body,[0,1.2,2.4],[[0,0,0],[0,.025,0],[0,0,0]]);scale(p.body,[0,1.2,2.4],[[1,1,1],[1.025,1.015,1.025],[1,1,1]]);
      rotation(p.tail,[0,1.2,2.4],[[0,-.13,0],[0,.13,0],[0,-.13,0]]);rotation(p.earL,[0,1.2,2.4],[[0,0,0],[.06,0,.06],[0,0,0]]);
      scale(p.eyes,[0,1.65,1.73,1.82,2.4],[[1,1,1],[1,1,1],[1,.12,1],[1,1,1],[1,1,1]]);
      rotation(p.wingL,[0,.6,1.2,1.8,2.4],[[0,-.2,0],[0,.2,0],[0,-.2,0],[0,.2,0],[0,-.2,0]]);rotation(p.wingR,[0,.6,1.2,1.8,2.4],[[0,.2,0],[0,-.2,0],[0,.2,0],[0,-.2,0],[0,.2,0]]);
    } else if(name==='step'){
      duration=.65;position(r.motion,[0,.2,.45,.65],[[0,0,0],[0,.08,.12],[0,.04,.24],[0,0,0]]);rotation(p.footL,[0,.2,.45,.65],[[0,0,0],[-.4,0,0],[.3,0,0],[0,0,0]]);rotation(p.footR,[0,.2,.45,.65],[[0,0,0],[.3,0,0],[-.4,0,0],[0,0,0]]);
    } else if(['attack','cast','special','telegraph'].includes(name)){
      duration=name==='special'?1.8:name==='telegraph'?1.2:.9;
      const t=[0,duration*.3,duration*.55,duration*.72,duration];
      rotation(p.armR,t,[[0,0,0],[-1.2,0,-.3],[-1.6,.1,-.15],[.6,0,.2],[0,0,0]]);
      rotation(p.armL,t,[[0,0,0],[-.5,0,.4],[-1.2,0,.6],[-.3,0,0],[0,0,0]]);
      rotation(p.head,t,[[0,0,0],[.12,-.16,0],[-.12,.12,0],[0,.08,0],[0,0,0]]);
      rotation(r.motion,t,[[0,0,0],[.10,-.16,0],[-.12,.2,0],[.08,.1,0],[0,0,0]]);
      position(r.motion,t,[[0,0,0],[0,-.05,-.08],[0,name==='special'?.20:.06,.13],[0,0,.08],[0,0,0]]);
      scale(p.eyes,t,[[1,1,1],[1,.65,1],[1,.8,1],[1,1,1],[1,1,1]]);
      rotation(p.launcher,t,[[0,0,0],[-.5,0,0],[-.6,0,0],[.2,0,0],[0,0,0]]);
    } else if(['hit','stagger','down'].includes(name)){
      duration=name==='down'?1.1:.65;const t=[0,duration*.25,duration*.65,duration];
      rotation(r.motion,t,[[0,0,0],[-.22,0,.12],[-.1,0,-.08],name==='down'?[0,0,1.35]:[0,0,0]]);
      position(r.motion,t,[[0,0,0],[0,.04,-.15],[0,-.06,-.10],name==='down'?[.3,-.03,0]:[0,0,0]]);
      scale(p.eyes,t,[[1,1,1],[1,.12,1],[1,.3,1],name==='down'?[1,.12,1]:[1,1,1]]);
      rotation(p.head,t,[[0,0,0],[-.2,0,.12],[.1,0,-.07],[0,0,0]]);
    } else {
      duration=1.6;const t=[0,.4,.8,1.2,1.6];position(r.motion,t,[[0,0,0],[0,.22,0],[0,0,0],[0,.16,0],[0,0,0]]);
      rotation(p.armR,t,[[0,0,0],[-1.5,0,-.7],[-1.2,0,-.4],[-1.5,0,-.7],[-1.2,0,-.4]]);
      rotation(p.head,t,[[0,0,0],[0,0,-.12],[0,0,.12],[0,0,-.12],[0,0,0]]);
    }
    return new T.AnimationClip(name,duration,[...tracks]);
  });
}
