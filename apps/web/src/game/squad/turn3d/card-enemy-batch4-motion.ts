import type { CardClipDefinition } from './card-motion-data';
export const ENEMY_BATCH4_CLIPS:Record<string,CardClipDefinition[]>={
 'crumb-sentinel':[
  {id:'enemy:crumb-sentinel:basic',duration:1.27,travel:{travel:.18,arc:0,float:0,side:.12,hold:65},keys:[
   [0,{}],
   [.2,{motion:[.13,-.3,.1],head:[.1,.16,-.04],armL:[-.7,-.4,.7],armR:[-1.1,.5,-.1],shift:[-.08,-.06,-.06]}],
   [.43,{motion:[-.12,.3,-.12],head:[-.08,-.1,.04],armR:[-1.5,-.3,-.9],armL:[-.6,-.1,.35],shift:[.12,.09,.17]}],
   [.63,{motion:[.1,-.15,.05],armR:[-.6,.2,-.4],shift:[-.04,-.04,.04]}],
   [.83,{motion:[-.03,.04,0],head:[-.03,0,0],shift:[0,.03,0]}],[1,{}],
  ]},
  // Sweep crumbs into a pile, drum both palms, scatter an expanding sugar fan.
  {id:'enemy:crumb-sentinel',duration:1.36,travel:{travel:.06,arc:0,float:0,side:0,hold:100},keys:[
   [0,{}],
   [.18,{motion:[.23,-.2,.06],head:[.14,.12,-.03],armL:[-.7,-.6,1.2],armR:[-.7,.6,-1.2],shift:[-.07,-.12,.04],stretch:[1.08,.87,1.06]}],
   [.37,{motion:[-.17,.10,-.04],head:[-.12,-.05,.02],armL:[-2.1,.4,-.15],armR:[-2.1,-.4,.15],shift:[.03,.20,-.04],stretch:[.94,1.12,.97]}],
   [.52,{motion:[.28,0,0],head:[.15,0,0],armL:[-.85,.2,.2],armR:[-.85,-.2,-.2],shift:[0,-.16,.20],stretch:[1.13,.81,1.08]}],
   [.68,{motion:[-.14,.12,-.06],armL:[-1.25,-.3,1.45],armR:[-1.25,.3,-1.45],head:[-.10,-.08,.03],shift:[.05,.13,.03]}],
   [.86,{motion:[.05,0,0],armL:[-.35,-.1,.3],armR:[-.35,.1,-.3],shift:[0,-.03,0]}],[1,{}],
  ]},
 ],
};
