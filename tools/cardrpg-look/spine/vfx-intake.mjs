/** Designer VFX intake, independent of the character bone/animation contract. */
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';import{resolve,dirname}from'node:path';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
import{ROOT,CONFIG,Spine,safeRead,pngSize,readSlots}from'./validate.mjs';
const sockets=['feet','vfxOrigin','mainHand','offHand','head','chest'];
export async function validateVfx(folder,id){
 const issues=[],files=new Map();let spec;
 const read=async name=>{const bytes=await safeRead(folder,name);files.set(name,bytes);return bytes;};
 try{
  spec=JSON.parse(await read('effect.json'));
  if(spec.id!==id||!['sequence','spine'].includes(spec.format))throw Error('Effect ID/format mismatch');
  if(!sockets.includes(spec.socket)||!['cast','hit'].includes(spec.cue))throw Error('Specify a supported socket and cast/hit event');
  if(![spec.width,spec.height,spec.scale].every(n=>Number.isFinite(n)&&n>0)||spec.width*spec.scale>2048||spec.height*spec.scale>2048)throw Error('Effect bounds/scale must be positive and at most2048units');
  if(spec.format==='sequence'){
   if(!Array.isArray(spec.frames)||!spec.frames.length||spec.frames.length>180||!Number.isFinite(spec.fps)||spec.fps<1||spec.fps>60)throw Error('Need1–180PNGframes at1–60fps');
   let dimensions;
   for(const name of spec.frames){if(typeof name!=='string'||!name.endsWith('.png'))throw Error(`Effect frame needs a .png filename: ${name}`);const size=pngSize(await read(name),name);if(dimensions&&size.some((n,i)=>n!==dimensions[i]))throw Error('Frames need equal dimensions');dimensions=size;}
   if(Math.abs(dimensions[0]/dimensions[1]-spec.width/spec.height)>.01)throw Error('Frame aspect must match effect bounds');
   if(spec.frames.length/spec.fps>10)throw Error('Effect must be at most10seconds');
  }else{
   if(typeof spec.skeleton!=='string'||!(/\.(json|skel)$/.test(spec.skeleton)))throw Error('Effect skeleton needs a .json or .skel filename');
   if(typeof spec.atlas!=='string'||!spec.atlas.endsWith('.atlas'))throw Error('Effect atlas needs an .atlas filename');
   const atlas=new Spine.TextureAtlas((await read(spec.atlas)).toString('utf8'));if(!atlas.pages.length)throw Error('Empty atlas');
   for(const page of atlas.pages){if(!page.name.endsWith('.png'))throw Error(`Effect atlas page needs a .png filename: ${page.name}`);const name=dirname(spec.atlas)==='.'?page.name:dirname(spec.atlas)+'/'+page.name,size=pngSize(await read(name),name);if(size[0]!==page.width||size[1]!==page.height)throw Error('Atlas/PNG mismatch');page.setTexture(new Spine.FakeTexture({width:size[0],height:size[1]}));if(!page.pma)issues.push({severity:'WARN',message:'Straight alpha is premultiplied by the loader'});}
   const reader=spec.skeleton.endsWith('.skel')?new Spine.SkeletonBinary(new Spine.AtlasAttachmentLoader(atlas)):new Spine.SkeletonJson(new Spine.AtlasAttachmentLoader(atlas));
   const bytes=await read(spec.skeleton),data=reader.readSkeletonData(spec.skeleton.endsWith('.skel')?new Uint8Array(bytes):JSON.parse(bytes));
   if(data.version?.split('.').slice(0,2).join('.')!==CONFIG.runtimeVersion)throw Error('Spine version mismatch');
   const clip=data.animations.find(a=>a.name===(spec.animation??'effect'));if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0||clip.duration>10)throw Error('Need a nonempty finite effect animation <=10seconds');
   for(const bone of data.bones)if(![bone.x,bone.y,bone.rotation,bone.scaleX,bone.scaleY].every(Number.isFinite))throw Error('Nonfinite effect bone');
   const skeleton=new Spine.Skeleton(data);skeleton.updateWorldTransform(Spine.Physics.update);const bounds=skeleton.getBoundsRect();
   if(![bounds.x,bounds.y,bounds.width,bounds.height].every(Number.isFinite)||bounds.width<=0||bounds.height<=0)throw Error('Invalid measured effect bounds');
   if(bounds.x < -spec.width/2-1||bounds.y < -spec.height/2-1||bounds.x+bounds.width > spec.width/2+1||bounds.y+bounds.height > spec.height/2+1)throw Error('Effect must fit its declared centered bounds');
   if(data.bones.length>40)issues.push({severity:'WARN',message:'Effect exceeds40bones'});
  }
 }catch(error){issues.push({severity:'FIX',message:String(error.message??error)});}
 return{accepted:!issues.some(i=>i.severity==='FIX'),issues,spec,files};
}
export async function intakeVfx({id,folder,root=ROOT,install=false}){
 const slots=await readSlots();if(!slots.units.some(u=>u.skills.some(s=>s.id===id)))throw Error('Unknown skill ID');
 const result=await validateVfx(folder,id);if(result.accepted&&install){
  const hash=createHash('sha256');for(const[name,bytes]of [...result.files].sort(([a],[b])=>a.localeCompare(b))){hash.update(name+'\0');hash.update(bytes);}const revision=hash.digest('hex');
  const relative=`assets/cardrpg-look/vfx-designer/${id.replaceAll(':','-')}/accepted/${revision.slice(0,16)}`;
  for(const[name,bytes]of result.files){const path=resolve(root,relative,name);await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);}
  const registryFile=resolve(root,'assets/cardrpg-look/vfx-designer/registry.json');const registry=JSON.parse(await readFile(registryFile,'utf8'));
  const spec={...result.spec,revision};delete spec.id;if(spec.frames)spec.frames=spec.frames.map(name=>relative+'/'+name);if(spec.skeleton)spec.skeleton=relative+'/'+spec.skeleton;if(spec.atlas)spec.atlas=relative+'/'+spec.atlas;
  registry.effects[id]=spec;await writeFile(registryFile+'.tmp',JSON.stringify(registry,null,2)+'\n');await rename(registryFile+'.tmp',registryFile);
 }
 return{accepted:result.accepted,issues:result.issues,spec:result.spec,files:[...result.files.keys()],installed:result.accepted&&install};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const[id,folder]=process.argv.slice(2);const result=await intakeVfx({id,folder,install:process.argv.includes('--install')});console.log(JSON.stringify(result,null,2));process.exitCode=result.accepted?0:1;}
