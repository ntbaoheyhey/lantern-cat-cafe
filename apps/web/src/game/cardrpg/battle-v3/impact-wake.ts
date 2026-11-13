import type {PackedPaint} from '../vfx-layered/atlas';

/** A grounded continuation of the actual painted strike, following its direction. */
export function paintImpactWake(c:CanvasRenderingContext2D,paint:PackedPaint,since:number,x:number,y:number,radius:number,direction:number,targets:number,reduced:boolean){
 if(reduced||since<33||since>520)return false;
 const p=(since-33)/487,travel=1-(1-p)**3;
 c.save();c.globalCompositeOperation='source-over';c.globalAlpha=Math.sin(p*Math.PI)*.52/Math.sqrt(targets);
 c.translate(x+direction*radius*.48*travel,y-radius*(.10+.16*p));
 c.scale(direction,1);c.rotate(-.06+travel*.10);
 const width=radius*(1.25+1.6*travel),height=radius*(.70-.22*p);
 c.drawImage(paint.image,paint.x+512,paint.y,256,256,-width*.5,-height*.5,width,height);
 c.restore();return true;
}
