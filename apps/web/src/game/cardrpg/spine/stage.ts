import * as T from 'three';
import { PAINT } from './style';
import { cafePainting, cafeLayers } from './stage-painting';

const P=PAINT.stage;
function ellipse(c:CanvasRenderingContext2D,x:number,y:number,rx:number,ry:number,color:string,rotation=0){
 c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,rotation,0,Math.PI*2);c.fill();
}
function halo(c:CanvasRenderingContext2D,x:number,y:number,r:number,strength:string){
 const light=c.createRadialGradient(x,y,0,x,y,r);light.addColorStop(0,P.light+strength);light.addColorStop(1,P.light+'00');c.fillStyle=light;c.fillRect(x-r,y-r,r*2,r*2);
}
function plant(c:CanvasRenderingContext2D,x:number,y:number,scale:number){
 c.save();c.translate(x,y);c.scale(scale,scale);c.lineCap='round';c.lineWidth=2;c.strokeStyle=P.foliage;
 for(let i=0;i<5;i++){const a=(i-2)*.42,xx=Math.sin(a)*28,yy=-30-Math.cos(a)*15;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(xx*.25,-15,xx,yy);c.stroke();ellipse(c,xx,yy,6,14,i%2?P.leaf:P.foliage,a);}
 c.fillStyle=P.pot;c.beginPath();c.moveTo(-14,-3);c.lineTo(14,-3);c.lineTo(10,20);c.quadraticCurveTo(0,25,-10,20);c.closePath();c.fill();ellipse(c,0,-3,15,4,P.frame);c.restore();
}
function cup(c:CanvasRenderingContext2D,x:number,y:number){
 c.strokeStyle=P.paper;c.lineWidth=3;c.beginPath();c.arc(x+7,y-6,4,-Math.PI/2,Math.PI/2);c.stroke();c.fillStyle=P.paper;c.beginPath();c.roundRect(x-7,y-14,14,15,[1,1,5,5]);c.fill();ellipse(c,x,y-14,7,2,P.frame);ellipse(c,x,y+2,12,2,P.trim);
}

