/** Actual production journey output, scene transitions, causal contacts and scene-ready transfer. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio,evaluateJourneyAudio} from './journey-observer.mjs';
import {prepareImpactObservation,evaluateImpactObservation} from './impact-observer.mjs';
import {installOutputCapture} from '../../../scripts/audio/capture-page.mjs';
import {decodedDuration} from './duration.mjs';
import {observeRehearsal} from '../rehearsal/metrics.mjs';
import {waitForBattleReady} from '../rehearsal/battle-ready.mjs';
import {observeSceneAudio,evaluateSceneAudio} from './scene-observer.mjs';
import {verifyJourneyReceipts} from '../proof/receipt-check.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));const width=Number(process.argv[3]??1280),height=width===1440?900:720;assert([1280,1440].includes(width));
const output=resolve(root,`reports/v4-ship/S11/scene-journey-${attempt}.json`),raw=resolve(root,`reports/v4-ship/S11/scene-journey-${attempt}.events.json.gz`);
assert(!existsSync(output)&&!existsSync(raw),'Preserve prior evidence');
const captureFolder=resolve(root,`work/v4ship-audio/scene-journey-${attempt}`);assert(!existsSync(captureFolder));mkdirSync(captureFolder,{recursive:true});
const capturePath=resolve(captureFolder,'journey.webm');
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');stop();
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-13.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const runtime=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
const unchanged=()=>git(['diff','--name-only',build.sourceCommit,'--',...runtime])==='';assert(unchanged(),'Production build must match source');
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),sourceCommit:build.sourceCommit,buildEvidence:buildPath,viewport:{width,height},scope:'Fresh production journey with observed combat contacts; real local API/Anvil transactions. No neutral unlock click, no injected playback, no screenshots. Causal telemetry does not prove physical onset or human listening.',harness:['tools/v4ship-lab/audio/scene-journey.mjs','tools/v4ship-lab/audio/scene-observer.mjs','tools/v4ship-lab/audio/journey-observer.mjs','tools/v4ship-lab/audio/impact-observer.mjs','tools/v4ship-lab/rehearsal/metrics.mjs','tools/v4ship-lab/rehearsal/battle-ready.mjs','scripts/audio/capture-page.mjs'].map(path=>({path,sha256:hash(readFileSync(resolve(root,path)))})),actions:[],receipts:[],errors:[],blocked:[],failedRequests:[],journeyPass:false};
const safe=v=>String(v).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,250);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(r.ok,`Fixture ${action}`);};
let browser,active=false,page,capturing=false,meter;
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
try{
 await fixture('begin');active=true;
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
 page.on('requestfailed',r=>report.failedRequests.push({path:new URL(r.url()).pathname,error:safe(r.failure()?.errorText)}));
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');if(local||font)await route.continue();else{report.blocked.push(u.origin+u.pathname);await route.abort();}});
 meter=await observeRehearsal(context,page);await installOutputCapture(page,capturePath);
 await prepareJourneyAudio(page);await prepareImpactObservation(page);await page.exposeFunction('audioProof',v=>report.receipts.push(v));await page.addInitScript(()=>window.addEventListener('chain:receipt',e=>window.audioProof(e.detail)));
 await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
 const button=name=>page.getByRole('button',{name,exact:true});await button('Play free').waitFor();await observeJourneyAudio(page);await observeSceneAudio(page);
 const click=async name=>{stop();await button(name).click();report.actions.push(name);save();console.log(JSON.stringify({action:name}));};
 await click('Play free');await button('Start trial').waitFor();
 report.captureStarted=await page.evaluate(()=>window.__outputCapture.start());capturing=true;
 await click('Start trial');await waitForBattleReady(page);await meter.firstBattle();
 await button('Mint trial reward').waitFor({timeout:200000});await click('Mint trial reward');await button('Fund workshop').waitFor({timeout:60000});
 for(const [name,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){await click(name);await button(next).waitFor({timeout:60000});}
 await click('Face the boss');await waitForBattleReady(page);await meter.startBoss();await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:200000});await page.locator('[data-wallet-proof-complete="true"]').waitFor();await meter.endBoss();
 const history=await page.locator('[data-history-kind] a').evaluateAll(xs=>xs.map(e=>({href:e.href,hash:new URL(e.href).pathname.split('/').at(-1)}))),wallet=await page.locator('.ship-wallet-proof>a').getAttribute('title');
 report.receiptVerification=await verifyJourneyReceipts(report.receipts,history,wallet);await page.waitForTimeout(400);
 report.captureEnded=await page.evaluate(()=>window.__outputCapture.stop());capturing=false;
 report.rehearsal=await meter.finish();meter=null;
 const data=await page.evaluate(()=>{clearInterval(window.__impactObserverTimer);clearInterval(window.__sceneAudioTimer);return {...window.__journeyAudio,settings:window.__thAudio.settings,impact:window.__impactObservation,scene:window.__sceneAudioObservation};}),bytes=gzipSync(JSON.stringify(data));writeFileSync(raw,bytes);report.events={path:relative(root,raw),sha256:hash(bytes)};
 report.sceneAudio=evaluateSceneAudio(data);
 report.audio=evaluateJourneyAudio(data);report.impact=evaluateImpactObservation(data.impact,data);report.journeyPass=report.receipts.length===18&&report.receiptVerification.pass&&!report.errors.length&&!report.blocked.length&&!report.failedRequests.length&&unchanged();
 const levels=spawnSync('ffmpeg',['-hide_banner','-i',capturePath,'-af','loudnorm=I=-18:TP=-1:LRA=5:print_format=json','-f','null','-'],{encoding:'utf8'});assert.equal(levels.status,0,'Output loudness analysis failed');
 const loudness=JSON.parse(levels.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0]);
 report.capture={path:relative(root,capturePath),bytes:readFileSync(capturePath).length,sha256:hash(readFileSync(capturePath)),wallSeconds:report.captureEnded-report.captureStarted,...decodedDuration(capturePath)};
 report.mix={lufs:+loudness.input_i,lra:+loudness.input_lra,peak:+loudness.input_tp};
 report.mixGates={loudness:report.mix.lufs>=-20&&report.mix.lufs<=-16,truePeak:report.mix.peak<=-1,loudnessRange:report.mix.lra>=5};
 report.physicalOnsetVerified=false;report.humanListeningVerified=false;report.overallAudioGatePass=false;
}catch(error){report.failure=safe(error.message);report.journeyPass=false;}
finally{
 if(page&&capturing)try{report.partialCaptureEnded=await page.evaluate(()=>window.__outputCapture.stop());}catch(error){report.partialOutputFailure=safe(error.message);}
 if(meter)try{report.rehearsal=await meter.finish();}catch(error){report.rehearsalFailure=safe(error.message);}
 if(page&&!report.events)try{
  const data=await page.evaluate(()=>({...window.__journeyAudio,impact:window.__impactObservation,scene:window.__sceneAudioObservation})),bytes=gzipSync(JSON.stringify(data));
  writeFileSync(raw,bytes);report.events={path:relative(root,raw),sha256:hash(bytes),partial:true};
 }catch(error){report.partialCaptureFailure=safe(error.message);}
 if(browser)try{await browser.close();}catch(error){report.cleanupFailure=safe(error.message);report.journeyPass=false;}
 if(active)try{await fixture('rollback');report.rollback=true;}catch(error){report.rollback=false;report.failure=safe(error.message);}
 report.journeyPass=report.journeyPass&&report.rollback===true;save();
}
console.log(JSON.stringify({output:relative(root,output),journeyPass:report.journeyPass,primaryControls:report.audio?.primaryControlsPass,receipts:report.audio?.everyReceiptChimePass,sourceBudget:report.audio?.sourceBudgetPass,impacts:report.impact?.causallyPlayedContacts,expectedImpacts:report.impact?.expectedContacts,impactCoverage:report.impact?.observedImpactCoveragePass,scenePass:report.sceneAudio?.correctBattleBeds,mix:report.mix,bytes:report.rehearsal?.transfer?.conservativeTransferBytes,failure:report.failure}));
if(!report.journeyPass||!report.audio?.primaryControlsPass||!report.audio?.everyReceiptChimePass||!report.audio?.sourceBudgetPass||!report.impact?.observedImpactCoveragePass)process.exitCode=1;
