import {expect,it,vi} from 'vitest';
import {bindWorldStatusSource,pendingLabelExtent,pendingLabelExtents,type WorldStatusRow} from './world-label-status';

it('measures newly available badges before a HUD commit and retains wide stack text',()=>{
 const layer=document.createElement('div'),node=document.createElement('div');
 node.className='b3-world';node.dataset.actor='clover';node.style.left='200px';node.style.top='100px';
 node.innerHTML='<div class="b3-marker-row"><div class="b3-statuses"></div></div><div class="b3-hp"></div><div class="b3-rage"></div>';
 layer.append(node);document.body.append(layer);
 let rows:WorldStatusRow[]=[{id:'clover',shield:false,stacks:[2]}];
 const release=bindWorldStatusSource(layer,()=>rows),before=node.outerHTML,seen:string[]=[];
 const bounds=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){
  if(this.classList.contains('b3-world')){
   if(this!==node)seen.push(this.innerHTML);
   const tall=!!this.querySelector('.b3-statuses>span');
   return new DOMRect(168,tall?66:84,64,tall?34:16);
  }
  if(this.tagName==='B'&&this.textContent==='12345')return new DOMRect(236,80,34,11);
  return new DOMRect();
 });
 try{
  expect(pendingLabelExtent(node)).toEqual({x:-32,y:-34,width:64,height:34});
  expect(node.outerHTML).toBe(before);expect(layer.children.length).toBe(1);
  // Updating the source requires no React render or mutation of the visible label.
  rows=[{id:'clover',shield:true,stacks:[12345,2,3,4,5]}];
  expect(pendingLabelExtent(node)).toEqual({x:-32,y:-34,width:102,height:34});
  const measured=document.createElement('div');measured.innerHTML=seen.at(-1)!;
  expect([...measured.querySelectorAll('.b3-statuses>span')].map(n=>n.textContent)).toEqual(['','12345','2','3','+2']);
  expect(node.outerHTML).toBe(before);expect(layer.children.length).toBe(1);
  release();expect(pendingLabelExtent(node)).toBeNull();
 }finally{release();bounds.mockRestore();layer.remove();}
});

it('keeps per-actor pending snapshots fresh and leaves visible labels and accessibility IDs intact',()=>{
 const layer=document.createElement('div');document.body.append(layer);
 const nodes=['mochi','clover'].map(id=>{const node=document.createElement('div');node.className='b3-world';node.id=id;node.dataset.actor=id;node.style.left='100px';node.style.top='80px';node.innerHTML=`<div id="${id}-status" data-tutorial-id="badge" class="b3-statuses"></div>`;layer.append(node);return node;});
 let rows:WorldStatusRow[]=[{id:'mochi',shield:true,stacks:[]},{id:'clover',shield:false,stacks:[12345,2,3,4]}];
 const release=bindWorldStatusSource(layer,()=>rows),before=layer.innerHTML,seen:HTMLElement[]=[];
 const bounds=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){
  if(!this.classList.contains('b3-world'))return new DOMRect();
  const clone=this as HTMLElement;seen.push(clone);
  return new DOMRect(90,60,clone.textContent!.includes('12345')?105:64,clone.querySelector('.b3-statuses>span')?34:16);
 });
 try{
  const first=pendingLabelExtents(nodes);
  expect(first.get(nodes[0]!)).toEqual({x:-10,y:-20,width:64,height:34});
  expect(first.get(nodes[1]!)).toEqual({x:-10,y:-20,width:105,height:34});
  expect(layer.innerHTML).toBe(before);
  for(const clone of seen){expect(clone.isConnected).toBe(false);expect(clone.id).toBe('');expect(clone.dataset.actor).toBeUndefined();expect(clone.getAttribute('aria-hidden')).toBe('true');expect(clone.inert).toBe(true);expect(clone.querySelector('[id],[data-tutorial-id]')).toBeNull();}
  rows=[{id:'mochi',shield:false,stacks:[]},{id:'clover',shield:false,stacks:[]}];
  for(const rect of pendingLabelExtents(nodes).values())expect(rect?.height).toBe(16);
  expect(layer.innerHTML).toBe(before);
 }finally{release();bounds.mockRestore();layer.remove();}
});

it('cleans every pending copy when a later label measurement fails and keeps null fallbacks',()=>{
 const layer=document.createElement('div');document.body.append(layer);
 const nodes=['mochi','clover','missing-badges'].map(id=>{const n=document.createElement('div');n.className='b3-world';n.dataset.actor=id;if(id!=='missing-badges')n.innerHTML='<div class="b3-statuses"></div>';layer.append(n);return n;});
 const detached=document.createElement('div'),release=bindWorldStatusSource(layer,()=>nodes.map(n=>({id:n.dataset.actor!,shield:true,stacks:[1]}))),before=layer.innerHTML;
 let copies=0;
 const bounds=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){if(this.classList.contains('b3-world')&&++copies===2)throw Error('measurement failed');return new DOMRect(0,0,64,34);});
 try{
  expect(()=>pendingLabelExtents(nodes)).toThrow('measurement failed');expect(layer.innerHTML).toBe(before);
  expect(pendingLabelExtents([nodes[2]!,detached])).toEqual(new Map([[nodes[2]!,null],[detached,null]]));
  release();expect(pendingLabelExtents(nodes)).toEqual(new Map(nodes.map(n=>[n,null])));expect(layer.innerHTML).toBe(before);
 }finally{release();bounds.mockRestore();layer.remove();}
});
