import type {EffectFrame,EffectPlan} from '../../squad/turn3d/effects';
import type {Anchor} from '../../squad/turn3d/scene';
import {puppetNumberRows} from '../../squad/turn3d/look-puppet-numbers';
import type {StatusPresentation} from '../../squad/turn3d/card-status-beats';
import type {SequencePlan} from './sequence';
import {numberPieces,numberRecipients,numberOffset} from './number-pieces';
type Glyph={x:number;y:number;width:number;height:number};
type Atlas={canvas:HTMLCanvasElement;glyphs:Map<string,Glyph>;digitHeight:number};
type Burst={key:string;id:string;text:string;x:number;y:number;at:number;height:number;color:string;critical:boolean;kind:string};
/** Gradient digits are baked once; measured ink bounds, not nominal CSS font size, set their height. */
export class BattleNumbers {
 readonly canvas=document.createElement('canvas');
 readonly drawn:{key:string;id:string;text:string;x:number;y:number;width:number;height:number;glyphHeight:number;kind:string;born:number}[]=[];
 private c:CanvasRenderingContext2D;private anchors:readonly Anchor[]=[];
 private atlases=new Map<string,Atlas>();private chars='0123456789−+!CRIT◇×';
 private plan:EffectPlan|null=null;private pending:ReturnType<typeof puppetNumberRows>=[];
 private shown=new Set<string>();private bursts:Burst[]=[];private now=0;private last=0;private frameAt=-1;
 constructor(private host:HTMLElement){
  this.c=this.canvas.getContext('2d')!;this.canvas.dataset.puppetNumbers='true';this.canvas.setAttribute('aria-hidden','true');
  Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'6'});
  host.appendChild(this.canvas);void document.fonts?.ready.then(()=>this.atlases.clear());
 }
 setAnchors(anchors:readonly Anchor[]){this.anchors=anchors;}
 private atlas(color:string){
  const cached=this.atlases.get(color);if(cached)return cached;
  const canvas=document.createElement('canvas');canvas.width=96*this.chars.length;canvas.height=144;
  const c=canvas.getContext('2d',{willReadFrequently:true})!,font=getComputedStyle(this.host).getPropertyValue('--font-num').trim()||'"Baloo 2"';
  c.font=`800 96px ${font}`;c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  const g=c.createLinearGradient(0,35,0,112);g.addColorStop(0,'#fffef0');g.addColorStop(.38,'#fff1ac');g.addColorStop(.58,color);g.addColorStop(1,color);
  c.fillStyle=g;c.strokeStyle='#301b35';c.lineWidth=7;
  const glyphs=new Map<string,Glyph>();
  [...this.chars].forEach((ch,i)=>{c.strokeText(ch,i*96+48,76);c.fillText(ch,i*96+48,76);
   const px=c.getImageData(i*96,0,96,144).data;let x0=96,y0=144,x1=0,y1=0;
   for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(px[(y*96+x)*4+3]!>16){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   glyphs.set(ch,{x:i*96+x0,y:y0,width:x1-x0+1,height:y1-y0+1});
  });
  const digitHeight=Math.max(...[...'0123456789'].map(ch=>glyphs.get(ch)!.height)),atlas={canvas,glyphs,digitHeight};this.atlases.set(color,atlas);return atlas;
 }
 private text(text:string,x:number,y:number,height:number,color:string){
  const atlas=this.atlas(color),s=height/atlas.digitHeight,glyphs=[...text].map(ch=>atlas.glyphs.get(ch)).filter((g):g is Glyph=>!!g);
  const gap=height*.065,w=glyphs.reduce((n,g)=>n+g.width*s+gap,0)-gap;let left=x-w/2;
  for(const g of glyphs){this.c.drawImage(atlas.canvas,g.x,g.y,g.width,g.height,left,y-g.height*s/2,g.width*s,g.height*s);left+=g.width*s+gap;}return w;
 }
 private textWidth(text:string,height:number,color:string){
  const atlas=this.atlas(color),glyphs=[...text].map(ch=>atlas.glyphs.get(ch)).filter((g):g is Glyph=>!!g);
  return glyphs.reduce((n,g)=>n+g.width*height/atlas.digitHeight+height*.065,0)-height*.065;
 }
 render(frame:EffectFrame|null,presentation:StatusPresentation|undefined,width:number,height:number,reduced:boolean,enabled:boolean,fixedTime?:number){
  const clock=fixedTime===undefined?performance.now():fixedTime*1000;
  if(clock<this.last){this.bursts.length=0;this.shown.clear();}this.last=clock;this.now=clock;
  const ratio=Math.min(devicePixelRatio||1,2),w=Math.round(width*ratio),h=Math.round(height*ratio);
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  const c=this.c;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);this.drawn.length=0;
  this.canvas.hidden=!enabled;this.host.dataset.puppetNumbers=String(enabled);if(!enabled)return;
  if(frame?.plan!==this.plan){this.plan=frame?.plan??null;this.pending=frame?puppetNumberRows({...frame.plan,targetIds:numberRecipients(frame.plan)},presentation):[];this.shown.clear();this.frameAt=-1;}
  if(frame&&frame.elapsed<this.frameAt){this.shown.clear();this.bursts.length=0;}
  if(frame){
   this.frameAt=frame.elapsed;const contact=frame.plan.beats[2]!.start,tier=(frame.plan as SequencePlan).sequence?.tier??(frame.plan.ultimate?'ultimate':'basic');
   const scale=Math.min(1.3,Math.max(.65,this.host.ownerDocument.defaultView!.innerHeight/720));
   this.pending.forEach((row,targetIndex)=>{
    const a=this.anchors.find(a=>a.id===row.id);if(!a)return;let stack=0;
    row.labels.filter(e=>['damage','heal','shield','fizzle'].includes(e.type)).forEach((label,labelIndex)=>{
     const event=frame.plan.events.find(e=>e.targetIds.includes(row.id)&&e.type===label.type);
     const dot=!!(event&&'dot' in event&&event.dot),pieces=numberPieces(label.amount,label.type==='damage'&&!dot?(tier==='ultimate'?3:tier==='active'?2:1):1);
     pieces.forEach((amount,i)=>{
      const key=`${frame.plan.id}:${row.id}:${labelIndex}:${i}`,offset=numberOffset(frame.plan.duration-contact,presentation?.offsets.get(row.id)??targetIndex*25,i,pieces.length);
      const stackIndex=stack++;if(this.shown.has(key)||frame.elapsed<contact+offset)return;this.shown.add(key);
      const text=label.type==='fizzle'?'×':(label.type==='heal'?'+':label.type==='shield'?'◇':'−')+amount;
      const digitHeight=(dot?30:label.critical?70:label.type==='fizzle'?30:46)*scale;
      this.bursts.push({key,id:row.id,text,x:Math.max(80,Math.min(width-80,a.textLane?a.textLane.x+a.textLane.width/2:a.x)),
       y:Math.max(digitHeight,Math.min(height-40,(a.textLane?.y??a.footY-100)+20-stackIndex*50*scale)),at:this.now-(frame.elapsed-contact-offset),height:digitHeight,
       color:label.type==='heal'?'#55eb9b':label.type==='shield'?'#83ddff':label.type==='fizzle'?'#c1bfd1':label.critical?'#ff903e':'#ffc86a',critical:label.critical,kind:dot?'dot':label.type});
     });
    });
   });
  }
  this.bursts=this.bursts.filter(b=>this.now-b.at<850);
  for(const b of this.bursts){
   const age=this.now-b.at;if(age<0)continue;const t=age/850,pop=reduced?1:1+(b.critical?.4:.1)*(1-Math.min(1,age/160)),gh=b.height*pop,y=b.y-(reduced?0:48*t);
   const inkWidth=this.textWidth(b.text,gh,b.color),angle=b.critical&&!reduced?.07:0;
   // Include the crit tag and tilted corners when constraining rising stacks.
   const halfWidth=Math.max(inkWidth/2,b.critical?this.textWidth('CRIT',20,'#ffad55')/2:0);
   const top=b.critical?Math.max(gh/2,gh*.75+10):gh/2;
   const marginX=halfWidth*Math.cos(angle)+top*Math.sin(angle)+4;
   const marginTop=top*Math.cos(angle)+halfWidth*Math.sin(angle)+4;
   const marginBottom=gh/2*Math.cos(angle)+halfWidth*Math.sin(angle)+4;
   const x=Math.max(marginX,Math.min(width-marginX,b.x)),safeY=Math.max(marginTop,Math.min(height-marginBottom,y));
   c.save();c.globalAlpha=Math.min(1,(1-t)*4);c.translate(x,safeY);if(angle)c.rotate(-angle);
   this.text(b.text,0,0,gh,b.color);if(b.critical)this.text('CRIT',0,-gh*.75,20,'#ffad55');c.restore();
   this.drawn.push({key:b.key,id:b.id,text:b.text,x:x-inkWidth/2,y:safeY-gh/2,width:inkWidth,height:gh,glyphHeight:gh,kind:b.kind,born:b.at});
  }
 }
 dispose(){this.canvas.remove();delete this.host.dataset.puppetNumbers;this.atlases.clear();this.bursts.length=0;}
}
