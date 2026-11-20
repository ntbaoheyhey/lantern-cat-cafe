import type {EffectFrame} from '../../squad/turn3d/effects';
import type {Rect} from '../../squad/turn3d/label-layout';
import {sequenceAt} from './sequence';
import {IdentifiedFocusBanner,type FocusIdentity} from './identified-focus';

/** F2: a local title only. The scene owns dimming and the caster outline. */
export class CinematicPlayer {
 readonly root=document.createElement('div');
 private title=document.createElement('strong');
 private identified=new IdentifiedFocusBanner(this.title);
 readonly audit={plate:false,cutin:false,elapsed:0,contact:0,videoTime:0,expectedVideoTime:0,mediaReady:0,mediaFailed:false,cameraTake:'static',flash:0,focus:false,banner:false};
 constructor(host:HTMLElement){
  this.root.className='b3-cinema';this.root.setAttribute('aria-hidden','true');
  this.title.className='b3-focus-name';this.title.hidden=true;this.root.append(this.title);host.append(this.root);
 }
 render(frame:EffectFrame|null,_paused:boolean,_speed:number,reduced:boolean,_fixed=false,_battleKey?:unknown,box?:Rect,identity?:FocusIdentity){
  const state=frame?sequenceAt(frame.plan,frame.elapsed,reduced):null;
  const focus=!!state&&state.seq.tier==='ultimate'&&state.at<600;
  this.title.hidden=!focus;
  if(focus&&frame){
   this.title.style.setProperty('--element',frame.color);
   if(identity)this.identified.paint(frame.plan,frame.plan.name,identity);
   else{
    this.identified.reset();this.title.textContent=frame.plan.name;
    this.title.style.left=`${box?.x??8}px`;this.title.style.top=`${box?.y??8}px`;this.title.style.width=`${box?.width??230}px`;
   }
  }
  Object.assign(this.audit,{plate:false,cutin:false,elapsed:state?.at??0,contact:state?.seq.impact??0,focus,banner:focus});
 }
 dispose(){this.identified.dispose();this.root.remove();}
}
