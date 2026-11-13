export interface PackedPaint {
 image:HTMLCanvasElement;
 x:number;y:number;width:number;height:number;
 sourceUrl:string;
}

/** Equal-sized source sheets pack without resampling or extra transparent area. */
export function atlasSlots(count:number,width:number,height:number,maxSize=4096){
 if(!Number.isInteger(count)||count<1||width<1||height<1||Math.max(width,height)>maxSize)throw Error('Invalid painted atlas geometry');
 const maxColumns=Math.floor(maxSize/width),maxRows=Math.floor(maxSize/height),capacity=maxColumns*maxRows;
 return Array.from({length:Math.ceil(count/capacity)},(_,page)=>{
  const length=Math.min(capacity,count-page*capacity);
  const choices=Array.from({length:Math.min(maxColumns,length)},(_,i)=>({cols:i+1,rows:Math.ceil(length/(i+1))})).filter(p=>p.rows<=maxRows);
  choices.sort((a,b)=>a.cols*a.rows-b.cols*b.rows||Math.abs(a.cols*width-a.rows*height)-Math.abs(b.cols*width-b.rows*height));
  const {cols,rows:usedRows}=choices[0]!;
  return {width:cols*width,height:usedRows*height,slots:Array.from({length},(_,i)=>({index:page*capacity+i,x:i%cols*width,y:Math.floor(i/cols)*height}))};
 });
}

/** Per-unit pages keep its basic, active, ultimate and passive paint on one surface. */
export async function packPaintSheets(entries:readonly {id:string;url:string}[],cancelled:()=>boolean){
 const result=new Map<string,PackedPaint>();
 if(!entries.length)return result;
 const first=new Image();first.src=entries[0]!.url;await first.decode();
 if(cancelled())return result;
 for(const layout of atlasSlots(entries.length,first.width,first.height)){
  const image=document.createElement('canvas');image.width=layout.width;image.height=layout.height;
  const c=image.getContext('2d')!;
  // Decode sequentially so the full set of 86 source sheets never sits in memory.
  for(const slot of layout.slots){
   if(cancelled()){image.width=image.height=1;return new Map<string,PackedPaint>();}
   const entry=entries[slot.index]!,source=slot.index===0?first:new Image();
   if(slot.index!==0){source.src=entry.url;await source.decode();}
   if(source.width!==first.width||source.height!==first.height)throw Error('Mismatched painted atlas sheet: '+entry.id);
   c.drawImage(source,slot.x,slot.y);
   result.set(entry.id,{image,x:slot.x,y:slot.y,width:source.width,height:source.height,sourceUrl:entry.url});
  }
 }
 return result;
}
