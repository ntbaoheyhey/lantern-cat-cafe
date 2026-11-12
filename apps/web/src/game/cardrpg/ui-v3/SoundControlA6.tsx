import {useId} from 'react';
import type {DepthModel} from '../depth/model';
import './sound-a6.css';

export function SoundControlA6({m,battle=false}:{m:DepthModel;battle?:boolean}) {
 const id=useId(),{enabled,blocked,pending}=m.audio;
 const message=pending?'Opening sound…':blocked?'Sound could not start. Try again.':'';
 const label=pending?'Starting sound…':blocked?'Try sound again':battle?`Turn sound ${enabled?'off':'on'}`:`Sound ${enabled?'on':'off'}`;
 return <>
  <button aria-label={label} disabled={pending} aria-pressed={enabled} aria-busy={pending} aria-describedby={message?id:undefined} onClick={()=>{void m.toggleSound();}}>{m.state.formationC2?(enabled?'♫':'♩'):label}</button>
  <p id={id} className="a6-sound-status" aria-live="polite" aria-atomic="true" data-blocked={blocked}>{message}</p>
 </>;
}
