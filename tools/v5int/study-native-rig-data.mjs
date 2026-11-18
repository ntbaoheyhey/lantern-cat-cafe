/** Pre-adoption experiment: preserve full parsed enemy rigs while sharing exact JSON subtrees. */
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root='/Users/bao/taskbar-hero-chain',out=`${root}/work/v5/CXI/batch-m/rig-data-study-r1`;
const require=createRequire(`${root}/apps/web/package.json`),{chromium,webkit}=require('@playwright/test');
const ids=['button-guard','sock-skipper','teacup-healer','needle-moth','kettle-knight','spool-ram','pollen-scout','crumb-sentinel','yarn-giant','binding-thread'];
const originals=Object.fromEntries(await Promise.all(ids.map(async id=>[id,await readFile(`${root}/apps/web/public/units/${id}/rig.json`,'utf8')])));
const sources=Object.fromEntries(ids.map(id=>[id,JSON.parse(originals[id])]));
const sha=b=>createHash('sha256').update(b).digest('hex'),gzip=x=>gzipSync(typeof x==='string'?x:JSON.stringify(x)).length;
const variants=[];let chosen;
for(const min of [40,120,300,1000,3000]){
 const counts=new Map();
 function count(x){if(!x||typeof x!=='object')return;assert.ok(!Object.hasOwn(x,'$'));const s=JSON.stringify(x);if(s.length>=min)counts.set(s,(counts.get(s)||0)+1);Object.values(x).forEach(count);}
 Object.values(sources).forEach(count);const shared=[],indexes=new Map();
 function pack(x){if(!x||typeof x!=='object')return x;const s=JSON.stringify(x);if(counts.get(s)>1){if(indexes.has(s))return {$:indexes.get(s)};const i=shared.length;indexes.set(s,i);shared.push(null);shared[i]=visit(x);return {$:i};}return visit(x);}
 function visit(x){return Array.isArray(x)?x.map(pack):Object.fromEntries(Object.entries(x).map(([k,v])=>[k,pack(v)]));}
 const units=Object.fromEntries(ids.map(id=>[id,pack(sources[id])]));
 function unpack(x){return !x||typeof x!=='object'?x:Array.isArray(x)?x.map(unpack):Object.keys(x).length===1&&typeof x.$==='number'?unpack(shared[x.$]):Object.fromEntries(Object.entries(x).map(([k,v])=>[k,unpack(v)]));}
 for(const id of ids)assert.deepEqual(unpack(units[id]),sources[id]);
 const row={min,entries:shared.length,sharedGzip:gzip(shared),units:ids.map(id=>({id,originalGzip:gzip(originals[id]),packedGzip:gzip(units[id]),originalSha256:sha(originals[id])}))};
 variants.push(row);if(min===300)chosen={shared,units};
}
const current=JSON.parse(await readFile(`${root}/work/v5/CXI/transfer/v8-native-atlas-r1/all.json`,'utf8'));
const transferEstimates=current.rows.map(row=>{
 const paths=row.transfer.resources.filter(r=>ids.some(id=>r.path===`/units/${id}/rig.json`));const baseline=paths.reduce((s,x)=>s+x.totalBytes,0);
 const bodies=chosen.shared.length?gzip(chosen.shared)+paths.reduce((s,x)=>s+gzip(chosen.units[x.path.split('/')[2]]),0):0;
 return{fixture:row.fixture,rigResponseBytes:baseline,experimentalBodiesGzip:bodies,grossDelta:baseline-bodies,limits:'No new headers, manifest, parser or build deltas counted; not a cold-transfer result.'};
});
const native=[];
for(const [name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const rows=await page.evaluate(({shared,units,originals})=>{
   const unpack=x=>!x||typeof x!=='object'?x:Array.isArray(x)?x.map(unpack):Object.keys(x).length===1&&typeof x.$==='number'?unpack(shared[x.$]):Object.fromEntries(Object.entries(x).map(([k,v])=>[k,unpack(v)]));
   return Object.entries(units).map(([id,tree])=>{
    const original=JSON.parse(originals[id]),expected=JSON.stringify(original),decoded=unpack(tree),instances=new WeakSet();let alias=false,nodes=0;
    const visit=x=>{if(!x||typeof x!=='object')return;nodes++;if(instances.has(x))alias=true;instances.add(x);Object.values(x).forEach(visit);};visit(decoded);
    const timing=[];for(let i=0;i<30;i++){const start=performance.now();unpack(tree);timing.push(performance.now()-start);}
    timing.sort((a,b)=>a-b);return{id,equal:JSON.stringify(decoded)===expected,noAliases:!alias,containerNodes:nodes,decodeMs:{median:timing[15],p95:timing[28],max:timing[29]}};
   });
  },{...chosen,originals});
  assert.ok(rows.every(r=>r.equal&&r.noAliases));native.push({engine:name,version:browser.version(),rows});
 }finally{await browser.close();}
}
await mkdir(out,{recursive:true});
await writeFile(`${out}/payload.json`,JSON.stringify(chosen));
const report={utc:new Date().toISOString(),toolSha256:sha(await readFile(import.meta.filename)),originals:ids.map(id=>({id,path:`${root}/apps/web/public/units/${id}/rig.json`,sha256:sha(originals[id])})),variants,transferEstimates,native,
 decision:'Promising exact-data experiment; no production adoption. Default drawn-enemy loading only is proposed; originals and other actors remain direct.',
 rejected:'Per-unit numeric dictionaries, F64-base64 dictionaries, shared-subtree dictionaries and object-schema encoding did not close the 39,216-byte gap. Cross-unit sharing addresses repetition beyond each response gzip window.'};
await writeFile(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({path:`${out}/report.json`,transferEstimates,native:native.map(r=>({engine:r.engine,exact:r.rows.filter(x=>x.equal&&x.noAliases).length,maxDecodeMs:Math.max(...r.rows.map(x=>x.decodeMs.max))}))}));
