/** Lossless transport packages. Source audio, manifests and cue boundaries stay intact. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const root=resolve(import.meta.dirname,'../..'),publicRoot=resolve(root,'apps/web/public');
const require=createRequire(resolve(root,'apps/web/package.json'));
const check=process.argv.includes('--check');
assert(process.argv.slice(2).every(arg=>arg==='--check'),'Only --check is supported');
const hash=bytes=>createHash('sha256').update(bytes).digest();
const temp=await mkdtemp('/tmp/tbh-audio-delivery-');
try{
 const {build}=await import(require.resolve('vite'));
 await build({configFile:false,root,envDir:false,publicDir:false,logLevel:'silent',
  build:{outDir:temp,minify:false,lib:{entry:resolve(root,'apps/web/src/audio/v5-manifest-loader.ts'),formats:['es'],fileName:()=> 'loader.mjs'}}});
 const {applyV5Audio}=await import(pathToFileURL(resolve(temp,'loader.mjs')).href);
 const read=async path=>JSON.parse(await readFile(resolve(publicRoot,path),'utf8'));
 const manifest=applyV5Audio(await read('audio/manifest.json'),await read('audio/v5/manifest.json'));
 const definitions=Object.entries(manifest.packSubstitutions).filter(([key])=>/^b2-(hits|motion|magic|ui)$|^v4-ranged-/.test(key));
 // Authored sounds are considered only when the entire group is already requested.
 definitions.push(['authored-combat',manifest.deliveredPacks]);
 const used=new Set(),groups=[],evidence=[];
 for(const [name,ids] of definitions.sort(([a],[b])=>a.localeCompare(b))){
  const paths=[...new Set(ids.map(id=>manifest.packs[id]?.opus).filter(Boolean))].sort();
  if(paths.length<2)continue;
  const files={},sourceHashes={};let sourceBytes=0;
  for(const path of paths){
   assert(path.startsWith('/audio/v5/')&&!path.includes('..')&&path.endsWith('.opus'));
   assert(!used.has(path),`Overlapping semantic group: ${path}`);used.add(path);
   const bytes=await readFile(resolve(publicRoot,path.slice(1)));
   files[path]=bytes.toString('base64');sourceHashes[path]=hash(bytes).toString('hex');sourceBytes+=bytes.length;
  }
  const bytes=Buffer.from(JSON.stringify({version:1,files})),digest=hash(bytes);
  const url=`/audio-delivery/${name}.${digest.toString('hex').slice(0,16)}.json`;
  const target=resolve(publicRoot,url.slice(1));
  if(check)assert.deepEqual(await readFile(target),bytes,`Stale package: ${name}`);
  else{await mkdir(resolve(publicRoot,'audio-delivery'),{recursive:true});await writeFile(target,bytes);}
  groups.push({url,integrity:`sha256-${digest.toString('base64')}`,paths});
  evidence.push({name,url,files:paths.length,sourceBytes,jsonBytes:bytes.length,gzipBytes:gzipSync(bytes,{level:6}).length,sourceHashes});
 }
 const index=JSON.stringify(groups,null,2)+'\n',target=resolve(root,'apps/web/src/audio/packed-audio-index.json');
 if(check)assert.equal(await readFile(target,'utf8'),index,'Stale audio package index; run node tools/v5int/audio-delivery.mjs');
 else await writeFile(target,index);
 const evidenceRoot=resolve(root,'work/v5/CXI/audio-delivery');await mkdir(evidenceRoot,{recursive:true});
 await writeFile(resolve(evidenceRoot,'source-hashes.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log(JSON.stringify({check,groups:evidence.map(({name,files,sourceBytes,jsonBytes,gzipBytes})=>({name,files,sourceBytes,jsonBytes,gzipBytes}))}));
}finally{await rm(temp,{recursive:true,force:true});}
