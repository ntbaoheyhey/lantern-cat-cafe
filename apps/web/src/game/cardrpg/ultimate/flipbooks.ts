/**
 * Optional CXV Blender flipbooks (/vfx/v9/<id>.webp + .json): 512 px cells,
 * four columns, row-major, centre anchor. Additive atlases are RGB emission on
 * black ('lighter'); smoke is straight RGBA. Missing atlases simply stay absent
 * and the painter keeps its procedural version.
 */
export type FlipbookId='impact-core'|'shockwave-ring'|'smoke-embers'|'lantern-dome'|'tea-clover'|'comet-loop'|'fire-dome'|'rune-circle';
interface Atlas {image:CanvasImageSource;frames:number;cols:number;cell:number;additive:boolean;loop:boolean;fps:number}
const BLEND:Record<FlipbookId,{additive:boolean;loop:boolean}>={
 'impact-core':{additive:true,loop:false},'shockwave-ring':{additive:true,loop:false},'smoke-embers':{additive:false,loop:false},
 'lantern-dome':{additive:true,loop:false},'tea-clover':{additive:true,loop:false},'comet-loop':{additive:true,loop:true},
 'fire-dome':{additive:true,loop:false},'rune-circle':{additive:true,loop:true},
};
export const FLIPBOOK_IDS=Object.keys(BLEND) as FlipbookId[];

/** Source rectangle of a frame; one-shots clamp, loops wrap. */
export function flipbookCell(frame:number,frames:number,cols:number,cell:number,loop:boolean){
 const f=loop?((Math.floor(frame)%frames)+frames)%frames:Math.max(0,Math.min(frames-1,Math.floor(frame)));
 return {x:(f%cols)*cell,y:Math.floor(f/cols)*cell,size:cell,frame:f};
}

/** Blender emission atlases are RGB on opaque black. The 2D overlay sits on top of
 * the WebGL canvas, so black must become transparent: alpha = max channel, colour
 * unassociated. Done once per atlas at load. */
export function emissionPixels(data:Uint8ClampedArray){
 for(let i=0;i<data.length;i+=4){
  const m=Math.max(data[i]!,data[i+1]!,data[i+2]!);
  if(m===0){data[i+3]=0;continue;}
  const k=255/m;data[i]=Math.min(255,Math.round(data[i]!*k));data[i+1]=Math.min(255,Math.round(data[i+1]!*k));data[i+2]=Math.min(255,Math.round(data[i+2]!*k));data[i+3]=Math.round(m*(data[i+3]!/255));
 }
 return data;
}
function emissionToAlpha(image:HTMLImageElement):CanvasImageSource{
 try{
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const c=canvas.getContext('2d',{willReadFrequently:true});if(!c)return image;
  c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height);emissionPixels(pixels.data);c.putImageData(pixels,0,0);
  return canvas;
 }catch{return image;}
}

export class FlipbookSet {
 private atlases=new Map<FlipbookId,Atlas>();private requested=false;private disposed=false;
 load(root=''){
  if(this.requested||typeof Image==='undefined')return;this.requested=true;
  for(const id of FLIPBOOK_IDS)void (async()=>{
   try{
    const r=await fetch(`${root}/vfx/v9/${id}.json`);if(!r.ok)return;
    const meta=await r.json() as {frames?:number;cols?:number;columns?:number;cell?:number|number[];cellSize?:number;blend?:string;loop?:boolean;fps?:number};
    const image=new Image();image.decoding='async';image.src=`${root}/vfx/v9/${id}.webp`;await image.decode();
    if(this.disposed)return;
    const additive=meta.blend?meta.blend==='additive':BLEND[id].additive;
    const source=additive?emissionToAlpha(image):image;
    const frames=Math.max(1,meta.frames??1),cols=Math.max(1,meta.cols??meta.columns??4),cell=(Array.isArray(meta.cell)?meta.cell[0]:meta.cell)??meta.cellSize??512;
    this.atlases.set(id,{image:source,frames,cols,cell,additive,loop:meta.loop??BLEND[id].loop,fps:meta.fps??30});
   }catch{/* procedural stays */}
  })();
 }
 has(id:FlipbookId){return this.atlases.has(id);}
 /** Draw `id` at progress u (0..1 one-shot, or seconds for loops when loopSeconds is set). */
 drawAt(c:CanvasRenderingContext2D,id:FlipbookId,x:number,y:number,size:number,u:number,opts:{sy?:number;alpha?:number;loopFps?:number;rotate?:number}={}){
  const a=this.atlases.get(id);if(!a)return false;
  const frame=a.loop?u*(opts.loopFps??a.fps):u*(a.frames-1);
  const cell=flipbookCell(frame,a.frames,a.cols,a.cell,a.loop),half=.5;
  c.save();c.globalCompositeOperation=a.additive?'lighter':'source-over';c.globalAlpha*=opts.alpha??1;
  c.translate(x,y);if(opts.rotate)c.rotate(opts.rotate);c.scale(1,opts.sy??1);
  c.drawImage(a.image,cell.x+half,cell.y+half,cell.size-1,cell.size-1,-size/2,-size/2,size,size);
  c.restore();return true;
 }
 /** Shared beats placed by the painter's frame (kept here so atlases stay optional). */
 draw(_c:CanvasRenderingContext2D,_f:unknown){/* set pieces call drawAt directly */}
 dispose(){this.disposed=true;this.atlases.clear();}
}
