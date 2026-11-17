/** Independent recheck on a newly built immutable SHIP target. */
import {runJourneys} from './journey.mjs';
import {writeFileSync} from 'node:fs';
const qa='/Users/bao/taskbar-hero-qa';
const attempt=process.argv[2]??'2';
if(!/^\d+$/.test(attempt))throw Error('Numeric build attempt required');
const label=`q2-current-build-${attempt}`;
const {report}=await runJourneys({
  url:'http://127.0.0.1:6200',allowGuestTx:true,label,measureSceneReady:true,
  buildPath:`${qa}/reports/v4-qa/Q1/build-${attempt}.json`,
  reportRoot:`${qa}/reports/v4-qa/Q2`,
  viewports:[{width:1440,height:900},{width:390,height:844}],
});
const evidence={at:new Date().toISOString(),sourceSha:report.sourceSha,
  raw:`Q2/${label}/results.json`,scope:'Fresh local production profiles; no public Fuji writes',
  runs:report.runs.map(row=>({id:row.id,verdict:row.verdict,failure:row.failure,
    battleBytes:row.transferAtBattle?.bytes,inFlight:row.inFlightAtBattle,
    sceneReadyBytes:row.transferAtSceneReady?.bytes,sceneReadyMs:row.sceneReadyMs,
    inFlightAtSceneReady:row.inFlightAtSceneReady,sceneReadyDefinition:row.sceneReadyDefinition,
    firstBattleMs:row.firstBattleMs,firstReceiptMs:row.firstReceiptMs,
    steps:row.steps.map(s=>s.name),receipts:row.receipts.length,
    proofReady:row.walletProof?.ready,layouts:row.layouts,
    errors:row.errors,failedRequests:row.failedRequests,assertions:row.assertions})),
};
writeFileSync(`${qa}/reports/v4-qa/Q2/current-build-${attempt}-recheck.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(`COMPLETE current target ${report.sourceSha}; inspect transfer, layouts and loaded proof before closing findings`);
