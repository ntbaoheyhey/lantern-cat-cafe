/** Fresh real production journey for editing preparation; scheduled R2 remains a separate run. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {gzipSync} from 'node:zlib';
import {prepareRecording,observeAudioStarts,sha} from './recording.mjs';
import {verifyJourneyReceipts} from '../proof/receipt-check.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
if(!/^\d+$/.test(attempt))throw Error('Choose a new preparation capture number');
const out=resolve(root,`work/v4ship-prep/S10-film-${attempt}`),reportPath=resolve(root,`reports/v4-ship/S10/film-capture-${attempt}.json`);
if(existsSync(out)||existsSync(reportPath)||existsSync(resolve(root,'STOP-V4SHIP')))throw Error('Preserve previous capture / STOP');
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-2.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim(),runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
if(git(['branch','--show-current'])!=='codex/v4-ship-2026-11-16'||!build.ready||!build.buildComplete||build.port!==5998)throw Error('Wrong branch or no production preview');
const unchanged=()=>!git(['diff','--name-only',build.sourceCommit,'--',...runtimePaths]);if(!unchanged())throw Error('Production sources changed');
const source=await fetch('http://127.0.0.1:5998');if(!source.ok||sha(Buffer.from(await source.arrayBuffer()))!==build.indexSha256)throw Error('Preview index mismatch');
mkdirSync(out,{recursive:true});const raw=resolve(out,'journey');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),buildEvidence:buildPath,mode:'Preparatory real local build/API/Anvil capture; not R2, FINAL, Fuji latency or a rehearsal gate',raw:relative(root,raw),harness:['capture.mjs','recording.mjs'].map(n=>({path:`tools/v4ship-lab/film/${n}`,sha256:sha(readFileSync(resolve(import.meta.dirname,n)))})),marks:[],actions:[],receipts:[],errors:[],network:[],fontReads:[],failedRequests:[],pass:false};
const safe=v=>String(v).replace(/0x[\da-f]{64,}/gi,'[hex]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,300);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});if(!r.ok)throw Error(`Fixture ${action} failed:${r.status}`);};
let active=false,browser,page,recorder,zero=0,recorded=false;
try{
 await fixture('begin');active=true;
 browser=await chromium.launch({headless:true,args:['--use-angle=metal','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
 page.on('requestfailed',r=>{const u=new URL(r.url());report.failedRequests.push({url:safe(u.origin+u.pathname),method:r.method(),error:safe(r.failure()?.errorText)});});
 await context.route('**/*',async route=>{
  const request=route.request(),u=new URL(request.url());
  const local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port);
  const fontRead=u.protocol==='https:'&&request.method()==='GET'&&(
   u.hostname==='fonts.googleapis.com'&&request.resourceType()==='stylesheet'||
   u.hostname==='fonts.gstatic.com'&&request.resourceType()==='font');
  if(local||fontRead){if(fontRead)report.fontReads.push({url:u.origin+u.pathname,method:request.method(),type:request.resourceType()});await route.continue();}
  else{report.network.push(u.origin+u.pathname);await route.abort();}
 });
 await page.exposeFunction('recordFilmReceipt',value=>report.receipts.push(value));await page.addInitScript(()=>window.addEventListener('chain:receipt',e=>window.recordFilmReceipt(e.detail)));
 recorder=await prepareRecording(page,raw);
 await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
 const button=name=>page.getByRole('button',{name,exact:true});await button('Play free').waitFor({timeout:60000});
 // A real neutral click activates the existing audio graph without starting the journey.
 await page.getByRole('heading',{name:/Lantern/}).click();await page.waitForFunction(()=>window.__thAudio?.ctx?.state==='running');
 await observeAudioStarts(page);zero=await recorder.start('Local rehearsal · Anvil · Preparation');recorded=true;
 const mark=async name=>{if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');const at=await page.evaluate(()=>Date.now()/1000)-zero;report.marks.push({name,at});console.log(JSON.stringify({mark:name,at:+at.toFixed(3)}));return at;};
 const click=async name=>{const at=await mark('click:'+name);await button(name).click({timeout:60000});report.actions.push({name,at});};
 await mark('landing');await page.waitForTimeout(12000);await click('Play free');await button('Start trial').waitFor({timeout:60000});await mark('guest-ready');await page.waitForTimeout(8000);
 await click('Start trial');await page.locator('.dp-battle').waitFor({timeout:30000});await mark('first-battle');await button('Mint trial reward').waitFor({timeout:200000});await mark('reward-ready');await page.waitForTimeout(12000);
 await click('Mint trial reward');await button('Fund workshop').waitFor({timeout:60000});await page.locator('[data-receipt-hash]').waitFor();await mark('receipt-ready');await page.waitForTimeout(13000);
 for(const [name,next]of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
  await click(name);await button(next).waitFor({timeout:60000});await mark('ready:'+next);await page.waitForTimeout(4000);
 }
 await click('Face the boss');await page.locator('.dp-battle').waitFor({timeout:30000});await mark('boss-battle');await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:200000});await page.locator('[data-wallet-proof-complete="true"]').waitFor({timeout:60000});await mark('proof-ready');
 const history=await page.locator('[data-history-kind] a').evaluateAll(rows=>rows.map(r=>({href:r.href,hash:new URL(r.href).pathname.split('/').at(-1)})));
 const wallet=await page.locator('.ship-wallet-proof>a').getAttribute('title');report.receiptVerification=await verifyJourneyReceipts(report.receipts,history,wallet);
 await page.waitForTimeout(22000);await mark('end');
 report.audioStarts=await page.evaluate(()=>window.__filmAudioStarts);
 const recording=await recorder.stop();recorded=false;report.recording={...recording,pictures:undefined,frames:recording.pictures.length};
 report.pass=report.receiptVerification.pass&&report.receipts.length===18&&!report.errors.length&&!report.network.length&&!report.failedRequests.length&&unchanged();
}catch(error){report.failure=safe(error.message);}
finally{
 if(recorded)try{const r=await recorder.stop();report.partialRecording={seconds:r.seconds,frames:r.pictures.length};}catch(e){report.teardownError=safe(e.message);}
 if(browser)await browser.close();if(active)try{await fixture('rollback');report.fixtureRollback=true;}catch(e){report.pass=false;report.rollbackError=safe(e.message);}
 const events=report.audioStarts;if(events){const path=resolve(root,`reports/v4-ship/S10/film-audio-starts-${attempt}.json.gz`),bytes=gzipSync(JSON.stringify(events));writeFileSync(path,bytes);report.audioStarts={path:relative(root,path),count:events.length,sha256:sha(bytes)};}
 writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({report:relative(root,reportPath),pass:report.pass,failure:report.failure,receipts:report.receipts.length}));if(!report.pass)process.exitCode=1;
