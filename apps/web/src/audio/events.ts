import {eventCue} from './cues';
import type {EffectFrame} from '../game/squad/turn3d/effects';
import type {AudioBridge} from '../game/cardrpg/contracts/audio-cues';
export function playFrame(audio:Pick<AudioBridge,'play'>,frame:EffectFrame){const p=frame.plan,unit=p.actorId.replace(/^(party|cat)[-:]/,''),phase=({anticipation:'charge',travel:'release',impact:'impact',reaction:'tail',residue:'tail'} as const)[frame.beat.kind];const element=['slash','arrow'].includes(p.shape)?'slash':['bash','charge','sweep'].includes(p.shape)?'heavy':'magic';
 audio.play(p.ultimate?`ult.${unit}.${phase}`:`skill.${unit}.1.${phase==='charge'?'cast':'impact'}`,{element});
 if(phase==='charge')audio.play(`voice.${unit}.${p.ultimate?'ult':'skill'}`);
 if(phase==='impact')for(const event of p.events)audio.play(eventCue(event),{element});
}
