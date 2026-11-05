/** Original canvas bakes for the cafe wood, woven cloth, porcelain and warm windows. */
import * as T from 'three';
export function stageTexture(kind:'wood'|'cloth'|'window'):T.CanvasTexture{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d')!;
 if(kind==='window'){
  const g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,'#5b5266');g.addColorStop(.55,'#b88171');g.addColorStop(1,'#e8ba86');c.fillStyle=g;c.fillRect(0,0,256,256);
  c.fillStyle='#e7cda24f';for(let i=0;i<18;i++){c.beginPath();c.arc(18+(i*47)%228,35+(i*31)%195,6+(i%4)*4,0,Math.PI*2);c.fill()}
 }else{
  const d=c.createImageData(256,256);for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const n=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
   const v=kind==='wood'?(.68+.11*Math.sin(x*.20+Math.sin(y*.021)*3)+.07*Math.sin(x*.71+Math.sin(y*.03))+n*.035):(.85+((x%5<2)!==(y%5<2)?-.09:.04)+n*.035);
   const base=kind==='wood'?[203,155,112]:[211,204,195],i=(y*256+x)*4;d.data.set([...base.map(z=>Math.round(z*v)),255],i);
  }c.putImageData(d,0,0);
 }
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='wood'?3:kind==='cloth'?5:1,kind==='wood'?1:kind==='cloth'?3:1);texture.anisotropy=4;return texture;
}
