/**
 * Optional CXV Blender flipbooks (/vfx/v9/<id>.webp + .json): 512 px cells,
 * four columns, row-major, centre anchor. Additive atlases are RGB emission on
 * black ('lighter'); smoke is straight RGBA. Missing atlases simply stay absent
 * and the painter keeps its procedural version.
 */
export type FlipbookId='impact-core'|'shockwave-ring'|'smoke-embers'|'lantern-dome'|'tea-clover'|'comet-loop'|'fire-dome'|'rune-circle';
interface Atlas {image:HTMLImageElement;frames:number;cols:number;cell:number;additive:boolean;loop:boolean}
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

export class FlipbookSet {
 private atlases=new Map<FlipbookId,Atlas>();private requested=false;private disposed=false;
 load(root=''){
  if(this.requested||typeof Image==='undefined')return;this.requested=true;
  for(const id of FLIPBOOK_IDS)void (async()=>{
   try{
    const r=await fetch(`${root}/vfx/v9/${id}.json`);if(!r.ok)return;
    const meta=await r.json() as {frames?:number;cols?:number;columns?:number;cell?:number;cellSize?:number;blend?:string;loop?:boolean};
    const image=new Image();image.decoding='async';image.src=`${root}/vfx/v9/${id}.webp`;await image.decode();
    if(this.disposed)return;
    const frames=Math.max(1,meta.frames??1),cols=Math.max(1,meta.cols??meta.columns??4),cell=meta.cell??meta.cellSize??512;
    this.atlases.set(id,{image,frames,cols,cell,additive:meta.blend?meta.blend==='additive':BLEND[id].additive,loop:meta.loop??BLEND[id].loop});
   }catch{/* procedural stays */}
  })();
 }
 has(id:FlipbookId){return this.atlases.has(id);}
 /** Draw `id` at progress u (0..1 one-shot, or seconds for loops when loopSeconds is set). */
 drawAt(c:CanvasRenderingContext2D,id:FlipbookId,x:number,y:number,size:number,u:number,opts:{sy?:number;alpha?:number;loopFps?:number;rotate?:number}={}){
  const a=this.atlases.get(id);if(!a)return false;
  const frame=a.loop?u*(opts.loopFps??30):u*(a.frames-1);
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
