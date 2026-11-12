import type {EffectFrame,EffectPlan} from '../../squad/turn3d/effects';
import type {Anchor} from '../../squad/turn3d/scene';
import {puppetNumberRows} from '../../squad/turn3d/look-puppet-numbers';
import type {StatusPresentation} from '../../squad/turn3d/card-status-beats';
/** Font pixels are baked once per palette; every displayed glyph is a bitmap blit. */
export class BattleNumbers {
 readonly canvas=document.createElement('canvas');
 readonly drawn:{id:string;text:string;x:number;y:number;width:number;height:number}[]=[];
 private c:CanvasRenderingContext2D;
 private anchors:readonly Anchor[]=[];
 private atlases=new Map<string,HTMLCanvasElement>();
 private chars='0123456789−+!CRITMS';
 private plan:EffectPlan|null=null;
 private pending:ReturnType<typeof puppetNumberRows>=[];
 private shown=new Set<string>();
 private bursts:{id:string;text:string;x:number;y:number;at:number;size:number;color:string;critical:boolean}[]=[];
 private now=0;private last=0;private frameAt=-1;
 constructor(private host:HTMLElement){
  this.c=this.canvas.getContext('2d')!;
  this.canvas.dataset.puppetNumbers='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'6'});
  host.appendChild(this.canvas);void document.fonts?.ready.then(()=>this.atlases.clear());
 }
 setAnchors(anchors:readonly Anchor[]){this.anchors=anchors;}
 private atlas(color:string){
  let atlas=this.atlases.get(color);if(atlas)return atlas;
  atlas=document.createElement('canvas');atlas.width=64*this.chars.length;atlas.height=80;
  const c=atlas.getContext('2d')!,font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
  c.font=`800 48px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const g=c.createLinearGradient(0,15,0,66);g.addColorStop(0,'#fffbe2');g.addColorStop(.48,color);g.addColorStop(1,color);
  c.fillStyle=g;c.strokeStyle='#3e2536';c.lineWidth=6;
  [...this.chars].forEach((ch,i)=>{c.strokeText(ch,i*64+32,42);c.fillText(ch,i*64+32,42);});
  this.atlases.set(color,atlas);return atlas;
 }
 private text(text:string,x:number,y:number,size:number,color:string){
  const atlas=this.atlas(color),step=size*.64,w=text.length*step;
  [...text].forEach((ch,i)=>{const index=this.chars.indexOf(ch);if(index>=0)this.c.drawImage(atlas,index*64,0,64,80,x-w/2+i*step-size*.15,y-size*.8,size*1.33,size*1.67);});return w;
 }
 render(frame:EffectFrame|null,presentation:StatusPresentation|undefined,width:number,height:number,reduced:boolean,enabled:boolean){
  const clock=performance.now(),delta=this.last?Math.min(100,clock-this.last):0;this.last=clock;this.now+=delta;
  const ratio=Math.min(devicePixelRatio||1,2);if(this.canvas.width!==width*ratio||this.canvas.height!==height*ratio){this.canvas.width=width*ratio;this.canvas.height=height*ratio;}
  const c=this.c;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);this.drawn.length=0;
  this.canvas.hidden=!enabled;this.host.dataset.puppetNumbers=String(enabled);if(!enabled)return;
  if(frame?.plan!==this.plan){this.plan=frame?.plan??null;this.pending=frame?puppetNumberRows(frame.plan,presentation):[];this.shown.clear();this.frameAt=-1;}
  if(frame&&frame.elapsed<this.frameAt){this.shown.clear();this.bursts.length=0;}
  if(frame){
   this.frameAt=frame.elapsed;const contact=frame.plan.beats[2]!.start;
   for(const row of this.pending){
    if(this.shown.has(row.id)||frame.elapsed<contact+(presentation?.offsets.get(row.id)??0))continue;
    this.shown.add(row.id);const a=this.anchors.find(a=>a.id===row.id);if(!a)continue;
    row.labels.filter(e=>['damage','heal','shield','fizzle'].includes(e.type)).slice(0,4).forEach((label,i)=>{
     const event=frame.plan.events.find(e=>e.targetIds.includes(row.id)&&e.type===label.type&&e.amount===label.amount);
     const dot=event&&'dot' in event&&event.dot;
     const text=label.type==='fizzle'?'MISS':(label.type==='heal'||label.type==='shield'?'+':'−')+label.amount;
     this.bursts.push({id:row.id,text,x:Math.max(50,Math.min(width-50,a.textLane?a.textLane.x+a.textLane.width/2:a.x)),
      y:Math.max(40,Math.min(height-35,(a.textLane?.y??a.footY-65)+i*32)),at:this.now,size:dot?20:label.critical?40:28,
      color:label.type==='heal'?'#72eaa2':label.type==='fizzle'?'#bdb7c7':label.critical?'#ff9d42':'#ffd891',critical:label.critical});
    });
   }
  }
  this.bursts=this.bursts.filter(b=>this.now-b.at<700);
  for(const b of this.bursts){
   const t=(this.now-b.at)/700,y=b.y-(reduced?0:30*t);
   c.save();c.globalAlpha=Math.min(1,(1-t)*4);c.translate(b.x,y);if(b.critical&&!reduced)c.rotate(-.07);
   const w=this.text(b.text,0,0,b.size,b.color);if(b.critical)this.text('CRIT',0,-29,14,'#ffaf55');c.restore();
   this.drawn.push({id:b.id,text:b.text,x:b.x-w/2,y:y-b.size*.6,width:w,height:b.size*1.2});
  }
 }
 dispose(){this.canvas.remove();delete this.host.dataset.puppetNumbers;this.atlases.clear();this.bursts.length=0;}
}
