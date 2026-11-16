/** Sampled pages are explicitly lossy; the established page remains a decode fallback. */
export interface SampledAtlas {url:string;width:number;height:number;alphaEncoding?:string}
export interface LoadedAtlasImage {image:HTMLImageElement;sampled:boolean;alphaEncoding?:'straight'}
interface DecodeHooks {track?:(image:HTMLImageElement,pending:boolean)=>void;aborted?:()=>boolean}

export async function loadAtlasImage(fallbackUrl:string,sampled?:SampledAtlas,hooks:DecodeHooks={}):Promise<LoadedAtlasImage>{
 const decode=async(url:string,expected?:SampledAtlas)=>{
  const image=new Image();hooks.track?.(image,true);
  try{
   image.src=url;await image.decode();
   if(expected&&(image.naturalWidth!==expected.width||image.naturalHeight!==expected.height))throw Error('Unexpected sampled atlas dimensions');
   return image;
  }finally{hooks.track?.(image,false);}
 };
 if(sampled){try{
  const image=await decode(sampled.url,sampled);
  return {image,sampled:true,alphaEncoding:sampled.alphaEncoding==='straight'?'straight':undefined};
 }catch(error){if(hooks.aborted?.())throw error;}}
 // Source metadata still applies when decoding or dimension validation failed.
 return {image:await decode(fallbackUrl),sampled:false};
}
