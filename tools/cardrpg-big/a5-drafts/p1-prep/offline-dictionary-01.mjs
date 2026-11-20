// REFERENCE: P1 pilot04 registration. Exact original bytes; isolated output only.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {packModelDictionary,restoreModelDictionary} from './model-dictionary-transport.mjs';
const out='reports/cardrpg-big/a5/p1/pilot-04';
const method=JSON.parse(await readFile(`${out}/REGISTERED-METHOD.json`,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const input=await readFile(method.input);assert.equal(hash(input),method.inputSha256);
for(const [path,expected]of Object.entries(method.tools))assert.equal(hash(await readFile(path)),expected);
let html=input.toString('utf8');
const manifestPattern=/<script id="asset-manifest" type="application\/json">(.*?)<\/script>/s;
const manifest=JSON.parse(html.match(manifestPattern)[1]);
const assetPattern=index=>new RegExp(`<script id="asset-${index}" type="application/octet-stream">(.*?)<\\/script>`,'s');
const assets=manifest.map((asset,index)=>({...asset,bytes:gunzipSync(Buffer.from(html.match(assetPattern(index))[1],'base64'))}));
const packed=packModelDictionary(assets),entries=packed.entries.map(({offset,length})=>[offset,length]);
const dictionaryCompressed=gzipSync(packed.dictionary,{level:9}),dictionary=gunzipSync(dictionaryCompressed);
const rows=[];
for(const [index,asset]of packed.assets.entries()){
  const zipped=gzipSync(asset.bytes,{level:9});
  const restored=restoreModelDictionary(new Uint8Array(gunzipSync(zipped)),asset.patches,dictionary,entries);
  assert.deepEqual(Buffer.from(restored),assets[index].bytes,asset.key);
  if(asset.patches.length){
    manifest[index].patches=asset.patches;
    html=html.replace(assetPattern(index),`<script id="asset-${index}" type="application/octet-stream">${zipped.toString('base64')}</script>`);
  }
  rows.push({index,key:asset.key,mime:asset.mime,decodedBytes:restored.length,decodedSha256:hash(restored),patchCount:asset.patches.length,
    originalGzipBytes:Buffer.from(input.toString().match(assetPattern(index))[1],'base64').length,selectedGzipBytes:zipped.length});
}
html=html.replace(manifestPattern,`<script id="asset-manifest" type="application/json">${JSON.stringify(manifest)}</script>`);
const dictionaryTags=`<script id="model-dictionary" type="application/octet-stream">${dictionaryCompressed.toString('base64')}</script>\n<script id="model-dictionary-index" type="application/json">${JSON.stringify(entries)}</script>\n`;
html=html.replace('<script id="payload"',dictionaryTags+'<script id="payload"');
const loader=await readFile('tools/cardrpg-big/offline-loader.js','utf8');assert(html.includes(loader));
const declaration="  await new Promise(resolve => requestAnimationFrame(resolve));";
const needle='assets[asset.key] = URL.createObjectURL(new Blob([blob], { type: asset.mime }));';
assert.equal(loader.split(declaration).length,2);assert.equal(loader.split(needle).length,2);
const revised=loader.replace(declaration,declaration+`\n  const dictionary = new Uint8Array(await (await unpack(document.getElementById('model-dictionary'))).arrayBuffer());\n  const dictionaryIndex = JSON.parse(document.getElementById('model-dictionary-index').textContent);\n  document.getElementById('model-dictionary-index').remove();`)
  .replace(needle,`const restored = asset.patches ? restoreModelDictionary(new Uint8Array(await blob.arrayBuffer()), asset.patches, dictionary, dictionaryIndex) : blob;\n    assets[asset.key] = URL.createObjectURL(new Blob([restored], { type: asset.mime }));`);
html=html.replace(loader,restoreModelDictionary.toString()+'\n'+revised);
await mkdir(method.output,{recursive:true});await writeFile(method.output+'/index.html',html);
const receipt={method,rows,entries:packed.entries,dictionaryBytes:dictionary.length,dictionaryGzipBytes:dictionaryCompressed.length,
  allAssetBytesPreserved:true,beforeBytes:input.length,afterBytes:Buffer.byteLength(html),savedBytes:input.length-Buffer.byteLength(html),sha256:hash(html),output:method.output+'/index.html',
  limits:'Native exact asset parity only. Browser restoration/rendering/cold timings pending. No source art, production builder or public demo changes.'};
await writeFile(`${out}/transport.json`,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({beforeBytes:receipt.beforeBytes,afterBytes:receipt.afterBytes,savedBytes:receipt.savedBytes,dictionaryGzipBytes:receipt.dictionaryGzipBytes,models:rows.filter(r=>r.patchCount).length,sha256:receipt.sha256}));
