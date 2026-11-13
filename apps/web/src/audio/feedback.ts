import type {AudioBridge,AudioCue} from '../game/cardrpg/contracts/audio-cues';

const controls='button,a[href],summary,input,select,[role="button"],[role="tab"],[role="switch"]';
export const UI_FEEDBACK_CUES=['ui.tab','ui.toggle','ui.close','ui.open','ui.page','ui.slider','ui.quantity','ui.select','ui.click','ui.denied','ui.hover','ui.release','ui.scroll'] as const;
const disabled=(el:Element)=>el.matches(':disabled,[aria-disabled="true"]')||!!el.closest('[inert]');
/** Semantic input feedback is shared by mouse, touch and keyboard activation. */
export function controlCue(el:Element):AudioCue {
 const explicit=el.getAttribute('data-audio-cue');
 if(explicit&&UI_FEEDBACK_CUES.includes(explicit as typeof UI_FEEDBACK_CUES[number]))return explicit as AudioCue;
 if(el.matches('[role="tab"],nav button,[role="tablist"] button,select'))return 'ui.tab';
 if(el.matches('[role="switch"],[aria-pressed],input[type="checkbox"],input[type="radio"]'))return 'ui.toggle';
 if(el.matches('summary'))return el.parentElement?.hasAttribute('open')?'ui.close':'ui.open';
 if(el.matches('a'))return 'ui.page';
 if(el.matches('input[type="range"]'))return 'ui.slider';
 if(el.matches('input[type="number"]'))return 'ui.quantity';
 if(el.matches('.b2-batch-controls button'))return 'ui.quantity';
 if(el.matches('.b2-tile,.a6-cat-list button,.b2-fusion-grid button'))return 'ui.select';
 return 'ui.click';
}
export function installUiFeedback(audio:Pick<AudioBridge,'play'>,root:Document=document){
 const handlers:Array<[string,EventListener]>=[];const last=new Map<string,number>();
 const emit=(id:AudioCue,spacing=0)=>{const now=performance.now();if(now-(last.get(id)??-Infinity)<spacing)return;last.set(id,now);audio.play(id);};
 const listen=(name:string,fn:(event:Event)=>void)=>{root.addEventListener(name,fn,true);handlers.push([name,fn]);};
 const control=(event:Event)=>(event.target instanceof Element?event.target.closest(controls):null);
 listen('click',event=>{const el=control(event);if(el&&!disabled(el)&&(!el.matches('input,select')||el.matches('input[type="checkbox"],input[type="radio"]')))emit(controlCue(el),80);});
 listen('pointerover',event=>{const el=control(event),from=(event as PointerEvent).relatedTarget;if(el&&!(from instanceof Node&&el.contains(from)))emit(disabled(el)?'ui.denied':'ui.hover',80);});
 listen('pointerup',event=>{const el=control(event);if(el&&!disabled(el))emit('ui.release',40);});
 listen('input',event=>{const el=control(event);if(el&&!disabled(el)&&el.matches('input'))emit(controlCue(el),80);});
 listen('change',event=>{const el=control(event);if(el&&!disabled(el)&&el.matches('select'))emit('ui.tab',80);});
 listen('scroll',event=>{const target=event.target;if(target instanceof Element&&target.closest('.uv-sheet,.b2-dialog,.chain-room'))emit('ui.scroll',120);});
 return()=>{for(const [name,fn] of handlers)root.removeEventListener(name,fn,true);};
}
