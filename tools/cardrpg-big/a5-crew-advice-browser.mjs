// REFERENCE: advice28. Real clicks on the first registered owned-reserve suggestion; no injected state.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]);assert([1280,1440,1024].includes(width));
const height=width===1440?900:width===1024?600:720,look=process.argv[3]||'baseline';assert(['baseline','look'].includes(look));
const root='reports/cardrpg-big/a5/e1/crew-advice-28',artifact='/tmp/cardrpg-a5-crew-advice-28/artifact/index.html';
const attempt=process.env.A5_ADVICE_ATTEMPT||'1';
const out=root+'/browser-'+look+'-'+width+'-attempt-'+attempt;await mkdir(out,{recursive:false});
const fixture=JSON.parse(await readFile(root+'/browser-fixture.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
const errors=[],remote=[],captures=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
const button=name=>page.getByRole('button',{name,exact:true});
async function capture(name,selector){
 await page.locator(selector).scrollIntoViewIfNeeded();
 const metrics=await page.evaluate(selector=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const contrast=[...document.querySelectorAll(selector+' *')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.children.length&&e.textContent.trim()&&!e.matches('option,progress')).map(e=>{
   let p=e,bgs;const rect=e.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
   while(p){const box=p.getBoundingClientRect();if(x<box.left||x>box.right||y<box.top||y>box.bottom){p=p.parentElement;continue;}
    const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
    if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}
    const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
   const a=luma(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(luma),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));
   return {text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });return {overflow:document.documentElement.scrollWidth-innerWidth,contrast};
 },selector);
 const path=`${out}/${name}.png`;await page.screenshot({path});captures.push({name,path,selector,...metrics});
 assert.equal(metrics.overflow,0);assert(metrics.contrast.length>0);assert(metrics.contrast.every(c=>c.ratio>=4.5),JSON.stringify(metrics.contrast.filter(c=>c.ratio<4.5)));
}
let passed=false,workerWaitMs,after,before;
try{
 await page.goto('file://'+artifact+(look==='look'?'?dev=1':''));await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});
 if(look==='look')await button('Look A/B').click();
 else for(const name of ['Feel lab','Review studio','Mechanics lab','Frame meter','Look A/B'])assert.equal(await button(name).count(),0);
 await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:'Save & settings',exact:true}).click();
 await page.getByLabel('Save code',{exact:true}).fill(await readFile(root+'/earned-reserve-loss.save','utf8'));
 const start=Date.now();await button('Import save code').click();await button('Apply and retry route').waitFor({timeout:30000});workerWaitMs=Date.now()-start;
 before=await read();assert.equal(before.battle.result,'enemy');assert.equal(before.state.account.day,7);
 assert.deepEqual(before.state.team,fixture.beforeTeam);
 const text=await page.locator('.dp-v4-advice').innerText();assert(text.includes(fixture.advice.label));assert(text.includes('No currency needed.'));
 await capture('owned-reserve-suggestion','.dp-v4-advice');checks.push('Earned loss imported via Save code; worker selects exact registered owned-cat suggestion.');
 await button('Apply and retry route').click();after=await read();await writeFile(out+'/after-click.json',JSON.stringify({state:after.state,screen:after.screen,body:await page.locator('body').innerText()},null,2)+'\n');await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();
 after=await read();assert.equal(after.state.run.id,fixture.nextRunId);assert.deepEqual(after.state.team,fixture.afterTeam);
 assert.deepEqual(after.state.rows,fixture.afterRows);assert.deepEqual(after.state.account.currencies,fixture.afterCurrencies);
 assert.deepEqual(after.state.equipment,fixture.equipment);assert.deepEqual(after.state.gear,before.state.gear);
 assert.equal(after.battle.choices.length,0);assert.deepEqual(after.battle.initial.cats.map(c=>c.id),fixture.afterTeam);
 assert.equal(after.battle.initial.cats.find(c=>c.id===fixture.advice.change.replacementId).row,before.state.rows[fixture.advice.change.catId]);
 assert.equal(await button('Apply and retry route').count(),0);
 await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'),null,{timeout:30000});
 await capture('replacement-ready','.dp-v4-prepare');
 checks.push('One click preserves earned gear/currency, swaps only the named cat in the same row, and opens a fresh route before any combat action.');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,width,height,look,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),fixture:root+'/browser-fixture.json',workerWaitMs,checks,captures,errors,remote,beforeTeam:before?.state.team,afterTeam:after?.state.team,limitations:['Targeted result/apply/prepare flow; not a new elapsed gameplay, win-rate or cold-start benchmark.','Scoped contrast on captured advice/preparation text; not a full screenshot pack.']},null,2)+'\n');await browser.close();
}
