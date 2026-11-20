/** Cold, ordinary desktop controls through every tutorial card to visible damage. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readBuildIdentity} from './build-identity.mjs';

const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a fresh evidence label');
for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
const out=resolve(root,'work/v5/CXI/first-hit',label);
assert(!existsSync(out),'Preserve earlier evidence');mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const indexSha256=hash(readFileSync(resolve(root,'apps/web/dist/index.html')));
assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),indexSha256,'Preview differs from current build');
const req=createRequire(resolve(root,'apps/web/package.json')),{chromium}=req('@playwright/test'),sharp=req('sharp');
const report={url,utc:new Date().toISOString(),...readBuildIdentity(root,indexSha256),indexSha256,viewport:{width:1280,height:720},scope:'Cold guest practice first visible damage, ordinary UI controls, all tutorial text retained with 200-word/minute reading allowance. No fixture, saved progress, speed change or public transaction.',readingWordsPerMinute:200,steps:[],tutorial:[],errors:[],httpFailures:[],blocked:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});let page;
try{
 const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'});page=await context.newPage();
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(request.method()!=='POST')return route.continue();
  if(target.origin===new URL(url).origin){report.blocked.push(target.pathname);return route.abort();}
  let body;try{body=request.postDataJSON();}catch{report.blocked.push(target.origin+target.pathname);return route.abort();}
  const calls=Array.isArray(body)?body:[body];
  if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
  report.blocked.push(target.origin+target.pathname);return route.abort();
 });
 const start=performance.now(),step=name=>report.steps.push({name,ms:Math.round(performance.now()-start)});
 await page.goto(url);await page.getByRole('button',{name:'Play free',exact:true}).click();step('guest entered');
 await page.locator('.uv-patrol').click();step('prepare opened');
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.locator('.dp-battle').waitFor();step('battle visible');
 const tutorial=page.getByRole('dialog',{name:'Tutorial',exact:true});await tutorial.waitFor();
 const enemyMeters=page.locator('.b3-world[data-side="enemy"] .b3-hp');
 report.enemyHpBefore=await enemyMeters.evaluateAll(elements=>Object.fromEntries(elements.map(element=>[element.closest('[data-actor]').getAttribute('data-actor'),Number(element.getAttribute('aria-valuenow'))])));
 assert(Object.keys(report.enemyHpBefore).length>0,'Visible enemy HUD must be present');
 for(let i=0;i<12&&await tutorial.isVisible();i++){
  const instruction=await tutorial.locator('p').innerText(),words=instruction.trim().split(/\s+/).length;
  const readingMs=Math.max(1000,Math.ceil(words*60000/report.readingWordsPerMinute));
  report.tutorial.push({instruction,words,readingMs});await page.waitForTimeout(readingMs);
  await tutorial.getByRole('button',{name:/^(Next|Got it)$/}).click();step('tutorial card '+(i+1));
 }
 assert(!await tutorial.isVisible(),'All tutorial cards must be completed');
 assert(report.tutorial.length>0,'Tutorial must not be skipped');
 const hitHandle=await page.waitForFunction(before=>{
  for(const element of document.querySelectorAll('.b3-world[data-side="enemy"] .b3-hp')){
   const actor=element.closest('[data-actor]'),target=actor?.getAttribute('data-actor'),hp=Number(element.getAttribute('aria-valuenow')),rect=element.getBoundingClientRect();
   if(target&&before[target]>hp&&rect.width>0&&rect.height>0&&getComputedStyle(actor).visibility!=='hidden')return {target,name:element.getAttribute('aria-label'),hpBefore:before[target],hpAfter:hp,damage:before[target]-hp};
  }
  return false;
 },report.enemyHpBefore,{timeout:15000,polling:'raf'});step('first visible hit');
 report.firstHitMs=report.steps.at(-1).ms;
 report.hit=await hitHandle.jsonValue();await hitHandle.dispose();
 assert(report.hit.damage>0,'Visible enemy health must decrease');
 report.readingAllowanceMs=report.tutorial.reduce((total,card)=>total+card.readingMs,0);
 await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:84}).toFile(resolve(out,'first-hit-1024.jpg'));
 report.complete=!report.errors.length&&!report.httpFailures.length&&!report.blocked.length;
 report.budgetPass=report.complete&&report.firstHitMs<30000;await context.close();
}catch(error){report.failure=String(error.message).slice(0,1000);if(page&&!page.isClosed())await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(resolve(out,'failure-1024.jpg'));}
finally{await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,budgetPass:report.budgetPass,firstHitMs:report.firstHitMs,readingAllowanceMs:report.readingAllowanceMs,cards:report.tutorial.length,hit:report.hit,errors:report.errors,failure:report.failure}));
process.exitCode=report.complete?0:1;
