// Original keyframe choreography, authored for the named transform rigs in cast.mjs.
import {THREE as T} from './geometry.mjs';
// id, leading arm windup/release, off arm, torso twist, crouch, lift, lean, stance.
export const SKILL_POSES={
 guardian:[['guardianBasic',.5,-1.5,-.35,.65,-.07,.04,-.18,.24],['shieldBash',-.4,-.8,-1.7,-.25,-.12,.02,.32,.42],['rally',-.1,-2.4,-1.2,.1,-.04,.02,-.06,.18],['hearthwall',-2.5,.7,-2.3,0,-.2,.16,.4,.5]],
 witch:[['witchBasic',-.35,-1.25,-.4,-.4,-.02,.12,-.12,.06],['threadSnare',-.8,-1.4,-1.8,.8,-.04,.18,-.08,.1],['emberOrb',-1.8,-.5,-1.5,-.55,-.05,.27,-.2,.04],['lanternstorm',-.4,-2.7,-2.5,1.05,-.1,.38,-.15,.16]],
 alchemist:[['alchemistBasic',1.2,-1.6,-.3,.6,-.1,.14,-.13,.28],['milkFlask',.7,-.9,-1.1,-.35,-.12,.09,.16,.2],['mossFlask',-.2,-1.8,-1.5,.85,-.08,.2,-.22,.32],['nineLives',-1.8,-2.2,-2.6,-.8,-.18,.22,-.1,.4]],
 guard:[['guardAttack',.4,-1.2,-.8,.45,-.05,.02,.2,.25]],flanker:[['flankerAttack',1.1,-1.7,-.6,-1.1,-.16,.3,-.4,.5]],
 ranger:[['rangerAttack',-.9,-.3,-1.3,-.35,-.03,.22,.12,.1]],healer:[['healerAttack',-.3,-2.1,-1.6,.3,-.1,.13,-.1,.15]],
 charger:[['chargerAttack',.8,-.9,-.9,0,-.19,.1,.7,.4]],elite:[['eliteAttack',-2.3,.8,-1.5,-.6,-.15,.16,.5,.45]],
 yarn:[['yarnAttack',.3,-1.4,-1.9,1.25,-.1,.04,.2,.35],['bindThread',-.8,-.2,-1.5,-.75,-.06,.08,-.3,.15],['crossSweep',-2,-1.1,-2,-1.3,-.16,.12,.45,.5],['bossIntro',-.3,-2.4,-2.4,.25,-.12,.2,-.18,.1]],
 thread:[['threadAttack',.2,-.5,-.4,.7,-.14,.16,.35,.2]],dummy:[['dummyAttack',.1,-.4,-.3,-.3,-.18,.2,.2,.3]],
};
export function skillAnimations(r){return (SKILL_POSES[r.role]??[]).map(([id,wind,release,off,twist,crouch,lift,lean,stance])=>{
 const tracks=[],time=[0,.23,.48,.57,.82,1],parts=r.parts;
 const rotate=(node,values)=>{if(!node)return;tracks.push(new T.QuaternionKeyframeTrack(`${node.name}.quaternion`,time,values.flatMap(v=>new T.Quaternion().setFromEuler(new T.Euler(...v)).toArray())))};
 const move=(node,values)=>{if(!node)return;const base=node.position.toArray();tracks.push(new T.VectorKeyframeTrack(`${node.name}.position`,time,values.flatMap(v=>v.map((x,i)=>x+base[i]))))};
 rotate(parts.armR,[[0,0,0],[wind,twist*.2,-.22],[release,twist*.4,-stance],[release*.9,0,stance*.35],[.2,-twist*.2,.12],[0,0,0]]);
 rotate(parts.armL,[[0,0,0],[off*.45,-twist*.3,.2],[off,twist*.2,stance],[off*.8,0,stance*.7],[.1,0,-.1],[0,0,0]]);
 rotate(r.motion,[[0,0,0],[-lean*.5,-twist*.55,stance*.08],[lean,twist,0],[lean*.8,twist*.65,-stance*.12],[-lean*.2,-twist*.15,0],[0,0,0]]);
 move(r.motion,[[0,0,0],[0,crouch,-.08],[0,lift,.06],[0,lift*.4,.1],[0,crouch*.3,.02],[0,0,0]]);
 rotate(parts.head,[[0,0,0],[.1,-twist*.25,-stance*.15],[-.08,twist*.2,stance*.12],[-.12,twist*.1,0],[.04,0,0],[0,0,0]]);
 rotate(parts.footL,[[0,0,0],[stance,.1,0],[-stance*.8,-.12,0],[-stance*.4,0,0],[stance*.25,0,0],[0,0,0]]);
 rotate(parts.footR,[[0,0,0],[-stance,-.1,0],[stance*.8,.12,0],[stance*.4,0,0],[-stance*.25,0,0],[0,0,0]]);
 rotate(parts.launcher,[[0,0,0],[wind*.3,0,0],[release*.5,twist*.2,0],[release*.7,0,0],[.2,0,0],[0,0,0]]);
 rotate(parts.browL,[[0,0,0],[0,0,-.12],[0,0,-.28-stance*.15],[0,0,-.18],[0,0,-.05],[0,0,0]]);
 rotate(parts.browR,[[0,0,0],[0,0,.12],[0,0,.28+stance*.15],[0,0,.18],[0,0,.05],[0,0,0]]);
 return new T.AnimationClip(id,1,tracks);
})}
