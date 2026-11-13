import {eventCue} from './cues';
import {skillSlot,voiceUnit} from './callouts';
import type {EffectFrame} from '../game/squad/turn3d/effects';
import type {AudioBridge} from '../game/cardrpg/contracts/audio-cues';

export function playFrame(audio:Pick<AudioBridge,'play'>,frame:EffectFrame){
 const p=frame.plan,unit=voiceUnit(p.actorId),phase=({anticipation:'charge',travel:'release',impact:'impact',reaction:'tail',residue:'tail'} as const)[frame.beat.kind];
 const element=['slash','arrow'].includes(p.shape)?'slash':['bash','charge','sweep'].includes(p.shape)?'heavy':'magic';
 const slot=unit?skillSlot(unit,p.presentationId??p.skillId):undefined;
 // Round ticks and result effects have no casting unit. They still play their
 // impact events, but must not manufacture a skill cast or another cat's line.
 if(unit){
  if(p.ultimate&&frame.beat.kind!=='residue')audio.play(`ult.${unit}.${phase}`,{element});
  else if(!p.ultimate&&slot&&phase==='charge')audio.play(`skill.${unit}.${slot}.cast`,{element});
  else if(!p.ultimate&&slot&&phase==='impact')audio.play(`skill.${unit}.${slot}.impact`,{element});
  if(!p.ultimate&&phase==='release')audio.play('kit.slash.release',{element});
 }
 // The engine supplies the callout until A requests it explicitly. Sending a
 // generic skill/ult bark here would suppress that more specific fallback.
 if(phase==='impact')for(const event of p.events)audio.play(eventCue(event),{element});
}
