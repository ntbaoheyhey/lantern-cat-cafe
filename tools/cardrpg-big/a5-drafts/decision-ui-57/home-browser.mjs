// REFERENCE: Home54. Real imports/clicks/keyboard at three viewports; no elapsed-play claim.
import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]),before=process.argv[4]==='before';
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const height=width===1440?900:width===1024?600:720,attempt=process.env.A5_HOME_ATTEMPT||'1';
const root='reports/cardrpg-big/a5/e2-home-band',out=`${process.env.A5_DECISIONS_OUTPUT || root}/${before?'before-':''}${mode}-${width}-attempt-${attempt}`;
const artifact=process.env.A5_DECISIONS_ARTIFACT || (before?'reports/cardrpg-big/a5/e2-star-plans/prototype-on/index.html':`/tmp/cardrpg-a5-home-band-${mode}/index.html`);
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:false});const manifest=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try {
 for(const look of before?['baseline']:['baseline','look']) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=async name=>{await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cr-content')?.textContent.includes('Opening the table…'));};
  const state=()=>page.evaluate(()=>window.__depthReview.state),home=page.getByRole('region',{name:'Tonight at home'});
  await page.goto('file://'+(artifact.startsWith('/')?artifact:process.cwd()+'/'+artifact)+(look==='look'?'?dev=1':''));
  await page.locator('.cr-route-list').first().waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();
  for(const f of manifest.fixtures.filter(f=>mode==='off'?f.name==='off':before?f.name==='retained':f.name!=='off')) {
   const code=await readFile(f.path);assert.equal(sha(code),f.sha256);
   const expected=JSON.parse(await readFile(f.statePath));
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(code.toString().trim());await button('Import save code').click();
   assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Cafe');
   assert.deepEqual(await state(),expected);await page.locator('.cr-content').evaluate(e=>e.scrollTop=0);
   if(mode==='on')await home.waitFor();
   if(mode==='off'){
    assert.equal(await home.count(),0);assert.equal(await page.getByText(/stays fixed as your crew grows/).count(),0);
   } else {
    assert.equal(await page.getByRole('combobox',{name:'Challenge band'}).inputValue(),String(before?5:f.band));
    assert.equal(await page.getByRole('combobox',{name:'Challenge band'}).isDisabled(),f.name==='active');
   }
   const facts=await page.evaluate(()=>{
    const root=document.querySelector('[aria-label="Tonight at home"]')||document.querySelector('.cr-content');
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const text=[...root.querySelectorAll('p,b,span,button,h2,small')].filter(e=>!e.children.length&&e.getClientRects().length&&!e.closest(':disabled')&&e.textContent.trim());
    const contrast=text.map(e=>{let p=e,bgs;while(p){const st=getComputedStyle(p),stops=[...st.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(st.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    const primary=root.querySelector('.cr-primary')?.getBoundingClientRect();
    return{overflow:document.documentElement.scrollWidth-innerWidth,contrast,primaryVisible:!!primary&&primary.top>=0&&primary.bottom<=innerHeight};
   });
   const path=`${out}/${look}-${f.name}.png`;await page.screenshot({path});captures.push({name:f.name,look,path,...facts});assert.equal(facts.overflow,0);
   if(mode==='on'){assert(facts.primaryVisible);assert(facts.contrast.length&&facts.contrast.every(c=>c.ratio>=4.5),JSON.stringify(facts.contrast));}
   if(before){checks.push({name:f.name,look,beforeBand:5,previouslySelectedBand:2});continue;}
   if(mode==='off'){checks.push({name:f.name,look,homeV4Absent:true,stateExact:true});continue;}
   const selected=f.name==='next'?3:f.band;
   if(f.name==='next')await page.getByRole('combobox',{name:'Challenge band'}).selectOption('3');
   const primary=home.locator('.cr-primary');
   if(look==='baseline'){await primary.focus();await page.keyboard.press('Enter');}else await primary.click();
   await page.locator('.dp-map').waitFor();const actual=await state();
   assert.equal(actual.run.chapter,f.chapter);assert.equal(actual.run.challengeLevel,selected);
   assert.deepEqual(actual.account.currencies,expected.account.currencies);assert.deepEqual(actual.account.cards,expected.account.cards);
   assert.deepEqual(actual.gear,expected.gear);assert.deepEqual(actual.equipment,expected.equipment);
   if(f.name==='active')assert.deepEqual(actual,expected);
   checks.push({name:f.name,look,band:selected,chapter:f.chapter,stateExact:f.name==='active',noSpending:true});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
} finally {
 await writeFile(out+'/checks.json',JSON.stringify({passed,before,mode,width,height,artifact,sha256:sha(await readFile(artifact)),checks,captures,errors,remote,limitations:['Synthetic boundary cases are identified in the fixture manifest.','Scoped Home contrast; targeted captures, not the Z pack.','No combat, progression or elapsed cadence claim.']},null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({passed,before,mode,width,checks:checks.length,captures:captures.length}));
