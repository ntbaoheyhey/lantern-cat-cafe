import {V5_SKILL_TIMELINES} from '../vfx-layered/skill-timeline';
import {getV5Texture,registerV5Texture} from '../vfx-layered/skill-textures';

interface Entry {file:string;cols:number;rows:number;frameMs:number;blend?:'add'|'screen'|'normal'}
function valid(value:unknown):value is Entry {
 if(!value||typeof value!=='object')return false;
 const row=value as Entry;
 return typeof row.file==='string'&&/^[a-zA-Z0-9_/-]+\.(?:webp|png|avif)$/.test(row.file)
  &&!row.file.startsWith('/')&&!row.file.includes('..')
  &&[row.cols,row.rows].every(n=>Number.isInteger(n)&&n>0&&n<=16)
  &&Number.isFinite(row.frameMs)&&row.frameMs>0&&row.frameMs<=1000
  &&(row.blend===undefined||['add','screen','normal'].includes(row.blend));
}
let manifest:Promise<Record<string,unknown>|undefined>|undefined;
const pending=new Map<string,Promise<void>>();
function loadManifest(){
 return manifest??=fetch('/vfx/v5/manifest.json',{signal:AbortSignal.timeout(3000)})
  .then(async response=>{
   if(!response.ok)throw Error('Optional V5 manifest unavailable');
   const value:unknown=await response.json();
   if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid optional V5 manifest');
   return value as Record<string,unknown>;
  }).catch(()=>{manifest=undefined;return undefined;});
}

/** Prepare only this actor's timeline textures. Every failure retains procedural rendering. */
export async function loadV5Textures(owner:string):Promise<void>{
 const keys=new Set([...V5_SKILL_TIMELINES.values()].filter(row=>row.owner===owner).flatMap(row=>row.layers.map(layer=>layer.texture)));
 if(!keys.size)return;
 const entries=await loadManifest();if(!entries)return;
 await Promise.all([...keys].map(key=>{
  if(getV5Texture(key))return;
  const row=entries[key];if(!valid(row))return;
  const cached=pending.get(key);if(cached)return cached;
  const request=(async()=>{
   const image=new Image();let timer:ReturnType<typeof setTimeout>|undefined;
   try{
    image.src='/vfx/v5/'+row.file;
    await Promise.race([image.decode(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('Optional texture timeout')),3000);})]);
    registerV5Texture(key,{image,width:image.naturalWidth,height:image.naturalHeight,cols:row.cols,rows:row.rows,frameMs:row.frameMs,blend:row.blend});
   }catch{image.src='';}finally{clearTimeout(timer);}
  })().finally(()=>pending.delete(key));
  pending.set(key,request);return request;
 }));
}
