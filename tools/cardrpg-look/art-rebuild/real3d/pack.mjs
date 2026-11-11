/** Ship only clean authored cages. Decode, bound-check and keep skin/clip contracts. */
import {createRequire} from 'node:module';
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {manifest,measure} from './scale-check.mjs';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const {NodeIO}=require('@gltf-transform/core'),{ALL_EXTENSIONS}=require('@gltf-transform/extensions');
const {dedup,prune,resample,meshopt,textureCompress}=require('@gltf-transform/functions');
const {MeshoptEncoder,MeshoptDecoder}=require('meshoptimizer'),sharp=require('sharp');
const [id,source,dest]=process.argv.slice(2);if(!id||!source||!dest)throw Error('id source destination required');
const unit=manifest.units.find(u=>u.id===id);if(!unit)throw Error('unknown unit '+id);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const document=await io.read(resolve(source));const before=measure(document,unit);
await document.transform(resample(),dedup(),prune({keepAttributes:true,keepLeaves:true}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:92}),meshopt({encoder:MeshoptEncoder,level:'medium'}));
await mkdir(dirname(resolve(dest)),{recursive:true});await io.write(resolve(dest),document);
const decoded=await io.read(resolve(dest)),after=measure(decoded,unit),bytes=(await stat(dest)).size;
const receipt={id,source:resolve(source),dest:resolve(dest),before,after,bytes,skins:decoded.getRoot().listSkins().length,clips:decoded.getRoot().listAnimations().map(a=>a.getName()),accepted:false};
await writeFile(dest+'.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));
