/** One real production journey, causal audio observation, no screenshots or mix changes. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio,evaluateJourneyAudio} from './journey-observer.mjs';
import {verifyJourneyReceipts} from '../proof/receipt-check.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/audio-journey-${attempt}.json`),raw=resolve(root,`reports/v4-ship/S11/audio-journey-${attempt}.events.json.gz`);
assert(!existsSync(output)&&!existsSync(raw),'Preserve prior evidence');
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP'),hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');stop();
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-4.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const runtime=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
const unchanged=()=>git(['diff','--name-only',build.sourceCommit,'--',...runtime])==='';assert(unchanged(),'Production build must match source');
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),sourceCommit:build.sourceCommit,buildEvidence:buildPath,scope:'Fresh1280x720production journey; real local API/Anvil transactions. No neutral unlock click, no injected playback, no screenshots. Causal telemetry does not prove physical onset or human listening.',harness:['journey-probe.mjs','journey-observer.mjs'].map(name=>({path:'tools/v4ship-lab/audio/'+name,sha256:hash(readFileSync(resolve(import.meta.dirname,name)))})),actions:[],receipts:[],errors:[],blocked:[],failedRequests:[],journeyPass:false};
const safe=v=>String(v).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,250);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(r.ok,`Fixture ${action}`);};
let browser,active=false,page;
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
try{
 await fixture('begin');active=true;
 browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
 const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
 page.on('requestfailed',r=>report.failedRequests.push({path:new URL(r.url()).pathname,error:safe(r.failure()?.errorText)}));
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');if(local||font)await route.continue();else{report.blocked.push(u.origin+u.pathname);await route.abort();}});
 await prepareJourneyAudio(page);await page.exposeFunction('audioProof',v=>report.receipts.push(v));await page.addInitScript(()=>window.addEventListener('chain:receipt',e=>window.audioProof(e.detail)));
 await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
 const button=name=>page.getByRole('button',{name,exact:true});await button('Play free').waitFor();await observeJourneyAudio(page);
 const click=async name=>{stop();await button(name).click();report.actions.push(name);save();console.log(JSON.stringify({action:name}));};
 await click('Play free');await button('Start trial').waitFor();await click('Start trial');await page.locator('.dp-battle').waitFor();
 await button('Mint trial reward').waitFor({timeout:200000});await click('Mint trial reward');await button('Fund workshop').waitFor({timeout:60000});
 for(const [name,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){await click(name);await button(next).waitFor({timeout:60000});}
 await click('Face the boss');await page.locator('.dp-battle').waitFor();await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:200000});await page.locator('[data-wallet-proof-complete="true"]').waitFor();
 const history=await page.locator('[data-history-kind] a').evaluateAll(xs=>xs.map(e=>({href:e.href,hash:new URL(e.href).pathname.split('/').at(-1)}))),wallet=await page.locator('.ship-wallet-proof>a').getAttribute('title');
 report.receiptVerification=await verifyJourneyReceipts(report.receipts,history,wallet);await page.waitForTimeout(400);
 const data=await page.evaluate(()=>({...window.__journeyAudio,settings:window.__thAudio.settings})),bytes=gzipSync(JSON.stringify(data));writeFileSync(raw,bytes);report.events={path:relative(root,raw),sha256:hash(bytes)};
 report.audio=evaluateJourneyAudio(data);report.journeyPass=report.receipts.length===18&&report.receiptVerification.pass&&!report.errors.length&&!report.blocked.length&&!report.failedRequests.length&&unchanged();
}catch(error){report.failure=safe(error.message);}
finally{
 if(browser)await browser.close();if(active)try{await fixture('rollback');report.rollback=true;}catch(error){report.rollback=false;report.failure=safe(error.message);}
 report.journeyPass=report.journeyPass&&report.rollback===true;save();
}
console.log(JSON.stringify({output:relative(root,output),journeyPass:report.journeyPass,primaryControls:report.audio?.primaryControlsPass,receipts:report.audio?.everyReceiptChimePass,sourceBudget:report.audio?.sourceBudgetPass,failure:report.failure}));
if(!report.journeyPass||!report.audio?.primaryControlsPass||!report.audio?.everyReceiptChimePass||!report.audio?.sourceBudgetPass)process.exitCode=1;
