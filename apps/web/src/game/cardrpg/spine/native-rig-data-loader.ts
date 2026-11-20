import type {CutoutData} from '../../rig/cutout';
import manifest from './native-rig-data-manifest-loader.json';
import {decodeNativeRigData,isNativeRigDictionary} from './native-rig-data-codec';

type Delivery={url:string;integrity:string};
const units:Readonly<Record<string,Delivery>>=manifest.units;
let dictionary:Promise<unknown>|undefined;

async function fetchDelivery(delivery:Delivery):Promise<unknown> {
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),2000);
 try{
  const response=await fetch(delivery.url,{integrity:delivery.integrity,signal:controller.signal});
  if(!response.ok)throw Error(`Rig delivery HTTP ${response.status}`);
  return await response.json();
 }finally{clearTimeout(timeout);}
}

function sharedDictionary():Promise<unknown> {
 return dictionary??=(async()=>{
  try{
   const data=await fetchDelivery(manifest.shared);
   if(!isNativeRigDictionary(data))throw Error('Invalid rig dictionary');
   return data;
  }catch(error){dictionary=undefined;throw error;}
 })();
}

/** Only allowlisted drawn enemies share data; every failure retains the original complete rig. */
export async function loadNativeRigData(id:string,deferPixels=false):Promise<CutoutData> {
 const delivery=deferPixels&&Object.hasOwn(units,id)?units[id]:undefined;
 if(delivery){
  try{
   const [unit,shared]=await Promise.all([fetchDelivery(delivery),sharedDictionary()]);
   return decodeNativeRigData(unit,shared,id);
  }catch{/* Original JSON is the recovery path, with the existing error semantics below. */}
 }
 const response=await fetch(`/units/${id}/rig.json`);
 if(!response.ok)throw Error(`Native rig ${id}: HTTP ${response.status}`);
 return await response.json() as CutoutData;
}
