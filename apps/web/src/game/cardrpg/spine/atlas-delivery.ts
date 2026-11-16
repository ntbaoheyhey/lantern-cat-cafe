/** Sampled pages are explicitly lossy; the established page remains a decode fallback. */
export interface SampledAtlas {url:string;width:number;height:number}
interface DecodeHooks {track?:(image:HTMLImageElement,pending:boolean)=>void;aborted?:()=>boolean}

export async function loadAtlasImage(fallbackUrl:string,sampled?:SampledAtlas,hooks:DecodeHooks={}):Promise<HTMLImageElement>{
 const decode=async(url:string,expected?:SampledAtlas)=>{
  const image=new Image();hooks.track?.(image,true);
  try{
   image.src=url;await image.decode();
   if(expected&&(image.naturalWidth!==expected.width||image.naturalHeight!==expected.height))throw Error('Unexpected sampled atlas dimensions');
   return image;
  }finally{hooks.track?.(image,false);}
 };
 if(sampled){try{return await decode(sampled.url,sampled);}catch(error){if(hooks.aborted?.())throw error;}}
 return decode(fallbackUrl);
}
