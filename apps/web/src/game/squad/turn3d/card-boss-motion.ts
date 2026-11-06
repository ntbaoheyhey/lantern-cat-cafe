import type {CardClipDefinition, CardPose} from './card-motion-data';
import type {Motion} from './choreography';
const c=(id:string,keys:[number,CardPose][],travel:Partial<Motion>={}):CardClipDefinition=>({id,duration:1.38,keys:[[0,{}],...keys,[1,{}]],travel:{travel:0,arc:0,float:0,side:0,hold:100,...travel}});
export const BOSS_SKILL_CLIPS:Record<string,CardClipDefinition[]>={
 'yarn-giant':[
  c('enemy:yarn-giant:basic',[
   [.19,{motion:[.13,-.33,.12],head:[.10,.12,-.03],armL:[-1.15,-.5,1.0],armR:[-.6,.2,-.3],shift:[-.1,-.07,-.07]}],
   [.42,{motion:[-.14,.32,-.14],head:[-.08,-.13,.04],armL:[-.6,.55,-.25],armR:[-1.3,.1,-.8],shift:[.14,.1,.20]}],
   [.62,{motion:[.10,-.13,.06],armL:[-.9,-.15,.6],shift:[-.05,-.04,.04]}],
   [.83,{motion:[-.03,.04,0],shift:[0,.04,0]}],
  ],{travel:.16,side:.1}),
  // Lift an entire loom with high elbows, sink behind it, press the beam down.
  c('enemy:yarn-giant',[
   [.18,{motion:[.22,0,0],head:[.15,0,0],armL:[-.65,-.45,1.1],armR:[-.65,.45,-1.1],shift:[0,-.18,-.10],stretch:[1.10,.84,1.07]}],
   [.38,{motion:[-.26,0,0],head:[-.18,0,0],armL:[-2.55,-.2,.65],armR:[-2.55,.2,-.65],shift:[0,.28,-.05],stretch:[.93,1.15,.96]}],
   [.54,{motion:[.38,0,0],head:[.23,0,0],armL:[-.8,-.25,.35],armR:[-.8,.25,-.35],shift:[0,-.24,.30],stretch:[1.16,.73,1.12]}],
   [.73,{motion:[-.12,.08,-.03],head:[-.09,-.05,.02],armL:[-.6,-.1,.6],armR:[-.6,.1,-.6],shift:[.04,.10,.035]}],
   [.88,{motion:[.035,0,0],shift:[0,-.025,0]}],
  ],{travel:.10,hold:110}),
 ],
 'rain-spool':[
  // Gather one drop in a cupped paw, then sling it below shoulder height.
  c('enemy:rain-spool:basic',[
   [.19,{motion:[.13,.25,-.12],head:[.09,-.12,.04],armL:[-.8,-.1,.4],armR:[-.45,.6,-1.0],shift:[.09,-.08,-.05]}],
   [.43,{motion:[-.19,-.30,.15],head:[-.12,.12,-.04],armR:[-1.65,-.4,-.25],armL:[-.65,-.25,.65],shift:[-.13,.16,.17]}],
   [.63,{motion:[.08,.12,-.06],armR:[-.7,.2,-.65],shift:[.04,-.04,.06]}],
   [.83,{motion:[-.04,0,0],armR:[-.25,0,-.2],shift:[0,.035,0]}],
  ],{travel:.12,side:-.16}),
  // Coil the storm sideways, turn under the arms and release a low rolling wave.
  c('enemy:rain-spool',[
   [.19,{motion:[.16,-.38,-.18],head:[.1,.18,.07],armL:[-1.6,.6,-.3],armR:[-1.0,-.45,.2],shift:[-.16,-.12,-.10]}],
   [.39,{motion:[-.25,.43,.24],head:[-.16,-.2,-.06],armL:[-2.3,-.35,1.25],armR:[-2.0,.2,-.75],shift:[.18,.27,.05],stretch:[.90,1.18,.95]}],
   [.55,{motion:[.28,-.22,-.12],head:[.15,.14,.04],armL:[-.9,-.25,.6],armR:[-1.2,.3,-.55],shift:[-.11,-.16,.28],stretch:[1.13,.79,1.1]}],
   [.72,{motion:[-.13,.13,.08],armL:[-.6,-.1,.7],armR:[-.8,.2,-.6],shift:[.06,.13,.1]}],
   [.87,{motion:[.04,-.04,-.02],shift:[-.02,-.025,0]}],
  ],{travel:.18,side:.22,hold:105}),
 ],
 'pantry-crown':[
  // Count one cup on the left palm, tap the rim, and point it across the table.
  c('enemy:pantry-crown:basic',[
   [.18,{motion:[.12,-.18,.08],head:[.14,.1,-.03],armL:[-1.1,-.25,.7],armR:[-1.7,.6,.1],shift:[-.07,-.05,-.02]}],
   [.40,{motion:[-.13,.16,-.09],head:[-.08,-.08,.03],armL:[-1.2,-.2,.75],armR:[-.9,-.4,-1.0],shift:[.09,.12,.13]}],
   [.60,{motion:[.08,-.12,.04],armR:[-1.25,.4,.1],head:[.05,.06,-.02],shift:[-.045,-.025,.03]}],
   [.81,{motion:[-.035,0,0],armL:[-.4,-.1,.3],shift:[0,.03,0]}],
  ],{side:.08}),
  // Pull the tablecloth in, raise the empty tray and close the banquet with a bow.
  c('enemy:pantry-crown',[
   [.19,{motion:[.29,0,0],head:[.20,0,0],armL:[-1.0,-.3,1.0],armR:[-1.0,.3,-1.0],shift:[0,-.17,.17],stretch:[1.08,.84,1.05]}],
   [.39,{motion:[-.27,0,0],head:[-.18,0,0],armL:[-1.8,.6,-.2],armR:[-1.8,-.6,.2],shift:[0,.21,-.20],stretch:[.92,1.13,.94]}],
   [.56,{motion:[-.10,-.15,.06],head:[-.12,.10,-.025],armL:[-2.45,-.3,1.25],armR:[-2.45,.3,-1.25],shift:[-.06,.18,.04]}],
   [.75,{motion:[.34,.10,-.04],head:[.22,-.06,.02],armL:[-.6,-.2,.4],armR:[-.6,.2,-.4],shift:[.04,-.17,.18],stretch:[1.06,.87,1.03]}],
   [.88,{motion:[-.06,0,0],head:[-.04,0,0],shift:[0,.04,0]}],
  ],{hold:110}),
 ],
};

