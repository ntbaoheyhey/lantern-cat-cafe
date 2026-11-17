import {paintSourceRect,type PackedPaint} from '../vfx-layered/atlas';

/** Paint carried beyond contact by the strike, with distinct travelling edges. */
export function paintImpactStrokes(c:CanvasRenderingContext2D,paint:PackedPaint,since:number,x:number,y:number,radius:number,direction:number,targets:number,tier:string,seed:number,reduced:boolean,low:boolean){
 if(reduced||low||since<0||since>740)return 0;
 const count=tier==='basic'?2:3;let draws=0;
 for(let i=0;i<count;i++){
  const age=since-i*90;if(age<0||age>560)continue;
  const p=age/560,travel=1-(1-p)**2,fade=Math.sin(Math.min(1,p*3)*Math.PI/2)*(1-p);
  const angle=(i-(count-1)/2)*.60+(seed%5-2)*.09;
  c.save();c.globalCompositeOperation='source-over';c.globalAlpha=fade*.92/Math.sqrt(targets);
  c.translate(x+direction*radius*(travel*1.4-.3),y+Math.sin(angle)*radius*travel);
  c.rotate(angle);c.scale(direction,1);
  const w=radius*(1.7+travel*1.3),h=radius*(.95-p*.4);
  c.drawImage(paint.image,...paintSourceRect(paint,[768,256,256,256]),-w*.5,-h*.5,w,h);
  c.restore();draws++;
 }
 return draws;
}
