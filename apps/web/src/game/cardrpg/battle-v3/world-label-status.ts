import type {LabelRect} from './world-label-layout';

export interface WorldStatusRow {id:string;shield:boolean;stacks:readonly number[]}
type StatusSource=()=>readonly WorldStatusRow[];
const sources=new WeakMap<HTMLElement,StatusSource>();

/** Read the visual model at focus entry, even before React commits the next HUD. */
export function bindWorldStatusSource(layer:HTMLElement,source:StatusSource){
 sources.set(layer,source);
 return()=>{if(sources.get(layer)===source)sources.delete(layer);};
}

/** Prepare the next visual status without changing the currently displayed label. */
function pendingLabelClone(node:HTMLElement):HTMLElement|null {
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
 return clone;
}

/** Append all pending copies before measuring, then remove every copy together. */
export function pendingLabelExtents(nodes:readonly HTMLElement[]):Map<HTMLElement,LabelRect|null> {
 const extents=new Map<HTMLElement,LabelRect|null>();
 const copies:{node:HTMLElement;parent:HTMLElement;clone:HTMLElement}[]=[];
 try{
  for(const node of nodes){
   extents.set(node,null);
   const clone=pendingLabelClone(node),parent=node.parentElement;
   if(clone&&parent)copies.push({node,parent,clone});
  }
  for(const {parent,clone}of copies)parent.append(clone);
  for(const {node,clone}of copies){
   const boxes=[clone,...clone.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
   if(!boxes.length)continue;
   const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
   extents.set(node,{x:left-(parseFloat(clone.style.left)||0),y:top-(parseFloat(clone.style.top)||0),width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top});
  }
  return extents;
 }finally{for(const {clone}of copies)clone.remove();}
}

/** Size one pending label with the same CSS, including overflowing stack counters. */
export function pendingLabelExtent(node:HTMLElement):LabelRect|null {
 return pendingLabelExtents([node]).get(node)??null;
}
