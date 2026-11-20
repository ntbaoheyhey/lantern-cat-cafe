// REFERENCE: Prepare44 isolated layout; real controls and original earned save, no elapsed-play claim.
import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]||1280),before=process.argv[4]==='before';
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const height=width===1440?900:width===1024?600:720,attempt=process.env.A5_PREPARE_ATTEMPT||'1';
const root='reports/cardrpg-big/a5/c1-prepare-layout',out=`${root}/${before?'before-':''}${mode}-${width}-attempt-${attempt}`;
const artifact=before?'reports/cardrpg-big/a5/e1-equipment-forecast/prototype-'+mode+'/index.html':'/tmp/cardrpg-a5-prepare-order-'+mode+'/index.html';
await mkdir(out,{recursive:true});const sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try{
 for(const look of before?['baseline']:['baseline','look']){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
  async function forecast(){
   await page.waitForFunction(()=>document.querySelector('.dp-v4-forecast')?.hasAttribute('data-forecast-ms'),null,{timeout:30000});
   const text=await page.locator('.dp-v4-forecast').innerText();assert.match(text,/Risky|Even|Favoured/);assert.doesNotMatch(text,/\d+\s*%/);
  }
  async function capture(name){
   await page.locator('.cr-content').evaluate(e=>e.scrollTop=0);
   const facts=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label')||e.textContent.trim(),top:r.top,bottom:r.bottom,left:r.left,right:r.right,visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth};};
    const controls=[...document.querySelectorAll('.dp-v4-placement button')].map(rect);
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const leaves=[...document.querySelectorAll('.dp-v4-prepare :is(button,h2,h3,p,small,legend),.dp-v4-forecast :is(h2,p,small)')].filter(e=>!e.children.length&&e.getClientRects().length&&!e.matches(':disabled')&&!e.closest('details:not([open])'));
    const contrast=leaves.map(e=>{let p=e,bgs;while(p){const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return {text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    return {overflow:document.documentElement.scrollWidth-innerWidth,controls,fight:rect(document.querySelector('.dp-fight')),forecast:document.querySelector('.dp-v4-forecast')?rect(document.querySelector('.dp-v4-forecast')):null,contrast};
   });
   const path=`${out}/${look}-${name}.png`;await page.screenshot({path});captures.push({look,name,path,...facts});
   assert.equal(facts.overflow,0);assert(facts.fight.visible);
   if(mode==='on'&&!before){assert.equal(facts.controls.length,5);assert(facts.controls.every(r=>r.visible),JSON.stringify(facts.controls));assert(facts.contrast.length&&facts.contrast.every(r=>r.ratio>=4.5),JSON.stringify(facts.contrast));if(width>=1280)assert(facts.forecast.visible);}
   return facts;
  }
  await page.goto('file://'+(artifact.startsWith('/')?artifact:process.cwd()+'/'+artifact)+(look==='look'?'?dev=1':''));
  await page.getByRole('heading',{name:'A small light. A brave little team.',exact:true}).waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();
  await page.getByRole('button',{name:'Try the practice table →',exact:true}).click();
  await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();
  if(mode==='off'){
   assert.equal(await page.locator('.dp-v4-placement').count(),0);assert.equal(await page.locator('.dp-v4-forecast').count(),0);
   assert.equal(await page.locator('.dp-matchup').count(),1);await page.waitForFunction(()=>!document.querySelector('.dp-matchup').textContent.includes('Estimating'));
   await capture('practice-off');checks.push({look,kind:'OFF keeps original estimate and controls'});await page.close();continue;
  }
  const original=await read();await forecast();assert.deepEqual(await read(),original);
  await capture('practice');
  if(!before){
   assert(await button('Place Mochi in Back').isDisabled());
   await button('Select Soot for placement').focus();await page.keyboard.press('Enter');
   await button('Place Soot in Front').focus();await page.keyboard.press('Space');await forecast();
   assert.equal((await read()).battle.initial.cats.find(c=>c.id==='soot').row,'front');
   await button('Place Soot in Back').click();await forecast();assert.deepEqual((await read()).battle.initial,original.battle.initial);
   await button('Protect · below 65% HP').click();await forecast();assert.equal((await read()).battle.v4.plan.care,'protect');
   await button('Steady · below 45% HP').click();await forecast();assert.deepEqual((await read()).battle.initial,original.battle.initial);
   checks.push({look,kind:'keyboard rows, last-front guard, real forecast and standing-plan roundtrip'});
  }
  await nav('Save & settings');const save=await readFile('reports/cardrpg-big/a5/e2-home-stars/fixtures/earned.save','utf8');
  await page.getByLabel('Save code',{exact:true}).fill(save.trim());await button('Import save code').click();assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Cafe');
  await page.locator('.dp-v4-home-routes').getByRole('button').filter({hasText:'Tangled Cafe'}).click();
  await page.locator('.dp-node:enabled').first().click();await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();
  const earned=await read();await forecast();assert.deepEqual(await read(),earned);
  const facts=await capture('earned-route');
  assert.equal(await page.getByRole('region',{name:'Boss scouting'}).count(),1);assert.equal(await page.getByRole('heading',{name:'Three stars to chase'}).count(),1);
  if(before)assert(facts.controls.some(r=>!r.visible),'Reproduce original off-screen placement');
  checks.push({look,kind:before?'original placement below viewport reproduced':'earned route retains forecast, scouting, stars and exact account'});
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,before,mode,width,height,artifact,sha256:sha(await readFile(artifact)),checks,captures,errors,remote,limitations:['Targeted layout/real controls only, not new cadence, startup or balance evidence.','OFF retains the original five-simulation display; v4 shows qualitative forecast only.']},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,before,mode,width,checks:checks.length,captures:captures.length}));
