// REFERENCE: Result56. Targeted result/apply/fallback regressions, not a new elapsed journey.
import { chromium } from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]),before=process.argv[4]==='before';
assert(['on','off'].includes(mode));assert([1280,1440,1024].includes(width));
const height=width===1440?900:width===1024?600:720,attempt=process.env.A5_RESULT_ATTEMPT||'1';
const root='reports/cardrpg-big/a5/e1-result-advice',out=`${process.env.A5_DECISIONS_OUTPUT || root}/${before?'before-':''}${mode}-${width}-attempt-${attempt}`;
const artifact=process.env.A5_DECISIONS_ARTIFACT || (before?'reports/cardrpg-big/a5/e2-star-plans/prototype-on/index.html':`/tmp/cardrpg-a5-result-advice-${mode}/index.html`);
const sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(out,{recursive:false});const manifest=JSON.parse(await readFile(process.env.A5_DECISIONS_FIXTURES || root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try {
 for(const look of before?['baseline']:['baseline','look']) {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=async name=>{await page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cr-content')?.textContent.includes('Opening the table…'));};
  const read=()=>page.evaluate(()=>({state:window.__depthReview.state,battle:window.__depthReview.battle,screen:window.__depthReview.screen}));
  async function imported(f){
   const code=await readFile(f.path);assert.equal(sha(code),f.sha256);
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(code.toString().trim());await button('Import save code').click();
   await page.getByRole('heading',{name:/^(Victory|Defeat)$/,exact:true}).waitFor();
  }
  async function capture(name,primaryName,selector){
   await page.locator('.cr-content').evaluate(e=>e.scrollTop=0);
   const box=await button(primaryName).boundingBox();assert(box);
   const facts=await page.evaluate(selector=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const nodes=[...document.querySelectorAll(selector+' *')].filter(e=>!e.children.length&&e.getClientRects().length&&!e.closest(':disabled')&&e.textContent.trim());
    const contrast=nodes.map(e=>{let p=e,bgs;while(p){const st=getComputedStyle(p),stops=[...st.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(st.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    return{overflow:document.documentElement.scrollWidth-innerWidth,contrast};
   },selector);
   const path=`${out}/${look}-${name}.png`;await page.screenshot({path});
   const visible=box.y>=0&&box.y+box.height<=height&&box.x>=0&&box.x+box.width<=width;
   captures.push({name,look,path,box,visible,...facts});assert.equal(facts.overflow,0);
   if(!before){assert(visible,JSON.stringify({name,width,box}));assert(facts.contrast.length&&facts.contrast.every(c=>c.ratio>=4.5),JSON.stringify(facts.contrast));}
  }
  await page.goto('file://'+(artifact.startsWith('/')?artifact:process.cwd()+'/'+artifact)+(look==='look'?'?dev=1':''));
  await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});if(look==='look')await button('Look A/B').click();
  if(mode==='on'&&!before&&look==='baseline'){
   await button('Try the practice table →').click();await button('Fight').click();
   await button('Skip to result').click();await button('Complete lesson').waitFor();
   assert.equal(await page.locator('.dp-v4-advice').count(),0);
   assert.match(await button('Complete lesson').getAttribute('class'),/cr-primary/);
   await capture('tutorial-victory','Complete lesson','.cr-actions');
   checks.push({name:'tutorial-victory',look,unchangedPrimary:true,adviceAbsent:true});
  }
  for(const f of manifest.fixtures.filter(f=>mode==='off'?f.name.startsWith('off'):before?f.name==='original-loss':!f.name.startsWith('off'))){
   await imported(f);
   if(mode==='off'){
    if(f.name==='off-preference-active-v4'){
     await button('Apply and retry route').waitFor({timeout:30000});
     const current=await read();assert.equal(current.state.gameplayV4,false);assert.equal(current.state.run.gameplayV4,true);assert.equal(current.state.run.complete,false);
     assert.equal(await page.locator('.dp-v4-result-decisions').count(),1);
     assert.match(await button('Apply and retry route').getAttribute('class'),/cr-primary/);
     assert(!/cr-primary/.test(await button('Continue to rewards').getAttribute('class')||''));
     await capture(f.name+'-result','Apply and retry route','.dp-v4-advice');
     checks.push({name:f.name,look,retainedActiveV4:true,nextRunPreference:false});continue;
    }
    assert.equal(await page.locator('.dp-v4-result-decisions').count(),0);
    if(f.name==='off')assert.equal(await page.locator('.dp-v4-advice').count(),0);
    assert.equal(await page.locator('.dp-v4-advice .cr-primary').count(),0);
    assert.match(await button('Continue to rewards').getAttribute('class'),/cr-primary/);
    await capture(f.name+'-result','Continue to rewards','.cr-actions');checks.push({name:f.name,look,unchangedPrimary:true});continue;
   }
   await button('Apply and retry route').waitFor({timeout:30000});
   assert((await page.getByRole('region',{name:'Your next change'}).innerText()).includes(f.advice.label));
   await capture(f.name,'Apply and retry route','.dp-v4-advice');
   if(before){assert.match(await button('Continue to rewards').getAttribute('class'),/cr-primary/);checks.push({name:f.name,beforePrimary:'Continue to rewards'});continue;}
   assert(!/cr-primary/.test(await button('Continue to rewards').getAttribute('class')||''));
   assert.match(await button('Apply and retry route').getAttribute('class'),/cr-primary/);
   const expected=JSON.parse(await readFile(f.afterPath));
   if(look==='baseline'){await button('Apply and retry route').focus();await page.keyboard.press('Enter');}else await button('Apply and retry route').click();
   await page.getByRole('heading',{name:'Prepare your team',exact:true}).waitFor();
   const actual=await read();
   for(const key of ['team','rows','gear','equipment'])assert.deepEqual(actual.state[key],expected[key]);
   assert.deepEqual(actual.state.account.currencies,expected.account.currencies);
   assert.equal(actual.state.run.id,expected.run.id);assert.equal(actual.state.run.challengeLevel,expected.run.challengeLevel);
   assert.equal(actual.battle.choices.length,0);checks.push({name:f.name,look,exactAvailableChange:true,noCombatInput:true});
  }
  if(mode==='on'&&!before){
   const f=manifest.fixtures[0];await imported(f);await button('Apply and retry route').waitFor({timeout:30000});
   await button('Watch replay').click();await button('Skip to result').click();await button('Close replay').waitFor();
   assert.equal(await page.locator('.dp-v4-advice').count(),0);assert.match(await button('Close replay').getAttribute('class'),/cr-primary/);
   checks.push({name:'replay',look,adviceAbsent:true,unchangedPrimary:true});await button('Close replay').click();
   await nav('Save & settings');
   await page.evaluate(()=>{const meta=document.createElement('meta');meta.httpEquiv='Content-Security-Policy';meta.content="worker-src 'none'";document.head.append(meta);});
   await page.getByLabel('Save code',{exact:true}).fill((await readFile(f.path,'utf8')).trim());await button('Import save code').click();
   await button('Open team preparation').waitFor();
   assert.match(await button('Open team preparation').getAttribute('class'),/cr-primary/);
   await capture('csp-fallback','Open team preparation','.dp-v4-advice');
   const old=await read();await button('Open team preparation').click();
   assert.equal((await read()).screen,'team');assert.deepEqual((await read()).state.gear,old.state.gear);
   checks.push({name:'csp-fallback',look,actualWorkerDenied:true,teamAvailable:true});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
} finally {
 await writeFile(out+'/checks.json',JSON.stringify({passed,before,mode,width,height,artifact,sha256:sha(await readFile(artifact)),checks,captures,errors,remote,limitations:['Saved-fixture UI checks; no causal win, reward cadence or startup claim.','Replay skip is a renderer regression only; elapsed journeys remain x1 without skips.','Scoped text contrast, not the Z screenshot pack.']},null,2)+'\n');await browser.close();
}
console.log(JSON.stringify({passed,before,mode,width,checks:checks.length,captures:captures.length}));
