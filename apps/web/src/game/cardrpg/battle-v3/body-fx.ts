import type {SceneView} from '../../squad/turn3d/scene';
import type {Rect} from '../../squad/turn3d/label-layout';
import {bodyStatuses,STATUS_COLOR,type BodyStatus} from './status';
export class BodyFx {
 readonly canvas=document.createElement('canvas');
 private c:CanvasRenderingContext2D;
 private frozen=new Map<string,number>();
 constructor(host:HTMLElement){
  this.canvas.dataset.bodyFx='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3'});
  this.c=this.canvas.getContext('2d')!;host.appendChild(this.canvas);
 }
 render(view:SceneView,time:number,w:number,h:number,boxes:Map<string,Rect>){
  const ratio=Math.min(devicePixelRatio||1,2),c=this.c;
  if(this.canvas.width!==w*ratio||this.canvas.height!==h*ratio){this.canvas.width=w*ratio;this.canvas.height=h*ratio;}
  c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,w,h);
  const t=view.reducedMotion?0:time;
  for(const unit of view.actors){
   if(unit.hp<=0)continue;const b=boxes.get(unit.id);if(!b)continue;
   const kinds=bodyStatuses(view.cardStatuses?.[unit.id],unit.shield),cx=b.x+b.width/2,cy=b.y+b.height*.57,r=Math.min(b.width*.42,b.height*.38),feet=b.y+b.height;
   if(kinds.includes('freeze'))this.frozen.set(unit.id,time);
   else if(this.frozen.has(unit.id)&&time-this.frozen.get(unit.id)!>.35)this.frozen.delete(unit.id);
   const shatter=!kinds.includes('freeze')&&this.frozen.has(unit.id)?(time-this.frozen.get(unit.id)!)/.35:-1;
   for(const kind of kinds)this.draw(kind,cx,cy,r,feet,b.y,t);
   if(shatter>=0&&!view.reducedMotion){c.fillStyle='#bdf4ff';c.globalAlpha=1-shatter;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.save();c.translate(cx+Math.cos(a)*r*(1+shatter),cy+Math.sin(a)*r*(1+shatter));c.rotate(a);c.fillRect(-3,-8,6,16);c.restore();}c.globalAlpha=1;}
  }
 }
 private draw(kind:BodyStatus,x:number,y:number,r:number,feet:number,top:number,t:number){
  const c=this.c,color=STATUS_COLOR[kind];c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=2;
  if(kind==='shield'){const g=c.createRadialGradient(x,y,r*.65,x,y,r);g.addColorStop(0,'#b8e8ff00');g.addColorStop(.85,'#b8e8ff10');g.addColorStop(1,'#e7faff70');c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*1.16,0,0,Math.PI*2);c.fill();c.globalAlpha=.55;c.stroke();}
  if(kind==='freeze'){c.globalAlpha=.28;c.beginPath();c.moveTo(x-r,feet);c.lineTo(x-r*.9,top+r*.2);c.lineTo(x-r*.4,top+r*.4);c.lineTo(x,top-8);c.lineTo(x+r*.8,top+r*.2);c.lineTo(x+r,feet);c.closePath();c.fill();c.globalAlpha=.85;c.stroke();c.beginPath();c.moveTo(x,top);c.lineTo(x+r*.2,y);c.lineTo(x-r*.4,feet);c.stroke();}
  if(kind==='stun'){for(let i=0;i<3;i++){const a=t*2+i*Math.PI*2/3,px=x+Math.cos(a)*r*.65,py=top+14+Math.sin(a)*9;c.beginPath();for(let j=0;j<10;j++){const d=j%2?3:7,angle=j*Math.PI/5-Math.PI/2;c.lineTo(px+Math.cos(angle)*d,py+Math.sin(angle)*d);}c.closePath();c.fill();c.stroke();}}
  if(kind==='burn'){const frame=Math.floor(t*12)%8;for(let i=0;i<9;i++){const px=x-r*.65+i*r*.16,hh=17+13*Math.sin(i*3+frame);c.globalAlpha=.8;c.beginPath();c.moveTo(px-7,feet);c.quadraticCurveTo(px-13,feet-hh*.5,px+2,feet-hh);c.quadraticCurveTo(px+14,feet-hh*.3,px+7,feet);c.fill();}for(let i=0;i<8;i++){const p=(t*.6+i*.137)%1;c.globalAlpha=(1-p)*.8;c.fillRect(x+Math.sin(i*41)*r*.7,feet-p*r*1.5,3,4);}}
  if(kind==='poison'||kind==='bleed'){for(let i=0;i<7;i++){const p=(t*.5+i*.157)%1,px=x+Math.sin(i*19)*r*.65;c.globalAlpha=.7*(1-p);c.beginPath();c.ellipse(px,kind==='poison'?feet-p*r*1.5:y+p*r,kind==='poison'?4+p*4:2,kind==='poison'?4+p*4:6,0,0,Math.PI*2);c.fill();c.stroke();}}
  if(kind==='buff'||kind==='debuff'){const down=kind==='debuff';for(let i=0;i<3;i++){const p=(t*.6+i/3)%1,px=x+(i-1)*r*.65,py=down?top+r+p*r:feet-p*r;c.globalAlpha=.6*(1-p);c.beginPath();c.moveTo(px-5,py+(down?-5:5));c.lineTo(px,py);c.lineTo(px+5,py+(down?-5:5));c.stroke();}if(down){c.globalAlpha=.12;c.beginPath();c.ellipse(x,feet-8,r*.8,12,0,0,Math.PI*2);c.fill();}}
  c.restore();
 }
 dispose(){this.canvas.remove();this.frozen.clear();}
}
