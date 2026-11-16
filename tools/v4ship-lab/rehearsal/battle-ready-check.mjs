import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {waitForBattleReady} from './battle-ready.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S8/battle-ready-check-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true}),page=await browser.newPage();
const report={at:new Date().toISOString(),helperSha256:createHash('sha256').update(readFileSync(resolve(root,'tools/v4ship-lab/rehearsal/battle-ready.mjs'))).digest('hex'),cases:[],pass:false};
try{
 for(const [name,contents,ready] of [
  ['loading overlay','<canvas width="100" height="100"></canvas><div class="dp-loading">Loading</div>',false],
  ['error overlay','<canvas width="100" height="100"></canvas><div class="dp-loading" role="status">Unavailable</div>',false],
  ['missing canvas','<p>Battle container only</p>',false],
  ['hidden canvas','<canvas style="display:none"></canvas>',false],
  ['zero-sized canvas','<canvas style="width:0;height:100px"></canvas>',false],
  ['ready canvas','<canvas width="100" height="100"></canvas>',true],
 ]){
  await page.setContent(`<section class="dp-battle" style="min-height:150px">${contents}</section>`);
  const oldBoundary=await page.locator('.dp-battle').isVisible();let observed=true;
  try{await waitForBattleReady(page,150);}catch(error){assert(error.name==='TimeoutError');observed=false;}
  report.cases.push({name,oldBoundary,expected:ready,observed,pass:oldBoundary&&observed===ready});
 }
 await page.setContent('<section class="dp-battle"><canvas width="100" height="100"></canvas><div class="dp-loading">Loading</div></section>');
 await page.evaluate(()=>setTimeout(()=>document.querySelector('.dp-loading').remove(),100));const start=performance.now();await waitForBattleReady(page,2000);
 report.cases.push({name:'loading transitions to ready',observedMs:performance.now()-start,pass:await page.locator('.dp-loading').count()===0});
 report.pass=report.cases.length===7&&report.cases.every(x=>x.pass);
}catch(error){report.failure=error.message.slice(0,300);}
finally{await browser.close();writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,output),cases:report.cases.length,pass:report.pass,failure:report.failure}));if(!report.pass)process.exitCode=1;
