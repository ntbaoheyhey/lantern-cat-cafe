/** Deterministic fragments carry the force of a real hit down onto the floor. */
export function paintImpactDebris(c:CanvasRenderingContext2D,since:number,x:number,y:number,radius:number,direction:number,palette:readonly string[],seed:number,targets:number,reduced:boolean,low:boolean){
 if(reduced||since<0||since>=560)return 0;
 const count=low?6:16,scale=radius/220,random=(n:number)=>{const v=Math.sin(seed*3.1+n*127.1)*43758.5453;return v-Math.floor(v);};
 const t=since/1000,fade=Math.min(1,since/33)*(1-(since/560)**2);
 c.save();c.globalCompositeOperation='source-over';c.globalAlpha=fade*.92/Math.sqrt(targets);
 for(let i=0;i<count;i++){
  const spread=random(i),speed=90+random(i+40)*310,lift=90+random(i+80)*200;
  const px=x+direction*(spread-.3)*speed*t*scale,py=y-lift*t*scale+450*t*t*scale;
  const size=(9+random(i+120)*13)*scale;
  c.save();c.translate(px,py);c.rotate((spread-.5)*5+t*(i%2?8:-8));
  c.fillStyle=palette[i%palette.length]??'#ffe3ae';c.strokeStyle=palette[0]??'#fff4d3';c.lineWidth=1.5*scale;
  c.beginPath();c.moveTo(-size*.65,0);c.lineTo(size*.16,-size*.36);c.lineTo(size*.7,size*.12);c.lineTo(-size*.18,size*.3);c.closePath();c.fill();c.stroke();
  c.restore();
 }
 c.restore();return count;
}
