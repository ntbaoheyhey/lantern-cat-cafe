/** Canvas-owned impact text; reuses the resolved events and reserved target lanes. */
import type { EffectFrame, EffectPlan } from './effects';
import { impactLabels, visibleImpactLabel } from './impact-labels';
import { statusImpactLabels, type StatusPresentation } from './card-status-beats';
import type { Anchor } from './scene';
export function puppetNumberRows(plan:EffectPlan,presentation?:StatusPresentation){
  return plan.targetIds.map(id=>({id,labels:(presentation?statusImpactLabels(plan,id,presentation):impactLabels(plan.events,id))
    .filter(visibleImpactLabel)
    .map(e=>({text:e.type==='death'?'KO':e.type==='status_apply'||e.type==='fizzle'?e.note??'':`${e.type==='heal'?'+':e.type==='shield'?'◇':'−'}${e.amount}${e.critical?'!':''}${'bitter' in e&&e.bitter?' −50%':''}`,
      color:e.type==='heal'?'#a9ffd3':e.type==='shield'?'#b6eaff':e.critical?'#ffe38c':'#fff0d6',critical:!!e.critical,type:e.type,amount:e.amount}))})).filter(row=>row.labels.length);
}
export class PuppetNumbers {
  readonly canvas=document.createElement('canvas');
  private ctx:CanvasRenderingContext2D;
  private anchors:readonly Anchor[]=[];
  private plan?:EffectPlan;
  private presentation?:StatusPresentation;
  private rows:ReturnType<typeof puppetNumberRows>=[];
  readonly drawn:{id:string;text:string;x:number;y:number;width:number;height:number}[]=[];
  constructor(private host:HTMLElement){
    this.canvas.setAttribute('aria-hidden','true');this.canvas.dataset.puppetNumbers='true';
    Object.assign(this.canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'5'});
    const ctx=this.canvas.getContext('2d');if(!ctx)throw Error('Impact text canvas unavailable');this.ctx=ctx;host.appendChild(this.canvas);
  }
  setAnchors(anchors:readonly Anchor[]){this.anchors=anchors;}
  render(frame:EffectFrame|null,presentation:StatusPresentation|undefined,width:number,height:number,reduced:boolean,enabled:boolean,numbersOnly=false){
    this.canvas.hidden=!enabled;this.canvas.style.display=enabled?'block':'none';this.canvas.dataset.puppetNumbers=String(enabled);
    this.host.dataset.puppetNumbers=String(enabled);this.drawn.length=0;
    if(!enabled)return;
    const ratio=Math.min(devicePixelRatio||1,2),w=Math.round(width*ratio),h=Math.round(height*ratio);
    if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
    const c=this.ctx;c.setTransform(ratio,0,0,ratio,0,0);c.clearRect(0,0,width,height);
    if(!frame)return;
    if(this.plan!==frame.plan||this.presentation!==presentation){this.plan=frame.plan;this.presentation=presentation;this.rows=puppetNumberRows(frame.plan,presentation);}
    const impact=frame.plan.beats.find(b=>b.kind==='impact')?.start??Infinity;
    c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
    for(const row of this.rows){
      const lane=this.anchors.find(a=>a.id===row.id)?.textLane;if(!lane)continue;
      const elapsed=frame.elapsed-impact-(presentation?.offsets.get(row.id)??0);if(elapsed<0)continue;
      const duration=Math.min(850,frame.plan.duration-impact-(presentation?.offsets.get(row.id)??0)),t=Math.min(1,elapsed/Math.max(1,duration));
      if(t>=1)continue;
      const pop=reduced?1:1+.12*Math.sin(Math.min(1,elapsed/160)*Math.PI);
      const rise=reduced?0:2*Math.pow(1-t,2),word=presentation?.bursts.includes(row.id)?34:0;
      c.globalAlpha=reduced?1:1-Math.max(0,(t-.7)/.3);
      row.labels.filter(label=>!numbersOnly||['damage','heal','shield'].includes(label.type)).forEach((label,i)=>{
        const x=lane.x+lane.width/2,y=lane.y+word+17+i*34+rise;
        c.save();c.translate(x,y);c.font=`900 ${label.critical?28:25}px system-ui`;
        const measured=c.measureText(label.text).width,fit=Math.min(pop,(lane.width-6)/Math.max(1,measured+4));c.scale(fit,1);
        c.strokeStyle='#102832';c.lineWidth=4;c.strokeText(label.text,0,0);c.fillStyle=label.color;c.fillText(label.text,0,0);c.restore();
        this.drawn.push({id:row.id,text:label.text,x:x-(measured+4)*fit/2,y:y-16,width:(measured+4)*fit,height:32});
      });
    }
    c.globalAlpha=1;
  }
  dispose(){this.canvas.remove();delete this.host.dataset.puppetNumbers;this.anchors=[];this.rows=[];this.drawn.length=0;}
}