/** Three original painted planes, prepared once; detail stays behind the silhouettes. */
export class PaintedStage {
 readonly root=new T.Group();
 private layers:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
 private textures:T.Texture[]=[];
 private disposed=false;
 private source:'loading'|'painted'|'procedural'='loading';
 constructor(private onChange:()=>void=()=>{}){
  for(let layer=0;layer<3;layer++){
   const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
   const c=canvas.getContext('2d')!;c.scale(2,2);
   if(layer===0){
    const wash=c.createLinearGradient(0,0,0,512);wash.addColorStop(0,P.glassTop);wash.addColorStop(1,P.glassBottom);c.fillStyle=wash;c.fillRect(0,0,1024,512);
    halo(c,510,80,125,'35');ellipse(c,510,70,25,25,PAINT.cream);ellipse(c,520,64,25,25,P.glassTop);
    for(let i=0;i<48;i++){c.globalAlpha=.15+i%3*.10;ellipse(c,(i*397)%1024,20+(i*71)%260,1,1,PAINT.cream);}c.globalAlpha=1;
    // Distant hedges and roofs seen only through the three panes.
    for(let i=0;i<15;i++){const x=i*79-25,y=240+(i*37)%70;ellipse(c,x,y,70,60,P.distant);ellipse(c,x+10,y+20,80,52,P.foliage);}
    c.fillStyle=P.glassTop;c.globalAlpha=.35;c.beginPath();c.moveTo(0,310);for(let x=0;x<=1100;x+=90){c.lineTo(x,275+(x%7)*4);c.lineTo(x+45,238+(x%7)*4);}c.lineTo(1100,512);c.lineTo(0,512);c.closePath();c.fill();c.globalAlpha=1;
   }else if(layer===1){
    const plaster=c.createLinearGradient(0,0,0,355);plaster.addColorStop(0,P.plasterTop);plaster.addColorStop(1,P.plasterBottom);c.fillStyle=plaster;c.fillRect(0,0,1024,355);
    for(const x of [55,396,737]){
     c.save();c.beginPath();c.roundRect(x,16,235,260,[110,110,8,8]);c.clip();c.clearRect(x,16,235,260);
     const reflection=c.createLinearGradient(x,0,x+235,250);reflection.addColorStop(0,PAINT.cream+'18');reflection.addColorStop(.55,PAINT.cream+'00');reflection.addColorStop(1,P.glassTop+'20');c.fillStyle=reflection;c.fillRect(x,16,235,260);
     c.strokeStyle=PAINT.cream+'13';c.lineWidth=12;c.beginPath();c.moveTo(x+70,20);c.lineTo(x+15,160);c.moveTo(x+96,20);c.lineTo(x+41,160);c.stroke();c.restore();
     c.strokeStyle=P.frame;c.lineWidth=12;c.beginPath();c.roundRect(x,16,235,260,[110,110,8,8]);c.stroke();c.strokeStyle=P.trim;c.lineWidth=3;c.stroke();
     c.fillStyle=P.frame;c.fillRect(x+114,18,7,255);c.fillRect(x,172,235,7);c.fillStyle=P.trim;c.fillRect(x+114,18,1,255);
     c.fillStyle=P.sill;c.fillRect(x-9,274,253,17);c.fillStyle=P.trim;c.fillRect(x-9,274,253,3);
     // Familiar cups and sill plants add cafe context without a busy combat floor.
     plant(c,x+207,257,.65);cup(c,x+25,272);cup(c,x+47,272);
    }
    c.fillStyle=P.panel;c.fillRect(0,307,1024,46);c.strokeStyle=P.panelLight;c.lineWidth=2;
    for(let x=10;x<1024;x+=80)c.strokeRect(x,319,65,27);
    c.fillStyle=P.trim;c.fillRect(0,305,1024,3);
    for(const x of [348,691]){
     halo(c,x,118,110,'80');c.strokeStyle=P.frame;c.lineWidth=3;c.beginPath();c.moveTo(x,0);c.lineTo(x,93);c.stroke();
     c.fillStyle=P.lamp;c.beginPath();c.moveTo(x-20,107);c.lineTo(x-12,86);c.lineTo(x+12,86);c.lineTo(x+20,107);c.closePath();c.fill();c.stroke();ellipse(c,x,106,18,3,PAINT.cream);
     // A small book shelf and linen pennant occupy the narrow wall between windows.
     c.fillStyle=P.sill;c.fillRect(x-29,208,58,7);c.fillStyle=P.trim;c.fillRect(x-29,208,58,2);
     for(let i=0;i<5;i++){c.save();c.translate(x-19+i*7,207);c.rotate((i%3-1)*.08);c.fillStyle=[P.paper,P.pot,P.foliage,P.glassTop,P.trim][i]!;c.fillRect(0,-25-i%2*7,6,25+i%2*7);c.fillStyle=PAINT.cream+'55';c.fillRect(1,-20-i%2*7,4,1);c.restore();}
     c.fillStyle=P.paper;c.beginPath();c.moveTo(x-19,228);c.lineTo(x+19,228);c.lineTo(x+19,264);c.lineTo(x,274);c.lineTo(x-19,264);c.closePath();c.fill();
     c.strokeStyle=P.pot;c.lineWidth=2;c.beginPath();c.moveTo(x-12,230);c.lineTo(x-12,262);c.moveTo(x+12,230);c.lineTo(x+12,262);c.stroke();ellipse(c,x,248,7,7,P.pot);ellipse(c,x,248,4,4,P.paper);
    }
    for(let i=0;i<950;i++){c.fillStyle=i%2?PAINT.ink+'06':PAINT.cream+'09';c.fillRect((i*349)%1024,(i*97)%350,3+i%9,1+i%3);}
   }else{
    const floor=c.createLinearGradient(0,325,0,512);floor.addColorStop(0,P.floorTop);floor.addColorStop(1,P.floorBottom);c.fillStyle=floor;c.fillRect(0,350,1024,162);
    c.strokeStyle=P.seam+'50';c.lineWidth=1.5;
    for(let y=358;y<512;y+=31){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();for(let x=(y%2)*85;x<1024;x+=170){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+31);c.stroke();}}
    // Brush grain and a faded woven rug keep feet grounded without high contrast lines.
    for(let i=0;i<420;i++){c.fillStyle=i%2?PAINT.cream+'08':PAINT.ink+'08';c.fillRect((i*193)%1024,352+(i*71)%160,5+i%30,.8);}
    c.globalAlpha=.27;ellipse(c,512,423,265,48,P.rugEdge);ellipse(c,512,423,253,43,P.rug);c.strokeStyle=P.rugEdge;c.lineWidth=1.3;c.beginPath();c.ellipse(512,423,239,36,0,0,Math.PI*2);c.stroke();
    for(let i=0;i<12;i++){c.beginPath();c.ellipse(512,423,36+i*17,13+i*1.7,0,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
    halo(c,345,355,250,'17');halo(c,690,355,250,'17');
    const warmth=c.createLinearGradient(0,0,0,512);warmth.addColorStop(0,PAINT.honey+'07');warmth.addColorStop(.6,PAINT.honey+'00');warmth.addColorStop(1,PAINT.rose+'0d');c.fillStyle=warmth;c.fillRect(0,0,1024,512);
    const vignette=c.createRadialGradient(512,285,170,512,285,640);vignette.addColorStop(0,PAINT.ink+'00');vignette.addColorStop(1,PAINT.ink+'85');c.fillStyle=vignette;c.fillRect(0,0,1024,512);
   }
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.textures.push(texture);
   const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));mesh.renderOrder=-100+layer;this.root.add(mesh);this.layers.push(mesh);
  }
  void cafePainting().then(image=>{
   if(this.disposed)return;
   const textures=cafeLayers(image).map(canvas=>{const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;});
   this.layers.forEach((mesh,i)=>{mesh.material.map=textures[i]!;mesh.material.needsUpdate=true;});
   this.textures.forEach(texture=>texture.dispose());this.textures=textures;this.source='painted';this.onChange();
  }).catch(()=>{if(!this.disposed){this.source='procedural';this.onChange();}});
 }
 update(width:number,height:number,shift:number,dim:number){this.layers.forEach((mesh,i)=>{mesh.scale.set(width*1.04,height*1.04,1);mesh.position.set(shift*(i+1)*.13,height/2,-30+i);mesh.material.color.setScalar(1-dim);});}
 audit(){return{source:this.source,layers:this.layers.length,textureSize:[2048,1024],offsets:this.layers.map(layer=>layer.position.x)};}
 dispose(){this.disposed=true;for(const layer of this.layers){layer.geometry.dispose();layer.material.dispose();}this.textures.forEach(t=>t.dispose());}
}
