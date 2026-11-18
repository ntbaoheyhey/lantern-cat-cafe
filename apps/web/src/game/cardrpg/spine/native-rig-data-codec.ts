import type {CutoutData} from '../../rig/cutout';

type Json = null | boolean | string | number | Json[] | {[key:string]:Json};
const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);

export function isNativeRigDictionary(value:unknown):value is {version:1;entries:unknown[]} {
 return object(value)&&value.version===1&&Array.isArray(value.entries)&&value.entries.length<=4096;
}

/** Restore the complete JSON tree. References save transport bytes, never create shared pose data. */
export function decodeNativeRigData(unit:unknown,dictionary:unknown,id:string):CutoutData {
 if(!object(unit)||unit.version!==1||unit.id!==id||!Object.hasOwn(unit,'data'))throw Error('Invalid packed rig identity');
 if(!isNativeRigDictionary(dictionary))throw Error('Invalid packed rig dictionary');
 const entries=dictionary.entries,active=new Set<number>();let visited=0;
 function expand(value:unknown,depth=0):Json {
  if(++visited>250000||depth>64)throw Error('Packed rig expansion exceeds bounds');
  if(value===null||typeof value==='string'||typeof value==='boolean')return value;
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid packed rig number');return value;}
  if(Array.isArray(value))return value.map(item=>expand(item,depth+1));
  if(!object(value))throw Error('Invalid packed rig value');
  const keys=Object.keys(value);
  if(Object.hasOwn(value,'$')){
   const index=value.$;
   if(keys.length!==1||typeof index!=='number'||!Number.isInteger(index)||index<0||index>=entries.length||active.has(index))throw Error('Invalid packed rig reference');
   active.add(index);
   try{return expand(entries[index],depth+1);}finally{active.delete(index);}
  }
  // Object.fromEntries defines own properties, including an ordinary JSON __proto__ key.
  return Object.fromEntries(keys.map(key=>[key,expand(value[key],depth+1)]));
 }
 const data=expand(unit.data);
 if(!object(data)||data.format!=='taskbar-cutout-v1'||!Array.isArray(data.nodes)||!Array.isArray(data.parts)||!data.parts.length||!Array.isArray(data.pages)||!object(data.clips))throw Error('Invalid expanded native rig');
 return data as unknown as CutoutData;
}
