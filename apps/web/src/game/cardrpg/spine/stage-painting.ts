import cafeUrl from '../../../../../../assets/cardrpg-look/stage/painted-cafe-c11-v1.webp?url';
import { PAINT } from './style';

let source: Promise<HTMLImageElement> | undefined;
/** Decode once across battle scenes; a failed request may retry on a later scene. */
export function cafePainting() {
 return source ??= (() => {
  const image = new Image();
  const loaded = typeof image.decode==='function'
   ? (image.src=cafeUrl,image.decode())
   : new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('Cafe painting unavailable'));image.src=cafeUrl;});
  return loaded.then(() => image).catch((error: unknown) => { source = undefined; throw error; });
 })();
}

/** Extend the existing painted floor for the two raised formation seats. No new character art. */
export function formationPaintingC2(image: HTMLImageElement) {
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
 const c=canvas.getContext('2d')!,cut=Math.round(image.naturalHeight*.70),horizon=340;
 c.filter=`saturate(${PAINT.stage.paintingSaturation}) contrast(${PAINT.stage.paintingContrast}) brightness(${PAINT.stage.paintingBrightness})`;
 c.drawImage(image,0,0,image.naturalWidth,cut,0,0,2048,horizon);
 c.drawImage(image,0,cut,image.naturalWidth,image.naturalHeight-cut,0,horizon,2048,1024-horizon);
 return canvas;
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
