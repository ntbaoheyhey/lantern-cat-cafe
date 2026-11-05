import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {TurnScene,type SceneView} from './scene';

interface Slot {host:HTMLDivElement;scene:TurnScene;view:()=>SceneView;failure:(message:string)=>void;busy:boolean;error:string}
/** A run owns four warmed preview contexts: three cards and one equipment picker.
 * Detached previews suspend drawing; their programs survive loot/rest transitions.
 * Nothing survives leaving this TurnApp, and no global pool crosses account runs. */
class PreviewPool {
 private slots:Slot[]=[];
 acquire(host:HTMLElement,view:()=>SceneView,failure:(message:string)=>void){
  let slot=this.slots.find(s=>!s.busy);
  if(!slot)slot=this.create(view);
  slot.busy=true;slot.view=view;slot.failure=failure;host.appendChild(slot.host);slot.scene.invalidate();
  if(slot.error)failure(slot.error);
  const leased=slot;
  return {scene:slot.scene,release:()=>{leased.busy=false;leased.failure=()=>{};leased.host.remove()}};
 }
 private create(view:()=>SceneView){
  const host=document.createElement('div');host.className='t3-canvas';
  const slot={host,view,failure:(_message:string)=>{},busy:false,error:''} as Slot;
  slot.scene=new TurnScene(host,()=>({...slot.view(),suspended:!slot.busy}),()=>{},()=>{},message=>{slot.error=message;slot.failure(message)});
  this.slots.push(slot);return slot;
 }
 warmSpare(){const view=this.slots[0]?.view;if(view)while(this.slots.length<4)this.create(view)}
 dispose(){for(const slot of this.slots)slot.scene.dispose();this.slots=[]}
}
const Context=createContext<PreviewPool|null>(null);
export function MiniPreviewProvider({children}:{children:ReactNode}){
 const [pool]=useState(()=>new PreviewPool());
 useEffect(()=>{pool.warmSpare();return()=>pool.dispose()},[pool]);
 return <Context.Provider value={pool}>{children}</Context.Provider>;
}
export function usePreviewPool(){const pool=useContext(Context);if(!pool)throw new Error('Miniature preview requires a run owner');return pool}
