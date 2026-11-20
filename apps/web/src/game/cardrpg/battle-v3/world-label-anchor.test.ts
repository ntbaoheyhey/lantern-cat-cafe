import {expect,it,vi} from 'vitest';
import {layoutWorldLabels,type LabelRect,type WorldLabel} from './world-label-layout';
import {createWorldLabelLayout} from './world-label-dom';
import captures from './clover-hud-fixtures.json';

const overlaps=(a:LabelRect,b:LabelRect)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
it('keeps the label above the prepared Clover body throughout the frozen native sample',()=>{
 for(const f of captures){
  const label={id:'clover',side:'party' as const,rect:f.rect,anchorPlacement:{rect:f.target,avoid:f.body}};
  const [placed]=layoutWorldLabels([label],1280,720,[],[f.face]);
  expect(placed!.feasible).toBe(true);expect(placed!.rect).toEqual(f.target);
  expect(overlaps(placed!.rect,f.body)).toBe(false);
  expect(f.spout.x>=placed!.rect.x&&f.spout.x<=placed!.rect.x+placed!.rect.width&&f.spout.y>=placed!.rect.y&&f.spout.y<=placed!.rect.y+placed!.rect.height).toBe(false);
 }
});
it('keeps every ordinary label fixed when an authored anchor needs a fallback',()=>{
 const f=captures[0]!,labels:WorldLabel[]=[{id:'clover',side:'party',rect:f.rect},{id:'companion',side:'party',rect:{x:400,y:100,width:96,height:45}}];
 const baseline=layoutWorldLabels(labels,1280,720,[],[f.face]);
 const moved=layoutWorldLabels([{...labels[0]!,anchorPlacement:{rect:f.target,avoid:f.body}},labels[1]!],1280,720,[],[f.face]);
 expect(moved[1]).toEqual(baseline[1]);expect(moved[0]!.feasible).toBe(true);
 expect(overlaps(moved[0]!.rect,moved[1]!.rect)).toBe(false);expect(overlaps(moved[0]!.rect,f.body)).toBe(false);
 expect(moved[0]!.rect).not.toEqual(baseline[0]!.rect);
});
it('carries the canvas offset and overflowing status extent into authored-anchor placement',()=>{
 vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});
 const layer=document.createElement('div'),node=document.createElement('div'),badge=document.createElement('b');layer.className='b3-world-layer';node.dataset.side='party';node.append(badge);layer.append(node);document.body.append(layer);
 const bounds=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){
  const x=parseFloat(node.style.left)||0,y=parseFloat(node.style.top)||0;
  return this===node?new DOMRect(x-32,y-34,64,34):this===badge?new DOMRect(x+28,y-40,30,12):new DOMRect();
 });
 const layout=createWorldLabelLayout(new Map([['clover',node]]));
 try{
  layout.paint([{id:'clover',visible:true,labelX:280,labelY:200,face:{x:250,y:150,width:50,height:50},labelTarget:{x:270,y:120,avoid:{x:200,y:140,width:180,height:220}}}],{left:120,top:80},true);
  expect(parseFloat(node.style.left)).toBe(390);expect(parseFloat(node.style.top)).toBe(200);
  expect(node.hidden).toBe(false);
 }finally{layout.dispose();bounds.mockRestore();layer.remove();vi.unstubAllGlobals();}
});
