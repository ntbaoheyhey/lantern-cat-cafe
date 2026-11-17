import {layoutFocusBanner,type BannerPlacement} from './banner-layout';
import {layoutWorldLabels,type LabelRect,type WorldLabel} from './world-label-layout';

interface BannerAnchor {id:string;visible:boolean;labelX:number;labelY:number;body?:LabelRect;face?:LabelRect}
export interface FocusIdentity {id:string;name:string;portrait:string;anchors:readonly BannerAnchor[]}
const rect=(r:DOMRect):LabelRect=>({x:r.x,y:r.y,width:r.width,height:r.height});
const visible=(node:HTMLElement)=>!node.hidden&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden';

/** Measure once at focus entry or a real resize/font change, then hold the caption. */
export class IdentifiedFocusBanner {
 private key:unknown;
 private identity='';
 private viewport='';
 private dirty=true;
 private placement?:BannerPlacement;
 private parentOffset={x:0,y:0};
 private invalidate=()=>{this.dirty=true;};
 constructor(private title:HTMLElement){
  window.addEventListener('resize',this.invalidate);
  document.fonts?.addEventListener('loadingdone',this.invalidate);
 }
 paint(key:unknown,skill:string,owner:FocusIdentity){
  const identity=[owner.id,owner.name,owner.portrait,skill].join('\n');
  if(this.key!==key||this.identity!==identity){
   this.key=key;this.identity=identity;this.dirty=true;
   const image=document.createElement('img');image.src=owner.portrait;image.alt='';
   const name=document.createElement('span');name.className='b3-focus-owner';name.textContent=owner.name;
   const action=document.createElement('span');action.className='b3-focus-skill';action.textContent=skill;
   const copy=document.createElement('span');copy.className='b3-focus-copy';copy.append(name,action);
   this.title.replaceChildren(image,copy);this.title.classList.add('b3-focus-identified');this.title.dataset.caster=owner.id;
  }
  const viewport=innerWidth+':'+innerHeight;
  if(viewport!==this.viewport){this.viewport=viewport;this.dirty=true;}
  if(this.dirty){
   const parent=this.title.parentElement!.getBoundingClientRect();this.parentOffset={x:parent.x,y:parent.y};
   this.title.style.width=Math.min(260,innerWidth-16)+'px';
   const canvas=document.querySelector('.dp-canvas')?.getBoundingClientRect();
   const offset={x:canvas?.x??0,y:canvas?.y??0};
   const project=(r:LabelRect):LabelRect=>({...r,x:r.x+offset.x,y:r.y+offset.y});
   const anchors=owner.anchors.filter(a=>a.visible),caster=anchors.find(a=>a.id===owner.id)?.body;
   const hudNodes=[...document.querySelectorAll<HTMLElement>('.b3-top,.b3-bottom,.b3-boss,.th-audio,.b3-party')].filter(visible);
   const hud=hudNodes.map(n=>rect(n.getBoundingClientRect())).filter(r=>r.width&&r.height);
   const faces=anchors.flatMap(a=>a.face?[{...project(a.face),id:a.id}]:[]);
   const labels:WorldLabel[]=[];
   for(const node of document.querySelectorAll<HTMLElement>('.b3-world')){
    const anchor=anchors.find(a=>a.id===node.dataset.actor);if(!anchor||!visible(node))continue;
    const boxes=[node,...node.querySelectorAll<HTMLElement>('*')].filter(visible).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
    if(!boxes.length)continue;
    const left=Math.min(...boxes.map(r=>r.left)),top=Math.min(...boxes.map(r=>r.top));
    // Project the same measured glyph extents onto current anchors: HUD paint may run later in this frame.
    labels.push({id:anchor.id,side:node.dataset.side==='enemy'?'enemy':'party',rect:{
     x:offset.x+anchor.labelX+left-(parseFloat(node.style.left)||0),y:offset.y+anchor.labelY+top-(parseFloat(node.style.top)||0),
     width:Math.max(...boxes.map(r=>r.right))-left,height:Math.max(...boxes.map(r=>r.bottom))-top}});
   }
   const worldHud=hudNodes.filter(n=>!n.classList.contains('b3-party')).map(n=>rect(n.getBoundingClientRect())).filter(r=>r.width&&r.height);
   const placed=layoutWorldLabels(labels,innerWidth,innerHeight,worldHud,faces);
   const title=rect(this.title.getBoundingClientRect());
   this.placement=layoutFocusBanner({title,caster:caster?project(caster):title,width:innerWidth,height:innerHeight,
    hud,faces,bodies:anchors.flatMap(a=>a.body?[project(a.body)]:[]),labels:placed.map(p=>p.rect)});
   this.dirty=false;
  }
  if(this.placement){
   this.title.style.left=this.placement.x-this.parentOffset.x+'px';this.title.style.top=this.placement.y-this.parentOffset.y+'px';
   this.title.dataset.placement=this.placement.feasible?'clear':'crowded';
  }
 }
 reset(){this.key=undefined;this.dirty=true;this.placement=undefined;this.title.classList.remove('b3-focus-identified');delete this.title.dataset.caster;delete this.title.dataset.placement;}
 dispose(){window.removeEventListener('resize',this.invalidate);document.fonts?.removeEventListener('loadingdone',this.invalidate);}
}
