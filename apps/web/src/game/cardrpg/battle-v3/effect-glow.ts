/** Quarter-resolution glow from painted effects only; never samples units or HUD. */
export class EffectGlow {
 private source=document.createElement('canvas');
 private bloom=document.createElement('canvas');
 private sourceContext=this.source.getContext('2d')!;
 private bloomContext=this.bloom.getContext('2d')!;
 render(target:HTMLCanvasElement,c:CanvasRenderingContext2D,low:boolean,reduced:boolean){
  const {width,height}=target;
  if(this.source.width!==width||this.source.height!==height){this.source.width=width;this.source.height=height;}
  const source=this.sourceContext;source.setTransform(1,0,0,1,0,0);source.clearRect(0,0,width,height);
  source.filter='saturate(1.5) brightness(1.16)';source.drawImage(target,0,0);source.filter='none';
  c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='copy';c.drawImage(this.source,0,0);
  if(!low&&!reduced){
   const w=Math.max(1,Math.ceil(width/4)),h=Math.max(1,Math.ceil(height/4));
   if(this.bloom.width!==w||this.bloom.height!==h){this.bloom.width=w;this.bloom.height=h;}
   const glow=this.bloomContext;glow.clearRect(0,0,w,h);glow.filter='blur(3px)';glow.drawImage(this.source,0,0,w,h);glow.filter='none';
   c.globalCompositeOperation='lighter';c.globalAlpha=.36;c.drawImage(this.bloom,0,0,width,height);
  }
  c.restore();
 }
 dispose(){this.source.width=this.source.height=this.bloom.width=this.bloom.height=1;}
}
