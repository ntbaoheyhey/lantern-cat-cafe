/** Bind the corrected healer's independent measurements without claiming global acceptance. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
import {decodedDuration} from './duration.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/healer-validation-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex');
const reference=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=item=>{const bytes=readFileSync(resolve(root,item.path));assert.equal(hash(bytes),item.sha256,item.path);return bytes;};
const cbase='reports/v4-ship/S5/healer-coverage-1',ebase='reports/v4-ship/S5/healer-endurance-1';
const coverage=read(cbase+'/check.json'),cv=read(cbase+'/validation.json'),speech=read(cbase+'/intelligibility.json');
const ui=read('reports/v4-ship/S5/healer-ui-duration-1.json'),settings=read('reports/v4-ship/S5/healer-settings-1/UI-AUDIO-SETTINGS.json');
const evidence=[cbase+'/check.json',cbase+'/validation.json',cbase+'/intelligibility.json','reports/v4-ship/S5/healer-ui-duration-1.json','reports/v4-ship/S5/healer-settings-1/UI-AUDIO-SETTINGS.json'];
for(const report of [coverage,ui,settings]){assertUnchanged(root,report.signature);assert.deepEqual(report.signature,coverage.signature);}
const frozen=JSON.parse(verify(speech.captureReport));assert.deepEqual(frozen.signature,coverage.signature);for(const r of speech.rows)verify(r.crop);
assert.equal(hash(gunzipSync(verify(settings.bundledLog))),settings.sha256);
assert.equal(coverage.rows.length,5);assert.equal(ui.rows.length,34);assert.equal(settings.tests,15);
const durationRows=[];
for(const row of coverage.rows){verify(row.capture);verify(row.events);durationRows.push({scene:row.name,wallSeconds:row.actualSeconds,...decodedDuration(resolve(root,row.capture.path))});}
let endurance=null,ev=null;
if(existsSync(resolve(root,ebase+'/validation.json'))){
 endurance=read(ebase+'/check.json');ev=read(ebase+'/validation.json');assertUnchanged(root,endurance.signature);assert.deepEqual(endurance.signature,coverage.signature);
 for(const row of endurance.rows){verify(row.capture);verify(row.events);durationRows.push({scene:row.name,wallSeconds:row.actualSeconds,restarts:row.restarts,...decodedDuration(resolve(root,row.capture.path))});}
 evidence.push(ebase+'/check.json',ebase+'/validation.json');
}
const journeys=[];
for(const [i,width] of [[3,1280],[4,1440]]){
 const path=`reports/v4-ship/S11/impact-journey-${i}.json`,j=read(path),data=JSON.parse(gunzipSync(verify(j.events)));assert(j.journeyPass&&j.rollback&&j.viewport.width===width);
 assert(j.impact.observedImpactCoveragePass&&j.audio.primaryControlsPass&&j.audio.everyReceiptChimePass&&j.audio.sourceBudgetPass);
 for(const h of j.harness)verify(h);
 assert.equal(execFileSync('git',['diff','--name-only',j.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim(),'');
 const healers=data.impact.plans.filter(p=>p.owner==='clover'&&p.expectsAction),healerRows=healers.map(plan=>{
  const events=data.impact.events.filter(e=>e.plan===plan.sequence),contact=events.filter(e=>e.role==='impact'),starts=data.starts.filter(s=>contact.some(e=>e.requests.includes(s.request))&&!s.loop);
  const allStarts=data.starts.filter(s=>events.some(e=>e.requests.includes(s.request))&&!s.loop);
  const checks={oneHealingContact:contact.length===1&&contact[0].cue==='heal.medium',oneActualSource:starts.length===1,risingVariant:starts.length===1&&/maximize_(001|003|005|006):/.test(starts[0].variantId),noWeaponRoles:!events.some(e=>['movement','tail','release'].includes(e.role)),noImpactSamples:allStarts.every(s=>!s.variantId?.includes('impact-sounds'))};assert(Object.values(checks).every(Boolean));
  return {plan:plan.sequence,ultimate:plan.ultimate,impactMs:plan.impactMs,variants:starts.map(s=>s.variantId),checks};
 });assert.equal(healerRows.length,16);
 journeys.push({evidence:reference(path),events:j.events,viewport:j.viewport,sourceCommit:j.sourceCommit,journeyPass:j.journeyPass,rollback:j.rollback,verifiedReceipts:j.receiptVerification.receiptCount,controls:j.audio.controls.length,receiptChimes:j.audio.receipts.length,maxStartsPer100ms:j.audio.maxStartsPer100ms,causalContacts:j.impact.causallyPlayedContacts,healerRows,estimatedOnsetMaxMs:Math.max(...j.impact.rows.map(r=>r.estimatedAudioAfterSubmissionMs)),estimatedOver33ms:j.impact.rows.filter(r=>r.within33msEstimate===false).length});
}
const logs=['healer-regression-1','healer-validation-regression-1'].map(label=>{
 const path=`reports/v4-ship/S11/${label}/log.jsonl.gz`,s=gunzipSync(readFileSync(resolve(root,path))).toString().split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(r=>r.name==='web').map(r=>r.text).join('').replace(/\x1b\[[0-9;]*m/g,'');
 return {...reference(path),failures:s.split('\n').filter(l=>l.includes(' FAIL ')).map(l=>l.trim()),counts:s.split('\n').filter(l=>/^\s*(Test Files|Tests)\s/.test(l)).map(l=>l.trim())};
});assert.equal(logs[0].failures.length,7);assert.deepEqual(logs[0].failures,logs[1].failures);
const regPath='reports/v4-ship/S11/healer-validation-regression-1/check.json',reg=read(regPath);assert(reg.complete&&reg.rows.every(r=>r.exitCode===(r.name==='web'?1:0)));
const continuous=!!endurance&&endurance.rows.length===1&&durationRows.some(r=>r.scene==='boss'&&r.wallSeconds>=1800&&r.encodedSeconds>=1800&&r.timestampSpanSeconds>=1800&&r.restarts>0);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-healer-audio.md',status:endurance?'Fixture endurance and production healer semantics measured; global audio remains open.':'Healer coverage and production semantics measured; uninterrupted endurance still active.',
 harness:reference(relative(root,import.meta.filename)),evidence:evidence.map(reference),durationRows,coverage:cv,endurance:ev,continuous30Minutes:continuous,
 uiDurationPass:ui.pass,persistedMixPass:settings.passed,recognition:{measured:speech.measured,exact:speech.exact,automatedProxyPass:speech.automatedProxyPass,humanListeningPass:speech.humanListeningPass},journeys,
 regression:{check:reference(regPath),logs,sameSevenArtFailures:true,gRegPass:false,officialClassParityPass:false},
 actualJourneySoundscapeCorrect:false,soundscapeDiagnostic:'reports/v4-ship/S11/cold-contact-probe-1.json',completeWeaponCoveragePass:false,physicalAudiovisualOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false,
 limits:['Only Clover appears as a healer in these actual journeys; other healer routing has separate resolver/source evidence.','The production journey keeps the home bed because DemoJourney bypasses ShellV3 soundscape effects. Fixture mix measurements do not establish the production mix.','First-contact delay, ranged launch/travel, all-event onset, intelligibility and human listening remain separate.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),continuous30Minutes:continuous,healerContacts:journeys.reduce((n,j)=>n+j.healerRows.length,0),recognition:report.recognition,overallAudioGatePass:false}));
