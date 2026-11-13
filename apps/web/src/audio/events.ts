import {eventCue} from './cues';
import type {EffectFrame} from '../game/squad/turn3d/effects';
import type {AudioBridge} from '../game/cardrpg/contracts/audio-cues';
export function playFrame(audio:Pick<AudioBridge,'play'>,frame:EffectFrame){const p=frame.plan,unit=p.actorId.replace(/^(party|cat)[-:]/,''),phase=({anticipation:'charge',travel:'release',impact:'impact',reaction:'tail',residue:'tail'} as const)[frame.beat.kind];const element=['slash','arrow'].includes(p.shape)?'slash':['bash','charge','sweep'].includes(p.shape)?'heavy':'magic';
 // Travel, recoil and residue are visual beats of the same action, not extra hits.
 if(p.ultimate&&frame.beat.kind!=='residue')audio.play(`ult.${unit}.${phase}`,{element});
 else if(!p.ultimate&&phase==='charge')audio.play(`skill.${unit}.1.cast`,{element});
 else if(!p.ultimate&&phase==='impact')audio.play(`skill.${unit}.1.impact`,{element});
 if(!p.ultimate&&phase==='release')audio.play('kit.slash.release',{element});
 if(phase==='charge')audio.play(`voice.${unit}.${p.ultimate?'ult':'skill'}`);
 if(phase==='impact')for(const event of p.events)audio.play(eventCue(event),{element});
}
