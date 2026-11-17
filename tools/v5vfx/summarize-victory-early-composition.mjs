/** Classify early-lifecycle captures without replacing or visually reopening original evidence. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
const root=resolve(import.meta.dirname,'../..'),input=resolve(root,'work/v5/CXV/films/V7-F-victory-early-composition');
const provenance=JSON.parse(readFileSync(resolve(input,'provenance.json'))),trials=JSON.parse(readFileSync(resolve(input,'trials.json'))),original=JSON.parse(readFileSync(resolve(root,'reports/v5/CXV/V7-F-victory-capture-consistency.json')));
assert.equal(trials.length,6);assert.equal(hash(readFileSync(provenance.buildManifest)),provenance.buildManifestSha256);
for(const t of provenance.tools){assert.equal(hash(readFileSync(resolve(input,t.name))),t.sha256);assert.equal(hash(readFileSync(resolve(root,'tools/v5vfx',t.name))),t.sha256);}
const baseline=original.rows[0],variant=original.rows.find(r=>r.mode==='native'&&r.rate===4&&!r.fullSceneAgainstFirstBaseline.equal);assert(variant);
const classify=sha=>sha===baseline.fullSceneRgbSha256?'original-baseline':sha===variant.fullSceneRgbSha256?'original-discrepant-candidate':'new-variant';
const captures=[],runs=[],styleGroups={},layerGroups={};
for(const trial of trials){
 const bytes=readFileSync(trial.reportPath);assert.equal(hash(bytes),trial.sha256);const raw=JSON.parse(bytes);assert(raw.pass&&!raw.errors.length&&!raw.blockedRequests.length);assert.equal(raw.buildManifestSha256,provenance.buildManifestSha256);
 runs.push({...trial,utc:raw.utc,ended:raw.ended,url:raw.url,indexSha256:raw.indexSha256,method:raw.method});
 for(const c of raw.captures){
  const png=readFileSync(c.path);assert.equal(hash(png),c.sha256);assert.equal(png.readUInt32BE(16),1280);assert.equal(png.readUInt32BE(20),720);
  const rgb=execFileSync('ffmpeg',['-v','error','-i',c.path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],{maxBuffer:10_000_000});assert.equal(hash(rgb),c.fullRgbSha256);
  const mean=rgb.reduce((a,b)=>a+b,0)/rgb.length,stdDev=Math.sqrt(rgb.reduce((a,b)=>a+(b-mean)**2,0)/rgb.length);assert(stdDev>10);
  const styles=JSON.parse(JSON.stringify(c.state.styles).replaceAll(/http:\/\/127\.0\.0\.1:631[12]/g,'http://local-artifact'));
  const styleHash=hash(JSON.stringify(styles));styleGroups[styleHash]=styles;
  const layers=c.layers.map(l=>({width:l.width,height:l.height,drawsContent:l.drawsContent,reasons:l.compositingReasons??[]}));
  const layerHash=hash(JSON.stringify(layers));layerGroups[layerHash]=layers;
  const state=Object.fromEntries(['frozen','parked','calls','skipped','draws','completeAt','now','ready','drawn','animations'].map(k=>[k,c.state[k]]));
  captures.push({trial:trial.trial,mode:trial.mode,early:trial.early,name:c.name,path:c.path,crewPath:c.crewPath,utc:c.utc,sha256:c.sha256,fullRgbSha256:c.fullRgbSha256,crewRgbSha256:c.crewRgbSha256,state,styleHash,layerHash,visibleImages:c.state.images.length,width:1280,height:720,mean,stdDev,variant:classify(c.fullRgbSha256)});
 }
}
const selected=[captures.find(c=>c.mode==='baseline'&&!c.early&&c.name==='settled'),captures.find(c=>c.early&&c.name==='settled'),captures.find(c=>c.mode==='native'&&c.name==='settled'),captures.find(c=>c.early&&c.name==='resumed')];assert(selected.every(Boolean));
const path=resolve(input,'review.jpg');assert(!existsSync(path));
execFileSync('ffmpeg',['-v','error',...selected.flatMap(c=>['-i',c.path]),'-filter_complex','[0:v]scale=512:288[a];[1:v]scale=512:288[b];[2:v]scale=512:288[c];[3:v]scale=512:288[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0[v]','-map','[v]','-frames:v','1','-q:v','3',path]);
const dimensions=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',path],{encoding:'utf8'})).streams[0];assert.equal(dimensions.width,1024);assert.equal(dimensions.height,576);
const report={utc:new Date().toISOString(),source:original.source,runtimePatchSha256:original.runtimePatchSha256,viewport:{width:1280,height:720},provenance,runs,references:{baselineFullRgb:baseline.fullSceneRgbSha256,variantFullRgb:variant.fullSceneRgbSha256},captures,styleGroups,layerGroups,behaviorPass:true,naturalBaselineReproducesVariant:captures.some(c=>c.mode==='baseline'&&!c.early&&c.name==='settled'&&c.variant==='original-discrepant-candidate'),earlyFreezeReproducesVariant:captures.some(c=>c.early&&c.name==='settled'&&c.variant==='original-discrepant-candidate'),naturalCandidateReproducesVariant:captures.some(c=>c.mode==='native'&&c.name==='settled'&&c.variant==='original-discrepant-candidate'),allCapturesMatchOriginalBaseline:captures.every(c=>c.variant==='original-baseline'),sheet:{path,...dimensions,sha256:hash(readFileSync(path)),frames:selected.map(c=>({trial:c.trial,name:c.name}))},reviewedUtc:null,interpretation:null,limits:'Small reproduction sample with CDP layers and draw/RAF wrappers. These can change scheduling; a failure to reproduce is not exact-pixel acceptance. Baseline freeze and later size restoration are diagnostic browser interventions only. No application source or CSS is edited and no performance result is inferred.'};
const output=resolve(root,'reports/v5/CXV/V7-F-victory-early-composition.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,earlyFreezeReproducesVariant:report.earlyFreezeReproducesVariant,naturalCandidateReproducesVariant:report.naturalCandidateReproducesVariant,allCapturesMatchOriginalBaseline:report.allCapturesMatchOriginalBaseline,captures:captures.map(c=>({trial:c.trial,name:c.name,variant:c.variant,draws:c.state.draws})),sheet:path}));
