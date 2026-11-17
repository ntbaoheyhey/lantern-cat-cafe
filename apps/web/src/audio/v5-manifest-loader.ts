import {resolveDesign,type AudioManifest,type Bus,type CueDesign,type Sample} from './cues';

interface Delivery {
 opus:string;m4a:string;durationSeconds:number;gainDb:number;bus:Bus;
 runtimeCueId:string;aliases?:string[];variantId?:string;loop?:boolean;
}
const path=(value:unknown,extension:string):value is string=>typeof value==='string'
 &&value.startsWith('/audio/v5/')&&!value.includes('..')&&new RegExp(`^[\\w/.-]+\\.${extension}$`).test(value);
function valid(value:unknown):value is Delivery {
 if(!value||typeof value!=='object')return false;
 const d=value as Delivery;
 return path(d.opus,'opus')&&path(d.m4a,'m4a')&&Number.isFinite(d.durationSeconds)
  &&d.durationSeconds>0&&d.durationSeconds<=20&&Number.isFinite(d.gainDb)
  &&d.gainDb>=-24&&d.gainDb<=12&&['sfx','ui','voice','ambience'].includes(d.bus)
  &&typeof d.runtimeCueId==='string';
}

/** Preserve scheduled contacts and baked variant identities; delivery offsets are descriptive only. */
export function applyV5Audio(base:AudioManifest,input:unknown):AudioManifest {
 if(!input||typeof input!=='object'||Array.isArray(input))return base;
 // Exact per-variant slices have no cue alias or gain override in the delivery.
 const rows=Object.entries(input).flatMap(([id,value]):Array<[string,Delivery]>=>
  (Array.isArray(value)?value:[value]).flatMap((item):Array<[string,Delivery]>=>{
   if(!item||typeof item!=='object'||Array.isArray(item))return [];
   const raw=item as Partial<Delivery>;
   const delivery={...raw,gainDb:raw.gainDb===undefined?0:raw.gainDb,
    runtimeCueId:raw.runtimeCueId===undefined?id:raw.runtimeCueId};
   return valid(delivery)?[[typeof delivery.variantId==='string'?delivery.variantId:id,delivery]]:[];
  }));
 if(!rows.length)return base;
 const byId=new Map(rows),packs={...base.packs},substitutions=new Map<string,Set<string>>();
 const packFor=(d:Delivery)=>{
  const key=`v5:${d.opus.slice('/audio/v5/'.length,-5)}`;
  packs[key]={opus:d.opus,m4a:d.m4a,preferredFormat:'opus'};
  return key;
 };
 const sample=(s:Sample):Sample=>{
  if(!/^(?:v4-ranged-|cat-|callout-)/.test(s.pack))return s;
  const d=byId.get(s.variantId??'');
  const next=d&&(/\/(?:legacy|voice)\//.test(d.opus))&&d.bus===s.bus&&d.durationSeconds+.02>=s.duration
   ?{...s,pack:packFor(d),start:0,gainDb:d.gainDb}:s;
  const set=substitutions.get(s.pack)??new Set<string>();set.add(next.pack);substitutions.set(s.pack,set);
  return next;
 };
 const designs=Object.fromEntries(Object.entries(base.designs??{}).map(([id,d])=>[id,{
  ...d,...(d.baked?{baked:d.baked.map(v=>({...v,sample:sample(v.sample)}))}:{})
 }]));
 const cues=Object.fromEntries(Object.entries(base.cues).map(([id,samples])=>[id,samples.map(sample)]));
 const deliveredDesigns:Record<string,CueDesign>={},deliveredPacks=new Set<string>();
 for(const [id,d] of rows){
  if(d.opus.includes('/legacy/')||d.opus.includes('/voice/')&&d.variantId)continue;
  const pack=packFor(d);if(d.bus==='sfx'||d.bus==='ui')deliveredPacks.add(pack);
  const keys=[id,d.runtimeCueId,...(Array.isArray(d.aliases)?d.aliases.filter(a=>typeof a==='string'):[])];
  for(const key of keys){
   // Ranged aliases must keep their complete baked variant pool above.
   if(key.startsWith('kit.ranged-'))continue;
   const prior=resolveDesign(key,base);
   deliveredDesigns[key]={bus:d.bus,pitchRange:prior?.pitchRange??[1,1],gainRange:prior?.gainRange??[0,0],
    cooldownMs:prior?.cooldownMs??30,priority:prior?.priority??40,ducking:prior?.ducking,
    layers:[{role:'authored',eq:'flat',offsetMs:0,gainDb:d.gainDb,
     variants:[{pack,start:0,duration:d.durationSeconds,bus:d.bus,enveloped:true,variantId:id,...(d.loop?{loop:true}:{})}]}]};
  }
 }
 const receipt=deliveredDesigns['tx.confirmed'];
 if(receipt)substitutions.set('v4-receipt',new Set(receipt.layers.flatMap(l=>l.variants.map(s=>s.pack))));
 return {...base,packs,cues,designs,deliveredDesigns,deliveredPacks:[...deliveredPacks],
  packSubstitutions:Object.fromEntries([...substitutions].map(([key,values])=>[key,[...values]]))};
}

/** Missing optional deliveries leave the original complete manifest usable. */
export async function loadV5AudioManifest(base:AudioManifest,url:(path:string)=>string):Promise<AudioManifest>{
 try{
  const response=await fetch(url('/audio/v5/manifest.json'));
  return response.ok?applyV5Audio(base,await response.json()):base;
 }catch{return base;}
}
