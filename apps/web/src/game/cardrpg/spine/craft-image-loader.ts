import deliveries from './craft-manifest-loader.json';
import {loadAtlasImage,type SampledAtlas} from './atlas-delivery';
const byUrl:Record<string,SampledAtlas>=deliveries;
/** Same authored dimensions, colors and UVs; original pixels remain the decode fallback. */
export async function loadCraftImage(url:string):Promise<HTMLImageElement>{
 return (await loadAtlasImage(url,byUrl[url])).image;
}
