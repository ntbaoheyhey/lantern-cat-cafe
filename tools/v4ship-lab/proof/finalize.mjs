/** Keep local funnel/proof measurements separate from public production gates. */
import {readFileSync,writeFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {funnelGate,learnGate} from '../../../scripts/v4ship/check-ship.mjs';

const root=resolve(import.meta.dirname,'../../..'),trial=process.argv[2],name=process.argv[3];
if(!/^[\w-]+$/.test(trial)||!/^[\w-]+\.json$/.test(name))throw Error('Specify journey directory and a new report filename');
const out=resolve(root,'reports/v4-ship/S4',name),folder=resolve(root,'reports/v4-ship/RUNS',trial);
if(existsSync(out))throw Error('Preserve previous validation');
const files=readdirSync(folder).filter(name=>/^run-\d+-\d+\.json$/.test(name)).sort();
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),read=path=>JSON.parse(readFileSync(path));
const runs=files.map(name=>read(resolve(folder,name))),funnel=funnelGate(runs),learning=learnGate('S4');
const complete=runs.length===20&&funnel.pass,all=test=>complete&&runs.every(test);
const commits=[...new Set(runs.map(r=>r.sourceCommit))];
const runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
const runtimeChanged=commits.length===1?execFileSync('git',['diff','--name-only',commits[0],'--',...runtimePaths],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean):['inconsistent runtime'];
const harnesses=runs.map(r=>JSON.stringify(r.harness));
const harnessVerified=all(r=>Array.isArray(r.harness)&&r.harness.length===3&&r.harness.every(h=>hash(readFileSync(resolve(root,h.path)))===h.sha256))&&new Set(harnesses).size===1;
const gates={
 funnel:funnel.pass,
 stableRuntime:all(r=>r.runtimeStable===true&&r.sourceChanges?.length===0&&r.runtimeChangesAtEnd?.length===0)&&commits.length===1&&!runtimeChanged.length,
 harnessVerified,
 receiptValuesAndHistory:all(r=>r.receiptVerification?.pass===true&&r.receiptVerification.rows.length===r.receipts.length),
 proofTextContrast:all(r=>r.proofContrastPass===true),
 measuredGeometryAndLabels:all(r=>Array.isArray(r.ui)&&r.ui.length>=13&&r.ui.every(u=>u.horizontalOverflow===false&&u.unlabeled?.length===0&&u.clipped?.length===0&&Number.isFinite(u.bodyWords)&&u.bodyWords<=25)),
 reloadRecovery:all(r=>r.reloadRecovery===true)
};
const publicRecovery=resolve(root,'reports/v4-ship/S4/counter-recovery.json');
const report={at:new Date().toISOString(),trial,sourceCommit:commits.length===1?commits[0]:null,
 scope:'Twenty fresh-profile development journeys against isolated Anvil/SQL. Does not prove production preview or public sponsored transaction latency.',
 gates,localJourneyPass:Object.values(gates).every(Boolean),funnel,learning,runtimeChanged,
 receiptCount:runs.reduce((n,r)=>n+r.receipts.length,0),
 runMeasurements:runs.map(r=>({id:r.id,firstBattleMs:r.firstBattleMs,firstBattleClicks:r.firstBattleClicks,firstReceiptMs:r.firstReceiptMs,bossMs:r.bossMs,complete:r.complete,pass:r.pass,receiptCount:r.receipts.length,historyKinds:r.historyKinds,proofLinks:r.proofLinks})),
 publicCounterRecovery:{pass:read(publicRecovery).pass,path:relative(root,publicRecovery),sha256:hash(readFileSync(publicRecovery))},
 publicSponsoredLatencyVerified:false,overallProofGatePass:false,fullUiGatePass:false,productionRehearsalPass:false,
 limitations:['Contrast measurements cover wallet/receipt text; this is not an all-screen AA audit.','Local transaction timing cannot establish Fuji latency.','The journey explicitly uses development parameters and cannot satisfy production rehearsal.'],
 evidence:files.map(name=>{const path=resolve(folder,name);return {path:relative(root,path),sha256:hash(readFileSync(path))};})};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({gates,localJourneyPass:report.localJourneyPass,funnel,receiptCount:report.receiptCount}));
if(!report.localJourneyPass)process.exitCode=1;
