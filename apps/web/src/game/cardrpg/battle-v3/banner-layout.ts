import type {LabelRect} from './world-label-layout';

export interface BannerGeometry {
 title:LabelRect;caster:LabelRect;width:number;height:number;
 hud:readonly LabelRect[];faces:readonly LabelRect[];bodies:readonly LabelRect[];labels:readonly LabelRect[];
}
export interface BannerPlacement extends LabelRect {feasible:boolean}

/** The measured portrait caption keeps its owner explicit even in a detached clear lane. */
export function layoutFocusBanner(g:BannerGeometry):BannerPlacement {
 const {title,caster,width,height}=g;
 const pad=(r:LabelRect,n:number):LabelRect=>({x:r.x-n,y:r.y-n,width:r.width+2*n,height:r.height+2*n});
 const overlap=(a:LabelRect,b:LabelRect)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
 const obstacles=[...g.hud.map(r=>pad(r,8)),...g.faces.map(r=>pad(r,12)),...g.bodies.map(r=>pad(r,6)),...g.labels.map(r=>pad(r,8))];
 const fit=(p:{x:number;y:number}):LabelRect=>({x:Math.max(8,Math.min(width-title.width-8,p.x)),y:Math.max(8,Math.min(height-title.height-8,p.y)),width:title.width,height:title.height});
 const clear=(box:LabelRect)=>box.width<=width-16&&box.height<=height-16&&!obstacles.some(r=>overlap(box,r)>0);
 const midY=caster.y+caster.height*.35;
 const candidates=[{x:caster.x+caster.width+8,y:midY},{x:caster.x-title.width-8,y:midY},
  {x:caster.x+(caster.width-title.width)/2,y:caster.y-title.height-12},{x:caster.x+(caster.width-title.width)/2,y:caster.y+caster.height+8}].map(fit);
 let available=candidates.filter(clear);
 if(!available.length){
  for(let y=8;y<=height-title.height-8;y+=12)for(let x=8;x<=width-title.width-8;x+=16){
   const box={x,y,width:title.width,height:title.height};if(clear(box))available.push(box);
  }
 }
 const score=(b:LabelRect)=>(b.x+b.width/2-(caster.x+caster.width/2))**2+(b.y+b.height/2-(caster.y+caster.height/2))**2;
 const selected=available.sort((a,b)=>score(a)-score(b))[0];
 return {...(selected??fit(title)),feasible:!!selected};
}
