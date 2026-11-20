/** Install only the previously measured palette bytes; preserve historical monolith files. */
import assert from 'node:assert/strict';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve,relative,basename} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const reportPath=resolve(root,`reports/v4-ship/S11/ranged-palette-install-${attempt}.json`),folder=resolve(root,`work/v4ship-audio/ranged-roster-${attempt}`);
assert(!existsSync(reportPath)&&!existsSync(folder)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');
const hash=b=>createHash('sha256').update(b).digest('hex'),sign=p=>({path:relative(root,p),bytes:readFileSync(p).length,sha256:hash(readFileSync(p))});
const read=p=>JSON.parse(readFileSync(resolve(root,p)));
const verified=r=>{const b=readFileSync(resolve(root,r.path));assert.equal(hash(b),r.sha256);if(r.bytes!==undefined)assert.equal(b.length,r.bytes);return b;};
const study=read('reports/v4-ship/S11/ranged-delivery-comparison-2.json'),http=read('reports/v4-ship/S11/ranged-delivery-http-2.json');
assert(study.reconstructionPass&&http.pass&&http.rows.length===96);
for(const path of ['reports/v4-ship/S11/ranged-delivery-review-1.json','reports/v4-ship/S11/ranged-delivery-http-review-1.json'])assert(read(path).pass);
const manifestPath=resolve(root,'apps/web/public/audio/manifest.json'),licensePath=resolve(root,'apps/web/public/audio/LICENSES.json');
const before=readFileSync(manifestPath),manifest=JSON.parse(before),licenses=JSON.parse(readFileSync(licensePath));
assert.equal(hash(before),http.inputs.find(r=>r.path==='apps/web/public/audio/manifest.json').sha256);
const packages=study.packages.filter(p=>['ember','heavy','shadow','tide'].includes(p.id));assert.equal(packages.length,4);
const replacements=new Map(packages.flatMap(p=>p.variants.map(v=>[v.sample.variantId,v]))),copied=[];
assert.equal(replacements.size,144);
mkdirSync(folder,{recursive:true});writeFileSync(resolve(folder,'original-manifest.json'),before);
writeFileSync(resolve(folder,'original-engine.ts'),execFileSync('git',['show','HEAD:apps/web/src/audio/engine.ts'],{cwd:root}));
for(const pack of packages){
 assert(!manifest.packs[pack.pack]);manifest.packs[pack.pack]={};
 const provenance=new Set(pack.variants.flatMap(v=>v.layers.map(l=>'assets/audio-sources/b2/'+l.variantId.split(':').at(-1).split('/').slice(0,2).join('/'))));
 for(const file of pack.files){
  assert(['webm','mp3'].includes(file.format));const bytes=verified(file),name=basename(file.path),target=resolve(root,'apps/web/public/audio',name);assert(!existsSync(target));
  writeFileSync(target,bytes);copied.push({source:file,installed:sign(target)});manifest.packs[pack.pack][file.format]='/audio/'+name;
  const inherited=licenses.files.find(r=>r.file==='v4-ranged-impacts.'+file.format);assert(inherited);
  const sourceFiles=inherited.sourceFiles.filter(r=>provenance.has(r.path));assert.equal(sourceFiles.length,provenance.size);for(const s of sourceFiles)verified(s);
  licenses.files.push({...structuredClone(inherited),...sign(target),file:name,sourceFiles,
   processing:inherited.processing+' Partitioned by palette from the same pre-encoding PCM with unchanged guards; offsets rebased. No lossy transcoding or regenerated samples.',
   partitionedFrom:study.inputs.filter(r=>r.path.endsWith('impacts.f32')),
   palettePcm:pack.pcm,buildScript:sign(resolve(root,'tools/v4ship-lab/audio/ranged-delivery-compare.mjs')),
   derivationEvidence:'reports/v4-ship/LEARN/S11-audio-delivery.md'});
 }
}
let rebound=0;
for(const design of Object.values(manifest.designs))for(const variant of design.baked??[]){
 if(variant.sample.pack!=='v4-ranged-impacts')continue;
 const replacement=replacements.get(variant.sample.variantId);assert(replacement);assert.deepEqual(variant.layers,replacement.layers);
 const a={...variant.sample},b={...replacement.sample};delete a.start;delete a.pack;delete b.start;delete b.pack;assert.deepEqual(a,b);
 variant.sample={...replacement.sample};rebound++;
}
assert.equal(rebound,180);delete manifest.packs['v4-ranged-impacts'];
assert.deepEqual(manifest,JSON.parse(verified(http.candidate.manifest)));
writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');writeFileSync(licensePath,JSON.stringify(licenses,null,2)+'\n');
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',sourceCommit:git(['rev-parse','HEAD']),harness:sign(import.meta.filename),
 baseline:{engine:sign(resolve(folder,'original-engine.ts')),manifest:sign(resolve(folder,'original-manifest.json'))},
 copied,manifest:sign(manifestPath),licenses:sign(licensePath),reboundMappings:rebound,uniqueSprites:replacements.size,
 historicalMonolithPreserved:study.inputs.filter(r=>/v4-ranged-impacts\.(webm|mp3)$/.test(r.path)).every(r=>hash(verified(r))===r.sha256),
 runtimeCandidateInstalled:true,productionValidated:false,fullAudioGatePass:false,shippingTransferGatePass:false};
writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,reportPath),copied:copied.length,rebound,uniqueSprites:replacements.size}));
