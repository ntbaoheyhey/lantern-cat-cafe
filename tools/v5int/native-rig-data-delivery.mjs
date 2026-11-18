/** Deterministic exact-data derivatives; never edit the original native rig JSON. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {decodeNativeRigData} from '../../apps/web/src/game/cardrpg/spine/native-rig-data-codec.ts';

const root=resolve(import.meta.dirname,'../..'),check=process.argv[2]==='--check';
assert(process.argv.length===3&&(check||process.argv[2]==='--write'),'Use --write or --check');
const ids=['button-guard','sock-skipper','teacup-healer','needle-moth','kettle-knight','spool-ram','pollen-scout','crumb-sentinel','yarn-giant','binding-thread'];
const originals=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await readFile(resolve(root,`apps/web/public/units/${id}/rig.json`))])));
const sources=Object.fromEntries(ids.map(id=>[id,JSON.parse(originals[id])]));
const counts=new Map();
function count(value){
 if(!value||typeof value!=='object')return;
 assert(!Object.hasOwn(value,'$'),'Original rig contains reserved reference key');
 const text=JSON.stringify(value);if(text.length>=300)counts.set(text,(counts.get(text)||0)+1);
 Object.values(value).forEach(count);
}
Object.values(sources).forEach(count);
const entries=[],indexes=new Map();
function pack(value){
 if(!value||typeof value!=='object')return value;
 const text=JSON.stringify(value);
 if(counts.get(text)>1){
  if(indexes.has(text))return {$:indexes.get(text)};
  const index=entries.length;indexes.set(text,index);entries.push(null);entries[index]=visit(value);return {$:index};
 }
 return visit(value);
}
function visit(value){return Array.isArray(value)?value.map(pack):Object.fromEntries(Object.entries(value).map(([key,item])=>[key,pack(item)]));}
const packed=Object.fromEntries(ids.map(id=>[id,{version:1,id,data:pack(sources[id])}]));
const dictionary={version:1,entries};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function emit(prefix,value){
 const bytes=Buffer.from(JSON.stringify(value)+'\n'),digest=sha(bytes),url=`${prefix}-${digest.slice(0,16)}.json`,path=resolve(root,'apps/web/public'+url);
 if(check)assert.deepEqual(await readFile(path),bytes,'Stale rig delivery '+url);
 else{await mkdir(dirname(path),{recursive:true});await writeFile(path,bytes);}
 return{url,integrity:'sha256-'+Buffer.from(digest,'hex').toString('base64'),bytes:bytes.length,gzipBytes:gzipSync(bytes).length};
}
const shared=await emit('/rig-delivery/shared',dictionary),units={},rows=[];
for(const id of ids){
 // Include the actual JSON serialization boundary in the exact-value gate.
 const restored=decodeNativeRigData(JSON.parse(JSON.stringify(packed[id])),JSON.parse(JSON.stringify(dictionary)),id);
 assert.deepEqual(restored,sources[id],`Full rig differs: ${id}`);
 assert.equal(JSON.stringify(restored),JSON.stringify(sources[id]),`Object property order differs: ${id}`);
 const delivered=await emit(`/units/${id}/rig-shared`,packed[id]);
 units[id]={url:delivered.url,integrity:delivered.integrity,sourceSha256:sha(originals[id])};
 rows.push({id,sourceBytes:originals[id].length,sourceGzipBytes:gzipSync(originals[id]).length,...delivered});
}
const manifest={version:1,shared:{url:shared.url,integrity:shared.integrity},units};
const manifestPath=resolve(root,'apps/web/src/game/cardrpg/spine/native-rig-data-manifest-loader.json'),bytes=Buffer.from(JSON.stringify(manifest,null,2)+'\n');
if(check)assert.deepEqual(await readFile(manifestPath),bytes,'Stale native rig data manifest');else await writeFile(manifestPath,bytes);
for(const id of ids)assert.equal(sha(await readFile(resolve(root,`apps/web/public/units/${id}/rig.json`))),sha(originals[id]));
console.log(JSON.stringify({mode:check?'verified':'written',rigs:ids.length,entries:entries.length,shared,rows,manifestSha256:sha(bytes),exactFullTrees:true}));
