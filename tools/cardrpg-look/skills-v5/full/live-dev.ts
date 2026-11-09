import * as R from '../../../../packages/game-rules/src/cardrpg/depth/index';
type Setup=Parameters<typeof R.createBattle>[0];
declare global { interface Window { __v5LiveStart?: (setup:Setup,speed?:number)=>void } }
/** Explicit dev-only real battles: no fixture plans, event fabrication or rules mutation. */
export function installLiveProbe(){
 if(new URLSearchParams(location.search).get('dev')!=='1')return;
 window.__v5LiveStart=(setup,speed=1)=>{
  const m=window.__depthReview;if(!m)throw Error('Demo model not ready');
  m.galleryBattle=null;m.replay=null;m.plan=null;m.tutorialBattle=R.createBattle(setup);
  m.state.settings.speed=speed as typeof m.state.settings.speed;
  m.watching=true;m.paused=true;m.sceneStarted=true;m.camera='wide';m.go('map');m.notify(false);
 };
}
