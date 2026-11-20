// REFERENCE: Prepare44 supplement registered after geometry, before runtime adoption. Real delayed worker results and CSP denial.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
const root='reports/cardrpg-big/a5/c1-prepare-layout';
const out=root+'/worker-attempt-'+(process.env.A5_PREPARE_ATTEMPT||1);
await mkdir(out,{recursive:false});
const artifact='/tmp/cardrpg-a5-prepare-order-on/index.html';
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],errors=[],remote=[];let passed=false;
try {
 for(const scenario of ['delayed','csp']) {
  const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push({scenario,error:String(e)}));
  page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.addInitScript(()=>{
   const Native=window.Worker;
   window.__workerAudit=[];window.__holdForecasts=true;window.__heldForecasts=[];
   window.Worker=class extends Native {
    constructor(...args) {
     super(...args);
     const row={terminated:false,request:null,result:null,delivered:false};window.__workerAudit.push(row);
     let callback;
     Object.defineProperty(this,'onmessage',{configurable:true,get:()=>callback,set:fn=>{callback=fn;}});
     this.addEventListener('message',event=>{
      row.result=event.data;
      const deliver=()=>{row.delivered=true;callback?.(event);};
      if(window.__holdForecasts)window.__heldForecasts.push(deliver);else deliver();
     });
     const send=this.postMessage.bind(this),stop=this.terminate.bind(this);
     this.postMessage=(data,...rest)=>{row.request=data;send(data,...rest);};
     this.terminate=()=>{row.terminated=true;stop();};
    }
   };
  });
  await page.goto('file://'+artifact);await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const button=name=>page.getByRole('button',{name,exact:true});
  if(scenario==='csp')await page.evaluate(()=>{
   const meta=document.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content="worker-src 'none'";document.head.append(meta);
  });
  await page.getByRole('button',{name:'Try the practice table →',exact:true}).click();
  const region=page.getByRole('region',{name:'Rough forecast',exact:true});
  const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle}));
  if(scenario==='delayed') {
   await page.waitForFunction(()=>window.__heldForecasts.length===1);
   const old=await page.evaluate(()=>window.__workerAudit[0]);
   await button('Select Soot for placement').click();
   await button('Place Soot in Front').click();
   await button('Protect · below 65% HP').click();
   const before=await read();
   await page.waitForFunction(()=>window.__workerAudit.at(-1)?.result);
   const latest=await page.evaluate(()=>window.__workerAudit.at(-1));
   assert.notEqual(latest.request.key,old.request.key);
   assert.equal(latest.request.setup.cats.find(c=>c.id==='soot').row,'front');
   assert.equal(latest.request.setup.plan.care,'protect');
   // Only the stale native result arrives while the current result remains held.
   await page.evaluate(()=>window.__heldForecasts.shift()());
   assert.match(await region.innerText(),/Reading the matchup/);
   assert.equal(await region.locator('[data-forecast-ms]').count(),0);
   await page.evaluate(()=>{window.__holdForecasts=false;window.__heldForecasts.splice(0).forEach(send=>send());});
   await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'));
   const text=await region.innerText();assert(text.includes(latest.result.result.band));assert(text.includes(latest.result.result.risk));
   assert.deepEqual(await read(),before);
   await nav('Cafe');
   const audit=await page.evaluate(()=>window.__workerAudit.map(r=>({key:r.request?.key,resultKey:r.result?.key,terminated:r.terminated,delivered:r.delivered})));
   assert(audit.every(r=>r.terminated));
   checks.push({scenario,oldKey:old.request.key,latestKey:latest.request.key,audit,staleResultRejected:true,latestNativeResultShown:true,stateUnchanged:true,allWorkersTerminated:true});
  }else{
   const before=await read();
   await region.getByText('The forecast is unavailable. Read their plan below.',{exact:true}).waitFor();
   assert.equal(await region.getAttribute('data-forecast-ms'),null);
   assert.equal(await page.locator('.dp-v4-placement button').count(),5);
   assert(await button('Fight').isEnabled());
   assert.deepEqual(await read(),before);
   await page.screenshot({path:out+'/csp-fallback.png'});
   checks.push({scenario,actualWorkerCspDenied:true,fallback:true,stateUnchanged:true,placementAndFightRemainAvailable:true});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
} finally {
 await writeFile(out+'/checks.json',JSON.stringify({passed,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,errors,remote,method:'Native worker calculations with delayed message delivery; separate actual worker-src none CSP. Neither changes combat, account or forecast results.'},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,checks:checks.length}));
