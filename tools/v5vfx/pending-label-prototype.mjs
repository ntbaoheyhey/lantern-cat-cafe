/** Tool-only batching candidate. The lookup uses the current visual snapshot. */
export function measurePendingLabelBatch(nodes,lookup){
 const result=new Map(),items=[];
 try{
  for(const node of nodes){
   result.set(node,null);const snapshot=lookup(node);if(!snapshot)continue;
   const clone=node.cloneNode(true);clone.removeAttribute('id');clone.removeAttribute('data-actor');clone.setAttribute('aria-hidden','true');
   clone.inert=true;clone.style.visibility='hidden';clone.style.pointerEvents='none';
   for(const child of clone.querySelectorAll('[id],[data-tutorial-id]')){child.removeAttribute('id');child.removeAttribute('data-tutorial-id');}
   const statuses=clone.querySelector('.b3-statuses');if(!statuses)continue;
   statuses.replaceChildren();
   const badge=(text,stack)=>{const span=document.createElement('span');if(text!==undefined)span.textContent=text;if(stack!==undefined){const count=document.createElement('b');count.textContent=String(stack);span.append(count);}statuses.append(span);};
   if(snapshot.shield)badge();for(const stack of snapshot.stacks.slice(0,3))badge(undefined,stack);if(snapshot.stacks.length>3)badge('+'+(snapshot.stacks.length-3));
   items.push({node,clone});
  }
  for(const {node,clone}of items)node.parentElement.append(clone);
  for(const {node,clone}of items){
   const boxes=[clone,...clone.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);if(!boxes.length)continue;
   const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
   result.set(node,{x:left-(parseFloat(clone.style.left)||0),y:top-(parseFloat(clone.style.top)||0),width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top});
  }
  return result;
 }finally{for(const {clone}of items)clone.remove();}
}
