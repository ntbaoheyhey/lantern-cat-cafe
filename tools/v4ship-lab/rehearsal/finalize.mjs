import {existsSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {median} from './metrics.mjs';
const root=resolve(import.meta.dirname,'../../..'),trial=process.argv[2],name=process.argv[3];
if(!/^[\w-]+$/.test(trial)||!/^[\w-]+\.json$/.test(name))throw Error('Specify preserved trial and new report name');
const folder=resolve(root,'reports/v4-ship/RUNS',trial),out=resolve(root,'reports/v4-ship/S8',name);
if(existsSync(out))throw Error('Preserve earlier validation');
const paths=readdirSync(folder).filter(n=>/^run-\d+-\d+\.json$/.test(n)).sort().map(n=>resolve(folder,n));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),runs=paths.map(p=>JSON.parse(readFileSync(p))),all=f=>runs.length===10&&runs.every(f);
const gates={tenComplete:all(r=>r.complete&&r.pass&&r.viewport.width===1280&&r.viewport.height===720),
 realProductionBuild:all(r=>r.buildEvidence?.buildComplete===true&&r.mode==='production Vite build + vite preview + isolated Anvil/SQL'),
 stableRuntime:all(r=>r.runtimeStable),
 boundHarness:all(r=>r.harness?.length===4&&r.harness.every(h=>hash(readFileSync(resolve(root,h.path)))===h.sha256)),
 noDevelopmentPaths:all(r=>r.rehearsal?.gates.noDevelopmentPath===true),
 transfer:all(r=>r.rehearsal?.transfer.valid&&r.rehearsal.transfer.conservativeTransferBytes<=8_000_000),
 bossFps:all(r=>r.rehearsal?.boss.valid&&r.rehearsal.boss.hiddenFrames===0&&r.rehearsal.boss.medianFps>=50&&r.rehearsal.boss.seconds>=r.bossMs/1000*.9),
 receiptValuesAndHistory:all(r=>r.receiptVerification?.pass===true)};
const report={at:new Date().toISOString(),trial,scope:'Production Vite preview with local API and Anvil; no public deployment or Fuji transaction latency claim.',gates,pass:Object.values(gates).every(Boolean),
 firstBattleMedianMs:median(runs.map(r=>r.firstBattleMs).filter(Number.isFinite)),firstReceiptMedianMs:median(runs.map(r=>r.firstReceiptMs).filter(Number.isFinite)),
 bossMedianFps:median(runs.map(r=>r.rehearsal?.boss?.medianFps).filter(Number.isFinite)),
 maximumInitialTransferBytes:runs.length?Math.max(...runs.map(r=>r.rehearsal?.transfer?.conservativeTransferBytes??0)):null,
 sourceCommits:[...new Set(runs.map(r=>r.sourceCommit))],buildSourceCommits:[...new Set(runs.map(r=>r.buildEvidence?.sourceCommit))],
 runs:runs.map(r=>({id:r.id,pass:r.pass,failure:r.failure??r.rehearsal?.failure,firstBattleMs:r.firstBattleMs,firstReceiptMs:r.firstReceiptMs,bossMs:r.bossMs,boss:r.rehearsal?.boss,initialTransferBytes:r.rehearsal?.transfer?.conservativeTransferBytes})),
 evidence:paths.map(p=>({path:relative(root,p),sha256:hash(readFileSync(p))}))};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:report.pass,gates,bossMedianFps:report.bossMedianFps,maximumInitialTransferBytes:report.maximumInitialTransferBytes}));
if(!report.pass)process.exitCode=1;
