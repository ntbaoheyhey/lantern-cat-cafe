// Original lantern procession. Reference pixels are never inputs to this recipe.
import {clamp,smooth,timing} from './pose';
export type Kind='basic'|'ultimate';
export const recipe={
 actor:'soot',target:'button-guard',name:'Lantern Requiem',width:1280,height:720,
 sources:['assets/cardrpg-look/vfx-layered/soot-1.webp','assets/cardrpg-look/vfx-layered/soot-4.webp'],
 basic:{layers:['preparation-glint','travelling-comet','contact-star','ground-splinters'],...timing.basic},
 ultimate:{layers:['focus-lantern','cast-arch','procession-ribbons','contact-fan','lantern-residue'],...timing.ultimate},
} as const;
export const makeCanvas=()=>{const c=document.createElement('canvas');c.width=1280;c.height=720;return c;};
const path=(ctx:CanvasRenderingContext2D,pts:number[][],fill:string)=>{
 ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();
};
const envelope=(t:number,a:number,b:number,c:number,d:number)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
const star=(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,color:string,angle=0)=>{
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);path(ctx,[[0,-size],[size*.18,-size*.2],[size*.7,0],[size*.15,size*.2],[0,size],[-size*.18,size*.2],[-size*.7,0],[-size*.18,-size*.2]],color);ctx.restore();
};
export class LanternEffects{
 readonly layers=new Map<string,HTMLCanvasElement>();readonly union=makeCanvas();
 constructor(readonly paint:HTMLImageElement){for(const n of [...recipe.basic.layers,...recipe.ultimate.layers])this.layers.set(n,makeCanvas());}
 draw(kind:Kind|null,t:number,source:{x:number;y:number},target:{x:number;y:number}){
  for(const c of this.layers.values())c.getContext('2d')!.clearRect(0,0,1280,720);
  const union=this.union.getContext('2d')!;union.clearRect(0,0,1280,720);if(!kind)return;
  const layer=(name:string,alpha:number,draw:(ctx:CanvasRenderingContext2D)=>void)=>{
   const c=this.layers.get(name)!,ctx=c.getContext('2d')!;ctx.save();ctx.globalAlpha=clamp(alpha);draw(ctx);ctx.restore();
  };
  const {x:sx,y:sy}=source,{x:tx,y:ty}=target;
  if(kind==='basic'){
   layer('preparation-glint',envelope(t,0,100,240,350),c=>{
    const grow=.45+.55*smooth(t/250);star(c,sx,sy,30*grow,'#ffcc68',-.2);
    c.strokeStyle='#d591d9';c.lineWidth=3;c.beginPath();c.moveTo(sx-40,sy-30);c.quadraticCurveTo(sx-54,sy+30,sx-10,sy+42);c.stroke();
   });
   layer('travelling-comet',envelope(t,230,296,350,450),c=>{
    const p=clamp((t-250)/100),x=sx+(tx-sx)*p-24,y=sy+(ty-sy)*p-Math.sin(p*Math.PI)*45;
    const g=c.createLinearGradient(x-220,y,x+20,y);g.addColorStop(0,'#ef855400');g.addColorStop(.55,'#e5914b88');g.addColorStop(1,'#ffe48b');
    c.fillStyle=g;c.beginPath();c.moveTo(x+24,y);c.bezierCurveTo(x-25,y-37,x-135,y-25,x-225,y+15);c.bezierCurveTo(x-130,y-3,x-70,y+42,x+24,y);c.fill();
    c.strokeStyle='#fff3c0';c.lineWidth=4;c.beginPath();c.moveTo(x-140,y+5);c.quadraticCurveTo(x-30,y-10,x+17,y);c.stroke();
    star(c,x,y,21,'#fff5c5',Math.PI/4);
   });
   layer('contact-star',t<350?0:envelope(t,349,365,420,570),c=>{
    const p=smooth((t-350)/200);star(c,tx,ty,68+30*p,'#ffd878',.6);
    for(let i=0;i<7;i++){const a=-1.25+i*.4,len=(35+55*p)*(1+i%3*.25);c.save();c.translate(tx,ty);c.rotate(a);path(c,[[20,-4],[len+50,-1],[23,6]],i%2?'#ffefbb':'#dc8ea2');c.restore();}
   });
   layer('ground-splinters',envelope(t,350,418,550,780),c=>{
    c.save();c.translate(tx,535);c.scale(1,.24);c.drawImage(this.paint,256,256,256,256,-130,-90,260,180);c.restore();
    for(let i=0;i<6;i++){const p=clamp((t-350)/430),x=tx+28+i*17+80*p,y=512-i%3*23-55*Math.sin(p*Math.PI);star(c,x,y,4*(1-p),'#e9bb70',i);}
   });
  }else{
   layer('focus-lantern',envelope(t,0,100,650,850),c=>{
    star(c,sx,sy,25+5*Math.sin(t/130),'#ffe2a1');
    c.strokeStyle='#e9b464';c.lineWidth=3;c.beginPath();c.moveTo(sx-23,sy+35);c.bezierCurveTo(sx-90,sy-10,sx-20,sy-90,sx+50,sy-55);c.stroke();
    c.drawImage(this.paint,256,0,256,256,sx-80,sy-145,160,150);
   });
   layer('cast-arch',envelope(t,600,733,1150,1467),c=>{
    const p=clamp((t-600)/500),end=sx+(tx-sx)*p;
    c.strokeStyle='#e2a65f';c.lineWidth=10;c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx+170,120,end-130,155,end,250);c.stroke();
    c.strokeStyle='#fff1b8';c.lineWidth=3;c.stroke();
    for(let i=0;i<5;i++){const q=(i+1)/5,x=sx+(tx-sx)*q,y=150+80*(q-.45)**2;if(p<q-.07)continue;c.save();c.globalAlpha*=smooth((p-q+.07)/.14);c.drawImage(this.paint,256,0,256,256,x-110,y-70,220,220);c.restore();}
   });
   layer('procession-ribbons',envelope(t,600,733,1267,1733),c=>{
    const p=clamp((t-600)/500),end=sx+(tx-sx)*p;
    // A broad canopy of three brush-textured fabric flames, blocked as a silhouette first.
    for(let i=0;i<3;i++){
     const y=180+i*155,bow=i===1?105:-65,thick=235-i*10;
     const g=c.createLinearGradient(sx,0,tx,0);g.addColorStop(0,'#9c58b733');g.addColorStop(.5,['#f1b454','#d39aec','#ffc866'][i]);g.addColorStop(1,'#fff1ad');c.fillStyle=g;
     c.beginPath();c.moveTo(sx,sy);c.bezierCurveTo(sx+180,y+bow,end-135,y-bow,end,y);c.bezierCurveTo(end-100,y-bow+thick,sx+180,y+bow+thick,sx,sy+8);c.fill();
     c.save();c.clip();c.globalAlpha*=.4;c.drawImage(this.paint,512,0,256,256,sx,y-140,Math.max(1,end-sx),410);c.restore();
     c.strokeStyle='#ffedaf';c.lineWidth=3;c.stroke();
     for(let j=0;j<5;j++){const q=(j+1)/6,x=sx+(end-sx)*q,yy=sy+(y-sy)*q+(30+i*7)*Math.sin(q*Math.PI);star(c,x,yy,6+i*2,'#fff3ba',-.7);}
    }
   });
   layer('contact-fan',t<1100?0:envelope(t,1099,1134,1234,1567),c=>{
    const p=smooth((t-1100)/400);
    for(let i=0;i<11;i++){
     const a=-1.2+i*.24,len=100+(i%3)*50;
     c.save();c.translate(tx-15,ty);c.rotate(a);path(c,[[-65,-8],[70+len*p,-20-i%2*12],[110+len,-1],[25,22+i%3*10]],i%2?'#ffd16ecc':'#da9ee9bb');c.restore();
    }
    c.drawImage(this.paint,768,0,256,256,tx-105,ty-135,210,270);
   });
   layer('lantern-residue',envelope(t,1100,1200,1750,2200),c=>{
    c.save();c.translate(tx-25,535);c.scale(1,.3);c.drawImage(this.paint,256,256,256,256,-250,-180,500,360);c.restore();
    for(let i=0;i<16;i++){const p=clamp((t-1100)/1100),x=tx-280+(i*73%420)+p*45,y=300+(i*57%240)-p*(50+i%4*20);c.save();c.translate(x,y);c.rotate(i*.7+p);path(c,[[0,-12],[5,-2],[0,13],[-5,2]],i%2?'#d295d7':'#ffce83');c.restore();}
   });
  }
  for(const name of recipe[kind].layers)union.drawImage(this.layers.get(name)!,0,0);
 }
}
