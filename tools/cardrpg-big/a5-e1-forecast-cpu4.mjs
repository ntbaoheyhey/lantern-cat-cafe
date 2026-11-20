// REFERENCE: PROMPT-A5 E1. Separate CPU4 observation; prior three-width measurements retained.
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const artifact=process.env.A5_E1_ARTIFACT||'/tmp/cardrpg-a5-e1-artifact/index.html';
const out=process.env.A5_E1_CPU4_OUT||'reports/cardrpg-big/a5/e1/forecast-cpu4';await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),errors=[],observations=[];
page.on('pageerror',e=>errors.push(String(e)));
const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
let passed=false;
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await page.getByRole('button',{name:/Try the practice table/}).click();
 async function observe(label){
  await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'),null,{timeout:30000});
  const row=await page.locator('.dp-v4-forecast').evaluate(e=>({elapsedMs:Number(e.dataset.forecastMs),computeMs:Number(e.dataset.computeMs),cached:e.dataset.cacheHit==='true',text:e.innerText}));
  assert(!row.cached);assert.match(row.text,/Risky|Even|Favoured/);observations.push({label,...row});
 }
 await observe('practice');await page.getByRole('button',{name:'Select Soot for placement',exact:true}).click();
 await page.getByRole('button',{name:'Place Soot in Front',exact:true}).click();await observe('changed-row');
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByRole('button',{name:'Skip to result',exact:true}).click();
 await page.getByRole('button',{name:'Complete lesson',exact:true}).click();
 await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Save & settings',exact:true}).click();
 await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save','utf8'));
 await page.getByRole('button',{name:'Import save code',exact:true}).click();
 await page.getByRole('button',{name:'Apply and retry route',exact:true}).click({timeout:30000});await observe('earned-retry');
 assert.deepEqual(errors,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),cpu:4,observations,errors,
 method:'Chromium page Emulation.setCPUThrottlingRate(4), 1280x720; worker elapsed/compute reported separately. Three cold build keys, no repeated sampling until pass. Not a calibrated hardware benchmark.'},null,2));
 await browser.close();
}
