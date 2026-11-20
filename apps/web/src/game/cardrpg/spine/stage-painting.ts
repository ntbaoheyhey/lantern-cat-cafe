import {loadStagePainting} from './stage-image-loader';
import { PAINT } from './style';

/** Decode once across battle scenes; a failed request may retry on a later scene. */
export function cafePainting() {
 return loadStagePainting();
}

/** Extend the existing painted floor for the two raised formation seats. No new character art. */
export function formationPaintingC2(image: HTMLImageElement) {
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
 const c=canvas.getContext('2d')!,cut=Math.round(image.naturalHeight*.74),horizon=160;
 c.filter=`saturate(${PAINT.stage.paintingSaturation}) contrast(${PAINT.stage.paintingContrast}) brightness(${PAINT.stage.paintingBrightness})`;
 c.drawImage(image,0,0,image.naturalWidth,cut,0,0,2048,horizon);
 c.drawImage(image,0,cut,image.naturalWidth,image.naturalHeight-cut,0,horizon,2048,1024-horizon);
 // Original canvas props: a counter edge and cups left; a low leafy pot right.
 c.filter='none';c.save();c.scale(2,2);
 const wood=c.createLinearGradient(0,360,0,512);wood.addColorStop(0,'#83513a');wood.addColorStop(1,'#382b29');
 c.fillStyle=wood;c.beginPath();c.moveTo(0,370);c.lineTo(38,388);c.lineTo(67,512);c.lineTo(0,512);c.closePath();c.fill();
 c.strokeStyle='#d5a064';c.lineWidth=4;c.beginPath();c.moveTo(0,370);c.lineTo(38,388);c.lineTo(66,510);c.stroke();
 for(let i=0;i<3;i++){const x=8+i*7,y=370+i*4;c.fillStyle='#ead8ad';c.beginPath();c.roundRect(x-7,y-17,14,14,4);c.fill();c.fillStyle='#67432e';c.beginPath();c.ellipse(x,y-17,7,2,0,0,7);c.fill();}
 c.fillStyle='#46392c';c.beginPath();c.ellipse(1011,498,42,10,0,0,7);c.fill();c.fillStyle='#b47b56';c.beginPath();c.moveTo(978,455);c.lineTo(1040,455);c.lineTo(1030,496);c.lineTo(988,496);c.closePath();c.fill();
 c.strokeStyle='#516644';c.lineWidth=4;
 for(let i=0;i<11;i++){const x=985+(i*17)%55,y=403+(i*23)%46;c.beginPath();c.moveTo(1010,463);c.quadraticCurveTo(1004,430,x,y);c.stroke();c.fillStyle=i%2?'#82935c':'#536e46';c.beginPath();c.ellipse(x,y,7,18,(i-5)*.24,0,7);c.fill();}
 c.restore();
 // Keep the café warm, but lower its detail contrast behind the enlarged cast.
 // Selected from the actual-field tonal drill in LEARN/A2.md.
 const toned=document.createElement('canvas');toned.width=canvas.width;toned.height=canvas.height;
 const tone=toned.getContext('2d')!;tone.filter='saturate(.90) contrast(.90) brightness(.94)';tone.drawImage(canvas,0,0);
 return toned;
}

/** Runtime mattes separate distant panes, cafe wall and floor from one original painting. */
export function cafeLayers(image: HTMLImageElement) {
 return [0, 1, 2].map(layer => {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const c = canvas.getContext('2d')!; c.scale(2, 2);
  c.filter=`saturate(${PAINT.stage.paintingSaturation}) contrast(${PAINT.stage.paintingContrast}) brightness(${PAINT.stage.paintingBrightness})`;
  c.drawImage(image, 0, 0, 1024, 512);c.filter='none';
  if (layer === 1) {
   // Leave every frame, sill, cup and plant on the middle plane. Insets cover subpixel parallax.
   c.globalCompositeOperation = 'destination-out';c.filter='blur(3px)';
   for (const [left, right, bars] of [
    [31, 272, [74, 154, 229]], [385, 642, [431, 513, 597]], [740, 993, [791, 873, 953]],
   ] as const) {
    c.save(); c.beginPath(); c.roundRect(left, 20, right-left, 225, [112, 112, 0, 0]); c.clip();
    const edges = [left, ...bars, right];
    for (let i=0; i<edges.length-1; i++) {
     const x=edges[i]!+8, w=edges[i+1]!-edges[i]!-16;
     c.fillRect(x, 24, w, 65); c.fillRect(x, 108, w, 54);
    }
    c.restore();
   }
   c.filter='none';
   // A feathered horizontal join keeps the wood seamless while the near floor shifts.
   const mask=c.createLinearGradient(0,358,0,369);mask.addColorStop(0,'#0000');mask.addColorStop(1,'#000');
   c.fillStyle=mask;c.fillRect(0,358,1024,154);
  } else if (layer === 2) {
   c.globalCompositeOperation='destination-in';
   const mask=c.createLinearGradient(0,358,0,369);mask.addColorStop(0,'#0000');mask.addColorStop(1,'#000');
   c.fillStyle=mask;c.fillRect(0,0,1024,512);
  }
  c.globalCompositeOperation='source-over';return canvas;
 });
}
