import type {EffectFrame,EffectPlan} from '../../squad/turn3d/effects';
import type {Anchor} from '../../squad/turn3d/scene';
import {visibleImpactLabel} from '../../squad/turn3d/impact-labels';
import {NUMBER_LIFETIME_MS,placeNumber,type NumberFootprint} from './number-layout';
import type {Rect} from '../../squad/turn3d/label-layout';
import type {StatusPresentation} from '../../squad/turn3d/card-status-beats';
import {numberRecipients,numberOffset} from './number-pieces';
import {paintNumberBadge,type NumberBadge,type BadgePlan} from './number-badges';
import {numberPeakScale,sampleNumberMotion,type NumberMotion} from './number-motion';
type Glyph={x:number;y:number;width:number;height:number};
type Atlas={canvas:HTMLCanvasElement;glyphs:Map<string,Glyph>;digitHeight:number};
type Burst={key:string;id:string;text:string;x:number;y:number;at:number;height:number;color:string;critical:boolean;kind:string;badge?:NumberBadge};
/** Gradient digits are baked once; measured ink bounds, not nominal CSS font size, set their height. */
export class BattleNumbers {
 readonly canvas=document.createElement('canvas');
 readonly drawn:{key:string;id:string;text:string;x:number;y:number;width:number;height:number;glyphHeight:number;kind:string;born:number}[]=[];
 private c:CanvasRenderingContext2D;private anchors:readonly Anchor[]=[];
 private atlases=new Map<string,Atlas>();private chars='0123456789−+!CRIT◇×';
 private glyphMetrics?:{font:string;glyphs:Map<string,Glyph>;digitHeight:number};
 private plan:EffectPlan|null=null;private pending:{id:string;labels:EffectPlan['events'][number][]}[]=[];
 private shown=new Set<string>();private bursts:Burst[]=[];private now=0;private last=0;private frameAt=-1;
 private motion:NumberMotion={scale:1,rise:0,alpha:0,accent:0};
 constructor(private host:HTMLElement){
  this.c=this.canvas.getContext('2d')!;this.canvas.dataset.puppetNumbers='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'6'});
  host.appendChild(this.canvas);void document.fonts?.ready.then(()=>{this.atlases.clear();this.glyphMetrics=undefined;});
 }
 setAnchors(anchors:readonly Anchor[]){this.anchors=anchors;}
 private atlas(color:string){
  const cached=this.atlases.get(color);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=96*this.chars.length;canvas.height=144;
  const c=canvas.getContext('2d',{willReadFrequently:true})!,font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
  c.font=`800 96px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const g=c.createLinearGradient(0,35,0,112);g.addColorStop(0,'#fffef0');g.addColorStop(.38,'#fff1ac');g.addColorStop(.58,color);g.addColorStop(1,color);
  c.fillStyle=g;c.strokeStyle='#301b35';c.lineWidth=7;
  // Opaque palette colors share the same alpha silhouette and measured spacing.
  // Keep painting each color; reuse only ink metrics for the same loaded font.
  const solid=/^#[\da-f]{6}$/i.test(color),metrics=solid&&this.glyphMetrics?.font===font?this.glyphMetrics:undefined;
  const glyphs=metrics?.glyphs??new Map<string,Glyph>();
  [...this.chars].forEach((ch,i)=>{c.strokeText(ch,i*96+48,76);c.fillText(ch,i*96+48,76);
   if(metrics)return;
   const px=c.getImageData(i*96,0,96,144).data;let x0=96,y0=144,x1=0,y1=0;
   for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(px[(y*96+x)*4+3]!>16){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   glyphs.set(ch,{x:i*96+x0,y:y0,width:x1-x0+1,height:y1-y0+1});
  });
  const digitHeight=metrics?.digitHeight??Math.max(...[...'0123456789'].map(ch=>glyphs.get(ch)!.height)),atlas={canvas,glyphs,digitHeight};
  if(solid&&!metrics)this.glyphMetrics={font,glyphs,digitHeight};this.atlases.set(color,atlas);return atlas;
 }
 private text(text:string,x:number,y:number,height:number,color:string){
  const atlas=this.atlas(color),s=height/atlas.digitHeight,glyphs=[...text].map(ch=>atlas.glyphs.get(ch)).filter((g):g is Glyph=>!!g);
  const gap=height*.065,w=glyphs.reduce((n,g)=>n+g.width*s+gap,0)-gap;let left=x-w/2;
  for(const g of glyphs){this.c.drawImage(atlas.canvas,g.x,g.y,g.width,g.height,left,y-g.height*s/2,g.width*s,g.height*s);left+=g.width*s+gap;}return w;
 }
 private textWidth(text:string,height:number,color:string){
  const atlas=this.atlas(color),glyphs=[...text].map(ch=>atlas.glyphs.get(ch)).filter((g):g is Glyph=>!!g);
  return Math.max(0,glyphs.reduce((n,g)=>n+g.width*height/atlas.digitHeight+height*.065,0)-height*.065);
 }
 render(frame:EffectFrame|null,presentation:StatusPresentation|undefined,width:number,height:number,reduced:boolean,enabled:boolean,fixedTime?:number){
  const clock=fixedTime===undefined?performance.now():fixedTime*1000;
  if(clock<this.last){this.bursts.length=0;this.shown.clear();}this.last=clock;this.now=clock;
  const ratio=Math.min(devicePixelRatio||1,2),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.c;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);this.drawn.length=0;
  this.canvas.hidden=!enabled;this.host.dataset.puppetNumbers=String(enabled);if(!enabled)return;
  if(frame?.plan!==this.plan){this.plan=frame?.plan??null;this.bursts.length=0;this.pending=frame?numberRecipients(frame.plan).map(id=>({id,labels:frame.plan.events.filter(e=>e.targetIds.includes(id)&&visibleImpactLabel(e))})):[];this.shown.clear();this.frameAt=-1;}
  if(frame&&frame.elapsed<this.frameAt){this.shown.clear();this.bursts.length=0;}
  if(frame){
   this.frameAt=frame.elapsed;const contact=frame.plan.beats[2]!.start;
   const scale=Math.min(1.3,Math.max(.65,this.host.ownerDocument.defaultView!.innerHeight/720));
   this.pending.forEach(row=>{
    const a=this.anchors.find(a=>a.id===row.id);if(!a)return;
    row.labels.filter(e=>['damage','heal','shield','fizzle'].includes(e.type)&&!(e.type==='fizzle'&&(frame.plan as BadgePlan).numberBadges?.some(b=>b.targetId===row.id&&b.kind!=='absorb'))).forEach((label,labelIndex)=>{
     const dot=presentation?.kinds.get(label.seq)==='dot',pieces=[label.amount];
     pieces.forEach((amount,i)=>{
      const key=`${frame.plan.id}:${row.id}:${labelIndex}:${i}`,offset=numberOffset(frame.plan.duration-contact,0,i,pieces.length);
      if(this.shown.has(key)||frame.elapsed<contact+offset)return;this.shown.add(key);
      const text=label.type==='fizzle'?'×':(label.type==='heal'?'+':label.type==='shield'?'◇':'−')+amount;
      const digitHeight=(dot?28:label.critical?46:label.type==='fizzle'?28:36)*scale;
      this.addBurst({key,id:row.id,text,x:a.body?a.body.x+a.body.width/2:a.x,
       y:(a.body?a.body.y+a.body.height:a.footY)-18*scale,at:this.now-(frame.elapsed-contact-offset),height:digitHeight,
       color:label.type==='heal'?'#55eb9b':label.type==='shield'?'#83ddff':label.type==='fizzle'?'#c1bfd1':label.critical?'#ff903e':'#ffc86a',critical:!!label.critical,kind:dot?'dot':label.type});
     });
    });
   });

   for(const [index,badge] of ((frame.plan as BadgePlan).numberBadges??[]).entries()){
    const a=this.anchors.find(a=>a.id===badge.targetId);if(!a)continue;

    const key=`${frame.plan.id}:badge:${index}`,offset=Math.min(index*35,Math.max(0,frame.plan.duration-contact-40));
    if(this.shown.has(key)||frame.elapsed<contact+offset)continue;this.shown.add(key);
    this.addBurst({key,id:badge.targetId,text:badge.kind==='absorb'?String(badge.amount):'',badge:badge.kind,kind:badge.kind,critical:false,height:28*scale,color:badge.kind==='absorb'?'#83ddff':badge.kind==='resist'?'#c9adf3':'#ffe0a2',x:a.body?a.body.x+a.body.width/2:a.x,y:(a.body?a.body.y+a.body.height:a.footY)-18*scale,at:this.now-(frame.elapsed-contact-offset)});
   }
  }
  this.bursts=this.bursts.filter(b=>this.now-b.at<NUMBER_LIFETIME_MS);
  const occupied:Rect[]=[],faces=this.anchors.filter(a=>a.visible&&a.face).map(a=>a.face!);
  const scale=Math.min(1.3,Math.max(.65,this.host.ownerDocument.defaultView!.innerHeight/720));
  for(const b of this.bursts){
   const age=this.now-b.at;if(age<0)continue;
   const motion=sampleNumberMotion(age,b.critical,b.kind,reduced,this.motion),gh=b.height*motion.scale;
   const maxGh=b.height*(reduced?1:numberPeakScale(b.critical,b.kind)),tagHeight=14*scale;
   const textWidth=this.textWidth(b.text,gh,b.color),badgeSize=b.badge?gh:0,gap=b.badge&&b.text?5:0,inkWidth=textWidth+badgeSize+gap;
   const maxWidth=this.textWidth(b.text,maxGh,b.color)+(b.badge?maxGh:0)+gap;
   const critWidth=b.critical?this.textWidth('CRIT',tagHeight,'#ffad55'):0,accentPad=b.critical?10*scale:0;
   const footprint:NumberFootprint={halfWidth:Math.max(maxWidth/2,critWidth/2+accentPad)+4,top:(b.critical?maxGh*.75+tagHeight/2:maxGh/2)+4,bottom:maxGh/2+4,rise:reduced?0:24*scale};
   const anchor=this.anchors.find(a=>a.id===b.id),body=anchor?.body??{x:b.x-50,y:(anchor?.footY??b.y)-160,width:100,height:160};
   const placed=placeNumber(body,footprint,width,height,faces,occupied,scale,{x:b.x,y:b.y});
   if(!placed)continue;
   b.x=placed.x;b.y=placed.y;occupied.push(placed.box);
   const x=b.x,y=b.y-motion.rise*scale;
   c.save();c.globalAlpha=motion.alpha;c.translate(x,y);
   if(b.badge)paintNumberBadge(c,b.badge,-(textWidth+gap)/2,0,badgeSize);
   if(b.text)this.text(b.text,(badgeSize+gap)/2,0,gh,b.color);if(b.critical){
    this.text('CRIT',0,-gh*.75,tagHeight,'#ffad55');
    if(motion.accent>0){c.globalAlpha*=motion.accent;c.strokeStyle='#ffe4a1';c.lineWidth=2*scale;c.lineCap='round';
     c.beginPath();for(const side of [-1,1]){c.moveTo(side*(critWidth/2+3*scale),-gh*.75+2*scale);c.lineTo(side*(critWidth/2+8*scale),-gh*.75-3*scale);}c.stroke();}
   }c.restore();
   const top=b.critical?gh*.75+tagHeight/2:gh/2,actualWidth=Math.max(inkWidth,critWidth+(motion.accent>0?accentPad*2:0));
   this.drawn.push({key:b.key,id:b.id,text:b.text,x:x-actualWidth/2,y:y-top,width:actualWidth,height:top+gh/2,glyphHeight:b.text?gh:0,kind:b.kind,born:b.at});
  }
 }
 private addBurst(burst:Burst){
  this.bursts=this.bursts.filter(b=>this.now-b.at<NUMBER_LIFETIME_MS);
  while(this.bursts.filter(b=>b.id===burst.id).length>=3){const first=this.bursts.findIndex(b=>b.id===burst.id);this.bursts.splice(first,1);}
  this.bursts.push(burst);
 }
 dispose(){this.canvas.remove();delete this.host.dataset.puppetNumbers;this.atlases.clear();this.glyphMetrics=undefined;this.bursts.length=0;}
}
