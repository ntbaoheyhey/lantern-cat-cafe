import {hasDesignerIdleBody} from './designer-idle-body';
import type {SpineCue} from './events';

/** Media ultimates author a release cue instead of a hit cue. */
export function mediaClipContact(asset:string,actor:{cues(name:string):readonly SpineCue[]},animation:string,duration:number){
 const cue=hasDesignerIdleBody(asset,actor)&&animation==='ult'?'ult_release':'hit';
 return actor.cues(animation).find(event=>event.name===cue)?.time??duration*.55;
}
