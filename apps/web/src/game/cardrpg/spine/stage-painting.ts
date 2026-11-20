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

/**
 * Battle arena moods, aligned with the story cards: Ch1 and street patrol in the
 * café's night garden, Ch2 the same garden in cold rain, Ch3 the midnight pantry.
 * Each chapter boss gets its own grade of that place.
 */
export type ArenaMood='garden'|'rain'|'pantry'|'tangle'|'storm'|'crown';
export function arenaMood(chapter:number|undefined,boss:boolean,bossAsset?:string):ArenaMood{
 const c=chapter??1;
 if(boss||bossAsset){
  if(bossAsset==='rain-spool')return 'storm';
  if(bossAsset==='pantry-crown')return 'crown';
  if(bossAsset==='yarn-giant'||c<=1)return 'tangle';
  return c===2?'storm':'crown';
 }
 return c===2?'rain':c>=3?'pantry':'garden';
}
type Place='garden'|'pantry';
const PLACE:Record<ArenaMood,Place>={garden:'garden',rain:'garden',tangle:'garden',storm:'garden',pantry:'pantry',crown:'pantry'};
export interface ArenaSource {image:HTMLImageElement;floor?:HTMLImageElement}
const places=new Map<Place,Promise<ArenaSource>>();
async function decodeArena(url:string){const image=new Image();image.src=url;await image.decode();return image;}
/** The original b2 backdrops (the garden is the landing key art's place), decoded once each; the pantry borrows the café's painted floor. */
export function arenaImage(mood:ArenaMood){
 const place=PLACE[mood];let p=places.get(place);
 if(!p){
  const base=`/art/v3-shell/b2/backdrop-${place}`;
  p=(place==='garden'?decodeArena(`${base}.avif`).catch(()=>decodeArena(`${base}.webp`)).then(image=>({image}))
   :Promise.all([decodeArena(`${base}.webp`),cafePainting()]).then(([image,floor])=>({image,floor})))
   .catch((error:unknown)=>{places.delete(place);throw error;});
  places.set(place,p);
 }
 return p;
}
interface Grade {filter:string;wash?:[string,number,GlobalCompositeOperation];pool:string;far:number;rain?:boolean;threads?:string[];motes?:string}
const GRADE:Record<ArenaMood,Grade>={
 garden:{filter:'saturate(.92) contrast(.94) brightness(.94)',pool:'#ffcf8a',far:.40},
 rain:{filter:'saturate(.72) contrast(.92) brightness(.84)',wash:['#4f74b8',.30,'soft-light'],pool:'#ffd49a',far:.40,rain:true},
 pantry:{filter:'saturate(.88) contrast(.96) brightness(.78)',wash:['#6a3a1c',.24,'multiply'],pool:'#ffc070',far:.34,motes:'#ffd28a'},
 tangle:{filter:'saturate(.88) contrast(.95) brightness(.80)',wash:['#a2357f',.30,'multiply'],pool:'#ff9fc4',far:.40,threads:['#e05aa8','#b04ad0']},
 storm:{filter:'saturate(.55) contrast(.95) brightness(.74)',wash:['#5d7393',.38,'multiply'],pool:'#cfe4ff',far:.40,rain:true,threads:['#9fb6d8','#6f87b0']},
 crown:{filter:'saturate(.95) contrast(.98) brightness(.80)',wash:['#d79a2b',.30,'soft-light'],pool:'#ffd36a',far:.34,motes:'#ffe08a'},
};
const hex=(colour:string,a:number)=>colour+Math.round(Math.max(0,Math.min(1,a))*255).toString(16).padStart(2,'0');
/**
 * The garden is framed so its stone path and lawn lie under the formation:
 * both lines stand between 37% and 70% of the frame, the café table and the
 * corner lantern stay at the edges instead of under a cat.
 */
function drawGarden(c:CanvasRenderingContext2D,image:HTMLImageElement,W:number,H:number){
 const s=1.45;c.drawImage(image,-W*.30,-H*.45,W*s,H*s);
}
/**
 * Pantry: its shelf wall (above the counter) at natural proportion as the far
 * wall, then a perspective plank floor in the same warm wood for the lines.
 */
