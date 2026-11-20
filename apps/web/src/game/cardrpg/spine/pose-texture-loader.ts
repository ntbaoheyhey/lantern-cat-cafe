import {Texture} from 'three';
import {loadPoseImage} from './pose-image-loader';

/** Preserve authored UV geometry and the original-image decode fallback. */
export async function loadPoseTexture(url:string,width:number,height:number):Promise<Texture>{
 const texture=new Texture(await loadPoseImage(url,width,height));
 texture.needsUpdate=true;
 return texture;
}
