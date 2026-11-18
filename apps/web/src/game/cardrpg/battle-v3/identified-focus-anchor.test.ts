import {expect,it,vi} from 'vitest';
import {IdentifiedFocusBanner} from './identified-focus';
const {reserve}=vi.hoisted(()=>({reserve:vi.fn(()=>({x:600,y:350,width:200,height:60,feasible:true}))}));
vi.mock('./banner-layout',()=>({layoutFocusBanner:reserve}));
vi.mock('./world-label-status',()=>({pendingLabelExtent:()=>({x:-32,y:-40,width:100,height:40}),pendingLabelExtents:(nodes:HTMLElement[])=>new Map(nodes.map(n=>[n,{x:-32,y:-40,width:100,height:40}]))}));

it('reserves current and wider pending badges at the authored HP location before a HUD commit',()=>{
 const parent=document.createElement('div'),canvas=document.createElement('div'),title=document.createElement('div'),label=document.createElement('div');
 canvas.className='dp-canvas';label.className='b3-world';label.dataset.actor='clover';label.dataset.side='party';label.style.left='500px';label.style.top='300px';parent.append(canvas,title,label);document.body.append(parent);
 const bounds=vi.spyOn(Element.prototype,'getBoundingClientRect').mockImplementation(function(this:Element){return this===canvas?new DOMRect(120,80,1000,600):this===label?new DOMRect(468,266,64,34):this===title?new DOMRect(0,0,260,60):new DOMRect();});
 const banner=new IdentifiedFocusBanner(title);
 try{
  banner.paint('cast','Tea',{id:'clover',name:'Clover',portrait:'/own.webp',anchors:[{id:'clover',visible:true,labelX:280,labelY:200,face:{x:250,y:150,width:50,height:50},body:{x:200,y:140,width:180,height:220},labelTarget:{x:270,y:120,avoid:{x:200,y:140,width:180,height:220}}}]});
  expect(reserve).toHaveBeenCalledOnce();
  expect((reserve.mock.calls[0] as unknown as [{labels:unknown}])[0].labels).toEqual([{x:358,y:166,width:64,height:34},{x:358,y:160,width:100,height:40}]);
 }finally{banner.dispose();bounds.mockRestore();parent.remove();}
});