/** Intro fits the existing walk-in; phase pose fits the grouped 300 ms round beat. */
export const BOSS_LIFECYCLE:Record<string,CardClipDefinition[]>={
 'yarn-giant':[
  c('boss-intro',[
   [.2,{motion:[.16,0,0],head:[.12,0,0],armL:[-.7,.3,.1],armR:[-.7,-.3,-.1],shift:[0,-.12,0]}],
   [.48,{motion:[-.18,0,0],head:[-.12,0,0],armL:[-1.8,-.3,1.2],armR:[-1.8,.3,-1.2],shift:[0,.16,0]}],
   [.75,{motion:[.06,0,0],head:[.04,0,0],armL:[-.45,-.1,.45],armR:[-.45,.1,-.45],shift:[0,-.035,0]}],
  ]),
  c('boss-phase',[
   [.18,{motion:[.16,-.18,.06],head:[.1,.1,-.03],armL:[-1.4,.7,-.2],armR:[-1.4,-.7,.2],shift:[-.05,-.09,0]}],
   [.48,{motion:[-.18,.2,-.07],head:[-.1,-.1,.03],armL:[-1.7,-.4,1.4],armR:[-1.7,.4,-1.4],shift:[.06,.16,.05]}],
   [.78,{motion:[.06,0,0],shift:[0,-.035,0]}],
  ]),
 ],
 'rain-spool':[
  c('boss-intro',[
   [.22,{motion:[.13,-.28,-.12],head:[.08,.15,.04],armL:[-.5,-.4,.8],armR:[-1.1,.45,-.2],shift:[-.1,-.07,0]}],
   [.49,{motion:[-.17,.30,.14],head:[-.1,-.14,-.04],armL:[-2.0,-.2,1.0],armR:[-1.3,.2,-.9],shift:[.11,.2,0]}],
   [.76,{motion:[.07,-.1,-.04],armL:[-.45,-.1,.4],armR:[-.45,.1,-.4],shift:[-.035,-.04,0]}],
  ]),
  c('boss-phase',[
   [.20,{motion:[.24,0,0],head:[.16,0,0],armL:[-1.4,.5,-.2],armR:[-1.4,-.5,.2],shift:[0,-.14,-.04]}],
   [.49,{motion:[-.24,0,0],head:[-.16,0,0],armL:[-2.35,-.3,1.25],armR:[-2.35,.3,-1.25],shift:[0,.23,.06]}],
   [.78,{motion:[.08,0,0],armL:[-.7,-.1,.6],armR:[-.7,.1,-.6],shift:[0,-.04,0]}],
  ]),
 ],
 'pantry-crown':[
  c('boss-intro',[
   [.20,{motion:[-.09,0,0],head:[-.06,0,0],armL:[-1.2,-.3,.85],armR:[-1.2,.3,-.85],shift:[0,.07,0]}],
   [.48,{motion:[.35,0,0],head:[.22,0,0],armL:[-.75,.4,-.15],armR:[-.75,-.4,.15],shift:[0,-.16,.1]}],
   [.76,{motion:[-.10,0,0],head:[-.07,0,0],armL:[-.6,-.1,.5],armR:[-.6,.1,-.5],shift:[0,.08,0]}],
  ]),
  c('boss-phase',[
   [.18,{motion:[.12,.2,-.07],head:[.08,-.12,.03],armL:[-1.5,-.2,.9],armR:[-.75,.3,-.3],shift:[.07,-.06,0]}],
   [.47,{motion:[-.17,-.2,.08],head:[-.1,.12,-.03],armL:[-2.4,-.2,.9],armR:[-1.7,.3,-1.3],shift:[-.07,.20,.05]}],
   [.76,{motion:[.13,0,0],head:[.09,0,0],armL:[-.8,-.1,.5],armR:[-.8,.1,-.5],shift:[0,-.06,.03]}],
  ]),
 ],
};
