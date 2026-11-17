import {V5_SKILL_TIMELINES} from '../vfx-layered/skill-timeline';
import {getV5Texture,registerV5Texture} from '../vfx-layered/skill-textures';
import approved from './v5-approved-manifest-loader.json';
import delivery from './v5-avif-manifest-loader.json';

interface Entry {file:string;cols:number;rows:number;frameMs:number;blend?:'add'|'screen'|'normal';integrity:string}
interface Delivery {file:string;integrity:string;sourceIntegrity:string;width:number;height:number}
const safeFile=(file:unknown)=>typeof file==='string'&&/^[a-zA-Z0-9_/-]+\.(?:webp|png|avif)$/.test(file)&&!file.startsWith('/')&&!file.includes('..');
const safeIntegrity=(value:unknown)=>typeof value==='string'&&/^sha256-[A-Za-z0-9+/]{43}=$/.test(value);
function valid(value:unknown):value is Entry {
 if(!value||typeof value!=='object')return false;
 const row=value as Entry;
 return safeFile(row.file)
  &&[row.cols,row.rows].every(n=>Number.isInteger(n)&&n>0&&n<=16)
  &&Number.isFinite(row.frameMs)&&row.frameMs>0&&row.frameMs<=1000
  &&(row.blend===undefined||['add','screen','normal'].includes(row.blend))
  &&safeIntegrity(row.integrity);
}
function validDelivery(value:unknown,source:Entry):value is Delivery {
 if(!value||typeof value!=='object')return false;
 const row=value as Delivery;
 return safeFile(row.file)&&row.file.endsWith('.avif')&&safeIntegrity(row.integrity)&&row.sourceIntegrity===source.integrity
  &&[row.width,row.height].every(n=>Number.isInteger(n)&&n>0&&n<=8192)&&row.width%source.cols===0&&row.height%source.rows===0;
}
const entries:Readonly<Record<string,unknown>>=approved;
const deliveries:Readonly<Record<string,unknown>>=delivery;
const pending=new Map<string,Promise<void>>();

/** Both encodings are pinned. A failed derivative retries its approved original before procedural effects. */
export async function loadV5Textures(owner:string):Promise<void>{
 const keys=new Set([...V5_SKILL_TIMELINES.values()].filter(row=>row.owner===owner).flatMap(row=>row.layers.map(layer=>layer.texture)).filter(key=>Object.hasOwn(entries,key)));
 if(!keys.size)return;
 await Promise.all([...keys].map(key=>{
  if(getV5Texture(key))return;
  const row=entries[key];if(!valid(row))return;
  const cached=pending.get(key);if(cached)return cached;
  const request=(async()=>{
   const compact=deliveries[key],candidates=validDelivery(compact,row)?[compact,row]:[row];
   for(const candidate of candidates){
    const image=new Image();let timer:ReturnType<typeof setTimeout>|undefined,objectUrl:string|undefined;
    try{
     const response=await fetch('/vfx/v5/'+candidate.file,{integrity:candidate.integrity,signal:AbortSignal.timeout(3000)});
     if(!response.ok)throw Error('Optional approved texture unavailable');
     objectUrl=URL.createObjectURL(await response.blob());image.src=objectUrl;
     await Promise.race([image.decode(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Optional texture timeout')),3000);})]);
     if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth%row.cols||image.naturalHeight%row.rows)throw Error('Invalid approved sheet geometry');
     if('width'in candidate&&(image.naturalWidth!==candidate.width||image.naturalHeight!==candidate.height))throw Error('Changed delivery geometry');
     registerV5Texture(key,{image,width:image.naturalWidth,height:image.naturalHeight,cols:row.cols,rows:row.rows,frameMs:row.frameMs,blend:row.blend});
     return;
    }catch{image.src='';}finally{clearTimeout(timer);if(objectUrl)URL.revokeObjectURL(objectUrl);}
   }
  })().finally(()=>pending.delete(key));
  pending.set(key,request);return request;
 }));
}
