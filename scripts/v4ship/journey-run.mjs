/** Fresh browser + rollback of both disposable ledgers; production limits stay intact. */
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=require('sharp');
const item=process.env.V4_ITEM??'S4',count=Number(process.env.V4_RUNS??10),widths=(process.env.V4_WIDTHS??'1280,1440').split(',').map(Number);
if(!/^[\w-]+$/.test(item)||!Number.isInteger(count)||count<1||widths.some(w=>![1280,1440].includes(w)))throw Error('Invalid settings');
const out=resolve(root,'reports/v4-ship/RUNS',item);await mkdir(resolve(out,'raw'),{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const safe=value=>String(value).replace(/0x[\da-f]{64,}/gi,'[hex]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,240);
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});if(!r.ok)throw Error(`Disposable fixture ${action} failed:${r.status}`);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});let failed=false;
try{for(const width of widths)for(let n=1;n<=count;n++){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 await fixture('begin');const context=await browser.newContext({viewport:{width,height:width===1280?720:900}}),page=await context.newPage();
 const report={id:`${width}-${String(n).padStart(2,'0')}`,at:new Date().toISOString(),sourceCommit,viewport:{width,height:width===1280?720:900},mode:'development + isolated Anvil/SQL',cleanProfile:true,realClicks:true,backendIsolated:true,steps:[],clicks:[],errors:[],networkFailures:[],httpFailures:[],popups:[],receipts:[],ui:[]};
 const started=performance.now(),at=()=>Math.round(performance.now()-started);let closing=false;
 page.on('pageerror',e=>report.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')report.errors.push(safe(e.text()));});
 page.on('requestfailed',r=>{if(!closing)report.networkFailures.push({path:new URL(r.url()).pathname,error:safe(r.failure()?.errorText)});});
 page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({path:new URL(r.url()).pathname,status:r.status()});});context.on('page',p=>{if(p!==page)report.popups.push(at());});
 await page.exposeFunction('recordShipReceipt',proof=>report.receipts.push(proof));
 await page.addInitScript(()=>window.addEventListener('chain:receipt',event=>window.recordShipReceipt(event.detail)));
 const button=name=>page.getByRole('button',{name,exact:true});
 const click=async name=>{await button(name).click({timeout:60000});report.clicks.push({name,atMs:at()});};
 const ui=async name=>{report.ui.push({name,atMs:at(),...await page.evaluate(()=>{
  const visible=e=>e.checkVisibility()&&!e.closest('[aria-hidden="true"],[inert]');
  const unlabeled=[...document.querySelectorAll('button')].filter(visible).filter(e=>!(e.getAttribute('aria-label')||e.getAttribute('title')||e.textContent?.trim())).map(e=>e.outerHTML.slice(0,100));
  const clipped=[...document.querySelectorAll('button,h1,h2,h3,p,label,small,strong')].filter(visible).filter(e=>e.clientWidth&&e.scrollWidth>e.clientWidth+2&&['hidden','clip'].includes(getComputedStyle(e).overflowX)).map(e=>e.textContent?.slice(0,70));
  const bodyWords=[...document.querySelectorAll('.ship-trial-card p')].filter(visible).map(e=>e.textContent?.trim().split(/\s+/).length??0).reduce((a,b)=>a+b,0);
  return {horizontalOverflow:document.documentElement.scrollWidth>innerWidth,unlabeled,clipped,bodyWords};
 })});};
 const capture=async name=>{if(n===1)await sharp(await page.screenshot()).resize({width:1024}).png().toFile(resolve(out,'raw',`${width}-${name}.png`));};
 const step=async(number,name,work)=>{const row={number,name,startedMs:at()};report.steps.push(row);try{await work(row);await ui(name);row.status='pass';}catch(e){row.status='fail';row.reason=safe(e.message);throw e;}finally{row.endedMs=at();console.log(JSON.stringify({id:report.id,step:number,status:row.status,atMs:at()}));}};
 try{
  await step(1,'landing',async()=>{await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');await button('Play free').waitFor({timeout:60000});await capture('landing');});
  await step(2,'guest',async()=>{await click('Play free');await button('Start trial').waitFor({timeout:60000});});
  await step(3,'battle-reward',async()=>{await click('Start trial');await page.locator('.dp-battle').waitFor({timeout:30000});report.firstBattleMs=at();report.firstBattleClicks=report.clicks.length;await button('Mint trial reward').waitFor({timeout:200000});report.firstRewardMs=at();await capture('reward');});
  await step(4,'first-receipt',async()=>{await click('Mint trial reward');await button('Fund workshop').waitFor({timeout:60000});report.firstReceiptMs=at();const toast=page.locator('[data-receipt-hash]');await toast.waitFor();const data=await toast.evaluate(e=>({...e.dataset}));if(!data.receiptMs||!data.receiptFee||!data.receiptPayer)throw Error('Receipt metadata missing');});
  await step(5,'cafe-economy',async()=>{
   for(const [name,next] of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
    await click(name);await button(next).waitFor({timeout:60000});await ui(name);
    if(process.env.V4_RECOVERY==='1'&&name==='Forge Legendary'){await page.reload();await button(next).waitFor({timeout:60000});report.reloadRecovery=true;}
   }
   await capture('workshop');
  });
  await step(6,'boss',async()=>{await click('Face the boss');const start=at();await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:180000});report.bossMs=at()-start;});
  await step(7,'wallet-proof',async()=>{await page.locator('[data-wallet-proof-complete="true"]').waitFor({timeout:60000});report.historyKinds=await page.locator('[data-history-kind]').evaluateAll(rows=>[...new Set(rows.map(r=>r.dataset.historyKind))]);report.proofLinks=await page.locator('[data-history-kind] a[href*="snowtrace.io/tx/"]').count();if(report.historyKinds.length<5)throw Error('Fewer than five wallet action types');await capture('proof');});
 }catch(e){report.failure=safe(e.message);report.visibleFailure=await page.locator('body').innerText().then(text=>safe(text.slice(-1600)));await capture('failure');}
 finally{closing=true;report.elapsedMs=at();report.complete=report.steps.length===7&&report.steps.every(s=>s.status==='pass');report.pass=report.complete&&!report.errors.length&&!report.httpFailures.length&&!report.networkFailures.length&&!report.popups.length;failed||=!report.pass;await context.close();await fixture('rollback');await writeFile(resolve(out,`run-${report.id}.json`),JSON.stringify(report,null,2)+'\n');}
}}finally{await browser.close();}
if(failed)process.exitCode=1;
