import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {T,CARDS} from './thresholds.mjs';
import {checkGates,qualifiesPartial,formatGate} from './check-gates.mjs';

// Independent literal transcription of the numerical gates in the user's Revision 2.
// Do not regenerate this fixture from thresholds.mjs or tune it to observed results.
const PROMPT = {
  researchWindows:10,researchCandidates:120,researchNewLevers:8,
  mappedEvents:160,mappedScreens:18,unresolvedCues:0,
  sourceClips:350,catRecordings:15,catAuthors:6,consonantGrains:40,
  ambienceBeds:6,musicPieces:8,stings:8,licenceCoverage:1,forbiddenLicences:0,
  hitLayers:3,hitLayerVariants:4,uiVariants:2,consecutiveRepeats:0,
  sfxConcurrency:14,voiceConcurrency:1,shippedAudioBytes:16_000_000,cpuAddedPercent:8,
  battleSeconds:180,bossSeconds:120,menuSeconds:60,
  cats:12,voiceLinesPerCat:9,consonantsPerSyllable:0.5,
  sourceDistancePercentile:25,nearestF0Semitones:3,
  voiceLufs:-16,voiceLufsTolerance:1,voiceIntervalMin:6,voiceIntervalMax:9,
  calloutCoverage:1,ultimateVariants:2,ultWordAccuracy:0.70,skillWordAccuracy:0.50,
  missingUltimateCallouts:0,truePeakDbTP:-1,calloutPartialIterations:4,
  auditedScreens:24,uiArtFiles:60,uiArtBytes:8_000_000,referenceGeneratorInputs:0,
  visibleWords:25,plainTextButtons:2,systemFonts:0,unicodeIcons:0,
  screenAverageScore:8,criterionScore:7,rebuiltScreens:24,
  partialRebuiltScreens:20,partialRedesignIterations:2,
  uiTourSeconds:60,uiTourBytes:25_000_000,layoutShiftThreshold:0.05,
  excessiveLayoutShifts:0,transitionMedianFps:60,
  onsetRelativeTolerance:0.30,layerMedianAllowance:0.5,
  tickRelativeTolerance:0.40,musicBedFraction:0.95,voiceRelativeTolerance:0.35,
  silenceFractionAllowance:0.03,battleLufsMin:-16,battleLufsMax:-13,
  menuLufsMin:-20,menuLufsMax:-16,soundReelSeconds:90,
  duckDb:-8,duckAttackMs:120,duckReleaseMs:400,mixPartialIterations:8,
  interactiveCueCoverage:0.95,audioErrors:0,maxMusicGapMs:400,
  labCueCoverage:1,labRandomPlays:20,
  seeds:200,economyRuntimeSeconds:1800,playerMixes:3,
  demandLevels:2,botLevels:3,tokenWeeks:52,
  newSinks:3,searchLevers:10,fastSearchSeeds:40,confirmedTopConfigs:10,
  tuningRounds:15,leversChangedPerRound:2,searchedConfigs:600,structuralChanges:3,
  burnClaimsMin:1,fullDemandBurnClaimsMax:1.60,starRatioMin:0.90,starRatioMax:1.10,
  hourlyRatioMax:3,casualLegendaryMin:10,casualLegendaryMax:16,
  heavyLegendaryMin:5,heavyLegendaryMax:9,botHourlyRatioMax:0.5,
  topPercentWithdrawnShareMax:0.08,robustBurnMin:0.95,
  robustStarMin:0.80,robustStarMax:1.20,sensitivityDelta:0.20,paretoConfigs:20,
  baseAnvilReceipts:13,reportSampledNumbers:10,priceMedianDays:7,
  tutorialWords:12,tutorialOwnedFallbacks:0,tutorialPaddingPx:8,
  tutorialMissingTargetMs:2000,liveCounterMinimum:3,liveCounterTotal:4,
  rpcTimeoutMs:6000,rpcCacheMs:60000,rpcRetries:2,
  sync16:'2026-11-16T12:00:00Z',sync18:'2026-11-18T12:00:00Z',freeze:'2026-11-19T12:00:00Z',
};
function fixture(t) {
  const root=mkdtempSync(join(tmpdir(),'v3b2-gates-'));
  t.after(()=>rmSync(root,{recursive:true,force:true}));
  const put=(path,value)=>{const p=join(root,path);mkdirSync(dirname(p),{recursive:true});const s=typeof value==='string'?value:JSON.stringify(value);writeFileSync(p,s);return {path,sha256:createHash('sha256').update(s).digest('hex')};};
  const report=(name,value)=>put('reports/v3-shell/b2/'+name,value);
  const rows=()=>checkGates({root,now:new Date('2026-11-13T05:00:00Z')});
  const gate=id=>rows().find(r=>r.id===id);
  return {root,put,report,rows,gate};
}
test('every threshold equals the user prompt, including strict numeric endpoints',()=>assert.deepEqual(T,PROMPT));
test('threshold table is frozen',()=>assert.throws(()=>{T.sourceClips=20;},TypeError));
test('all required gate IDs and thresholds are listed with measurements',t=>{
  const f=fixture(t),rows=f.rows();
  assert.deepEqual([...new Set(rows.map(r=>r.card))],CARDS);
  assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
  for(const r of rows){assert.ok(r.threshold);assert.match(formatGate(r),/measured .+; required /);}
});
test('absent evidence fails every production gate, including maximum and every checks',t=>{
  const rows=fixture(t).rows();
  assert.equal(rows.find(r=>r.id==='G0.inventory').status,'PASS');
  assert.deepEqual(rows.filter(r=>r.id!=='G0.inventory'&&r.status!=='FAIL'),[]);
});
test('malformed JSON cannot pass a gate or crash the entire checker',t=>{
  const f=fixture(t);f.report('UI-AUDIT.json','{oops');f.report('VOICE-DISTINCT.json','null');
  assert.equal(f.gate('U1.screens').status,'FAIL');assert.equal(f.gate('S4.distinct').status,'FAIL');
});
test('empty arrays cannot pass universal checks',t=>{
  const f=fixture(t);f.report('VOICE-DISTINCT.json',{cats:[]});f.report('econ/FINAL.json',{scenarios:[],sensitivity:[]});
  assert.equal(f.gate('S4.distinct').status,'FAIL');assert.equal(f.gate('E3.T-a').status,'FAIL');assert.equal(f.gate('E3.T-h').status,'FAIL');
});
test('a missing trace cannot pass the CPU gate despite a small reported percentage',t=>{
  const f=fixture(t);f.report('AUDIO-PERFORMANCE.json',{addedMainThreadPercent:1,traces:[{path:'absent',sha256:'bad',durationSeconds:180}]});
  assert.equal(f.gate('S3.cpu').status,'FAIL');
});
test('strict CPU limit rejects exactly 8 percent and accepts 7.99 with a verified trace',t=>{
  const f=fixture(t),trace={...f.put('trace.json','actual trace fixture'),durationSeconds:180};
  f.report('AUDIO-PERFORMANCE.json',{addedMainThreadPercent:8,traces:[trace]});assert.equal(f.gate('S3.cpu').status,'FAIL');
  f.report('AUDIO-PERFORMANCE.json',{addedMainThreadPercent:7.99,traces:[trace]});assert.equal(f.gate('S3.cpu').status,'PASS');
});
test('hash mismatches invalidate evidence logs',t=>{
  const f=fixture(t),log=f.put('types.log','passed 2');f.report('GATE-TESTS.json',{exitCode:0,passed:2,log});
  assert.equal(f.gate('G0.tests').status,'PASS');f.put('types.log','modified');assert.equal(f.gate('G0.tests').status,'FAIL');
});
test('full-demand burn gate rejects a deflationary 1.61, accepts the exact 1.60 limit',t=>{
  const f=fixture(t),report=n=>f.report('econ/FINAL.json',{scenarios:[{demand:1,quantiles:{median:{burnClaims:n}}}]});
  report(1.61);assert.equal(f.gate('E3.T-a').status,'FAIL');report(1.60);assert.equal(f.gate('E3.T-a').status,'PASS');
});
test('sensitivity needs both positive and negative perturbations for each assumption',t=>{
  const f=fixture(t),r={assumption:'demand',cases:[{delta:0.2,scenarios:[{burnClaims:1,starRatio:1}]}]};
  f.report('econ/FINAL.json',{sensitivity:[r]});assert.equal(f.gate('E3.T-h').status,'FAIL');
  r.cases.push({delta:-0.2,scenarios:[{burnClaims:1,starRatio:1}]});f.report('econ/FINAL.json',{sensitivity:[r]});assert.equal(f.gate('E3.T-h').status,'PASS');
});
test('future-dated evidence cannot pre-complete sync or freeze',t=>{
  const f=fixture(t);f.report('SYNC-16.json',{at:T.sync16});f.report('SYNC-18.json',{at:T.sync18});f.report('FREEZE.json',{at:T.freeze});
  for(const id of ['SY1.time','SY2.time','SY3.time'])assert.equal(f.gate(id).status,'FAIL');
});
test('claimed PARTIAL cannot bypass missing evidence or minimum gates',()=>{
  for(const card of CARDS) assert.equal(Boolean(qualifiesPartial(card,{voice:{allUnitsCovered:true,onlyRecognizerMisses:true,processingIterations:4},s5:{mixIterations:8,sessionABlocker:'A'}})),false,card);
});
test('disallowed non-commercial audio is rejected even when its file hash matches',t=>{
  const f=fixture(t),a=f.put('assets/audio-sources/test.opus','audio fixture');
  f.put('apps/web/public/audio/LICENSES.json',{files:[{...a,sourceUrl:'https://example.test/source',author:'Fixture',date:'2026-11-13',license:'CC-BY-NC-4.0'}]});
  assert.equal(f.gate('S2.licenceCoverage').status,'PASS');assert.equal(f.gate('S2.licences').status,'FAIL');
});
