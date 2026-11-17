import {expect,it,vi} from 'vitest';
import {bindWorldStatusSource,pendingLabelExtent,type WorldStatusRow} from './world-label-status';

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
