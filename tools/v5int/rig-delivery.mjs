/** Build a small allowlist from delivered siblings; originals remain the fallback. */
import {readdir,access,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'../..'),directory=resolve(root,'apps/web/public/units'),manifest={};
for(const unit of (await readdir(directory,{withFileTypes:true})).filter(entry=>entry.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
 for(const file of (await readdir(resolve(directory,unit.name))).sort()){
  if(!/^rig-(?:depth|page-\d+)\.webp$/.test(file))continue;
  const png=file.replace(/\.webp$/,'.png'),path=resolve(directory,unit.name,file);
  try{await access(resolve(directory,unit.name,png));}catch{continue;}
  const {width,height}=await sharp(path).metadata();
  const preferred=async(name)=>{
   const original=resolve(directory,unit.name,name),alternative=original.replace(/\.webp$/,'.avif');
   const metadata=await sharp(original).metadata();
   try{
    const [before,after,other]=await Promise.all([stat(original),stat(alternative),sharp(alternative).metadata()]);
    if(after.size<before.size*.8&&other.width===metadata.width&&other.height===metadata.height)return{url:`/units/${unit.name}/${name.replace(/\.webp$/,'.avif')}`,width:other.width,height:other.height};
   }catch{/* Only delivered and dimension-matched siblings are selected. */}
   return{url:`/units/${unit.name}/${name}`,width:metadata.width,height:metadata.height};
  };
  const entry=await preferred(file);
  const half=file.replace(/\.webp$/,'.half.webp');
  try{
   entry.half=await preferred(half);
  }catch{/* Most atlas pages intentionally have no reduced sibling. */}
  manifest[`/units/${unit.name}/${png}`]=entry;
 }
}
const target=resolve(root,'apps/web/src/game/cardrpg/spine/native-rig-manifest-loader.json');
await writeFile(target,JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({nativeRigPages:Object.keys(manifest).length,target}));
