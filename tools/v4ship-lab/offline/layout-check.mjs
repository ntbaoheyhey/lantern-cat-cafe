/** Check the CSS-only banner correction against the already exercised package. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),reportPath=resolve(root,'reports/v4-ship/S10/offline-layout-1.json');
if(existsSync(reportPath)||existsSync(resolve(root,'STOP-V4SHIP')))throw Error('Preserve previous check / STOP');
const prior=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S10/offline-build-3.json'))),current=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S10/offline-build-4.json')));
const load=info=>{const html=readFileSync(resolve(info.directory,'index.html'),'utf8');const packed=html.match(/<script id="payload" type="application\/octet-stream">([A-Za-z0-9+/=]+)<\/script>/)?.[1];return JSON.parse(gunzipSync(Buffer.from(packed,'base64')));};
const a=load(prior),b=load(current),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
// Vite resolves independent imports concurrently. Compare the same unique keys,
// original byte lengths/hashes and MIME types independently of Map insertion order.
const sortedAssets=info=>info.assets.slice().sort((a,b)=>a.key.localeCompare(b.key));
const report={at:new Date().toISOString(),priorFunctionalEvidence:'reports/v4-ship/S10/offline-check-2.json',buildEvidence:'reports/v4-ship/S10/offline-build-4.json',harnessSha256:sha(readFileSync(import.meta.filename)),identicalModules:JSON.stringify(a.modules)===JSON.stringify(b.modules),identicalAssets:JSON.stringify(sortedAssets(prior))===JSON.stringify(sortedAssets(current)),identicalPacks:JSON.stringify(prior.files)===JSON.stringify(current.files),cssChanged:a.css!==b.css,rows:[],pass:false};
if(!report.identicalModules||!report.identicalAssets||!report.identicalPacks||!report.cssChanged){report.failure='Change is not restricted to CSS; run complete journeys';writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');throw Error(report.failure);}
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),sharp=require('sharp'),browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const out=resolve(root,'work/v4ship-prep/S10-offline-layout-1');mkdirSync(out,{recursive:true});
try{for(const width of [1280,1440]){
 const context=await browser.newContext({viewport:{width,height:width===1280?720:900},offline:true,serviceWorkers:'block'}),page=await context.newPage();
 const row={width,errors:[],pass:false};report.rows.push(row);page.on('pageerror',e=>row.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')row.errors.push(e.text());});
 try{
  await page.goto(pathToFileURL(resolve(current.directory,'index.html')).href);const button=name=>page.getByRole('button',{name,exact:true});await button('Play free').waitFor({timeout:60000});await button('Play free').click();await button('Start trial').click();await page.locator('.dp-battle').waitFor({timeout:30000});
  row.layout=await page.evaluate(()=>{const banner=document.getElementById('offline-notice'),r=banner.getBoundingClientRect(),overlap=(a,b)=>Math.min(a.right,b.right)>Math.max(a.left,b.left)&&Math.min(a.bottom,b.bottom)>Math.max(a.top,b.top);
   return {banner:{x:r.x,y:r.y,width:r.width,height:r.height},visible:banner.checkVisibility(),inside:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,overlappingControls:[...document.querySelectorAll('button,[role="progressbar"]')].filter(e=>e.checkVisibility()&&!e.closest('[inert],[aria-hidden="true"]')&&overlap(r,e.getBoundingClientRect())).map(e=>e.getAttribute('aria-label')||e.textContent),belowHeader:r.y>innerHeight*.7};
  });
  const path=resolve(out,`${width}-battle.png`);await sharp(await page.screenshot()).resize({width:1024}).png().toFile(path);row.screenshot={path:relative(root,path),sha256:sha(readFileSync(path))};
  row.pass=!row.errors.length&&row.layout.visible&&row.layout.inside&&row.layout.belowHeader&&!row.layout.overlappingControls.length;
 }catch(e){row.failure=e.message;}finally{await context.close();}
}}finally{await browser.close();report.pass=report.rows.every(r=>r.pass);writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
