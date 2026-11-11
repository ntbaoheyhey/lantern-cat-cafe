import * as T from 'three';
import { PAINT } from './style';

/** Original procedural cafe placeholder: distant glass, warm wall, wood apron. */
export class PaintedStage {
 readonly root=new T.Group();
 private layers:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
 private textures:T.Texture[]=[];
 constructor(){
  for(let layer=0;layer<3;layer++){
   const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
   const c=canvas.getContext('2d')!;c.scale(2,2);
   if(layer===0){
    const wash=c.createLinearGradient(0,0,0,512);wash.addColorStop(0,'#4a505c');wash.addColorStop(1,'#b59b8d');c.fillStyle=wash;c.fillRect(0,0,1024,512);
    c.fillStyle='#ecd9ad';c.beginPath();c.arc(510,70,25,0,Math.PI*2);c.fill();c.fillStyle='#4f5762';c.beginPath();c.arc(520,65,25,0,Math.PI*2);c.fill();
    c.fillStyle='#e2c8a2';for(let i=0;i<48;i++){const x=(i*397)%1024,y=20+(i*71)%260;c.globalAlpha=.15+i%3*.10;c.fillRect(x,y,2,2);}c.globalAlpha=1;
   }else if(layer===1){
    c.fillStyle=PAINT.wall;c.fillRect(0,0,1024,315);
    for(const x of [55,396,737]){
     c.save();c.beginPath();c.roundRect(x,16,235,260,[110,110,8,8]);c.clip();c.clearRect(x,16,235,260);c.restore();
     c.strokeStyle='#755144';c.lineWidth=12;c.beginPath();c.roundRect(x,16,235,260,[110,110,8,8]);c.stroke();
     c.strokeStyle='#d9ae76';c.lineWidth=3;c.stroke();c.fillStyle='#946b4d';c.fillRect(x+114,18,7,255);c.fillRect(x,172,235,7);
     c.fillStyle='#735042';c.fillRect(x-9,274,253,17);c.fillStyle='#d9b17a';c.fillRect(x-9,274,253,3);
    }
    c.fillStyle='#8d614e';c.fillRect(0,307,1024,46);c.strokeStyle='#bc9063';c.lineWidth=2;
    for(let x=10;x<1024;x+=80)c.strokeRect(x,319,65,27);
    // Familiar cafe lamps, painted halo kept behind the combat silhouettes.
    for(const x of [348,691]){
     const glow=c.createRadialGradient(x,118,2,x,118,89);glow.addColorStop(0,'#f3cf8e99');glow.addColorStop(1,'#f3cf8e00');c.fillStyle=glow;c.fillRect(x-90,28,180,180);
     c.strokeStyle='#674638';c.lineWidth=3;c.beginPath();c.moveTo(x,0);c.lineTo(x,93);c.stroke();c.fillStyle='#f0c87f';c.beginPath();c.moveTo(x-20,107);c.lineTo(x-12,86);c.lineTo(x+12,86);c.lineTo(x+20,107);c.closePath();c.fill();c.stroke();
    }
    // Sparse deterministic brush flecks soften the flat wall without new media.
    for(let i=0;i<650;i++){c.fillStyle=i%2?'#583c2a08':'#fff0c50a';c.fillRect((i*349)%1024,(i*97)%350,3+i%9,1+i%3);}
   }else{
    const floor=c.createLinearGradient(0,325,0,512);floor.addColorStop(0,'#c39970');floor.addColorStop(1,'#825746');c.fillStyle=floor;c.fillRect(0,350,1024,162);
    c.strokeStyle='#6b483d55';c.lineWidth=1.5;
    for(let y=358;y<512;y+=31){c.beginPath();c.moveTo(0,y);c.lineTo(1024,y);c.stroke();for(let x=(y%2)*85;x<1024;x+=170){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+31);c.stroke();}}
    const vignette=c.createRadialGradient(512,285,130,512,285,660);vignette.addColorStop(0,'#49303b00');vignette.addColorStop(1,'#49303b70');c.fillStyle=vignette;c.fillRect(0,0,1024,512);
   }
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;this.textures.push(texture);
   const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false}));mesh.renderOrder=-100+layer;this.root.add(mesh);this.layers.push(mesh);
  }
 }
 update(width:number,height:number,shift:number,dim:number){this.layers.forEach((mesh,i)=>{mesh.scale.set(width*1.04,height*1.04,1);mesh.position.set(shift*(i+1)*.13,height/2,-30+i);mesh.material.color.setScalar(1-dim);});}
 dispose(){for(const layer of this.layers){layer.geometry.dispose();layer.material.dispose();}this.textures.forEach(t=>t.dispose());}
}
