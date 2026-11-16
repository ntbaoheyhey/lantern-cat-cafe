/** Seven-step real-click measurement. Never writes saves, battle state or auth storage. */
import {createRequire} from 'node:module';
import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..');
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),sharp=require('sharp');
const base=process.env.V4_BASE_URL??'http://127.0.0.1:5994';
const item=process.env.V4_ITEM??'S2';
const count=Number(process.env.V4_RUNS??10);
const widths=(process.env.V4_WIDTHS??'1280,1440').split(',').map(Number);
if(!Number.isInteger(count)||count<1||widths.some(w=>![1280,1440].includes(w)))throw Error('Invalid run settings');
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('This runner currently permits disposable local fixtures only');
if(!/^[\w-]+$/.test(item))throw Error('Invalid item');
const out=resolve(root,'reports/v4-ship/RUNS',item);
await mkdir(resolve(out,'raw'),{recursive:true});
const sourceCommit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const cleanText=value=>String(value).replace(/0x[a-f\d]{64,}/gi,'[hex-redacted]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token-redacted]').replace(/https?:\/\/[^\s)]+/g,v=>{try{const u=new URL(v);return u.origin+u.pathname;}catch{return '[url]';}}).slice(0,250);
const safeUrl=value=>{try{const u=new URL(value);return u.origin+u.pathname;}catch{return '[non-http]';}};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void browser.close().then(()=>process.exit(130)));
let anyFailed=false;
async function run(width,n){
 const id=`${width}-${String(n).padStart(2,'0')}`,context=await browser.newContext({viewport:{width,height:width===1280?720:900}}),page=await context.newPage();
 page.setDefaultTimeout(12000);
 const started=performance.now(),at=()=>Math.round(performance.now()-started);
 const report={id,at:new Date().toISOString(),sourceCommit,viewport:{width,height:width===1280?720:900},mode:'development + disposable Anvil',base:safeUrl(base),cleanProfile:true,realClicks:true,concurrency:1,steps:[],clicks:[],errors:[],networkFailures:[],httpFailures:[],popups:[],screenshots:[],observations:[],receipts:[]};
 let closed=false;
 page.on('pageerror',e=>report.errors.push({atMs:at(),kind:'pageerror',message:cleanText(e.message)}));
 page.on('console',e=>{if(e.type()==='error')report.errors.push({atMs:at(),kind:'console',message:cleanText(e.text())});});
 page.on('requestfailed',r=>{if(!closed)report.networkFailures.push({atMs:at(),url:safeUrl(r.url()),kind:r.resourceType(),reason:cleanText(r.failure()?.errorText)});});
 page.on('response',r=>{if(r.status()>=400)report.httpFailures.push({atMs:at(),url:safeUrl(r.url()),status:r.status()});});
 context.on('page',p=>{if(p!==page)report.popups.push({atMs:at(),url:safeUrl(p.url())});});
 const button=name=>page.getByRole('button',{name,exact:typeof name==='string'});
 async function click(locator,label){await locator.click();report.clicks.push({atMs:at(),label});}
 async function tap(name){await click(button(name),String(name));}
 async function coach(){const d=page.getByRole('dialog',{name:'Tutorial',exact:true});if(await d.isVisible())await click(d.getByRole('button',{name:'Skip',exact:true}),'Skip tutorial');}
 async function celebrations(){for(const name of ['Dismiss celebration','Skip celebration'])if(await button(name).isVisible())await tap(name);}
 async function victory(timeout){
  const begin=at();let diagnosticAt=0;
  while(at()-begin<timeout){
   await coach();
   const state=await page.evaluate(()=>({screen:window.__depthReview?.screen,round:window.__depthReview?.battle?.round,paused:window.__depthReview?.paused,watching:window.__depthReview?.watching}));
   if(state.screen==='result')return;
   if(at()-diagnosticAt>15000){console.log(JSON.stringify({id,progress:'battle',atMs:at(),...state}));diagnosticAt=at();}
   await page.waitForTimeout(350);
  }
  throw Error(`Battle did not finish within ${timeout/1000} seconds`);
 }
 async function snapshot(name){
  const file=`raw/${id}-${name}.png`;
  await sharp(await page.screenshot()).resize({width:1280,withoutEnlargement:true}).png().toFile(resolve(out,file));
  report.screenshots.push({step:name,file});
  const observed=await page.evaluate(()=>({headings:[...document.querySelectorAll('h1,h2,h3')].filter(e=>e.getClientRects().length).map(e=>e.textContent),buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({label:e.getAttribute('aria-label')||e.textContent,disabled:e.disabled})),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,screen:window.__depthReview?.screen}));
  observed.headings=observed.headings.map(cleanText);observed.buttons=observed.buttons.map(b=>({...b,label:cleanText(b.label)}));
  report.observations.push({atMs:at(),name,...observed});
 }
 async function step(number,name,work){
  const row={number,name,startedMs:at(),clickStart:report.clicks.length};report.steps.push(row);
  try{await work(row);row.status='pass';}catch(e){row.status='fail';row.reason=cleanText(e instanceof Error?e.message:e);}
  row.endedMs=at();row.clicks=report.clicks.length-row.clickStart;
  await snapshot(`${number}-${name}`).catch(()=>{row.screenshotFailed=true;});
  await writeFile(resolve(out,`run-${id}.json`),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({id,step:number,status:row.status,atMs:row.endedMs,reason:row.reason}));
  return row.status==='pass';
 }
 try{
  let entered=false,battle=false,reward=false,home=false,cafe=false;
  await step(1,'landing',async row=>{
   await page.goto(base,{waitUntil:'domcontentloaded'});await button(/^(Play free|Play as guest)$/).waitFor();
   const u=new URL(page.url());report.resolvedPath=u.pathname+u.search;row.readyMs=at();
   row.judgePassVisible=await button(/Judge pass/).isVisible();
   row.counterTexts=(await page.locator('.b-live-counters,.b-counters').allTextContents()).map(cleanText);
  });
  entered=await step(2,'guest',async()=>{await tap(/^(Play free|Play as guest)$/);await button(/^Fight/).waitFor();if(await page.getByRole('dialog',{name:'Wallet sign-in'}).isVisible())throw Error('Guest requested wallet sign-in');report.guestReadyMs=at();});
  battle=await step(3,'battle-reward',async row=>{
   if(!entered)throw Error('Blocked by guest entry');
   await tap(/^Fight/);await tap('Fight');
   await page.waitForFunction(()=>window.__depthReview?.watching===true);
   report.firstBattleMs=at();report.firstBattleClicks=report.clicks.length;
   await victory(240000);
   row.practiceMs=at();row.practiceResult=await page.evaluate(()=>window.__depthReview?.battle?.result);
   if(row.practiceResult!=='party')throw Error('Practice lost');
   await tap('Complete lesson');await button('Welcome').waitFor();await coach();await tap('Welcome');await tap('Skip reveal');await celebrations();
   await click(page.getByRole('dialog',{name:'Recruit',exact:true}).getByRole('button',{name:'Close',exact:true}),'Close recruit');
   await tap(/^Fight/);await tap('Fight');row.campaignStartedMs=at();
   await victory(600000);
   row.campaignResult=await page.evaluate(()=>window.__depthReview?.battle?.result);
   if(row.campaignResult!=='party')throw Error('First campaign lost');
   row.rewardCount=await page.locator('[data-reward-id]').count();
   reward=row.rewardCount>0;report.firstRewardMs=at();
   await tap('Next');await button(/^Fight/).waitFor();await coach();await celebrations();home=true;
   if(!reward)throw Error('Victory did not expose reward cards');
  });
  await step(4,'first-receipt',async row=>{
   if(!home)throw Error('Blocked before return to café');
   await tap('Market');await page.getByRole('dialog',{name:'Fuji market',exact:true}).waitFor();
   await tap('Café');await page.getByRole('region',{name:'On-chain café',exact:true}).waitFor();
   await button('Seal').waitFor();await coach();cafe=true;await tap('Seal');
   const choices=page.locator('.b2-seal-items button');row.sealableChoices=await choices.count();
   if(!row.sealableChoices)throw Error('No earned item is available to seal in the on-chain café');
   await click(choices.first(),'Seal earned item');await tap('Confirm & mint');
   const receipt=page.getByRole('link',{name:/Receipt/}).first();await receipt.waitFor({timeout:60000});
   report.firstReceiptMs=at();row.link=await receipt.getAttribute('href');
   // A link alone cannot satisfy the required measured time/fee/payer toast.
   const toast=page.locator('[data-receipt-hash]').last();
   if(!await toast.isVisible())throw Error('Receipt link lacks measured time, AVAX fee and payer');
   row.toast=cleanText(await toast.innerText());
  });
  await step(5,'cafe-economy',async row=>{
   if(!cafe)throw Error('Blocked before on-chain café');
   if(await button('Back to café').isVisible())await tap('Back to café');
   await tap('Fusion');row.epicInputs=await page.locator('.b-fusion-inputs button').count();
   if(row.epicInputs<3)throw Error(`Fusion requires three matching Epics; available choices=${row.epicInputs}. Market buy and Spool depend on missing earned resources`);
   throw Error('Fusion/list/second-wallet buy/Spool traversal requires an accessible funded guest journey; not counted from pre-seeded state');
  });
  await step(6,'boss',async()=>{
   if(await button('Close market').isVisible())await tap('Close market');
   const boss=button(/^(Fight boss|Boss fight)$/);
   if(!await boss.isVisible())throw Error('No boss action reachable on the guest demo path');
   await click(boss,'Fight boss');await page.waitForFunction(()=>window.__depthReview?.watching===true);const bossStart=at();
   await page.waitForFunction(()=>window.__depthReview?.screen==='result',null,{timeout:180000});report.bossMs=at()-bossStart;
   if(await page.evaluate(()=>window.__depthReview?.battle?.result)!=='party')throw Error('Boss lost');
  });
  await step(7,'wallet-proof',async()=>{
   const proof=button('My café on Avalanche');
   if(!await proof.isVisible())throw Error('My café on Avalanche is not reachable from the guest path');
   await click(proof,'My café on Avalanche');await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor();
   report.proofLinks=await page.locator('a[href*="snowtrace.io/tx/"]').count();
   if(report.proofLinks<5)throw Error('Wallet proof does not show five action types');
  });
 }finally{
  report.elapsedMs=at();report.complete=report.steps.length===7&&report.steps.every(s=>s.status==='pass');
  report.pass=report.complete&&report.errors.length===0&&report.networkFailures.length===0&&report.httpFailures.length===0&&report.popups.length===0;
  anyFailed||=!report.pass;closed=true;await context.close();
  await writeFile(resolve(out,`run-${id}.json`),JSON.stringify(report,null,2)+'\n');
 }
}
try{for(const width of widths)for(let n=1;n<=count;n++)await run(width,n);}finally{await browser.close();}
if(anyFailed)process.exitCode=1;
