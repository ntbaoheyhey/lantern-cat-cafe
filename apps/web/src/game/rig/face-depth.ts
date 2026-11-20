/** Bounded projection of the existing painting; no hidden-side pixels are invented.
 * Rounded cheek and muzzle depths turn independently of the neck/ear outline.
 */
const bounded=(n:number)=>Math.max(-1,Math.min(1,n));
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export class FaceDepth {
 yaw=0;pitch=0;
 private yawSin=0;private yawCos=1;private pitchSin=0;private pitchCos=1;
 sample(turn:number,nod:number){
  this.yaw=bounded(turn)*10;this.pitch=bounded(nod)*6;
  this.yawSin=Math.sin(this.yaw*Math.PI/180);this.yawCos=Math.cos(this.yaw*Math.PI/180);
  this.pitchSin=Math.sin(this.pitch*Math.PI/180);this.pitchCos=Math.cos(this.pitch*Math.PI/180);
 }
 /** Source-image coordinates; caller reuses out while walking the mesh. */
 offset(x:number,y:number,face:readonly [number,number,number,number],out:{x:number;y:number}){
  out.x=out.y=0;if(this.yaw===0&&this.pitch===0)return out;
  const [fx,fy,w,h]=face,dx=x-fx-w*.55,dy=y-fy-h*.52;
  const dome=smooth(1-(dx/(w*.62))**2-(dy/(h*.78))**2);
  const muzzle=smooth(1-((x-fx-w*.60)/(w*.22))**2-((y-fy-h*.64)/(h*.28))**2);
  if(dome===0&&muzzle===0)return out;
  const depth=w*(.22*dome+.06*muzzle);
  out.x=dx*(this.yawCos-1)*dome+depth*this.yawSin;
  out.y=dy*(this.pitchCos-1)*dome-depth*this.pitchSin;
  return out;
 }
}
