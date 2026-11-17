import type {LabelRect} from './world-label-layout';

export interface WorldStatusRow {id:string;shield:boolean;stacks:readonly number[]}
type StatusSource=()=>readonly WorldStatusRow[];
const sources=new WeakMap<HTMLElement,StatusSource>();

/** Read the visual model at focus entry, even before React commits the next HUD. */
export function bindWorldStatusSource(layer:HTMLElement,source:StatusSource){
 sources.set(layer,source);
 return()=>{if(sources.get(layer)===source)sources.delete(layer);};
}

/** Size an invisible copy with the same CSS, including overflowing stack counters. */
export function pendingLabelExtent(node:HTMLElement):LabelRect|null {
 const snapshot=node.parentElement&&sources.get(node.parentElement)?.().find(row=>row.id===node.dataset.actor);
 if(!snapshot)return null;
 const clone=node.cloneNode(true) as HTMLElement;
 clone.removeAttribute('id');clone.removeAttribute('data-actor');clone.setAttribute('aria-hidden','true');
 clone.inert=true;clone.style.visibility='hidden';clone.style.pointerEvents='none';
 for(const child of clone.querySelectorAll('[id],[data-tutorial-id]')){child.removeAttribute('id');child.removeAttribute('data-tutorial-id');}
 const statuses=clone.querySelector('.b3-statuses');
 if(!statuses)return null;
 statuses.replaceChildren();
 const badge=(text?:string,stack?:number)=>{
  const span=document.createElement('span');
  if(text!==undefined)span.textContent=text;
  if(stack!==undefined){const count=document.createElement('b');count.textContent=String(stack);span.append(count);}
  statuses.append(span);
 };
 if(snapshot.shield)badge();
 for(const stack of snapshot.stacks.slice(0,3))badge(undefined,stack);
 if(snapshot.stacks.length>3)badge('+'+(snapshot.stacks.length-3));
 node.parentElement!.append(clone);
 try{
  const boxes=[clone,...clone.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  if(!boxes.length)return null;
  const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
  return{x:left-(parseFloat(clone.style.left)||0),y:top-(parseFloat(clone.style.top)||0),width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top};
 }finally{clone.remove();}
}
