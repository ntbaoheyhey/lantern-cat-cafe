/** Verify installed ranged cues in complete shipping journeys without inferring physical onset. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-production-validation-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path))),verify=s=>{const bytes=readFileSync(resolve(root,s.path));assert.equal(hash(bytes),s.sha256,s.path);return bytes;};
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),runtimePath='reports/v4-ship/S11/ranged-runtime-playback-1.json',runtime=read(runtimePath),rows=[];
assert(runtime.pass&&runtime.summary.cases===168);for(const s of [...runtime.signature,...runtime.harness])verify(s);verify(runtime.events);
for(const [i,number]of [7,8].entries()){
 const path=`reports/v4-ship/S11/scene-journey-${number}.json`,report=read(path),raw=JSON.parse(gunzipSync(verify(report.events)));
 for(const s of report.harness)verify(s);verify(report.capture);
 assert.equal(report.viewport.width,i?1440:1280);assert(report.journeyPass&&report.rollback&&report.receiptVerification.pass);
 assert.equal(report.receiptVerification.receiptCount,18);assert(report.audio.primaryControlsPass&&report.audio.everyReceiptChimePass&&report.audio.sourceBudgetPass&&report.impact.observedImpactCoveragePass);
 assert(report.sceneAudio.correctBattleBeds&&report.sceneAudio.firstContactsPredecoded&&report.rehearsal.gates.noDevelopmentPath);
 const plans=raw.impact.plans.filter(p=>p.expectsAction&&!p.gallery),ranged=[],healers=[];
 for(const p of plans){
  const events=raw.impact.events.filter(e=>e.plan===p.sequence),contact=raw.impact.submissions.find(s=>s.plan===p.sequence),c=inventory.rows.find(c=>c.owner===p.owner&&c.ultimate===p.ultimate);
  assert(contact&&contact.sceneReady&&contact.canvasVisible&&contact.documentVisible);
  if(c){
   const phases=c.hasFlight?['release','travel','impact']:['impact'],observed=[];
   for(const role of phases){
    const selected=events.filter(e=>e.role===role);assert.equal(selected.length,1);const event=selected[0];assert.equal(event.requests.length,1);
    assert.equal(event.cue,`kit.ranged-${c.element}.${role}`);const starts=raw.starts.filter(s=>event.requests.includes(s.request)&&!s.loop);assert.equal(starts.length,1);
    const request=raw.scene.requests.find(r=>r.request===event.requests[0]);assert(request&&starts.every(s=>request.decoded.includes(s.pack)));
    if(role!=='impact')assert(event.performanceMs<contact.performanceMs,'Flight request reached contact');
    observed.push({role,cue:event.cue,sourceCount:starts.length,sourcePack:starts[0].pack,predecoded:true,requestMinusContactMs:event.performanceMs-contact.performanceMs});
   }
   if(!c.hasFlight)assert(!events.some(e=>e.role==='release'||e.role==='travel'));
   ranged.push({scene:p.scene,plan:p.sequence,owner:p.owner,ultimate:p.ultimate,phases:observed});
  }
  if(p.owner==='clover'){
   const impact=events.filter(e=>e.role==='impact'),starts=raw.starts.filter(s=>impact.some(e=>e.requests.includes(s.request))&&!s.loop);
   assert.equal(impact.length,1);assert.equal(impact[0].cue,'heal.medium');assert.equal(starts.length,1);assert(/maximize_(001|003|005|006):/.test(starts[0].variantId));
   assert(!events.some(e=>['movement','release','travel','tail'].includes(e.role)));healers.push(p.sequence);
  }
 }
 assert(ranged.length>0&&healers.length===16);
 const unchanged=execFileSync('git',['diff','--name-only',report.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim();assert.equal(unchanged,'');
 rows.push({evidence:signed(path),events:report.events,capture:report.capture,viewport:report.viewport,sourceCommit:report.sourceCommit,verifiedReceipts:report.receiptVerification.receiptCount,causalContacts:report.impact.causallyPlayedContacts,rangedPlans:ranged.length,ranged,healerContacts:healers.length,normalBattleBeds:true,firstContactsPredecoded:true,
  mix:report.mix,mixGates:report.mixGates,duck:report.sceneAudio.duck,voiceInterruptions:report.sceneAudio.voiceInterruptions,maximumStartsPer100ms:report.audio.maxStartsPer100ms,
  maximumAbsoluteContactOnsetEstimateMs:Math.max(...report.impact.rows.map(r=>Math.abs(r.estimatedAudioAfterSubmissionMs))),contactEstimatesOutside33ms:report.impact.rows.filter(r=>!r.within33msEstimate).length,
  sceneReadyBytes:report.rehearsal.transfer.conservativeTransferBytes,transferPass:report.rehearsal.gates.transfer,boss:report.rehearsal.boss});
}
assert.equal(rows[0].sourceCommit,rows[1].sourceCommit);
const regPath='reports/v4-ship/S11/ranged-integration-regression-comparison-1.json',reg=read(regPath);assert(reg.sameSevenArtFailures&&reg.typecheck&&reg.threeFixtureProbe&&reg.build);for(const s of reg.inputs)verify(s);
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:signed(relative(root,import.meta.filename)),inputs:[signed(inventoryPath),signed(runtimePath),signed(regPath)],rows,installedScheduler168CasesVerified:true,actualBothViewportJourneysVerified:true,rangedPhasesAndPreloadsVerified:true,healerRoutingPreserved:true,
 mixGatesPass:rows.every(r=>Object.values(r.mixGates).every(Boolean)),sourceStartCeilingPass:rows.every(r=>r.maximumStartsPer100ms<=6),duckAndRecoveryPass:rows.every(r=>r.duck.depthPass&&r.duck.recoveryPass),voiceUninterrupted:rows.every(r=>r.voiceInterruptions===0),
 physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false,gRegPass:false,officialClassParityPass:false,
 limits:['Production journeys prove only their encountered ranged classes; all14actions and speed changes are covered by the separate installed-scheduler fixture capture.','Full-scene telemetry attributes flight audio to the same action before rendered contact; it does not measure flight pixels or acoustic onset.','These two production journeys do not replace ten required rehearsals. Transfer, human intelligibility and physical timing remain separate gates.','Compared takes are randomized; mix observations are not a controlled perceptual experiment.']};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),rows:rows.map(({ranged,...r})=>r),mixGatesPass:report.mixGatesPass,overallAudioGatePass:false}));
