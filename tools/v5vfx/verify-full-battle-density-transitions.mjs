/** Verify live-density battles against the preserved static-DPR2 natural control. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const out=resolve(process.env.CXV_FULL_INPUT??resolve(root,'work/v5/CXV/films/V7-F-full-battle-density-transitions'));
const reportPath=resolve(process.env.CXV_FULL_REPORT??resolve(root,'reports/v5/CXV/V7-F-full-battle-density-transitions.json'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));assert(reportPath.startsWith(resolve(root,'reports/v5/CXV')+'/'));
const report=await read(reportPath),raw=await read(resolve(out,'report.json'));
const baseline=await read(resolve(root,'reports/v5/CXV/V7-F-full-battle-desktop-density.json'));
const prior=await read(baseline.raw.path),priorRoot=resolve(baseline.raw.path,'..');
assert.equal(hash(await readFile(report.raw.path)),report.raw.sha256);
assert.equal(hash(await readFile(baseline.raw.path)),baseline.raw.sha256);
assert(raw.pass&&prior.pass&&report.pass);
assert.equal(raw.cpuRate,4);assert.equal(prior.cpuRate,4);
assert.equal(raw.deviceScaleFactor,2);assert.equal(prior.deviceScaleFactor,2);
assert.deepEqual(raw.viewport,{width:1280,height:720});
assert.equal(raw.local,true);assert.equal(raw.artifactIdentity.buildRuntimePatchSha256,hash(''));
const provenance=await read(resolve(out,'tool-provenance.json'));
assert.equal(provenance.source,raw.servedSource);
assert.equal(provenance.indexSha256,raw.indexSha256);
assert.equal(provenance.manifestSha256,raw.artifactIdentity.buildManifestSha256);
for(const file of provenance.provenance)assert.equal(hash(await readFile(resolve(out,file.name))),file.sha256);
assert.equal(hash(await readFile(resolve(out,'capture-full-battle-production.mjs'))),raw.harnessSha256);
assert.equal(hash(await readFile(resolve(out,'production-candidate-fixture.mjs'))),raw.productionFixtureSha256);
const rows=[];
const plansWithoutClock=plans=>plans.map(({wallMs,...p})=>p);
for(const run of raw.runs){
 const control=prior.runs.find(r=>r.mode===run.mode);assert(control);
 const initial=await read(resolve(out,run.mode,'initial.json'));
 const controlInitial=await read(resolve(priorRoot,run.mode,'initial.json'));
 const timeline=await read(resolve(out,run.mode,'timeline.json'));
 const controlTimeline=await read(resolve(priorRoot,run.mode,'timeline.json'));
 assert.deepEqual(initial.battle,controlInitial.battle);
 assert.equal(run.initialBattleSha256,control.initialBattleSha256);
 assert.deepEqual(run.final.actors,control.final.actors);
 assert.equal(run.final.result,control.final.result);assert.equal(run.final.round,control.final.round);
 assert.deepEqual(timeline.log,controlTimeline.log);
 assert.deepEqual(plansWithoutClock(timeline.plans),plansWithoutClock(controlTimeline.plans));
 assert.equal(run.actions,68);assert.equal(run.ultimates.length,24);
 assert.deepEqual(run.errors,[]);assert.deepEqual(run.blockedRequests,[]);
 assert.equal(run.densityTransitions.length,3);
 const measured=report.runs.find(r=>r.mode===run.mode);assert.equal(measured.densityTransitions.length,3);
 rows.push({mode:run.mode,initialBattleExact:true,finalActorsExact:true,roundExact:true,resultExact:true,
  ruleLogExact:true,presentationsWithoutWallClockExact:true,actions:run.actions,ultimates:run.ultimates.length,
  transitions:run.densityTransitions.length,victoryTransitions:run.victoryDensityTransitions?.length??0,statusEvents:measured.statusEvents});
}
report.controlComparison={utc:new Date().toISOString(),baseline:baseline.raw,baselineSource:prior.servedSource,
 baselineIndexSha256:prior.indexSha256,source:raw.servedSource,rows,
 toolSnapshotsVerified:provenance.provenance.length,emptyRuntimePatch:true,
 limitation:'Natural runs share exact seeded rules and action order, not synchronized pixels or timing. CDP density emulation is not physical multi-monitor event-delivery coverage.'};
report.measurementToolSha256=hash(await readFile(resolve(root,'tools/v5vfx/measure-full-battle-production.mjs')));
await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({reportPath,pass:true,rows,toolSnapshotsVerified:provenance.provenance.length}));
