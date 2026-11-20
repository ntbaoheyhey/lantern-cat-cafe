import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { readablePortrait, readableName } from '../../apps/web/src/game/squad/turn3d/look-readable-assets';
import './b2-gallery.css';
declare global { interface Window { __b2Showcase?: { images: {name:string;before:string;after:string}[]; ultimateSheet?:string } } }
const cats=['mochi','soot','clover','biscuit','sorrel','panko','mallow','cinnamon','brioche','marigold','velvet','inkcap'];
export function B2Gallery() {
 const m=window.__depthReview;
 useSyncExternalStore(m?.subscribe??(()=>()=>{}),m?.snapshot??(()=>0));
 const [open,setOpen]=useState(false),[preview,setPreview]=useState(false);
 const dialog=useRef<HTMLDialogElement>(null),close=()=>setOpen(false);
 useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
 const inspect=(id:string)=>{if(!m)return;m.inspect(id,0,true);setPreview(true);setOpen(false);};
 return <><button onClick={()=>setOpen(true)} disabled={!!m?.showBattle&&!preview}>Battle gallery</button>
 <dialog className="look-b2-gallery" ref={dialog} onCancel={close} onClose={close}>
  <header><div><small>THE LANTERN</small><h2>A closer look at the battle</h2></div><button onClick={close} autoFocus>Close gallery</button></header>
  <p>See the same six moments before and after, or watch a companion’s ultimate.</p>
  <div className="look-b2-pairs">{window.__b2Showcase?.images.map((item,i)=><figure key={item.name}><figcaption>{i+1}. {item.name}</figcaption><div><img src={item.before} alt={`${item.name}, before B2`} /><img src={item.after} alt={`${item.name}, after B2`} /></div><small>Before · After</small></figure>)}</div>
  <h3>Twelve little moments of magic</h3><div className="look-b2-ultimates">{cats.map(id=><button key={id} onClick={()=>inspect(`${id}-4`)}><img src={readablePortrait(id)} alt="" /><b>{readableName(id)}</b><span>Watch ultimate</span></button>)}</div>
  {window.__b2Showcase?.ultimateSheet&&<img className="look-b2-effect-sheet" src={window.__b2Showcase.ultimateSheet} alt="Twelve ultimate impact frames" />}
 </dialog>
 {preview&&m?.galleryBattle&&<div className="look-b2-preview" role="region" aria-label="Ultimate preview controls"><span>Ultimate preview</span><button onClick={()=>m.inspect(m.galleryId,0,true)}>Replay</button><label>Preview speed<select aria-label="Preview speed" value={m.gallerySpeed} onChange={e=>{m.gallerySpeed=Number(e.target.value);m.notify(false);}}><option value={.25}>0.25×</option><option value={1}>1×</option></select></label><label><input type="checkbox" checked={m.galleryEffectOnly} onChange={e=>{m.galleryEffectOnly=e.target.checked;m.notify(false);}} />Effect only</label><button onClick={()=>{m.closeGallery();setPreview(false);setOpen(true);}}>Back to gallery</button></div>}
 </>;
}
