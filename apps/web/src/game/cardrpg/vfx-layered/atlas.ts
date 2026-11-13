export interface PackedPaint {
 image:HTMLImageElement;
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
