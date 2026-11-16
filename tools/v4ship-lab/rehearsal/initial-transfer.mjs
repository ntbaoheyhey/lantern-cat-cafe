/** Cold production entry diagnostics. No screenshots, debug state, public writes or gate substitution. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {transferSummary} from './metrics.mjs';
import {waitForBattleReady} from './battle-ready.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S8/initial-transfer-${attempt}.json`);assert(!existsSync(output));
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')));stop();
const sha=b=>createHash('sha256').update(b).digest('hex');
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-11.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
assert.equal(execFileSync('git',['diff','--name-only',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim(),'');
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&sha(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={at:new Date().toISOString(),buildPath,sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,harnessSha256:sha(readFileSync(import.meta.filename)),metricsSha256:sha(readFileSync(resolve(root,'tools/v4ship-lab/rehearsal/metrics.mjs'))),rows:[],complete:false,observationPass:false,transferGate:false,limits:['Diagnostic first-battle entries only; not the ten complete rehearsal journeys or boss FPS gate.','Resource Timing excludes the navigation entry and can hide cross-origin sizes; CDP counts complete responses for every request started before battle.','Five-second landing dwell is an additional user-timing scenario, never a change to the measurement boundary.']};
const safe=x=>String(x).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
const pathOf=url=>{try{const u=new URL(url);return u.origin+u.pathname;}catch{return '[non-url]';}};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const fixture=async action=>{const response=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(response.ok,`Fixture ${action}: ${response.status}`);};
try{
 for(const [width,height] of [[1280,720],[1440,900]])for(const dwellMs of [0,5000]){
  stop();await fixture('begin');const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage(),cdp=await context.newCDPSession(page),initiators=new Map(),records=new Map(),devPaths=new Set();let closing=false;
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(()=>performance.setResourceTimingBufferSize(2000));
  cdp.on('Network.requestWillBeSent',e=>{const u=new URL(e.request.url);if(!['http:','https:'].includes(u.protocol))return;const path=pathOf(e.request.url);if(/\/(?:@vite|@fs|src)(?:\/|$)|\.tsx?$/.test(u.pathname)||u.searchParams.has('dev'))devPaths.add(path);records.set(e.requestId,{id:e.requestId,path,type:e.type,observed:0,finished:false,failed:false,cached:false});if(!initiators.has(path))initiators.set(path,{type:e.initiator.type,frames:(e.initiator.stack?.callFrames??[]).slice(0,4).map(f=>({path:pathOf(f.url),function:safe(f.functionName),line:f.lineNumber,column:f.columnNumber}))});});
  cdp.on('Network.responseReceived',e=>{const r=records.get(e.requestId);if(r){r.observed=e.response.encodedDataLength??0;r.cached=!!(e.response.fromDiskCache||e.response.fromServiceWorker||e.response.fromPrefetchCache);}});
  cdp.on('Network.dataReceived',e=>{const r=records.get(e.requestId);if(r)r.observed+=e.encodedDataLength;});
  cdp.on('Network.loadingFinished',e=>{const r=records.get(e.requestId);if(r){r.finished=true;r.totalBytes=e.encodedDataLength;r.observed=e.encodedDataLength;}});
  cdp.on('Network.loadingFailed',e=>{const r=records.get(e.requestId);if(r){r.finished=true;r.failed=true;}});
  cdp.on('Network.requestServedFromCache',e=>{const r=records.get(e.requestId);if(r)r.cached=true;});
  const boundary=()=>new Map([...records.values()].map(r=>[r.id,r.observed]));
  const timing=()=>page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).origin+new URL(r.name).pathname,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,duration:r.duration})));
  const row={width,height,dwellMs,backendIsolated:true,errors:[],blocked:[],failedRequests:[],httpFailures:[],popups:0,clicks:[],complete:false};report.rows.push(row);
  page.on('pageerror',e=>row.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')row.errors.push(safe(e.text()));});context.on('page',()=>row.popups++);
  page.on('requestfailed',r=>{if(!closing)row.failedRequests.push({path:pathOf(r.url()),error:safe(r.failure()?.errorText)});});
  page.on('response',r=>{if(r.status()>=400)row.httpFailures.push({path:pathOf(r.url()),status:r.status()});});
  await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(['data:','blob:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5997','5998','8546'].includes(u.port)||u.protocol==='https:'&&r.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))await route.continue();else{row.blocked.push(u.origin+u.pathname);await route.abort();}});
  const start=performance.now();
  try{
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
   if(dwellMs)await page.waitForTimeout(dwellMs);
   for(const name of ['Play free','Start trial']){await page.getByRole('button',{name,exact:true}).click({timeout:60000});row.clicks.push({name,ms:performance.now()-start});}
   await page.waitForFunction(()=>document.querySelector('.dp-battle')?.checkVisibility(),null,{timeout:30000});row.battleDomVisibleMs=performance.now()-start;const atDom=boundary();row.domResourceTiming=await timing();
   await waitForBattleReady(page);
   row.firstBattleMs=performance.now()-start;const atReady=boundary();row.resourceTiming=await timing();
   // Complete all responses already begun, retaining the original first-battle boundary.
   await page.waitForTimeout(3000);
   row.transfer=transferSummary(records,atReady);row.domTransfer=transferSummary(records,atDom);row.developmentPaths=[...devPaths];
   row.byType={};for(const r of row.transfer.resources){row.byType[r.type]=(row.byType[r.type]??0)+(r.totalBytes??0);r.initiator=initiators.get(r.path)??null;}
   row.methodComparison={domVisibleInitialResponses:row.domTransfer.conservativeTransferBytes,sceneReadyInitialResponses:row.transfer.conservativeTransferBytes,cdpObservedAtBattle:row.transfer.bytesObservedAtBattle,resourceTimingAtBattle:row.resourceTiming.reduce((n,r)=>n+r.transferSize,0),resourceTimingEntries:row.resourceTiming.length,resourceTimingZeroSize:row.resourceTiming.filter(r=>r.transferSize===0).length};
   row.complete=row.transfer.valid&&row.domTransfer.valid&&!row.errors.length&&!row.blocked.length&&!row.failedRequests.length&&!row.httpFailures.length&&!row.popups&&!row.developmentPaths.length;
   row.transferGate=row.complete&&row.transfer.conservativeTransferBytes<=8_000_000;
  }catch(error){row.failure=safe(error.message);row.visibleFailure=await page.locator('.ship-journey').innerText().then(s=>safe(s.slice(-800))).catch(()=>null);}
  finally{closing=true;await cdp.detach();await context.close();await fixture('rollback');row.rolledBack=true;save();}
  console.log(JSON.stringify({width,height,dwellMs,complete:row.complete,battleMs:row.firstBattleMs,bytes:row.transfer?.conservativeTransferBytes,transferGate:row.transferGate,failure:row.failure}));
 }
 report.complete=report.rows.length===4&&report.rows.every(r=>r.complete);report.observationPass=report.complete;report.transferGate=report.complete&&report.rows.every(r=>r.transferGate);
}catch(error){report.failure=safe(error.message);}
finally{await browser.close();save();}
console.log(JSON.stringify({output:relative(root,output),observationPass:report.observationPass,transferGate:report.transferGate}));if(!report.observationPass)process.exitCode=1;
