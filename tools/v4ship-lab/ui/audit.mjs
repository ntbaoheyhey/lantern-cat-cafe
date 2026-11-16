/** Production DOM/AX observation, no screenshots. LEARN/S11-ui.md. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {verifyJourneyReceipts} from '../proof/receipt-check.mjs';
import {observeDocument} from './observe.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt),'Use a new attempt number');
const output=resolve(root,`reports/v4-ship/S11/ui-audit-${attempt}.json`),rawPath=resolve(root,`reports/v4-ship/S11/ui-audit-${attempt}.rows.json.gz`);
assert(!existsSync(output)&&!existsSync(rawPath),'Preserve prior evidence');
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');stop();
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-2.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
assert.equal(git(['diff','--name-only',build.sourceCommit,'--',...runtimePaths]),'','Require matching production build');
const response=await fetch('http://127.0.0.1:5998');
assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256,'Production index identity');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const report={at:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),buildEvidence:buildPath,harnessSha256:hash(readFileSync(import.meta.filename)),observerSha256:hash(readFileSync(resolve(root,'tools/v4ship-lab/ui/observe.mjs'))),scope:'UI observation on two complete real local production journeys; no screenshots, no funnel/rehearsal pass claim',rows:[],profiles:[],pass:false};
const raw=[];
const save=()=>{writeFileSync(rawPath,gzipSync(JSON.stringify(raw)));report.raw={path:relative(root,rawPath),sha256:hash(readFileSync(rawPath))};writeFileSync(output,JSON.stringify(report,null,2)+'\n');};
const safe=x=>String(x).replace(/0x[\da-f]{64,}/gi,'[hash]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(r.ok,`Fixture ${action}`);};

async function inspect(page,cdp,width,phase){
 stop();
 const dom=await page.evaluate(observeDocument);
 const tree=await cdp.send('Accessibility.getFullAXTree');
 const roles=['button','link','checkbox','slider','textbox','combobox','img','image'];
 const controls=tree.nodes.filter(n=>!n.ignored&&roles.includes(n.role?.value)).map(n=>({role:n.role.value,name:n.name?.value??'',disabled:n.properties?.find(p=>p.name==='disabled')?.value?.value??false}));
 const row={width,phase,allVisibleWords:dom.allVisibleWords,proseWords:dom.proseWords,textNodes:dom.texts.length,controls:controls.length,unnamedControls:controls.filter(c=>!c.name.trim()),horizontalOverflow:dom.horizontalOverflow,
  contrastFailures:dom.texts.filter(t=>t.contrast==='fail').map(t=>({text:t.text,class:t.class,ratio:t.ratio,minimum:t.minimum})),
  contrastUnknown:dom.texts.filter(t=>t.contrast==='unknown').length,clippingCandidates:dom.texts.filter(t=>t.clipping.length).map(t=>({text:t.text,class:t.class,clipping:t.clipping})),brokenImages:dom.brokenImages};
 raw.push({width,phase,...dom,controls});report.rows.push(row);save();
 console.log(JSON.stringify({width,phase,prose:row.proseWords,texts:row.textNodes,contrastFail:row.contrastFailures.length,contrastUnknown:row.contrastUnknown,clip:row.clippingCandidates.length,unnamed:row.unnamedControls.length}));
}
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  let active=false,context;
  const profile={width,height,errors:[],blocked:[],failedRequests:[],receipts:[],complete:false};report.profiles.push(profile);
  try{
   stop();await fixture('begin');active=true;
   context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const page=await context.newPage(),cdp=await context.newCDPSession(page);
   page.on('pageerror',e=>profile.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')profile.errors.push(safe(e.text()));});
   page.on('requestfailed',r=>profile.failedRequests.push({url:new URL(r.url()).origin+new URL(r.url()).pathname,error:safe(r.failure()?.errorText)}));
   await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');
    if(local||font)await route.continue();else{profile.blocked.push(u.origin+u.pathname);await route.abort();}});
   await page.exposeFunction('uiReceipt',v=>profile.receipts.push(v));await page.addInitScript(()=>window.addEventListener('chain:receipt',e=>window.uiReceipt(e.detail)));
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
   const button=name=>page.getByRole('button',{name,exact:true});
   const audit=async phase=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await inspect(page,cdp,width,phase);};
   await button('Play free').waitFor();await audit('landing');await button('Play free').click();await button('Start trial').waitFor();await audit('intro');
   await button('Start trial').click();await page.locator('.dp-battle').waitFor();await page.waitForTimeout(2000);await audit('trial-battle');
   await button('Mint trial reward').waitFor({timeout:200000});await audit('trial-reward');
   await button('Mint trial reward').click();await button('Fund workshop').waitFor({timeout:60000});await page.locator('[data-receipt-hash]').waitFor();await audit('cafe-receipt');
   for(const [name,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
    await button(name).click();await button(next).waitFor({timeout:60000});await audit('after:'+name);
   }
   await button('Face the boss').click();await page.locator('.dp-battle').waitFor();await page.waitForTimeout(2000);await audit('boss-battle');
   await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:200000});await page.locator('[data-wallet-proof-complete="true"]').waitFor();await audit('wallet-proof');
   const history=await page.locator('[data-history-kind] a').evaluateAll(xs=>xs.map(e=>({href:e.href,hash:new URL(e.href).pathname.split('/').at(-1)})));
   const wallet=await page.locator('.ship-wallet-proof>a').getAttribute('title');
   profile.receiptVerification=await verifyJourneyReceipts(profile.receipts,history,wallet);profile.complete=true;
  }catch(error){profile.failure=safe(error.message);}
  finally{if(context)await context.close();if(active)try{await fixture('rollback');profile.rollback=true;}catch(error){profile.rollback=false;profile.failure=safe(error.message);}save();}
  assert(profile.complete&&profile.receiptVerification?.pass&&profile.rollback,'Journey/fixture failed; inspect preserved evidence');
 }
 report.journeysPass=report.profiles.every(p=>p.complete&&p.receiptVerification.pass&&!p.errors.length&&!p.blocked.length&&!p.failedRequests.length&&p.rollback);
 report.observationComplete=report.rows.length===26;
 report.pass=report.journeysPass&&report.observationComplete&&report.rows.every(r=>!r.unnamedControls.length&&!r.contrastFailures.length&&!r.contrastUnknown&&!r.clippingCandidates.length&&!r.brokenImages.length&&!r.horizontalOverflow&&r.proseWords<=25);
 report.limits=['Canvas/image text, full keyboard/screen-reader use and unvisited panels are not proven by this DOM audit.',
  'Unknown contrast and geometric clipping candidates require diagnosis; they are never automatically passed.',
  'Prose counts include visible paragraph/status/alert text; raw visible-word counts also remain in evidence.'];
}catch(error){report.failure=safe(error.message);}
finally{await browser.close();save();}
console.log(JSON.stringify({output:relative(root,output),pass:report.pass,journeysPass:report.journeysPass,rows:report.rows.length}));if(!report.pass)process.exitCode=1;
