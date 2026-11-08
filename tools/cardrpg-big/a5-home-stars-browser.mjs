// REFERENCE: A5 Home43. Exact chapter/band and active-route navigation; not a new elapsed journey.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
assert([1280,1440,1024].includes(width));
const root='reports/cardrpg-big/a5/e2-home-stars',attempt=process.env.A5_HOME_ATTEMPT||'1',before=process.env.A5_HOME_STARS_BEFORE==='1';
const out=`${root}/${before?'before-':''}browser-${width}-attempt-${attempt}`;
const artifact=before?'reports/cardrpg-big/a5/c1-growth-preview/artifact/index.html':'/tmp/cardrpg-a5-home-stars-artifact/index.html';
const absolute=artifact.startsWith('/')?artifact:process.cwd()+'/'+artifact;
await mkdir(out,{recursive:false});
const fixtures=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try{
 for(const look of before?['baseline']:['baseline','look']){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  const button=name=>page.getByRole('button',{name,exact:true});
  const home=page.getByRole('region',{name:'Tonight at home'});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>({state:window.__depthReview.state,screen:window.__depthReview.screen,battle:window.__depthReview.battle}));
  async function capture(name){
   await page.locator('.cr-content').evaluate(e=>e.scrollTop=0);
   // Wait for the ordinary A-owned preview readiness, preserving a missing miniature as a limitation.
   await page.waitForFunction(()=>!document.querySelector('.dp-miniature-loading'),null,{timeout:15000}).catch(()=>{});
   const m=await home.evaluate(root=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const nodes=[...root.querySelectorAll('p,b,span,button,h2,small')].filter(e=>!e.children.length&&e.getClientRects().length&&e.textContent.trim());
    const contrast=nodes.map(e=>{
     let p=e,bgs;const rect=e.getBoundingClientRect(),x=rect.x+rect.width/2,y=rect.y+rect.height/2;
     while(p){const box=p.getBoundingClientRect();if(x<box.left||x>box.right||y<box.top||y>box.bottom){p=p.parentElement;continue;}
      const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
      if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}
      const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));
     return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
    });
    const primary=root.querySelector('.cr-primary').getBoundingClientRect();
    return{overflow:document.documentElement.scrollWidth-innerWidth,contrast,primaryVisible:primary.top>=0&&primary.bottom<=innerHeight,text:root.innerText,loading:root.querySelectorAll('.dp-miniature-loading').length};
   });
   const path=`${out}/${look}-${name}.png`;await page.screenshot({path});captures.push({look,name,path,...m});
   assert.equal(m.overflow,0);assert(m.primaryVisible);assert(m.contrast.length&&m.contrast.every(c=>c.ratio>=4.5),JSON.stringify(m.contrast));
  }
  async function imported(name){
   const f=fixtures.checks.find(r=>r.name===name);assert(f);const code=await readFile(f.path,'utf8');
   assert.equal(createHash('sha256').update(code).digest('hex'),f.sha256);
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(code.trim());await button('Import save code').click();
   assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Cafe');
  }
  await page.goto('file://'+absolute+(look==='look'?'?dev=1':''));
  await home.waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();else assert.equal(await button('Feel lab').count(),0);
  await imported('earned');const earned=(await read()).state;
  const money=structuredClone(earned.account.currencies);
  if(before){
   assert.match(await home.innerText(),/Tangled Cafe, stop/);
   await capture('mismatched-star');await home.getByRole('button',{name:'Revisit Midnight Pantry →',exact:true}).click();
   assert.equal((await read()).state.run.chapter,3);
   checks.push({look,name:'reproduced',hintChapter:1,actualChapter:3});await page.close();continue;
  }
  assert.match(await home.innerText(),/Tangled Cafe · band 1, stop/);
  await capture('earned-star');await home.getByRole('button',{name:'Revisit Tangled Cafe →',exact:true}).focus();await page.keyboard.press('Enter');
  let now=await read();assert.equal(now.screen,'map');assert.equal(now.state.run.chapter,1);assert.equal(now.state.run.challengeLevel,1);
  assert.deepEqual(now.state.account.currencies,money);
  checks.push({look,name:'earned',keyboard:true,chapter:1,band:1,noSpending:true});
  await imported('bands');const band=page.getByRole('combobox',{name:'Challenge band',exact:true});
  assert.equal(await band.inputValue(),'2');assert.match(await home.innerText(),/Tangled Cafe · band 2, stop 1/);
  await capture('default-band');await band.selectOption('4');
  assert.match(await home.innerText(),/Rooftop Orchard · band 4, stop 7: Win within 10 rounds/);
  assert(!/Tangled Cafe · band/.test(await home.innerText()));await capture('selected-band');
  await home.getByRole('button',{name:'Revisit Rooftop Orchard →',exact:true}).click();now=await read();
  assert.equal(now.state.run.chapter,2);assert.equal(now.state.run.challengeLevel,4);
  checks.push({look,name:'bands',defaultBand:2,selectedBand:4,chapter:2});
  await imported('next');assert((await home.innerText()).includes('Explore Rooftop Orchard for a new star.'));
  await capture('next-chapter');await home.getByRole('button',{name:'Explore Rooftop Orchard →',exact:true}).click();
  assert.equal((await read()).state.run.chapter,2);checks.push({look,name:'next',chapter:2});
  await imported('above');assert(!/Tangled Cafe · band/.test(await home.innerText()));assert.equal(await band.inputValue(),'1');
  await capture('above-ceiling');await home.getByRole('button',{name:'Revisit Midnight Pantry →',exact:true}).click();
  assert.equal((await read()).state.run.challengeLevel,1);checks.push({look,name:'above',unavailableStarHidden:true});
  await imported('full');assert((await home.innerText()).includes('Explore Midnight Pantry for a new star.'));
  assert(!(await home.innerText()).includes('Win your first route encounter.'));await capture('all-recorded-complete');
  checks.push({look,name:'full',noFalseFirstStar:true});
  await imported('active-band');const active=(await read()).state;
  assert.equal(await band.inputValue(),'2');assert(await band.isDisabled());await capture('active-band');
  await home.getByRole('button',{name:'Continue your route →',exact:true}).click();now=await read();
  assert.deepEqual(now.state,active);assert.equal(now.screen,'map');checks.push({look,name:'active-band',stateExact:true});
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,before,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),
  checks,captures,errors,remote,method:'Original earned checkpoint continued through public commands; separate explicitly synthetic band/star edge fixtures. Real clicks and keyboard navigation, no injected browser state or cadence claim.'},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,before,width,checks:checks.length,captures:captures.length}));
