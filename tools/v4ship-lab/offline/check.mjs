/** Exercise the packaged file with all HTTP blocked; this cannot count as G-REHEARSAL. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),build=process.argv[2],attempt=process.argv[3];
if(!/^\d+$/.test(build)||!/^\d+$/.test(attempt))throw Error('Specify build and new check number');
const reportPath=resolve(root,`reports/v4-ship/S10/offline-check-${attempt}.json`);
if(existsSync(reportPath)||existsSync(resolve(root,'STOP-V4SHIP')))throw Error('Preserve attempts / STOP');
const info=JSON.parse(readFileSync(resolve(root,`reports/v4-ship/S10/offline-build-${build}.json`)));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
if(!info.pass||sha(readFileSync(resolve(info.directory,'index.html')))!==info.index.sha256)throw Error('Build integrity failed');
for(const row of info.files)if(sha(readFileSync(resolve(info.directory,row.path)))!==row.sha256)throw Error('Pack integrity failed');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),sharp=require('sharp');
const raw=resolve(root,`work/v4ship-prep/S10-offline-check-${attempt}`);mkdirSync(raw,{recursive:true});
const report={at:new Date().toISOString(),buildEvidence:`reports/v4-ship/S10/offline-build-${build}.json`,sourceCommit:info.sourceCommit,scope:'Offline mock review; not production or public-chain evidence',harnessSha256:sha(readFileSync(import.meta.filename)),rows:[],pass:false};
const safe=value=>String(value).replace(/0x[\da-f]{64,}/gi,'[hex]').slice(0,500);
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{for(const width of [1280,1440]){
 if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
 const context=await browser.newContext({viewport:{width,height:width===1280?720:900},offline:true,serviceWorkers:'block'}),page=await context.newPage();
 const row={width,at:new Date().toISOString(),network:[],errors:[],steps:[],screenshots:[],pass:false};report.rows.push(row);
 page.on('pageerror',e=>row.errors.push(safe(e.message)));page.on('console',e=>{if(e.type()==='error')row.errors.push(safe(e.text()));});
 await context.route('**/*',async route=>{if(/^https?:/.test(route.request().url())){row.network.push(route.request().url());await route.abort();}else await route.continue();});
 await page.addInitScript(()=>{window.__offlineViolations=[];document.addEventListener('securitypolicyviolation',e=>window.__offlineViolations.push({directive:e.effectiveDirective,uri:e.blockedURI}));});
 const button=name=>page.getByRole('button',{name,exact:true});
 const capture=async name=>{if(process.env.V4_OFFLINE_SCREENSHOTS!=='1')return;const path=resolve(raw,`${width}-${name}.png`);await sharp(await page.screenshot()).resize({width:1024}).png().toFile(path);row.screenshots.push({path:relative(root,path),sha256:sha(readFileSync(path))});};
 const step=async(name,work)=>{const started=performance.now();await work();row.steps.push({name,seconds:(performance.now()-started)/1000});console.log(JSON.stringify({width,step:name}));};
 try{
  await step('file-open landing',async()=>{
   await page.goto(pathToFileURL(resolve(info.directory,'index.html')).href,{timeout:60000});
   if(row.errors.length)throw Error('Offline bootstrap raised an error');
   await Promise.race([button('Play free').waitFor({timeout:60000}),new Promise((_,reject)=>page.once('pageerror',reject))]);
   if(!await page.locator('#offline-notice').isVisible())throw Error('Persistent mock label missing');
   row.restoredAssets=await page.evaluate(async manifest=>{
    const missing=[],changed=[];
    for(const asset of manifest){const url=window.__cardAssets[asset.key];if(!url){missing.push(asset.key);continue;}
     const bytes=await(await fetch(url)).arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
     if(digest!==asset.sha256||bytes.byteLength!==asset.bytes)changed.push(asset.key);
    }return {count:manifest.length,missing,changed};
   },info.assets.map(({key,sha256,bytes})=>({key,sha256,bytes})));
   if(row.restoredAssets.missing.length||row.restoredAssets.changed.length)throw Error('Original asset byte verification failed');
   await capture('landing');
  });
  await step('guest and real battle',async()=>{
   await button('Play free').click();
   await button('Wallet').click();await page.getByRole('dialog',{name:'Offline wallet',exact:true}).waitFor();await button('Close offline wallet').click();
   await button('Start trial').click({timeout:30000});await page.locator('.dp-battle').waitFor({timeout:30000});
   row.battle=await page.evaluate(()=>({realModel:!!window.__depthReview,setup:window.__depthReview?.replay?.initial??window.__depthReview?.visualBattle?.initial}));
   await capture('battle');await button('Mint trial reward').waitFor({timeout:200000});
  });
  await step('mock reward and workshop',async()=>{
   await button('Mint trial reward').click();
   for(const [name,next]of [['Fund workshop','Seal Epic'],['Seal Epic','Forge Legendary'],['Forge Legendary','List for 5 YARN'],['List for 5 YARN','Buy with demo wallet'],['Buy with demo wallet','Withdraw Spool'],['Withdraw Spool','Face the boss']]){
    await button(name).click({timeout:30000});await button(next).waitFor();
    if(name==='Forge Legendary'){await page.reload();await button(next).waitFor({timeout:60000});row.reloadRecovery=true;}
   }
  });
  await step('boss and offline ledger',async()=>{
   await button('Face the boss').click();await page.getByRole('heading',{name:'Offline café ledger',exact:true}).waitFor({timeout:200000});
   row.mockRecords=await page.locator('[data-mock-record]').allTextContents();if(row.mockRecords.length!==7)throw Error('Incomplete mock ledger');
   if(await page.locator('a[href*="snowtrace.io/tx/"]').count())throw Error('Mock receipt linked to a real explorer');
   await capture('ledger');
  });
  row.assetsAtEnd=await page.evaluate(()=>({missing:window.__demoOffline.missingAssets,networkAttempts:window.__demoOffline.networkAttempts,violations:window.__offlineViolations,brokenImages:[...document.images].filter(i=>i.checkVisibility()&&(!i.complete||i.naturalWidth===0)).map(i=>i.getAttribute('src')),label:document.getElementById('offline-notice').checkVisibility(),horizontalOverflow:document.documentElement.scrollWidth>innerWidth}));
  await step('restart',async()=>{await button('Restart offline journey').click();await button('Play free').waitFor({timeout:60000});row.resetLedger=await page.evaluate(()=>localStorage.getItem('lantern.v4.offline.mock.v1'));if(row.resetLedger!==null)throw Error('Reset retained mock ledger');});
  const end=row.assetsAtEnd;
  row.pass=!row.errors.length&&!row.network.length&&!end.missing.length&&!end.networkAttempts.length&&!end.violations.length&&!end.brokenImages.length&&end.label&&!end.horizontalOverflow&&row.reloadRecovery;
 }catch(error){row.failure=safe(error.message);row.visibleFailure=await page.locator('body').innerText().then(s=>safe(s.slice(-1200))).catch(()=>null);}
 finally{await context.close();writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
 if(!row.pass)break;
}}finally{await browser.close();report.pass=report.rows.length===2&&report.rows.every(r=>r.pass);writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({report:relative(root,reportPath),pass:report.pass,rows:report.rows.map(({width,pass,failure,errors})=>({width,pass,failure,errors}))}));
if(!report.pass)process.exitCode=1;
