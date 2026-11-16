/** Production bundle + real DOM actions. See reports/v4-ship/LEARN/S8.md. */
import {createRequire} from 'node:module';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {observeRehearsal} from '../../tools/v4ship-lab/rehearsal/metrics.mjs';
import {proofContrast} from '../../tools/v4ship-lab/proof/proof-contrast.mjs';
import {verifyJourneyReceipts} from '../../tools/v4ship-lab/proof/receipt-check.mjs';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=require('sharp');
const item=process.env.V4_ITEM??'S8-production-journeys-1',count=Number(process.env.V4_RUNS??10),widths=(process.env.V4_WIDTHS??'1280').split(',').map(Number);
if(!/^[\w-]+$/.test(item)||!Number.isInteger(count)||count<1||widths.some(w=>![1280,1440].includes(w)))throw Error('Invalid settings');
const buildEvidence=JSON.parse(readFileSync(resolve(root,process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-1.json')));
if(!buildEvidence.buildComplete||!buildEvidence.ready||buildEvidence.port!==5998)throw Error('Production build not ready');
if(execFileSync('git',['diff','--name-only',buildEvidence.sourceCommit,'HEAD','--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'],{cwd:root,encoding:'utf8'}).trim())throw Error('Production runtime changed since build');
if(createHash('sha256').update(readFileSync(resolve(buildEvidence.output,'index.html'))).digest('hex')!==buildEvidence.indexSha256)throw Error('Production index changed');
const out=resolve(root,'reports/v4-ship/RUNS',item);
if(existsSync(out))throw Error('Preserve previous journeys; choose a new V4_ITEM');
await mkdir(resolve(out,'raw'),{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const harness=['scripts/v4ship/rehearsal-run.mjs','tools/v4ship-lab/rehearsal/metrics.mjs','tools/v4ship-lab/proof/receipt-check.mjs','tools/v4ship-lab/proof/proof-contrast.mjs'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
const runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
const changedRuntime=()=>[...new Set([
 ...execFileSync('git',['diff','--name-only',sourceCommit,'--',...runtimePaths],{cwd:root,encoding:'utf8'}).trim().split('\n'),
 ...execFileSync('git',['ls-files','--others','--exclude-standard','--',...runtimePaths],{cwd:root,encoding:'utf8'}).trim().split('\n'),
].filter(Boolean))];
const sourceChanges=changedRuntime();
if(process.env.V4_STABLE==='1'&&sourceChanges.length)throw Error('Stable journeys require a committed runtime');
const safe=value=>String(value).replace(/0x[\da-f]{64,}/gi,'[hex]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});if(!r.ok)throw Error(`Disposable fixture ${action} failed:${r.status}`);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});let failed=false,screenshots=0;
try{for(const width of widths)for(let n=1;n<=count;n++){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 await fixture('begin');const context=await browser.newContext({viewport:{width,height:width===1280?720:900},serviceWorkers:'block'}),page=await context.newPage();
 const report={id:`${width}-${String(n).padStart(2,'0')}`,at:new Date().toISOString(),sourceCommit,sourceChanges,harness,viewport:{width,height:width===1280?720:900},mode:'production Vite build + vite preview + isolated Anvil/SQL',buildEvidence,cleanProfile:true,realClicks:true,backendIsolated:true,steps:[],clicks:[],errors:[],networkFailures:[],httpFailures:[],popups:[],receipts:[],ui:[],audioTrace:[]};
 const started=performance.now(),at=()=>Math.round(performance.now()-started);let closing=false;
 page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
 page.on('requestfailed',r=>{if(!closing)report.networkFailures.push({path:new URL(r.url()).pathname,error:safe(r.failure()?.errorText)});});
 page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({path:new URL(r.url()).pathname,status:r.status()});});context.on('page',p=>{if(p!==page)report.popups.push(at());});
 await page.exposeFunction('recordShipReceipt',proof=>report.receipts.push(proof));
 await page.addInitScript(()=>window.addEventListener('chain:receipt',event=>window.recordShipReceipt(event.detail)));
 const measurement=await observeRehearsal(context,page);
 const button=name=>page.getByRole('button',{name,exact:true});
 const click=async name=>{await button(name).click({timeout:60000});report.clicks.push({name,atMs:at()});};
 const ui=async name=>{report.ui.push({name,atMs:at(),...await page.evaluate(()=>{
  const visible=e=>e.checkVisibility()&&!e.closest('[aria-hidden="true"],[inert]');
  const unlabeled=[...document.querySelectorAll('button')].filter(visible).filter(e=>!(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent?.trim())).map(e=>e.outerHTML.slice(0,100));
  const clipped=[...document.querySelectorAll('button,h1,h2,h3,p,label,small,strong')].filter(visible).filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+2&&['hidden','clip'].includes(getComputedStyle(e).overflowX)).map(e=>e.textContent?.slice(0,70));
  const bodyWords=[...document.querySelectorAll('.ship-trial-card p')].filter(visible).map(e=>e.textContent?.trim().split(/\s+/).length??0).reduce((a,b)=>a+b,0);
  return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth,unlabeled,clipped,bodyWords};
 }),proofContrast:await proofContrast(page)});};
 const capture=async name=>{if(n===1&&screenshots<4){await sharp(await page.screenshot()).resize({width:1024}).png().toFile(resolve(out,'raw',`${width}-${name}.png`));screenshots++;}};
 const step=async(number,name,work)=>{const row={number,name,startedMs:at()};report.steps.push(row);try{await work(row);await ui(name);row.status='pass';}catch(e){row.status='fail';row.reason=safe(e.message);throw e;}finally{row.endedMs=at();console.log(JSON.stringify({id:report.id,step:number,status:row.status,atMs:at()}));}};
 try{
  await step(1,'landing',async()=>{await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');await button('Play free').waitFor({timeout:60000});await capture('landing');});
  await step(2,'guest',async()=>{await click('Play free');await button('Start trial').waitFor({timeout:60000});});
  await step(3,'battle-reward',async()=>{await click('Start trial');await page.locator('.dp-battle').waitFor({timeout:30000});report.firstBattleMs=at();await measurement.firstBattle();report.firstBattleClicks=report.clicks.length;await button('Mint trial reward').waitFor({timeout:200000});report.firstRewardMs=at();await capture('reward');});
  await step(4,'first-receipt',async()=>{await click('Mint trial reward');await button('Fund workshop').waitFor({timeout:60000});report.firstReceiptMs=at();const toast=page.locator('[data-receipt-hash]');await toast.waitFor();const data=await toast.evaluate(e=>({...e.dataset}));if(!data.receiptMs||!data.receiptFee||!data.receiptPayer)throw Error('Receipt metadata missing');});
  await step(5,'cafe-economy',async()=>{
   for(const [name,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
    await click(name);await button(next).waitFor({timeout:60000});await ui(name);
    if(process.env.V4_RECOVERY==='1'&&name==='Forge Legendary'){await page.reload();await button(next).waitFor({timeout:60000});report.reloadRecovery=true;}
   }
   await capture('workshop');
  });
  await step(6,'boss',async()=>{await measurement.startBoss();await click('Face the boss');const start=at();await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:180000});report.bossMs=at()-start;await measurement.endBoss();});
  await step(7,'wallet-proof',async()=>{
   await page.locator('[data-wallet-proof-complete="true"]').waitFor({timeout:60000});
   report.historyKinds=await page.locator('[data-history-kind]').evaluateAll(rows=>[...new Set(rows.map(r=>r.dataset.historyKind))]);
   report.proofLinks=await page.locator('[data-history-kind] a[href*="snowtrace.io/tx/"]').count();
   if(report.historyKinds.length<5)throw Error('Fewer than five wallet action types');
   const history=await page.locator('[data-history-kind] a').evaluateAll(rows=>rows.map(r=>({href:r.href,hash:new URL(r.href).pathname.split('/').at(-1)})));
   const wallet=await page.locator('.ship-wallet-proof>a').getAttribute('title');
   report.receiptVerification=await verifyJourneyReceipts(report.receipts,history,wallet);
   if(!report.receiptVerification.pass)throw Error('Receipt or wallet history verification failed');
   await capture('proof');
  });
 }catch(e){report.failure=safe(e.message);report.visibleFailure=await page.locator('body').innerText().then(text=>safe(text.slice(-1600)));await capture('failure');}
 finally{
  report.rehearsal=await measurement.finish().catch(e=>({pass:false,failure:safe(e.message)}));
  if(report.rehearsal.boss){report.rehearsal.gates.fullBossCoverage=report.rehearsal.boss.seconds>=report.bossMs/1000*.9;report.rehearsal.pass&&=report.rehearsal.gates.fullBossCoverage;}
  closing=true;report.elapsedMs=at();report.complete=report.steps.length===7&&report.steps.every(s=>s.status==='pass');
  report.proofContrastPass=report.ui.some(row=>row.proofContrast.length>0)&&report.ui.every(row=>row.proofContrast.every(check=>check.pass));
  report.runtimeChangesAtEnd=changedRuntime();report.runtimeStable=report.runtimeChangesAtEnd.length===0&&sourceChanges.length===0;
  report.teardownErrors=[];
  try{await context.close();}catch(e){report.teardownErrors.push(safe(e.message));}
  try{await fixture('rollback');}catch(e){report.teardownErrors.push(safe(e.message));}
  report.pass=report.rehearsal.pass&&report.complete&&!report.errors.length&&!report.httpFailures.length&&!report.networkFailures.length&&!report.popups.length&&!report.teardownErrors.length&&(process.env.V4_STABLE!=='1'||report.runtimeStable);
  failed||=!report.pass;
  await writeFile(resolve(out,`run-${report.id}.json`),JSON.stringify(report,null,2)+'\n');
  if(report.teardownErrors.length)throw Error('Journey cleanup failed; evidence preserved');
 }
 if(!report.pass&&process.env.V4_FAIL_FAST==='1')throw Error('Journey failed; evidence preserved');
}}finally{await browser.close();}
if(failed)process.exitCode=1;
