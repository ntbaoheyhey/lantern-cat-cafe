import {layoutWorldLabels,type LabelRect,type WorldLabel} from './world-label-layout';

interface WorldAnchor {id:string;visible:boolean;labelX:number;labelY:number;face?:LabelRect}

/** Cache glyph extents; moving an actor should not measure every descendant each frame. */
export function createWorldLabelLayout(nodes:Map<string,HTMLDivElement>){
 const extents=new Map<HTMLDivElement,LabelRect>(),observed=new Set<Element>();
 let dirty=true,viewportWidth=0,viewportHeight=0,obstacles:LabelRect[]=[],lastHud:HTMLElement[]=[];
 const invalidate=()=>{dirty=true;};
 const resize=new ResizeObserver(invalidate),content=new MutationObserver(invalidate);
 const layer=document.querySelector('.b3-world-layer');
 if(layer)content.observe(layer,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',invalidate);
 document.fonts?.addEventListener('loadingdone',invalidate);
 const observe=(node:Element)=>{if(!observed.has(node)){observed.add(node);resize.observe(node);dirty=true;}};
 const position=(node:HTMLElement,x:number,y:number)=>{
  const left=`${x}px`,top=`${y}px`;if(node.style.left!==left)node.style.left=left;if(node.style.top!==top)node.style.top=top;
 };
 return {
  paint(anchors:readonly WorldAnchor[],canvas:{left:number;top:number},enabled:boolean){
   const active=anchors.flatMap(anchor=>{
    const node=nodes.get(anchor.id);if(!node)return[];node.hidden=!anchor.visible;
    if(!enabled||!anchor.visible){position(node,canvas.left+anchor.labelX,canvas.top+anchor.labelY);return[];}
    observe(node);return[{anchor,node,x:canvas.left+anchor.labelX,y:canvas.top+anchor.labelY}];
   });
   if(!enabled)return;
   const hud=[...document.querySelectorAll<HTMLElement>('.b3-top,.b3-boss,.b3-bottom,.th-audio')];
   if(hud.length!==lastHud.length||hud.some((node,i)=>node!==lastHud[i])){dirty=true;lastHud=hud;}
   for(const node of hud)observe(node);
   if(innerWidth!==viewportWidth||innerHeight!==viewportHeight){viewportWidth=innerWidth;viewportHeight=innerHeight;dirty=true;}
   if(dirty){
    for(const item of active)position(item.node,item.x,item.y);
    for(const {node,x,y} of active){
     const boxes=[node,...node.querySelectorAll('*')].map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
     if(!boxes.length){extents.delete(node);continue;}
     const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
     extents.set(node,{x:left-x,y:top-y,width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top});
    }
    obstacles=hud.filter(n=>!n.hidden&&getComputedStyle(n).visibility!=='hidden').map(n=>{
     const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};
    }).filter(r=>r.width&&r.height);
    dirty=false;
   }
   const labels:WorldLabel[]=active.flatMap(({anchor,node,x,y})=>{
    const box=extents.get(node);return box?[{id:anchor.id,side:node.dataset.side==='enemy'?'enemy' as const:'party' as const,rect:{...box,x:x+box.x,y:y+box.y}}]:[];
   });
   const faces=anchors.flatMap(a=>a.visible&&a.face?[{...a.face,id:a.id,x:a.face.x+canvas.left,y:a.face.y+canvas.top}]:[]);
   for(const placed of layoutWorldLabels(labels,viewportWidth,viewportHeight,obstacles,faces)){
    const item=active.find(a=>a.anchor.id===placed.id),before=labels.find(l=>l.id===placed.id);if(!item||!before)continue;
    position(item.node,item.x+placed.rect.x-before.rect.x,item.y+placed.rect.y-before.rect.y);
   }
  },
  dispose(){resize.disconnect();content.disconnect();window.removeEventListener('resize',invalidate);document.fonts?.removeEventListener('loadingdone',invalidate);extents.clear();observed.clear();},
 };
}
