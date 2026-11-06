import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const c=(id:string,keys:[number,CardPose][],motion:Partial<Motion>={}):CardClipDefinition=>({id,duration:1.3,keys:[[0,{}],...keys,[1,{}]],travel:{travel:0,arc:0,float:0,side:0,hold:60,...motion}});
/** Each basic and signature has its own centre of gravity and hand action. */
export const ENEMY_BATCH1_CLIPS:Record<string,CardClipDefinition[]>={
 'button-guard':[
  // Flick one cuff button with the right hand, then cover the sleeve again.
  c('enemy:button-guard:basic',[
   [.19,{motion:[.06,-.28,.08],head:[.08,.1,-.03],armR:[-.45,.2,-1.1],armL:[-.8,-.2,.3],shift:[-.05,-.04,-.04]}],
   [.42,{motion:[-.06,.32,-.11],armR:[-1.4,-.15,-.15],armL:[-.7,-.3,.2],shift:[.08,.05,.16]}],
   [.56,{motion:[.1,-.12,.03],armR:[-.3,.3,-.8],head:[.07,-.07,0],shift:[-.04,-.03,.04]}],
   [.79,{armR:[-.2,0,-.25],armL:[-.2,0,.2],shift:[0,.025,0]}],
  ],{travel:.20,side:.08}),
  // Kneel, bring both lapels across the chest, and press the button wall outward.
  c('enemy:button-guard',[
   [.21,{motion:[.24,.02,0],head:[.17,0,0],armL:[-1.05,.65,-.25],armR:[-1.05,-.65,.25],shift:[0,-.16,-.06],stretch:[1.12,.8,1.08]}],
   [.43,{motion:[-.14,0,0],head:[-.09,0,0],armL:[-1.45,-.3,.65],armR:[-1.45,.3,-.65],shift:[0,.14,.1],stretch:[.96,1.1,1.02]}],
   [.61,{motion:[.13,0,0],armL:[-.7,-.5,1.05],armR:[-.7,.5,-1.05],shift:[0,-.1,.03]}],
   [.82,{motion:[-.04,0,0],head:[-.03,0,0],armL:[-.3,-.1,.35],armR:[-.3,.1,-.35],shift:[0,.04,0]}],
  ],{hold:95}),
 ],
 'sock-skipper':[
  // Wind a heel back and kick across the floor without the signature's leap.
  c('enemy:sock-skipper:basic',[
   [.18,{motion:[.12,-.38,-.16],head:[0,.16,.05],footR:[-.8,0,.12],armL:[.3,-.3,.8],armR:[-.4,.2,-.2],shift:[-.1,-.06,-.02]}],
   [.41,{motion:[-.18,.27,.22],head:[-.05,-.1,-.06],footR:[1.2,.1,-.12],armL:[-.6,-.2,.35],armR:[.6,.1,-.7],shift:[.13,.11,.16]}],
   [.59,{motion:[.12,-.1,-.08],footR:[.25,0,0],footL:[-.3,0,0],shift:[-.03,-.035,.04]}],
   [.80,{motion:[-.03,.05,.04],armL:[-.2,0,.25],armR:[-.2,0,-.25],shift:[0,.025,0]}],
  ],{travel:.32,side:-.14}),
  // Pop the clasp, spring sideways, scoop with the left paw and land crouched.
  c('enemy:sock-skipper',[
   [.16,{motion:[.25,.2,-.2],head:[.13,-.1,.04],armL:[-1.2,.4,-.3],armR:[-1.2,-.4,.3],shift:[0,-.18,-.08],stretch:[1.12,.78,1.06]}],
   [.36,{motion:[-.15,-.55,.32],head:[-.08,.2,-.08],armL:[-1.6,-.3,1.4],armR:[.4,.25,-1.1],footL:[.9,0,-.15],footR:[-.7,0,.2],shift:[-.16,.34,.12],stretch:[.92,1.13,.96]}],
   [.55,{motion:[.18,.35,-.18],armL:[-1.6,.65,-.25],armR:[-.45,-.1,-.2],shift:[.14,-.14,.19],stretch:[1.08,.84,1.04]}],
   [.76,{motion:[-.06,-.13,.06],head:[-.04,.05,0],armL:[-.4,.1,.3],shift:[-.035,.08,.02]}],
  ],{travel:.60,arc:.20,side:-.26,hold:40}),
 ],
 'spool-ram':[
  // A sideways bobbin nudge, cranked by the left arm with one planted foot.
  c('enemy:spool-ram:basic',[
   [.2,{motion:[.12,.34,-.16],armL:[-.2,-.6,1.1],armR:[-.65,.2,-.3],head:[.12,-.12,.04],shift:[.1,-.05,-.06]}],
   [.43,{motion:[-.14,-.32,.18],armL:[-1.2,.3,.35],armR:[-.6,.1,-.45],head:[-.1,.1,-.04],shift:[-.12,.06,.17]}],
   [.61,{motion:[.1,.15,-.08],armL:[-.4,-.2,.8],shift:[.05,-.04,.06]}],
   [.82,{motion:[-.035,-.05,.02],head:[-.025,0,0],armL:[-.2,0,.3],shift:[0,.025,0]}],
  ],{travel:.28,side:.15,hold:65}),
  // Load a spring, drive both horns forward, rebound into a second low sweep.
  c('enemy:spool-ram',[
   [.22,{motion:[.42,0,0],head:[.3,0,0],armL:[.5,-.1,.35],armR:[.5,.1,-.35],shift:[0,-.18,-.24],stretch:[1.13,.79,1.12]}],
   [.42,{motion:[-.32,0,0],head:[-.2,0,0],armL:[-1.15,-.2,.25],armR:[-1.15,.2,-.25],shift:[0,.13,.33],stretch:[.92,1.08,1.13]}],
   [.56,{motion:[.22,.16,-.07],head:[.16,-.08,.02],armL:[.2,0,.4],armR:[-.6,0,-.6],shift:[.08,-.13,.07]}],
   [.69,{motion:[-.2,-.18,.08],head:[-.12,.08,-.02],armL:[-.8,-.2,.7],armR:[-.95,.2,-.25],shift:[-.06,.09,.23]}],
   [.86,{motion:[.06,0,0],shift:[0,.03,-.03]}],
  ],{travel:.58,hold:100}),
 ],
};
