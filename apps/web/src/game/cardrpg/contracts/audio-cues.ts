/** Shared V3 contract. Session A owns timing; Session B owns playback. */
export type AudioCue = `ult.${string}.${'charge'|'release'|'impact'|'tail'}`
 | `skill.${string}.${number}.${'cast'|'impact'}` | `hit.${'blunt'|'slash'|'magic'|'heavy'}`
 | `status.${string}.${'on'|'off'|'tick'}`
 | `voice.${string}.${'select'|'attack'|'skill'|'ult'|'hit'|'death'|'victory'}`
 | `voice.${string}.skill.${string}` | `voice.${string}.ult.${'charge'|'release'}`
 | `voice.${string}.${'idle'|'gear'|'forge'}`
 | `ui.${string}` | `music.${'landing'|'home'|'map'|'battle'|'elite'|'boss'|'victory'|'defeat'|'reveal'|'level-up'|'quest-complete'}`
 | `ambience.${string}` | `move.${string}.whoosh` | `kit.${string}.${'charge'|'release'|'travel'|'impact'|'tail'}`
 | `battle.${'turn'|'round'|'ready'|'cut'}` | 'boss.enrage' | 'rage.full' | 'count.tick'
 | 'crit' | 'block' | 'dodge' | 'miss' | `heal.${'small'|'medium'|'large'}` | 'buff.on' | 'debuff.on'
 | `currency.${string}.gain` | `item.land.${string}` | `gacha.${'charge'|'flip'|'pity'}`
 | `tx.${'wallet'|'pending'|'confirmed'|'failed'}` | `fusion.${'consume'|'charge'|'reveal'}`
 | `market.${'list'|'buy'|'cancel'}` | `deed.${'mint'|'reveal'}` | 'withdraw.pour'
 | `seal.${'press'|'release'}` | 'spool.unwind' | `map.${'unfold'|'node'}`;
export interface CueOptions { volume?:number; pitch?:number; priority?:number; element?:string; speed?:number; }
export interface AudioBridge {
 play(id:string,opts?:CueOptions):void; stop(id?:string):void;
 setBus(bus:string,value:number):void; music(id:string):void;
 unlock():Promise<void>; mute(value:boolean):void; pause(value:boolean):void; speed(value:number):void;
 preloadVoices?(actors:readonly string[]):Promise<void>;
 setBattleRoster?(actors?:readonly string[]):void;
 readonly muted:boolean; readonly ready:boolean;
}
declare global { interface Window { __thAudio?:AudioBridge; } }
export function playCue(id:AudioCue,opts?:CueOptions):void { if(typeof window!=='undefined')window.__thAudio?.play(id,opts); }
