// REFERENCE: route53. Real clicks/keyboard on earned fixtures; no elapsed-play claim.
import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]),before=process.argv[4]==='before';
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const height=width===1440?900:width===1024?600:720,attempt=process.env.A5_ROUTE_ATTEMPT||'1';
const root='reports/cardrpg-big/a5/c1-route-order',out=`${root}/${before?'before-':''}${mode}-${width}-attempt-${attempt}`;
const artifact=before?'reports/cardrpg-big/a5/e2-star-plans/prototype-on/index.html':`/tmp/cardrpg-a5-route-order-${mode}/index.html`;
await mkdir(out,{recursive:false});const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try {
 for(const look of before?['baseline']:['baseline','look']) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=async name=>{await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cr-content')?.textContent.includes('Opening the table…'));};
  const read=()=>page.evaluate(()=>JSON.parse(JSON.stringify(window.__depthReview.state)));
  await page.goto('file://'+(artifact.startsWith('/')?artifact:process.cwd()+'/'+artifact)+(look==='look'?'?dev=1':''));
  await page.getByRole('heading',{name:'A small light. A brave little team.',exact:true}).waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();
  for(const f of manifest.fixtures.filter(f=>f.mode===mode&&(!before||f.name==='reward'))) {
   const save=await readFile(f.path,'utf8');assert.equal(sha(save),f.sha256);
   const source=await readFile(f.statePath),after=await readFile(f.afterPath);assert.equal(sha(source),f.stateSha256);assert.equal(sha(after),f.afterSha256);
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(save.trim());await button('Import save code').click();
   assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Night route');
   await page.locator('.dp-map').waitFor();assert.deepEqual(await read(),JSON.parse(source));
   await page.locator('.cr-content').evaluate(e=>e.scrollTop=0);
   const target=(f.selector.startsWith('.')?page.locator(f.selector):button(f.selector)).first();
   const box=await target.boundingBox();assert(box);const decisionVisible=box.y>=0&&box.y+box.height<=height&&box.x>=0&&box.x+box.width<=width;
   const facts=await page.evaluate(()=>{
    const shown=e=>{if(!e.getClientRects().length)return false;for(let p=e;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(e))return false;return true;};
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const nodes=[...document.querySelectorAll('.cr-content :is(h1,h2,h3,p,small,button,summary)')].filter(e=>!e.children.length&&shown(e)&&!e.closest(':disabled')&&e.textContent.trim());
    const contrast=nodes.map(e=>{let p=e,bgs;while(p){const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    const map=document.querySelector('.dp-map'),scouting=document.querySelector('[aria-label="Boss scouting"]'),activity=[...document.querySelectorAll('.dp-page > .cr-panel')].find(e=>e.querySelector('button'));
    const precedes=(a,b)=>!!a&&!!b&&!!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
    return {overflow:document.documentElement.scrollWidth-innerWidth,contrast,activityBeforeMap:precedes(activity,map),mapBeforeActivity:precedes(map,activity),mapBeforeScouting:precedes(map,scouting)};
   });
   const path=`${out}/${look}-${f.name}.png`;await page.screenshot({path});captures.push({path,name:f.name,look,decisionVisible,box,...facts});
   assert.equal(facts.overflow,0);
   if(before){assert(!decisionVisible,'Reproduce original reward below viewport');continue;}
   if(mode==='on'){
    assert(decisionVisible,JSON.stringify({mode,width,look,name:f.name,box}));
    if(f.name!=='route')assert(facts.activityBeforeMap);
    assert(facts.mapBeforeScouting);assert(facts.contrast.length&&facts.contrast.every(c=>c.ratio>=4.5),JSON.stringify(facts.contrast));
   }else if(f.name!=='route')assert(facts.mapBeforeActivity,'OFF keeps original DOM order');
   if(look==='baseline'){await target.focus();await page.keyboard.press(f.name==='reward'?'Space':'Enter');}else await target.click();
   await page.waitForFunction(()=>!window.__depthReview.state.v4?.journey.pending.length);
   assert.deepEqual(await read(),JSON.parse(after));
   if(f.name==='complete')assert.equal(await page.evaluate(()=>window.__depthReview.screen),'hub');
   if(f.name==='route')assert.equal(await page.evaluate(()=>window.__depthReview.screen),'prepare');
   checks.push({mode,width,look,name:f.name,exactCommandState:true,input:look==='baseline'?'keyboard':'click'});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,before,mode,width,height,artifact,sha256:sha(await readFile(artifact)),checks,captures,errors,remote,limitations:['Targeted saved-fixture UI checks, not elapsed cadence, balance or x1 timing.','OFF retains original DOM ordering, including its below-fold controls.','Scoped text contrast, not the Z screenshot pack.']},null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({passed,before,mode,width,checks:checks.length,captures:captures.length}));
