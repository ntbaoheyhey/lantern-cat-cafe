/** Shared V3 contract. Session A owns timing; Session B owns playback. */
export type AudioCue = `ult.${string}.${'charge'|'release'|'impact'|'tail'}`
 | `skill.${string}.${number}.${'cast'|'impact'}` | `hit.${'blunt'|'slash'|'magic'|'heavy'}`
 | `status.${string}.${'on'|'off'|'tick'}`
 | `voice.${string}.${'select'|'attack'|'skill'|'ult'|'hit'|'death'|'victory'}`
 | `ui.${string}` | `music.${'landing'|'home'|'battle'|'boss'|'victory'|'defeat'|'reveal'}`;
export interface CueOptions { volume?:number; pitch?:number; priority?:number; element?:string; speed?:number; }
export interface AudioBridge {
 play(id:string,opts?:CueOptions):void; stop(id?:string):void;
 setBus(bus:string,value:number):void; music(id:string):void;
 unlock():Promise<void>; mute(value:boolean):void; pause(value:boolean):void; speed(value:number):void;
 readonly muted:boolean; readonly ready:boolean;
}
declare global { interface Window { __thAudio?:AudioBridge; } }
export function playCue(id:AudioCue,opts?:CueOptions):void { if(typeof window!=='undefined')window.__thAudio?.play(id,opts); }
