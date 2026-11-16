/** Bind the installed ranged runtime's complete measurements; retain unverified gates. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-validation-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const reference=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=s=>{const b=readFileSync(resolve(root,s.path));assert.equal(hash(b),s.sha256,s.path);return b;};
const cb='reports/v4-ship/S5/ranged-coverage-1',eb='reports/v4-ship/S5/ranged-endurance-1';
const coverage=read(cb+'/check.json'),cv=read(cb+'/validation.json'),endurance=read(eb+'/check.json'),ev=read(eb+'/validation.json');
const speech=read(cb+'/intelligibility.json'),ui=read('reports/v4-ship/S5/ranged-ui-duration-1.json'),settings=read('reports/v4-ship/S5/ranged-settings-1/UI-AUDIO-SETTINGS.json');
const schedulerPath='reports/v4-ship/S11/ranged-runtime-playback-1.json',scheduler=read(schedulerPath),schedulerReviewPath='reports/v4-ship/S11/ranged-runtime-review-1.json',schedulerReview=read(schedulerReviewPath);
const productionPath='reports/v4-ship/S11/ranged-production-validation-1.json',production=read(productionPath);
const evidence=[cb+'/check.json',cb+'/validation.json',cb+'/intelligibility.json',eb+'/check.json',eb+'/validation.json','reports/v4-ship/S5/ranged-ui-duration-1.json','reports/v4-ship/S5/ranged-settings-1/UI-AUDIO-SETTINGS.json',schedulerPath,schedulerReviewPath,productionPath];
for(const r of [coverage,endurance,ui,settings,scheduler]){assertUnchanged(root,r.signature);assert.deepEqual(r.signature,coverage.signature);}
for(const r of [coverage,endurance])verify(r.harness);
assert.deepEqual(JSON.parse(verify(speech.captureReport)).signature,coverage.signature);for(const row of speech.rows)verify(row.crop);
assert.equal(hash(gunzipSync(verify(settings.bundledLog))),settings.sha256);
assert.equal(coverage.rows.length,5);assert.equal(endurance.rows.length,1);assert.equal(endurance.rows[0].name,'boss');assert.equal(ui.rows.length,34);assert.equal(settings.tests,15);
assert.deepEqual(new Set(coverage.rows.map(r=>r.name)),new Set(['wave1','wave3','home','bag','forge']));
assert.equal(cv.trial,coverage.trial);assert.equal(ev.trial,endurance.trial);
const durationRows=[];
for(const report of [coverage,endurance])for(const row of report.rows){
 verify(row.capture);verify(row.events);
 durationRows.push({trial:report.trial,scene:row.name,wallSeconds:row.actualSeconds,restarts:row.restarts,...decodedDuration(resolve(root,row.capture.path))});
}
for(const ref of [...scheduler.harness,...scheduler.signature])verify(ref);verify(scheduler.events);verify(schedulerReview.input);verify(schedulerReview.events);
assert(scheduler.pass&&schedulerReview.pass&&scheduler.summary.cases===168);
verify(production.harness);for(const input of production.inputs)verify(input);
assert(production.actualBothViewportJourneysVerified&&production.rangedPhasesAndPreloadsVerified&&production.healerRoutingPreserved);
for(const row of production.rows){
 verify(row.evidence);verify(row.events);verify(row.capture);
 assert.equal(execFileSync('git',['diff','--name-only',row.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim(),'');
}
const regPath='reports/v4-ship/S11/ranged-evidence-regression-1/check.json',reg=read(regPath);verify(reg.log);
assert(reg.complete&&reg.rows.length===6&&reg.rows.every(r=>r.exitCode===(r.name==='web'?1:0)));
const logText=s=>gunzipSync(verify(s)).toString().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'');
const fail=t=>t.split('\n').filter(l=>l.includes(' FAIL ')).map(l=>l.trim());
const priorLog=reference('reports/v4-ship/S11/history-checkpoint-regression-6/log.jsonl.gz'),oldFailures=fail(logText(priorLog)),failures=fail(logText(reg.log));assert.equal(failures.length,7);assert.deepEqual(failures,oldFailures);
const measurements=[cv,ev],all=key=>measurements.every(r=>r.gates[key]===true),rows=measurements.flatMap(r=>r.rows);
const perSceneMix=rows.map(r=>({name:r.name,lufs:r.lufs,lra:r.lra,peak:r.peak,loudnessPass:r.lufs>=-20&&r.lufs<=-16,loudnessRangePass:r.lra>=5,truePeakPass:r.peak<=-1}));
const continuous=durationRows.filter(r=>r.trial===endurance.trial).every(r=>r.wallSeconds>=1800&&r.encodedSeconds>=1800&&r.timestampSpanSeconds>=1800&&r.restarts>0);
const gates={continuous30Minutes:continuous,representativeScenes:['wave1','wave3','boss','home','bag','forge'].every(name=>rows.some(r=>r.name===name)),loudness:all('loudness')&&production.rows.every(r=>r.mixGates.loudness),truePeak:all('truePeak')&&production.rows.every(r=>r.mixGates.truePeak),loudnessRange:all('loudnessRange')&&production.rows.every(r=>r.mixGates.loudnessRange),sourceBudget:all('sourceBudget')&&production.sourceStartCeilingPass,duckDepth:all('duckDepth')&&production.duckAndRecoveryPass,duckRecovery:all('duckRecovery')&&production.duckAndRecoveryPass,zeroErrors:all('zeroErrors'),voiceUninterrupted:rows.every(r=>r.voiceInterruptions===0)&&production.voiceUninterrupted,
  perSceneMix:perSceneMix.every(r=>r.loudnessPass&&r.loudnessRangePass&&r.truePeakPass),uiDuration:ui.pass,persistedMix:settings.passed,encounteredJourneyControlsAndReceipts:true,encounteredRangedPhasesAndHealers:true,installedRangedScheduler168Cases:true,
  estimatedOnset:rows.every(r=>r.estimatedOnsetPass===true)&&scheduler.summary.estimatesOutside33ms===0&&production.rows.every(r=>r.contactEstimatesOutside33ms===0),
  intelligibilityProxy:speech.measured===12&&speech.exact>=10&&speech.rows.every(r=>!r.interrupted),humanListening:speech.humanListeningPass===true,physicalAudibleOnset:false,completePerceptualWeaponCoverage:false};
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:reference(relative(root,import.meta.filename)),runtimeSignature:coverage.signature,evidence:evidence.map(reference),durationRows,coverage:cv,endurance:ev,gates,overallAudioGatePass:Object.values(gates).every(Boolean),recognition:{measured:speech.measured,exact:speech.exact,automatedProxyPass:speech.automatedProxyPass,humanListeningPass:speech.humanListeningPass},production:{evidence:reference(productionPath),sceneMixPass:production.mixGatesPass,causalContacts:production.rows.reduce((n,r)=>n+r.causalContacts,0),rangedPlans:production.rows.reduce((n,r)=>n+r.rangedPlans,0),healerContacts:production.rows.reduce((n,r)=>n+r.healerContacts,0),receipts:production.rows.reduce((n,r)=>n+r.verifiedReceipts,0),sceneReadyBytes:production.rows.map(r=>r.sceneReadyBytes),transferPass:production.rows.every(r=>r.transferPass)},regression:{check:reference(regPath),log:reg.log,priorLog,sameSevenArtFailures:true,failures,gRegPass:false,officialClassParityPass:false},limits:['Fixture coverage and uninterrupted endurance are separate captures; production15 supplies complete-journey evidence.','Output timestamps and ASR remain proxies for physical onset and human listening.','The production encounters cover only their actors. The separate fixture checks all14ranged actions; this is not a universal perceptual distinction claim.','Transfer and seven ART failures remain open independently of audio measurements.']};
report.perSceneMix=perSceneMix;report.limits.push('Loudness/peak/range aggregate gates do not establish every scene; the separate perSceneMix gate retains bag/forge range failures.');
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),gates,recognition:report.recognition,overallAudioGatePass:report.overallAudioGatePass}));
