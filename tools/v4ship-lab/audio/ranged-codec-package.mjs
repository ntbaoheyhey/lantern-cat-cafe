/** Prepare an integrity-bound pack/manifest/licence bundle; never install it. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const folder=resolve(root,`work/v4ship-audio/ranged-codec-package-${attempt}`),output=resolve(root,`reports/v4-ship/S11/ranged-codec-package-${attempt}.json`);
assert(!existsSync(folder)&&!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(folder,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=s=>{const b=readFileSync(resolve(root,s.path));assert.equal(hash(b),s.sha256,s.path);return b;};
const codecPath='reports/v4-ship/S11/ranged-codec-scale-1.json',codec=read(codecPath),bakePath='reports/v4-ship/S11/ranged-impact-bake-1.json',bake=read(bakePath);
assert(codec.reconstructionPass&&codec.selectedCandidate);for(const file of [...codec.inputs,...codec.harness,codec.raw,bake.engine,bake.source,bake.script])verify(file);
const sourceFolder=resolve(root,bake.output),patch=read(relative(root,resolve(sourceFolder,'manifest-patch.json'))),licenses=read(relative(root,resolve(sourceFolder,'license-entries.json'))),files=[];
for(const format of ['webm','mp3']){
 const selected=codec.selectedCandidate[format],bytes=verify(selected),name=`v4-ranged-impacts.${format}`,target=resolve(folder,name);copyFileSync(resolve(root,selected.path),target);
 const entry=licenses.find(l=>l.file===name);assert(entry);entry.sha256=hash(bytes);
 entry.processing+=' Encoding validated in Chromium156/WebKit27.2 at48/44.1kHz: Vorbis has128leading PCM zeros to cancel decoder alignment; native LAME192k uses requested1/0.97 to cancel its fixed preset attenuation (reported effective gain1). No normalization, browser sniffing or runtime offsets.';
 entry.encodingEvidence=signed(codecPath);entry.encodingScript=signed(format==='webm'?'tools/v4ship-lab/audio/ranged-codec-padding.mjs':'tools/v4ship-lab/audio/ranged-codec-scale.mjs');
 files.push({...signed(relative(root,target)),bytes:bytes.length,format});
}
for(const [name,value] of [['manifest-patch.json',patch],['license-entries.json',licenses]])writeFileSync(resolve(folder,name),JSON.stringify(value,null,2)+'\n');
const regPath='reports/v4-ship/S11/ranged-codec-regression-1/check.json',reg=read(regPath);assert(reg.complete&&reg.rows.every(r=>r.exitCode===(r.name==='web'?1:0)));verify(reg.log);
const failures=path=>gunzipSync(readFileSync(resolve(root,path))).toString().split('\n').filter(Boolean).map(JSON.parse).filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'').split('\n').filter(l=>l.includes(' FAIL ')).map(l=>l.trim());
const previous='reports/v4-ship/S11/scene-audio-regression-1/log.jsonl.gz';assert.equal(failures(previous).length,7);assert.deepEqual(failures(previous),failures(reg.log.path));
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',inputs:[signed(bakePath),signed(codecPath)],harness:signed(relative(root,import.meta.filename)),files,
 manifest:signed(relative(root,resolve(folder,'manifest-patch.json'))),licenses:signed(relative(root,resolve(folder,'license-entries.json'))),variants:bake.variants,output:relative(root,folder),
 reconstructionPass:true,sourceCommitScope:'AudioEngine/source/public assets unchanged since the completed production14 scene captures.',regression:{check:signed(regPath),log:reg.log,sameSevenArtFailures:true,gRegPass:false,officialClassParityPass:false},
 decisions:['Retain padded Vorbis and native LAME with effective unity gain; preserve all72canonical sprite starts.','Reject no-Xing, decoder-inclusive iTunes tagging and native default scale; their failed evidence remains.','Prepared files only. Actual launch/travel design, real source admission, output mix and production coverage are still required.'],runtimeInstalled:false,physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),files,variants:bake.variants,runtimeInstalled:false}));
