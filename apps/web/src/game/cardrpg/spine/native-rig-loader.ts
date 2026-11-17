import manifest from './native-rig-manifest-loader.json';
import type {SampledAtlas} from './atlas-delivery';

const deliveries:Readonly<Record<string,SampledAtlas&{half?:SampledAtlas}>>=manifest;
/** Only published siblings are requested; loadAtlasImage retains decode fallback. */
export function nativeRigDelivery(path:string):SampledAtlas|undefined{
 const delivery=deliveries[path];
 return delivery?.half??delivery;
}