function drawPantry(c:CanvasRenderingContext2D,image:HTMLImageElement,W:number,H:number,floor?:HTMLImageElement){
 const horizon=H*.42,wallSrc=image.naturalHeight*.60,scale=horizon/wallSrc,ww=image.naturalWidth*scale;
 c.drawImage(image,0,0,image.naturalWidth,wallSrc,(W-ww)/2,0,ww,horizon);
 if(ww<W){c.drawImage(image,0,0,image.naturalWidth*.12,wallSrc,0,0,(W-ww)/2+2,horizon);c.drawImage(image,image.naturalWidth*.88,0,image.naturalWidth*.12,wallSrc,(W+ww)/2-2,0,(W-ww)/2+2,horizon);}
 if(floor){
  // The café's own painted planks and braided rug, laid in under the shelves.
  const cut=floor.naturalHeight*.735;c.drawImage(floor,0,cut,floor.naturalWidth,floor.naturalHeight-cut,-W*.06,horizon,W*1.12,H-horizon);
 }else{const wood=c.createLinearGradient(0,horizon,0,H);wood.addColorStop(0,'#5a3424');wood.addColorStop(1,'#4a2c20');c.fillStyle=wood;c.fillRect(0,horizon,W,H-horizon);}
 // Skirting board where the shelf wall meets the floor.
 c.fillStyle='#2e1c16';c.fillRect(0,horizon-6,W,12);c.fillStyle='#b98250';c.fillRect(0,horizon-6,W,2);
 const shade=c.createLinearGradient(0,horizon,0,horizon+H*.10);shade.addColorStop(0,'#1a0e0a88');shade.addColorStop(1,'#1a0e0a00');c.fillStyle=shade;c.fillRect(0,horizon,W,H*.10);
}
/**
 * Formation backdrop: the far half in soft focus so the cast reads first, a
 * warm pool of lantern light where the two lines stand, and a chapter grade.
 * Replaces the stretched plank floor (80% of the frame was empty wood and one rug).
 */
export function arenaPaintingC2({image,floor}:ArenaSource,mood:ArenaMood){
 const W=2048,H=1024,g=GRADE[mood];
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d')!;
 // Compose the place once, then filter it as a single image (a filter on many small draws is slow).
 const base=document.createElement('canvas');base.width=W;base.height=H;const b=base.getContext('2d')!;
 if(PLACE[mood]==='garden')drawGarden(b,image,W,H);else drawPantry(b,image,W,H,floor);
 c.filter=g.filter;c.drawImage(base,0,0);c.filter='none';
 const far=document.createElement('canvas');far.width=W;far.height=H;const f=far.getContext('2d')!;
 f.filter=`${g.filter} blur(5px) brightness(.88)`;f.drawImage(base,0,0);f.filter='none';
 f.globalCompositeOperation='destination-in';const fade=f.createLinearGradient(0,0,0,H);
 fade.addColorStop(0,'#000');fade.addColorStop(g.far,'#000');fade.addColorStop(g.far+.22,'#0000');f.fillStyle=fade;f.fillRect(0,0,W,H);
 c.drawImage(far,0,0);
 if(g.wash){c.globalCompositeOperation=g.wash[2];c.globalAlpha=g.wash[1];c.fillStyle=g.wash[0];c.fillRect(0,0,W,H);c.globalAlpha=1;c.globalCompositeOperation='source-over';}
 c.save();c.lineCap='round';
 if(g.threads)for(let i=0;i<6;i++){
  // A few loose threads sag between the far trees: soft, uneven, behind the cast.
  const x0=-60+(i*331)%(W*.5),x1=x0+W*(.45+(i%3)*.18),y0=70+(i*113)%260,y1=y0+((i*71)%120-60),sag=90+(i*53)%110;
  c.strokeStyle=g.threads[i%2]!;c.globalAlpha=.12+(i%3)*.04;c.lineWidth=2.5+(i%3)*1.5;
  c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(x0+(x1-x0)*.3,y0+sag,x0+(x1-x0)*.7,y1+sag,x1,y1);c.stroke();
 }
 if(g.rain)for(let i=0;i<520;i++){
  const x=(i*367)%W,y=(i*211)%H,l=18+(i%5)*9;c.strokeStyle='#dfeaff';c.globalAlpha=.06+(i%4)*.03;c.lineWidth=1+(i%3)*.5;
  c.beginPath();c.moveTo(x,y);c.lineTo(x-l*.22,y+l);c.stroke();
 }
 if(g.motes)for(let i=0;i<70;i++){
  const x=(i*523)%W,y=60+(i*149)%(H*.6),r=1.5+(i%4);c.fillStyle=g.motes;c.globalAlpha=.10+(i%5)*.05;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 }
 c.restore();
 // Lantern pools on the ground under both lines; additive, so they light rather than paint.
 c.globalCompositeOperation='lighter';
 for(const [x,y,r,a] of [[.30,.66,.34,.20],[.70,.66,.34,.16],[.50,.80,.42,.12]] as const){
  const pool=c.createRadialGradient(W*x,H*y,0,W*x,H*y,W*r);pool.addColorStop(0,hex(g.pool,a));pool.addColorStop(1,hex(g.pool,0));
  c.fillStyle=pool;c.fillRect(0,0,W,H);
 }
 c.globalCompositeOperation='source-over';
 const ground=c.createLinearGradient(0,H*.55,0,H);ground.addColorStop(0,'#14101e00');ground.addColorStop(1,'#14101e55');c.fillStyle=ground;c.fillRect(0,H*.55,W,H*.45);
 const vignette=c.createRadialGradient(W/2,H*.58,H*.35,W/2,H*.58,W*.62);vignette.addColorStop(0,'#0c081400');vignette.addColorStop(1,'#0c0814b0');c.fillStyle=vignette;c.fillRect(0,0,W,H);
 return canvas;
}
