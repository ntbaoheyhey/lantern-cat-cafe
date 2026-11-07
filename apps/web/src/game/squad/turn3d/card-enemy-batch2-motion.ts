import type { CardClipDefinition, CardPose } from './card-motion-data';
import type { Motion } from './choreography';
const c=(id:string,keys:[number,CardPose][],travel:Partial<Motion>={}):CardClipDefinition=>({id,duration:1.34,keys:[[0,{}],...keys,[1,{}]],travel:{travel:0,arc:0,float:0,side:0,hold:60,...travel}});
/** Pinch, pour and polish: three different sources of force and release. */
export const ENEMY_BATCH2_CLIPS:Record<string,CardClipDefinition[]>={
 'needle-moth':[
  c('enemy:needle-moth:basic',[
   [.18,{motion:[.10,-.28,.10],head:[.08,.12,-.04],armL:[-1.1,-.5,.8],armR:[-1.8,.5,-.2],wingL:[0,-.5,.2],wingR:[0,.5,-.2],shift:[-.08,-.05,-.04]}],
   [.39,{motion:[-.12,.20,-.12],armL:[-1.1,-.3,1.2],armR:[-.7,-.3,-1.3],head:[-.06,-.1,.02],wingL:[0,.4,-.12],wingR:[0,-.4,.12],shift:[.10,.13,.10]}],
   [.62,{motion:[.08,-.08,.05],armR:[-.25,.3,-.4],shift:[-.025,.06,.02]}],
   [.83,{motion:[-.02,0,0],armL:[-.25,0,.2],shift:[0,.025,0]}],
  ],{float:.10,side:.12}),
  c('enemy:needle-moth',[
   [.20,{motion:[.18,0,0],head:[.16,0,0],armL:[-1.8,.6,-.3],armR:[-1.8,-.6,.3],wingL:[0,-.9,.25],wingR:[0,.9,-.25],shift:[0,-.10,-.06]}],
   [.40,{motion:[-.24,0,0],head:[-.17,0,0],armL:[-2.3,-.4,1.3],armR:[-2.3,.4,-1.3],wingL:[0,.7,-.2],wingR:[0,-.7,.2],shift:[0,.30,.06],stretch:[.94,1.12,.96]}],
   [.57,{motion:[.27,.1,-.05],head:[.13,-.07,.025],armL:[-.5,-.35,.4],armR:[-.5,.35,-.4],wingL:[0,-.65,.15],wingR:[0,.65,-.15],shift:[.04,-.05,.18]}],
   [.79,{motion:[-.08,-.06,.025],armL:[-.4,0,.3],armR:[-.4,0,-.3],wingL:[0,.15,0],wingR:[0,-.15,0],shift:[-.02,.10,0]}],
  ],{float:.19,hold:80}),
 ],
 'teacup-healer':[
  c('enemy:teacup-healer:basic',[
   [.20,{motion:[.12,-.2,.18],head:[.05,.14,-.08],armL:[-.55,-.1,.5],armR:[-1.0,.45,-.1],shift:[-.08,-.06,-.04]}],
   [.43,{motion:[-.10,.25,-.24],head:[-.05,-.12,.08],armL:[-.9,-.1,.6],armR:[-.6,-.4,-1.1],shift:[.14,.08,.14]}],
   [.63,{motion:[.06,-.10,.10],armR:[-.8,.2,-.4],shift:[-.03,-.035,.045]}],
   [.82,{head:[-.04,0,0],motion:[-.03,0,0],shift:[0,.025,0]}],
  ],{travel:.14,side:.16}),
  c('enemy:teacup-healer',[
   [.22,{motion:[.12,.18,-.08],head:[.17,-.12,.04],armL:[-.7,.35,.1],armR:[-.7,-.35,-.1],shift:[.04,-.08,-.04],stretch:[1.04,.94,1.02]}],
   [.44,{motion:[.10,-.12,.35],head:[.03,.1,-.14],armL:[-1.15,-.15,.8],armR:[-1.45,.1,-.6],shift:[-.16,.06,.13]}],
   [.63,{motion:[.02,-.05,.20],head:[-.08,.04,-.08],armL:[-1.0,-.1,.6],armR:[-1.2,0,-.4],shift:[-.10,.04,.09]}],
   [.82,{motion:[-.08,.08,-.08],head:[-.10,-.04,.04],armL:[-.4,-.1,.3],armR:[-.4,.1,-.3],shift:[.035,.055,0]}],
  ],{travel:.04,hold:20}),
 ],
 'kettle-knight':[
  c('enemy:kettle-knight:basic',[
   [.18,{motion:[.14,.35,-.10],head:[.10,-.15,.04],armL:[-.9,-.35,.55],armR:[.3,.2,-.75],shift:[.09,-.06,-.08]}],
   [.40,{motion:[-.12,-.28,.12],head:[-.08,.1,-.04],armL:[-.8,-.2,.35],armR:[-1.5,-.35,-.2],shift:[-.12,.08,.19]}],
   [.61,{motion:[.10,.12,-.05],armR:[-.4,.2,-.6],shift:[.035,-.025,.04]}],
   [.82,{motion:[-.035,0,0],head:[-.02,0,0],armL:[-.3,0,.2],shift:[0,.03,0]}],
  ],{travel:.26,hold:75}),
  c('enemy:kettle-knight',[
   [.21,{motion:[.19,-.16,.08],head:[.14,.10,-.03],armL:[-1.1,-.2,1.1],armR:[-1.5,.7,.15],shift:[-.08,-.13,-.04],stretch:[1.08,.85,1.06]}],
   [.42,{motion:[-.19,.10,-.05],head:[-.13,-.07,.03],armL:[-1.9,-.3,.8],armR:[-1.25,-.5,-.4],shift:[.05,.20,.07],stretch:[.94,1.14,.96]}],
   [.61,{motion:[.08,.15,-.08],head:[-.03,-.1,.03],armL:[-1.4,-.2,1.2],armR:[-.6,.3,-.9],shift:[.08,-.05,.02]}],
   [.81,{motion:[-.06,-.05,.02],armL:[-.45,-.1,.35],armR:[-.35,.1,-.25],shift:[-.02,.04,0]}],
  ],{hold:100}),
 ],
};
