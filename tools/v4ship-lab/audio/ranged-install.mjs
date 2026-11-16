/** Install only the signed all-class candidate after its raw source/paint review. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-install-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),read=path=>JSON.parse(readFileSync(resolve(root,path))),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),verify=s=>assert.equal(signed(s.path).sha256,s.sha256);
const names=['ranged-class-bake-1','ranged-flight-compare-1','ranged-class-speed-playback-1','ranged-flight-frame-review-2','ranged-source-review-1'],inputs=names.map(n=>signed(`reports/v4-ship/S11/${n}.json`)),[bake,compare,playback,frames,sources]=inputs.map(s=>read(s.path));
assert(bake.reconstructionPass&&playback.pass&&frames.candidatePass&&sources.candidatePass);
assertUnchanged(root,bake.signature);assertUnchanged(root,playback.signature);
for(const report of [frames,sources])for(const input of report.inputs)verify(input);
for(const input of [...bake.files,bake.manifest,bake.licenses,compare.candidate,playback.events,...playback.captures])verify(input);
assert.equal(playback.candidate.sha256,compare.candidate.sha256);
const manifestPath='apps/web/public/audio/manifest.json',licensesPath='apps/web/public/audio/LICENSES.json',manifest=read(manifestPath),licenses=read(licensesPath),patch=read(compare.candidate.path),entries=read(bake.licenses.path),before=[signed(manifestPath),signed(licensesPath)];
assert.deepEqual(Object.keys(patch.packs),['v4-ranged-impacts']);assert.equal(Object.keys(patch.designs).length,15);assert.equal(entries.length,2);
for(const [key,value]of Object.entries(patch.packs)){assert(!manifest.packs[key]);manifest.packs[key]=value;}
for(const [key,value]of Object.entries(patch.designs)){assert(!manifest.designs[key]&&/^kit\.ranged-(ember|heavy|shadow|tide|ice)\.(release|travel|impact)$/.test(key));manifest.designs[key]=value;}
const limitations=['Nominal-pitch codec reconstruction only; arbitrary pitch/speed waveform and human perceptual equivalence are unverified.','Common composite pitch/speed resamples internal layer offsets; original separate layers keep explicit wall-time offsets.','Each palette uses 36 balanced combinations rather than independently randomizing all 1296 layer combinations. Ice/tide share identical impact PCM; their launch/travel designs differ.'];
for(const entry of entries){
 assert(/^apps\/web\/public\/audio\/v4-ranged-impacts\.(webm|mp3)$/.test(entry.path));assert(!existsSync(resolve(root,entry.path))&&!licenses.files.some(e=>e.path===entry.path));
 const source=bake.files.find(f=>f.format===entry.path.split('.').at(-1));assert(source&&source.sha256===entry.sha256);
 for(const original of entry.sourceFiles)verify(original);
}
for(const entry of entries){const source=bake.files.find(f=>f.format===entry.path.split('.').at(-1));copyFileSync(resolve(root,source.path),resolve(root,entry.path));licenses.files.push({...entry,playbackLimitations:limitations,derivationEvidence:'reports/v4-ship/LEARN/S11-ranged-audio.md'});}
writeFileSync(resolve(root,manifestPath),JSON.stringify(manifest,null,2)+'\n');writeFileSync(resolve(root,licensesPath),JSON.stringify(licenses,null,2)+'\n');
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:signed(relative(root,import.meta.filename)),inputs,before,installed:[...entries.map(e=>signed(e.path)),signed(manifestPath),signed(licensesPath)],signature:runtimeSignature(root),limitations,
 scope:'Byte-exact installation of the prepared pack and selected palette-phase manifest additions. Existing cue designs and pack contents are retained. Scheduler integration and production preload/mix/variable-speed checks are separate.',runtimeCodeChanged:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),installed:report.installed,overallAudioGatePass:false}));
