// Compare immutable HTML variants before promoting any smaller model delivery.
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';

const [study,baseline='reports/cardrpg-look/validation/l5/batch1/pilot-1/index.html']=process.argv.slice(2);
assert(study,'Pass a completed packing study directory');
const out=`${study}/comparison`,packing=JSON.parse(await readFile(`${study}/packing.json`));
assert.equal(packing.rows.length,3,'Three completed study models required');
assert(!await access(`${out}/candidate.html`).then(()=>true,()=>false),'Preserve existing comparison');
const hash=b=>createHash('sha256').update(b).digest('hex');
const original=await readFile(baseline);
let html=original.toString();
const manifest=JSON.parse(html.match(/<script id="asset-manifest"[^>]*>(.*?)<\/script>/s)[1]);
const rows=[];
for(const row of packing.rows){
  const replacement=await readFile(row.output);
  assert.equal(hash(replacement),row.sha256);
  assert.equal(hash(await readFile(row.input)),row.sourceSha256);
  const key=`assets/cardrpg-look/game-models/${row.owner}.glb`;
  const index=manifest.findIndex(r=>r.key===key);
  assert(index>=0,`Missing model ${key}`);
  const pattern=new RegExp(`(<script id="asset-${index}"[^>]*>)(.*?)(</script>)`,'s');
  const match=html.match(pattern),before=gunzipSync(Buffer.from(match[2],'base64'));
  assert.equal(hash(before),hash(await readFile(key)),'Baseline must contain current 1024px delivery');
  const packed=gzipSync(replacement,{level:9}).toString('base64');
  html=html.replace(pattern,(_,open,_data,close)=>open+packed+close);
  rows.push({owner:row.owner,key,beforeSha256:hash(before),afterSha256:row.sha256,
    beforeBytes:before.length,afterBytes:replacement.length,embeddedDelta:packed.length-match[2].length});
}
await mkdir(out,{recursive:true});
await writeFile(`${out}/baseline.html`,original);
await writeFile(`${out}/candidate.html`,html);
const receipt={baseline,baselineSha256:hash(original),baselineBytes:original.length,
  candidateSha256:hash(html),candidateBytes:Buffer.byteLength(html),rows,
  status:'Comparison artifact only; no source model replacement or performance acceptance'};
await writeFile(`${out}/variants.json`,JSON.stringify(receipt,null,2)+'\n');
const run=(binary,args,env={})=>new Promise((resolve,reject)=>{
  const child=spawn(binary,args,{stdio:'inherit',env:{...process.env,...env}});
  child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${binary}: ${code}`)));
});
for(const variant of ['baseline','candidate'])await run(process.execPath,['tools/cardrpg-look/capture.mjs'],{
  LOOK_ARTIFACT:`${out}/${variant}.html`,LOOK_OUT:`${out}/${variant}`,LOOK_OWNERS:packing.rows.map(r=>r.owner).join(','),
  LOOK_KINDS:'unit',LOOK_SIZES:'[[1280,720],[1440,900]]',LOOK_TIME:'3.2',
});
for(const row of packing.rows){
  assert.equal(hash(await readFile(row.preview)),row.previewSha256);
  await withTimingLock(`LOOK compression studio ${row.owner}`,()=>run(
    '/Users/bao/tools/cardrpg-look/Blender.app/Contents/MacOS/Blender',
    ['--background','--threads','4','--python-exit-code','1','--python','tools/cardrpg-look/blender/roster-render.py','--',
      '--source',row.preview,'--out',`${out}/studio/${row.owner}`],{PYTHONDONTWRITEBYTECODE:'1'}));
}
assert.equal(hash(await readFile(baseline)),hash(original));
console.log(JSON.stringify(receipt));
