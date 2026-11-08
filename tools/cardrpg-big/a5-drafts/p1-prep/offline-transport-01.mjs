// REFERENCE: PROMPT-A5 P1; pilot-02/REGISTERED-METHOD.json. No production/artwork changes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {shuffleModelBytes,restoreModelBytes} from './model-transport.mjs';
const out='reports/cardrpg-big/a5/p1/pilot-02';
const method=JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const input=await readFile(method.input);
assert.equal(hash(input),method.inputSha256);
for(const [path,expected]of Object.entries(method.tools))assert.equal(hash(await readFile(path)),expected);
for(let size=0;size<=65;size++)for(const encoding of method.encodings){
 const b=Uint8Array.from({length:size},(_,i)=>(i*i+size*19)%256);
 assert.deepEqual(restoreModelBytes(shuffleModelBytes(b,encoding.width,encoding.delta),encoding),b);
}
let html=input.toString('utf8');
const tag=/<script id="asset-manifest" type="application\/json">(.*?)<\/script>/s;
const match=html.match(tag);assert(match);
const manifest=JSON.parse(match[1]),rows=[];
for(const [index,asset]of manifest.entries()){
 const pattern=new RegExp(`<script id="asset-${index}" type="application/octet-stream">(.*?)<\\/script>`,'s');
 const match=html.match(pattern);assert(match);
 const original=Buffer.from(match[1],'base64'),bytes=gunzipSync(original);
 const row={index,key:asset.key,mime:asset.mime,decodedBytes:bytes.length,decodedSha256:hash(bytes),originalGzipBytes:original.length,candidates:[]};
 let best=original,selected;
 if(asset.mime==='model/gltf-binary')for(const encoding of method.encodings){
  const packed=gzipSync(shuffleModelBytes(bytes,encoding.width,encoding.delta),{level:9});
  assert.deepEqual(Buffer.from(restoreModelBytes(gunzipSync(packed),encoding)),bytes,asset.key);
  row.candidates.push({encoding,gzipBytes:packed.length,byteParity:'PASS'});
  if(packed.length+JSON.stringify(encoding).length<best.length){best=packed;selected=encoding;}
 }
 if(selected){asset.transport=selected;html=html.replace(pattern,`<script id="asset-${index}" type="application/octet-stream">${best.toString('base64')}</script>`);}
 rows.push({...row,selected:selected??null,selectedGzipBytes:best.length});
}
html=html.replace(tag,`<script id="asset-manifest" type="application/json">${JSON.stringify(manifest)}</script>`);
const loader=await readFile('tools/cardrpg-big/offline-loader.js','utf8');assert(html.includes(loader));
const needle='assets[asset.key] = URL.createObjectURL(new Blob([blob], { type: asset.mime }));';assert.equal(loader.split(needle).length,2);
const revised=loader.replace(needle,`const restored = asset.transport ? restoreModelBytes(new Uint8Array(await blob.arrayBuffer()), asset.transport) : blob;\n    assets[asset.key] = URL.createObjectURL(new Blob([restored], { type: asset.mime }));`);
html=html.replace(loader,restoreModelBytes.toString()+'\n'+revised);
await mkdir(method.output,{recursive:true});await writeFile(method.output+'/index.html',html);
const receipt={method,rows,allAssetBytesPreserved:true,beforeBytes:input.length,afterBytes:Buffer.byteLength(html),savedBytes:input.length-Buffer.byteLength(html),sha256:hash(html),output:method.output+'/index.html',
 limits:'Exact native byte parity only. Browser restored-asset SHA checks, startup measurements and real-click rendering still pending. Source assets, gameplay, public artifact and production builder unchanged.'};
await writeFile(`${out}/transport.json`,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({beforeBytes:receipt.beforeBytes,afterBytes:receipt.afterBytes,savedBytes:receipt.savedBytes,models:rows.filter(r=>r.selected).length,sha256:receipt.sha256}));
