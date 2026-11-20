// REFERENCE: PROMPT-A5 E1. Targeted real-click flows; not an elapsed engagement or day7 victory measurement.
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const artifact=resolve(process.env.A5_E1_ARTIFACT||'/tmp/cardrpg-a5-e1-artifact/index.html');
const out=`${process.env.A5_E1_BROWSER_OUT||'reports/cardrpg-big/a5/e1'}/browser-${width}`;await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],remote=[],captures=[],checks=[],forecasts=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,screen:window.__depthReview.screen,battle:window.__depthReview.battle}));
const button=name=>page.getByRole('button',{name,exact:true}),nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
async function forecast(label,cpu=1){
 await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'),null,{timeout:30000});
 const row=await page.locator('.dp-v4-forecast').evaluate(e=>({elapsedMs:Number(e.dataset.forecastMs),computeMs:Number(e.dataset.computeMs),cached:e.dataset.cacheHit==='true',text:e.innerText}));
 assert.match(row.text,/Risky|Even|Favoured/);assert.doesNotMatch(row.text,/\d+\s*%/);forecasts.push({label,cpu,...row});return row;
}
async function capture(name,selector){
 await page.locator(selector).scrollIntoViewIfNeeded();
 const metrics=await page.evaluate(selector=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('details:not([open])');
  const contrast=[...document.querySelectorAll(selector+' *')].filter(e=>visible(e)&&!e.children.length&&e.textContent.trim()&&!e.matches('option,progress')).map(e=>{
   let p=e,bg;while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}p=p.parentElement;}
   const a=luma(rgb(getComputedStyle(e).color)),b=luma(bg||[29,27,40]);return {text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });return {overflow:document.documentElement.scrollWidth-innerWidth,contrast};
 },selector);await page.screenshot({path:`${out}/${name}.png`});captures.push({name,selector,...metrics});
 assert.equal(metrics.overflow,0,name);assert(metrics.contrast.every(c=>c.ratio>=4.5),JSON.stringify(metrics.contrast.filter(c=>c.ratio<4.5)));
}
let passed=false;
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await page.getByRole('button',{name:/Try the practice table/}).click();const original=await read();
 const fresh=await forecast('practice-cold');assert(!fresh.cached);await capture('forecast','.dp-v4-forecast');
 await button('Select Soot for placement').click();await button('Place Soot in Front').click();await forecast('changed-row');
 assert.equal((await read()).battle.initial.cats.find(c=>c.id==='soot').row,'front');
 await button('Place Soot in Back').click();const back=await forecast('restored-row');assert(back.cached);assert.deepEqual((await read()).battle.initial,original.battle.initial);
 checks.push('worker forecast responds to real row changes; identical build reuses cache; no percentage promise');
 await button('Fight').click();await button('Skip to result').click();
 await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();await capture('named-result','.dp-v4-outcome');
 const result=await read(),shown=await page.locator('.dp-v4-outcome').innerText();
 assert.match(shown,/Mochi|Soot|Clover/);assert.doesNotMatch(shown,/compare the visible enemy intent|These are observed/);
 await button('Complete lesson').click();
 const fixture=JSON.parse(await readFile('reports/cardrpg-big/a5/e1/rules/checks.json','utf8'));
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a5/e1/rules/earned-loss.save','utf8'));await button('Import save code').click();
 await button('Apply and retry route').waitFor({timeout:30000});const lost=await read();
 assert.equal(lost.battle.result,'enemy');assert.match(await page.locator('.dp-v4-advice').innerText(),new RegExp(fixture.advice.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 await capture('available-advice','.dp-v4-advice');await capture('loss-reasons','.dp-v4-outcome');
 await button('Apply and retry route').click();await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();
 const applied=await read();assert.equal(applied.state.run.id,lost.state.nextRunId);assert.equal(applied.state.run.visited.length,0);
 assert.deepEqual(applied.state.account.currencies,fixture.appliedCurrencies);
 checks.push('same earned day7 loss imports; named affordable advice applies once and opens a new route without grants');
 await forecast('retry-first-stop');await capture('retry-preparation','.dp-v4-forecast');
 await button('Fight').click();await button('Skip to result').click();await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();
 await button('Continue to rewards').click();await page.locator('.dp-reward').first().click();
 assert.match(await page.locator('.dp-v4-scouting').innerText(),/Known about the boss: 1\/3/);await capture('route-clue','.dp-v4-scouting');checks.push('completed first stop reveals one boss trait on route map');
 if(width===1280){
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.locator('.dp-node:enabled').first().click();
  if((await read()).screen==='prepare'){await forecast('next-encounter-cpu4',4);checks.push('CPU4 worker observation recorded separately');}
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,forecasts,captures,errors,remote,forecastBudget400ms:forecasts.filter(r=>r.cpu===1&&!r.cached).every(r=>r.elapsedMs<=400),limitations:['Targeted UI checks use Skip; not an x1 timing or engagement claim.','Earned loss imported from same public-command path; no day7 victory implied.']},null,2));await browser.close();
}
