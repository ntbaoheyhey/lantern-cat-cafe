import type {SceneView} from '../../squad/turn3d/scene';
import type {Rect} from '../../squad/turn3d/label-layout';
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
/** Phase pips and the original boss painting stay outside the fixed HUD. */
export class BossPhase {
 readonly canvas=document.createElement('canvas');
 readonly audit={visible:false,phase:1,age:0,aura:false,portrait:'yarn-giant'};
 private c:CanvasRenderingContext2D;private image=new Image();private seen=new Map<string,number>();
 private battleKey:unknown;private started=-100;private id='';private phase=1;
 constructor(host:HTMLElement){
  this.c=this.canvas.getContext('2d')!;this.image.src='/units/yarn-giant/portrait.webp';
  this.canvas.dataset.bossPhase='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'18'});host.append(this.canvas);
 }
 render(view:SceneView,time:number,width:number,height:number,bounds:(id:string)=>Rect|undefined){
  if(view.battleKey!==this.battleKey){this.battleKey=view.battleKey;this.seen.clear();this.started=-100;}
  const bossId=Object.keys(view.bossPhases??{})[0],portrait=bossId?view.models?.[bossId]??'yarn-giant':'yarn-giant';
  if(portrait!==this.audit.portrait){this.audit.portrait=portrait;this.image.src=`/units/${portrait}/portrait.webp`;}
  for(const [id,phase] of Object.entries(view.bossPhases??{})){
   const previous=this.seen.get(id);if(previous!==undefined&&phase>previous){this.started=time;this.id=id;this.phase=phase;}this.seen.set(id,phase);
  }
  const live=[...this.seen].filter(([id,p])=>p>1&&view.actors.some(a=>a.id===id&&a.hp>0));
  const age=time-this.started,visible=age>=0&&age<2.5&&live.some(([id])=>id===this.id);
  Object.assign(this.audit,{visible,phase:this.phase,age,aura:live.length>0});this.canvas.hidden=!visible&&!live.length;
  if(this.canvas.hidden)return;
  const ratio=Math.min(devicePixelRatio||1,view.quality==='low'?1:2),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.c;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);
  for(const [id,phase] of live){
   const b=bounds(id);if(!b)continue;const pulse=view.reducedMotion?0:Math.sin(time*4)*.05;
   c.save();c.translate(b.x+b.width/2,b.y+b.height*.88);c.scale(1,.28);
   c.strokeStyle=phase>=3?'#ff734f':'#d994ef';c.lineWidth=3;c.globalAlpha=.75;
   for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,0,b.width*(.46+i*.06+pulse),b.width*(.46+i*.06+pulse),0,0,Math.PI*2);c.stroke();}
   c.restore();
   if(!view.reducedMotion){c.save();c.strokeStyle=phase>=3?'#ffb06b':'#e3b6f2';c.lineWidth=2;
    for(let i=0;i<18;i++){const p=(time*.7+i/18)%1,x=b.x+b.width*(.05+i%7/7*.9),y=b.y+b.height*(1-p);c.globalAlpha=Math.sin(p*Math.PI)*.65;c.beginPath();c.moveTo(x,y+12);c.lineTo(x+Math.sin(i+time)*6,y-10);c.stroke();}c.restore();}
  }
  if(!visible)return;
  const enter=clamp(age/.18),leave=clamp((2.5-age)/.3),opacity=enter*leave,slide=view.reducedMotion?0:(1-enter)*width*.18;
  c.save();c.globalAlpha=opacity;c.translate(slide,0);
  const left=width*.57,back=c.createLinearGradient(left-50,0,width,0);
  back.addColorStop(0,'#25102d00');back.addColorStop(.22,'#25102de8');back.addColorStop(1,this.phase>=3?'#5b2334f5':'#38254ff5');
  c.fillStyle=back;c.fillRect(left-50,0,width-left+50,height);
  c.strokeStyle=this.phase>=3?'#ffbd75':'#edc6ff';c.lineWidth=4;
  for(const y of [height*.1,height*.89]){c.beginPath();c.moveTo(left,y);c.lineTo(width,y);c.stroke();}
  const size=height*.82,drift=view.reducedMotion?0:Math.sin(age*Math.PI/2.5)*height*.035;
  if(this.image.complete&&this.image.naturalWidth)c.drawImage(this.image,width*.80-size/2,height*.50-size/2-drift,size,size);
  // Two or three lit stitches communicate phase without another sentence.
  for(let i=0;i<3;i++){c.fillStyle=i<this.phase?'#ffdfa1':'#67506c';c.beginPath();c.arc(width*.80+(i-1)*26,height*.14,8,0,Math.PI*2);c.fill();}
  if(!view.reducedMotion){c.globalAlpha=opacity*.2;c.lineWidth=1;for(let i=0;i<16;i++){const y=(i/16+age*.22)%1*height;c.beginPath();c.moveTo(left,y);c.lineTo(width,y-height*.12);c.stroke();}}
  c.restore();
 }
 dispose(){this.canvas.remove();this.image.src='';this.seen.clear();}
}
