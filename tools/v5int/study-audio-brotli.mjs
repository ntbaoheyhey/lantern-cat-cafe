/** Exact-byte compression/capability experiment. No public asset or loader mutations. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {brotliCompressSync,brotliDecompressSync,gzipSync,gunzipSync,constants} from 'node:zlib';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),req=createRequire(resolve(app,'package.json'));
const {chromium,webkit}=req('@playwright/test');
const out=resolve(root,'work/v5/CXI/audio-delivery/brotli-r1');await mkdir(out,{recursive:true});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const indexBytes=await readFile(resolve(app,'src/audio/packed-audio-index.json')),groups=JSON.parse(indexBytes);
const sources=[],variants=[],rows=[];
for(const group of groups){
 const bytes=await readFile(resolve(app,'public'+group.url));
 assert.equal('sha256-'+createHash('sha256').update(bytes).digest('base64'),group.integrity);
 const body=JSON.parse(bytes);assert.equal(body.version,1);assert.deepEqual(Object.keys(body.files).sort(),[...group.paths].sort());
 const members=[];
 for(const path of group.paths){const original=await readFile(resolve(app,'public'+path)),extracted=Buffer.from(body.files[path],'base64');assert(original.equals(extracted));sources.push({path,sha256:sha(original)});members.push(original);}
 const gz6=gzipSync(bytes,{level:6}),gz9=gzipSync(bytes,{level:9});
 const br=brotliCompressSync(bytes,{params:{[constants.BROTLI_PARAM_QUALITY]:11,[constants.BROTLI_PARAM_SIZE_HINT]:bytes.length}});
 assert(brotliDecompressSync(br).equals(bytes));assert(gunzipSync(gz6).equals(bytes));assert(gunzipSync(gz9).equals(bytes));
 // Upper bound for an alternate binary framing; lengths + current path order suffice to split unchanged members.
 const lengths=Buffer.alloc(4+4*members.length);lengths.writeUInt32LE(members.length,0);members.forEach((b,i)=>lengths.writeUInt32LE(b.length,4+i*4));
 const binary=Buffer.concat([lengths,...members]),binaryGzip=gzipSync(binary,{level:9});assert(gunzipSync(binaryGzip).equals(binary));
 const row={url:group.url,sha256:sha(bytes),members:members.length,jsonBytes:bytes.length,gzip6:gz6.length,gzip9:gz9.length,brotli11:br.length,brotliSavingVsGzip6:gz6.length-br.length,binaryGzip9:binaryGzip.length,binarySavingVsGzip6:gz6.length-binaryGzip.length};rows.push(row);
 variants.push({url:group.url,format:'brotli',base64:br.toString('base64'),expected:sha(bytes),length:bytes.length});
 await writeFile(resolve(out,group.url.split('/').at(-1)+'.br'),br);
}
const probe=Buffer.from('Taskbar Hero exact-byte compression probe. '.repeat(32));
variants.unshift({url:'probe-gzip',format:'gzip',base64:gzipSync(probe).toString('base64'),expected:sha(probe),length:probe.length});
const engines=[];
for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:720}}),page=await context.newPage();
  await page.route('http://localhost/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Local capability probe</title>'}));
  await page.goto('http://localhost/compression-probe');
  const capabilities=await page.evaluate(()=>Object.fromEntries(['gzip','brotli','br'].map(format=>{try{new DecompressionStream(format);return [format,{supported:true}];}catch(error){return [format,{supported:false,error:String(error)}];}})));
  const results=[];
  for(const variant of variants){
   if(!capabilities[variant.format].supported)continue;
   const result=await page.evaluate(async ({format,base64})=>{
    const data=Uint8Array.from(atob(base64),c=>c.charCodeAt(0)),start=performance.now();
    const bytes=await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream(format))).arrayBuffer();
    const elapsedMs=performance.now()-start;
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
    return {sha256:hash,bytes:bytes.byteLength,elapsedMs};
   },variant);
   assert.equal(result.sha256,variant.expected);assert.equal(result.bytes,variant.length);results.push({url:variant.url,format:variant.format,...result});
  }
  engines.push({name,version:browser.version(),capabilities,results});await context.close();
 }finally{await browser.close();}
}
const transferPath=resolve(root,'work/v5/CXI/transfer/v8-mochi-scene-q22-r6/all.json'),transferBytes=await readFile(transferPath),transfer=JSON.parse(transferBytes);
const fixtureEstimates=transfer.rows.map(fixture=>{
 const requested=new Set(fixture.transfer.resources.map(x=>x.path)),selected=rows.filter(x=>requested.has(x.url));
 return {fixture:fixture.fixture,requestedPackages:selected.length,measuredColdBytes:fixture.transfer.conservativeTransferBytes,brotliGrossSaving:selected.reduce((s,r)=>s+r.brotliSavingVsGzip6,0),binaryGzipGrossSaving:selected.reduce((s,r)=>s+r.binarySavingVsGzip6,0),limits:'Offline replacement-byte estimate only; excludes loader/decoder/fallback/headers and is not a fresh cold measurement.'};
});
const result={utc:new Date().toISOString(),indexSha256:sha(indexBytes),sourceMembers:sources.length,sourceHashes:sources,packages:rows,engines,fixtureEstimates,transferReceiptSha256:sha(transferBytes),runtimeChanged:false,imagesViewed:0,
 limits:'No audio re-encoding, enrollment, hosting changes or production requests. Native capability tested only in installed engines. Existing JSON is already gzip-compressed; report compares against gzip6. Binary estimate excludes implementation and mapping costs. Source PCM inherits exact encoded bytes only; no new listening claim.'};
await writeFile(resolve(out,'report.json'),JSON.stringify(result,null,2)+'\n');
const small={...result,sourceHashes:undefined,engines:engines.map(({results,...engine})=>({...engine,verifiedDecodeCases:results.length,verifiedBrotliPackages:results.filter(x=>x.format==='brotli').length,decodeMs:results.map(x=>x.elapsedMs)})),rawReport:{path:resolve(out,'report.json'),sha256:sha(await readFile(resolve(out,'report.json')))}};
await writeFile(resolve(root,'reports/v5/CXI/evidence/v8-audio-brotli-review.json'),JSON.stringify(small,null,2)+'\n');
console.log(JSON.stringify({sourceMembers:sources.length,packages:rows.length,engines:small.engines,fixtureEstimates}));
