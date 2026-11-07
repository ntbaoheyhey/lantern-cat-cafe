// Verify a byte-preserving pack improvement against the immutable material4 HTML.
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
await withTimingLock('LOOK L4 lossless gzip packing probe',async()=>{
 const html=await readFile('/tmp/cardrpg-look-l4-material4.html','utf8'),rows=[];
 for(const match of html.matchAll(/<script id="([^"]+)" type="application\/octet-stream">([^<]+)<\/script>/g)){
  const encoded=Buffer.from(match[2],'base64'),raw=gunzipSync(encoded);
  const packed=gzipSync(raw,{level:9,memLevel:9});assert.deepEqual(gunzipSync(packed),raw);
  rows.push({id:match[1],rawSha256:createHash('sha256').update(raw).digest('hex'),before:match[2].length,after:packed.toString('base64').length});
 }
 assert(rows.length>100);
 const saved=rows.reduce((n,r)=>n+r.before-r.after,0);
 const receipt={at:new Date().toISOString(),artifactSha256:createHash('sha256').update(html).digest('hex'),
  beforeBytes:Buffer.byteLength(html),afterEstimate:Buffer.byteLength(html)-saved,saved,rawBytesExact:true,rows};
 await writeFile('reports/cardrpg-look/memory/l4-gzip-probe.json',JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({...receipt,rows:rows.length}));
});
