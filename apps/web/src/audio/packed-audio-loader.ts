import shippedGroups from './packed-audio-index.json';

export interface AudioPackage {url:string;integrity:string;paths:readonly string[];}
interface PackageBody {version:1;files:Record<string,string>;}

/** Transport only: each extracted buffer contains the unchanged encoded source file. */
export class PackedAudioLoader {
 private enabled=new Set<AudioPackage>();
 private packages=new Map<AudioPackage,Promise<PackageBody|undefined>>();
 private byPath=new Map<string,AudioPackage>();
 constructor(private groups:readonly AudioPackage[]=shippedGroups,private timeoutMs=2000){
  for(const group of groups)for(const path of group.paths)this.byPath.set(path,group);
 }
 /** Never pull a package containing a sound outside this existing preload boundary. */
 allow(paths:readonly string[]){
  const requested=new Set(paths);
  for(const group of this.groups)if(group.paths.every(path=>requested.has(path)))this.enabled.add(group);
 }
 available(path:string){const group=this.byPath.get(path);return !!group&&this.enabled.has(group);}
 private load(group:AudioPackage):Promise<PackageBody|undefined>{
  if(!this.packages.has(group))this.packages.set(group,(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);
   try{
    const response=await fetch(group.url,{integrity:group.integrity,signal:controller.signal});
    if(!response.ok)return;
    const body=await response.json() as Partial<PackageBody>;
    if(body.version!==1||!body.files||typeof body.files!=='object'||Array.isArray(body.files))return;
    if(!group.paths.every(path=>typeof body.files![path]==='string'))return;
    return body as PackageBody;
   }catch{return;}finally{clearTimeout(timer);}
  })());
  return this.packages.get(group)!;
 }
 async decode<T>(path:string,decode:(bytes:ArrayBuffer)=>Promise<T>):Promise<T|undefined>{
  const group=this.byPath.get(path);if(!group||!this.enabled.has(group))return;
  try{
   const body=await this.load(group);if(!body)return;
   const binary=atob(body.files[path]!),bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   // decodeAudioData can detach its input. Never reuse a previously decoded buffer.
   return await decode(bytes.buffer);
  }catch{return;}
 }
}
