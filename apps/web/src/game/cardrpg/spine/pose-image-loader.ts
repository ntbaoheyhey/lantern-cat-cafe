import deliveries from './pose-manifest-loader.json';
import {loadAtlasImage} from './atlas-delivery';

const byUrl:Record<string,{avif:string}>=deliveries;
/** Keep authored pose pixels as the fallback for unsupported or malformed AVIF. */
export async function loadPoseImage(url:string,width:number,height:number):Promise<HTMLImageElement>{
 const delivery=byUrl[url];
 return (await loadAtlasImage(url,delivery?{url:delivery.avif,width,height}:undefined)).image;
}
