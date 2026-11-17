/** Private sizing drill: use current presentation state before React commits its badges. */
export function pendingLabelExtent(node, snapshot) {
 const clone=node.cloneNode(true);
 clone.removeAttribute('id');clone.removeAttribute('data-actor');clone.setAttribute('aria-hidden','true');
 clone.inert=true;clone.style.visibility='hidden';clone.style.pointerEvents='none';
 for(const child of clone.querySelectorAll('[id],[data-tutorial-id]')){child.removeAttribute('id');child.removeAttribute('data-tutorial-id');}
 const statuses=clone.querySelector('.b3-statuses');
 if(!statuses)return null;
 statuses.replaceChildren();
 const badge=(text,stack)=>{
  const span=document.createElement('span');
  if(text!==undefined)span.textContent=text;
  if(stack!==undefined){const count=document.createElement('b');count.textContent=String(stack);span.append(count);}
  statuses.append(span);
 };
 if(snapshot.shield)badge();
 for(const stack of snapshot.stacks.slice(0,3))badge(undefined,stack);
 if(snapshot.stacks.length>3)badge('+'+(snapshot.stacks.length-3));
 node.parentElement.append(clone);
 try{
  const boxes=[clone,...clone.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
  const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
  return{x:left-(parseFloat(clone.style.left)||0),y:top-(parseFloat(clone.style.top)||0),width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top};
 }finally{clone.remove();}
}
