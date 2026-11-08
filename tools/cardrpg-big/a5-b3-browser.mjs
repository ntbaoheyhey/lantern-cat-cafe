// REFERENCE: A5 B3. Targeted real-click reward flow; full screenshot pack reserved for Z.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
assert([1024,1280,1440].includes(width));
const artifact=resolve('/tmp/cardrpg-a5-b3-adopted/index.html'),out=`reports/cardrpg-big/a5/b3/browser-${width}`;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],remote=[],captures=[],checks=[];
const read=()=>page.evaluate(()=>window.__depthReview.state),button=name=>page.getByRole('button',{name,exact:true});
const nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
async function capture(name,selector){
 await page.locator(selector).scrollIntoViewIfNeeded();
 const metrics=await page.evaluate(selector=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const contrast=[...document.querySelectorAll(selector+' *')].filter(e=>e.getClientRects().length&&!e.children.length&&e.textContent.trim()&&!e.matches('option,progress')).map(e=>{
   let p=e,bg;while(p){const c=rgb(getComputedStyle(p).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}p=p.parentElement;}
   const a=luma(rgb(getComputedStyle(e).color)),b=luma(bg||[29,27,40]);return {text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  });return {overflow:document.documentElement.scrollWidth-innerWidth,contrast};
 },selector);
 await page.screenshot({path:`${out}/${name}.png`});captures.push({name,...metrics});
 assert.equal(metrics.overflow,0,name);assert(metrics.contrast.every(c=>c.ratio>=4.5),JSON.stringify(metrics.contrast.filter(c=>c.ratio<4.5)));
}
let passed=false;
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 await nav('Invitations');await button('Open free welcome invitation').click();
 const welcome=await read();assert.equal(welcome.v4.selectorMarks??0,0);assert(welcome.freeInvite);
 await button('Invite once · 150 stamps').click();const paid=await read();
 assert.equal(paid.account.currencies.stamps,welcome.account.currencies.stamps-150);
 assert.equal(paid.v4.selectorMarks,1);assert.equal(paid.account.history.length,welcome.account.history.length+1);
 checks.push('fresh public paid draw spends150, adds one mark and retains history');
 await page.locator('.dp-player-odds summary').first().click();
 assert.match(await page.locator('.dp-player-odds').innerText(),/360 stamps daily/);
 assert.match(await page.locator('.dp-player-odds').innerText(),/From draw 13/);
 assert.match(await page.locator('.dp-player-odds').innerText(),/by draw 24/);
 await capture('disclosed-odds','.dp-player-odds');checks.push('welcome once, no selector mark, disclosed13/24/360');
 const fixture=JSON.parse(await readFile('reports/cardrpg-big/a5/b3/earned-selector/checks.json','utf8'));
 await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(await readFile('reports/cardrpg-big/a5/b3/earned-selector/ready.save','utf8'));await button('Import save code').click();
 const earned=await read();assert.equal(earned.v4.selectorMarks,24);
 await nav('Invitations');await page.getByLabel('Chosen reward',{exact:true}).selectOption(fixture.chosen);
 await capture('earned-choice','.dp-v4-selector');await button('Choose reward · 24 marks').click();
 const chosen=await read();assert.equal(chosen.v4.selectorMarks,0);assert.deepEqual(chosen.account.pity,earned.account.pity);
 assert(chosen.account.cards.some(c=>c.cardId===fixture.chosen));assert(await button('Choose reward · 24 marks').isDisabled());
 checks.push('public-command-earned24marks choose once; pity unchanged');
 if(chosen.account.currencies.stamps>=150){
  await button('Invite once · 150 stamps').click();const invited=await read();
  assert.equal(invited.account.currencies.stamps,chosen.account.currencies.stamps-150);assert.equal(invited.v4.selectorMarks,1);
  const result=invited.account.history.at(-1),shown=await page.locator('.dp-pull-history').innerText();assert.match(shown,/Account-bound/);assert.equal(result.bannerId,'standard');
  checks.push('earned paid draw spends150 and adds one mark');
 }
 await capture('choice-collected','.dp-v4-selector');await nav('Cafe');
 assert.match(await page.locator('.dp-v4-tomorrow').innerText(),/Tomorrow.*360/s);await capture('tomorrow','.dp-v4-tomorrow');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,errors,remote},null,2));await browser.close();
}
