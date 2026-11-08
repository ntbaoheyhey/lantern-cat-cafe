import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
const root='/Users/bao/taskbar-hero-cardrpg-a4';
const hash=s=>createHash('sha256').update(s).digest('hex');
const read=async p=>JSON.parse(await readFile(root+'/'+p,'utf8'));
const base='reports/cardrpg-big/a4/p7/performance/';
const receipts=await Promise.all(['main','candidate'].map(async name=>{
 const path=base+name+'-1280-cpu1/checks.json',r=await read(path);
 return {name,path,sha256:hash(await readFile(root+'/'+path)),head:r.buildHead,chunks:r.chunks.map(c=>({path:c.path,bytes:c.bytes,sha256:c.sha256,modules:c.modules}))};
}));
const sourcePath='apps/web/src/art/monsters/gameplay.generated.ts';
const source=await readFile(root+'/'+sourcePath,'utf8');
const data=JSON.parse(source.slice(source.indexOf(' = ')+3).trim().replace(/;$/,''));
const rowIds=new Map(),frameIds=new Map(),frames=[],roster={};
for(const [id,art] of Object.entries(data)){
 const target=roster[id]={...art,frames:{}};
 for(const [name,animation] of Object.entries(art.frames)){
  target.frames[name]=animation.map(frame=>{
   const indices=frame.map(row=>{
    if(!rowIds.has(row))rowIds.set(row,rowIds.size);
    return rowIds.get(row);
   });
   const key=JSON.stringify(indices);
   if(!frameIds.has(key)){frameIds.set(key,frames.length);frames.push(indices);}
   return frameIds.get(key);
  });
 }
}
const rows=[...rowIds.keys()],packed={rows,frames,roster};
const restored=Object.fromEntries(Object.entries(roster).map(([id,art])=>[id,{...art,frames:Object.fromEntries(Object.entries(art.frames).map(([name,ids])=>[name,ids.map(id=>frames[id].map(i=>rows[i]))]))}]));
assert.deepEqual(restored,data,'Every pixel, frame and catalog field retained');
const encoded=JSON.stringify(packed);
const rle=row=>{
 let out='';
 for(let i=0;i<row.length;){let end=i+1;while(end<row.length&&row[end]===row[i]&&end-i<35)end++;out+=(end-i).toString(36)+row[i];i=end;}
 return out;
};
const inflate=row=>{let out='';for(let i=0;i<row.length;i+=2)out+=row[i+1].repeat(parseInt(row[i],36));return out;};
const compressedRows=rows.map(rle);
assert.deepEqual(compressedRows.map(inflate),rows);
const rlePayload={...packed,rows:compressedRows};
const rleEncoded=JSON.stringify(rlePayload);
const result={kind:'read-only A4 receipts and isolated lossless packing pilot; no browser timing or production change',receipts,
 pixelSource:{path:sourcePath,sha256:hash(source),bytes:Buffer.byteLength(source),roster:Object.keys(data).length},
 pilot:{dictionaryBytes:Buffer.byteLength(encoded),dictionaryGzipBytes:gzipSync(encoded).length,rleDictionaryBytes:Buffer.byteLength(rleEncoded),rleDictionaryGzipBytes:gzipSync(rleEncoded).length,rows:rows.length,frames:frames.length,parity:'PASS'},
 exclusions:'No cardrpg or Three module was requested in either historical default startup. Lazy-loading V4 meta screens alone cannot remove the measured +552596 bytes. New source and browser measurements are still required.'};
await writeFile('/tmp/cardrpg-a5-p1-prep/a4-byte-audit.json',JSON.stringify(result,null,2));
await writeFile('/tmp/cardrpg-a5-p1-prep/pixels-dictionary.json',encoded);
await writeFile('/tmp/cardrpg-a5-p1-prep/pixels-rle.json',rleEncoded);
console.log(JSON.stringify({...result,receipts:receipts.map(r=>({name:r.name,head:r.head,bytes:r.chunks.reduce((n,c)=>n+c.bytes,0)}))},null,2));
