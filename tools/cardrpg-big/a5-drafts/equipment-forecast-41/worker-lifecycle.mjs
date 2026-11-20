// REFERENCE: Equipment41 supplement. Real worker results, deliberately delayed delivery and actual CSP denial.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
const root='reports/cardrpg-big/a5/e1-equipment-forecast';
const out=root+'/worker-attempt-'+(process.env.A5_EQUIPMENT_ATTEMPT||1);
await mkdir(out,{recursive:false});
const artifact='/tmp/cardrpg-a5-equipment-forecast-on/index.html';
const fixtures=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const fixture=fixtures.checks.find(f=>f.mode==='on'&&f.name==='threshold');
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
  await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill((await readFile(fixture.path,'utf8')).trim());
  await button('Import save code').click();
  while(await button('Skip celebration').count())await button('Skip celebration').click();
  if(scenario==='csp')await page.evaluate(()=>{
   const meta=document.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content="worker-src 'none'";document.head.append(meta);
  });
  await nav('Equipment');await page.getByRole('group',{name:'Equip for',exact:true}).getByRole('button',{name:'Mochi',exact:true}).click();
  await page.locator('.dp-gear-grid button').filter({hasText:'Bellsteel'}).filter({hasText:'relic'}).first().click();
  const before=await page.evaluate(()=>window.__depthReview.state);
  const region=page.getByRole('region',{name:'Equipment boss comparison',exact:true});
  if(scenario==='delayed') {
   await page.waitForFunction(()=>window.__heldForecasts.length>=2);
   const oldKeys=await page.evaluate(()=>window.__workerAudit.filter(r=>r.result).map(r=>r.request.key));
   assert(oldKeys.length>=2);
   await page.getByRole('group',{name:'Compare against boss'}).getByRole('button',{name:'Yarn Giant',exact:true}).click();
   await page.getByLabel('Comparison band',{exact:true}).selectOption('1');
   // Deliver old results after the build changed; their real worker computations are retained.
   await page.evaluate(()=>{window.__holdForecasts=false;window.__heldForecasts.splice(0).forEach(send=>send());});
   await page.waitForFunction(()=>[...document.querySelectorAll('.dp-v4-equipment-forecast .dp-v4-forecast')].length===2&&[...document.querySelectorAll('.dp-v4-equipment-forecast .dp-v4-forecast')].every(e=>e.hasAttribute('data-forecast-ms')));
   const expected=fixture.forecasts.find(f=>f.chapter===1&&f.band===1);
   const texts=await region.locator('.dp-v4-forecast').allInnerTexts();
   for(const [i,side]of ['before','after'].entries()){assert(texts[i].includes(expected[side].band));assert(texts[i].includes(expected[side].risk));}
   const audit=await page.evaluate(()=>window.__workerAudit.map(r=>({key:r.request?.key,resultKey:r.result?.key,terminated:r.terminated,delivered:r.delivered})));
   for(const key of oldKeys)assert(audit.filter(r=>r.key===key).every(r=>r.terminated));
   assert.deepEqual(await page.evaluate(()=>window.__depthReview.state),before);
   await nav('Cafe');assert((await page.evaluate(()=>window.__workerAudit)).every(r=>r.terminated));
   checks.push({scenario,oldKeys,audit,latestMatchesFixture:true,stateUnchanged:true,allWorkersTerminated:true});
  } else {
   await region.getByText('The forecast is unavailable. Compare the stats and set bonuses.',{exact:true}).first().waitFor();
   assert.equal(await region.locator('.dp-v4-forecast').count(),2);
   assert.equal(await region.locator('[data-forecast-ms]').count(),0);
   assert.deepEqual(await page.evaluate(()=>window.__depthReview.state),before);
   await region.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/csp-fallback.png'});
   checks.push({scenario,actualWorkerCspDenied:true,fallback:true,stateUnchanged:true});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
} finally {
 await writeFile(out+'/checks.json',JSON.stringify({passed,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,errors,remote,method:'Native worker calculations with delayed message delivery; separate actual worker-src none CSP. Neither changes combat, account or forecast results.'},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,checks:checks.length}));
