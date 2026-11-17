import avifUrl from '../../../../../../assets/cardrpg-look/stage/painted-cafe-c11-v1.avif?url';
import webpUrl from '../../../../../../assets/cardrpg-look/stage/painted-cafe-c11-v1.webp?url';

export const stagePaintingUrl=avifUrl;
let source:Promise<HTMLImageElement>|undefined;

async function decode(url:string){
 const image=new Image();
 if(typeof image.decode==='function'){image.src=url;await image.decode();}
 else await new Promise<void>((resolve,reject)=>{
  image.onload=()=>resolve();image.onerror=()=>reject(new Error('Cafe painting unavailable'));image.src=url;
 });
 if(image.naturalWidth!==1774||image.naturalHeight!==887)throw new Error('Unexpected cafe painting dimensions');
 return image;
}

/** Shared decode; a bad optional sibling retries the original before reporting failure. */
export function loadStagePainting(){
 return source??=(async()=>{
  try{return await decode(avifUrl);}catch{return await decode(webpUrl);}
 })().catch((error:unknown)=>{source=undefined;throw error;});
}
