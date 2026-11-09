// Account for both current atelier art and legacy B geometry/portraits in the offline payload.
import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const rows=[];
for(const [variant,path]of [['full','docs/cardrpg-look/b2.html'],['lean','docs/cardrpg-look/b2-lean.html']]){
 const html=await readFile(path,'utf8'),manifest=JSON.parse(html.match(/<script id="asset-manifest" type="application\/json">(.*?)<\/script>/s)[1]),classes={};
 let bOwnedBytes=0,bOwnedRaw=0;
 for(const [i,entry]of manifest.entries()){
  const key=entry.key;
  const bOwned=/^assets\/(cardrpg-look\/|cardrpg2\/models\/|cardrpg\/portraits\/|cardrpg3\/(portraits|icons|textures)\/|cardrpg3b\/textures\/)/.test(key);
  const category=key.includes('/game-models/')?'atelier models':key.includes('/stage/')?'atelier stage':key.includes('/models/')?'legacy models':key.includes('/portraits/')?'portraits':key.includes('/icons/')?'icons':key.includes('/flipbooks/')?'effect atlases':'textures or other';
  const encoded=html.match(new RegExp(`<script id="asset-${i}" type="application/octet-stream">(.*?)</script>`,'s'))[1],zip=Buffer.from(encoded,'base64'),raw=gunzipSync(zip);
  if(bOwned){const c=classes[category]??={files:0,rawBytes:0,gzipBytes:0,embeddedBytes:0};c.files++;c.rawBytes+=raw.length;c.gzipBytes+=zip.length;c.embeddedBytes+=encoded.length;bOwnedBytes+=encoded.length;bOwnedRaw+=raw.length;}
 }
 rows.push({variant,path,htmlBytes:Buffer.byteLength(html),bOwnedRawBytes:bOwnedRaw,bOwnedEmbeddedBytes:bOwnedBytes,classes});
}
await writeFile('reports/cardrpg-look/b2/v6/asset-budget.json',JSON.stringify({definition:'B art: all cardrpg-look assets, legacy model aliases and cardrpg/cardrpg3 portraits/icons/textures; excludes A-owned evidence imagery. Base64 gzip payload bytes, before script tags/manifest. Lean replaces12portrait2x with existing1x and resizes/recompresses legacy B textures and portraits; no source assets modified.',rows},null,2));console.log(JSON.stringify(rows));
