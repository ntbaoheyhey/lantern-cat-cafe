import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const c=(id:string,keys:[number,CardPose][],travel:Partial<Motion>={}):CardClipDefinition=>({id,duration:1.32,keys:[[0,{}],...keys,[1,{}]],travel:{travel:0,arc:0,float:0,side:0,hold:60,...travel}});
export const ENEMY_BATCH3_CLIPS:Record<string,CardClipDefinition[]>={
 'binding-thread':[
  // Catch a single strand and tug it over the opposite shoulder.
  c('enemy:binding-thread:basic',[
   [.20,{motion:[.15,-.25,-.12],head:[.10,.16,.04],armL:[-1.3,-.3,1.0],armR:[-.4,.3,-.4],shift:[-.11,-.06,.10]}],
   [.43,{motion:[-.18,.38,.18],head:[-.1,-.14,-.05],armL:[-1.8,.6,-.3],armR:[-.9,-.3,.2],shift:[.15,.12,-.13]}],
   [.64,{motion:[.10,-.13,-.07],armL:[-.6,-.1,.4],head:[.07,.08,.02],shift:[-.035,-.04,.04]}],
   [.83,{motion:[-.03,.03,.02],shift:[0,.025,0]}],
  ],{travel:.16,side:-.18}),
  // Loop hands around one another, then cinch the knot downward.
  c('enemy:binding-thread',[
   [.18,{motion:[.08,.16,-.08],armL:[-1.5,.65,-.2],armR:[-.7,-.45,.3],shift:[.06,.04,-.04]}],
   [.38,{motion:[-.16,-.20,.11],armL:[-.7,-.45,.9],armR:[-1.9,.5,-.15],head:[-.08,.14,-.04],shift:[-.10,.18,.02]}],
   [.57,{motion:[.28,0,0],armL:[-.9,-.5,1.35],armR:[-.9,.5,-1.35],head:[.18,0,0],shift:[0,-.18,.19],stretch:[1.10,.8,1.06]}],
   [.78,{motion:[-.09,.08,-.04],armL:[-.4,-.1,.3],armR:[-.4,.1,-.3],shift:[.04,.07,0]}],
  ],{travel:.10,hold:85}),
 ],
 'practice-cushion':[
  // Soft one-foot hop with the arms held out for balance.
  c('enemy:practice-cushion:basic',[
   [.20,{motion:[.08,.1,-.2],head:[.10,-.05,.08],armL:[-.3,-.1,1.0],armR:[-.3,.1,-1.0],footL:[.5,0,-.1],shift:[-.12,-.12,-.03],stretch:[1.1,.82,1.08]}],
   [.43,{motion:[-.12,-.1,.18],head:[-.07,.05,-.05],footL:[-.4,0,0],footR:[.7,0,.12],shift:[.13,.27,.14],stretch:[.92,1.15,.94]}],
   [.61,{motion:[.08,.04,-.07],shift:[-.03,-.10,.04],stretch:[1.08,.85,1.05]}],
   [.82,{motion:[-.025,0,.02],armL:[-.2,0,.2],armR:[-.2,0,-.2],shift:[0,.06,0]}],
  ],{travel:.23,arc:.06,side:.10,hold:20}),
  // Fold into a square, unfurl both paws and bounce twice on a broad base.
  c('enemy:practice-cushion',[
   [.20,{motion:[.30,0,0],head:[.20,0,0],armL:[-.8,.5,-.2],armR:[-.8,-.5,.2],shift:[0,-.22,-.08],stretch:[1.2,.67,1.16]}],
   [.39,{motion:[-.18,0,0],head:[-.1,0,0],armL:[-1.6,-.35,1.4],armR:[-1.6,.35,-1.4],shift:[0,.35,.12],stretch:[.86,1.24,.90]}],
   [.55,{motion:[.15,0,0],armL:[-.6,-.1,.7],armR:[-.6,.1,-.7],shift:[0,-.19,.22],stretch:[1.15,.73,1.12]}],
   [.71,{motion:[-.10,0,0],head:[-.08,0,0],shift:[0,.17,.08],stretch:[.95,1.08,.95]}],
   [.86,{shift:[0,-.05,0],stretch:[1.03,.94,1.02]}],
  ],{travel:.35,arc:.09,hold:30}),
 ],
 'pollen-scout':[
  // Sweep a seed brush from hip to shoulder, then flick the wrist down.
  c('enemy:pollen-scout:basic',[
   [.18,{motion:[.16,.26,.12],armR:[-.3,.5,-1.2],armL:[-.7,-.15,.3],head:[.12,-.12,-.04],shift:[.10,-.08,-.04]}],
   [.40,{motion:[-.17,-.22,-.15],armR:[-2.1,-.2,-.4],armL:[-.5,-.3,.7],head:[-.12,.1,.05],shift:[-.12,.18,.09]}],
   [.59,{motion:[.12,.12,.05],armR:[-.8,.3,-.8],shift:[.045,-.05,.14]}],
   [.80,{motion:[-.04,-.05,-.02],armR:[-.25,.1,-.2],shift:[-.02,.04,0]}],
  ],{float:.06,side:.12}),
  // Kneel to plant, press the soil, then lift the new thread with both hands.
  c('enemy:pollen-scout',[
   [.21,{motion:[.35,0,0],head:[.26,0,0],armL:[-.85,-.1,.3],armR:[-.9,.1,-.3],footL:[.4,0,0],shift:[0,-.24,.14],stretch:[1.08,.78,1.05]}],
   [.41,{motion:[.22,-.16,.05],head:[.15,.10,-.02],armL:[-1.3,.3,.1],armR:[-1.15,-.3,-.1],shift:[-.06,-.16,.22]}],
   [.62,{motion:[-.22,.12,-.06],head:[-.17,-.08,.03],armL:[-2.0,-.3,1.05],armR:[-2.0,.3,-1.05],shift:[.05,.24,.01],stretch:[.91,1.16,.94]}],
   [.83,{motion:[-.05,0,0],head:[-.04,0,0],armL:[-.6,-.1,.4],armR:[-.6,.1,-.4],shift:[0,.07,0]}],
  ],{hold:100}),
 ],
};
