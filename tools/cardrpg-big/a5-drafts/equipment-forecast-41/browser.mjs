// REFERENCE: A5 E1 Equipment forecast41. Targeted UI and worker checks, not balance acceptance.
import assert from 'node:assert/strict';
import {chromium} from '/Users/bao/taskbar-hero-cardrpg-a4/apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const mode=process.argv[2],width=Number(process.argv[3]),height=width===1440?900:width===1024?600:720;
assert(['on','off'].includes(mode)&&[1280,1440,1024].includes(width));
const root='reports/cardrpg-big/a5/e1-equipment-forecast',artifact=`/tmp/cardrpg-a5-equipment-forecast-${mode}/index.html`;
const out=`${root}/browser-${mode}-${width}-attempt-${process.env.A5_EQUIPMENT_ATTEMPT||1}`;
await mkdir(out,{recursive:false});
const fixtures=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],timings=[],errors=[],remote=[];let passed=false;
try{
 for(const look of ['baseline','look']){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
  await page.addInitScript(()=>{
   const Native=window.Worker;window.__equipmentWorkers=[];
   window.Worker=class extends Native{constructor(...args){super(...args);const row={started:performance.now(),terminated:false};window.__equipmentWorkers.push(row);const terminate=this.terminate.bind(this);this.terminate=()=>{row.terminated=true;terminate();};}};
  });
  const button=name=>page.getByRole('button',{name,exact:true});
  const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
  const read=()=>page.evaluate(()=>window.__depthReview.state);
  const region=page.getByRole('region',{name:'Equipment boss comparison',exact:true});
  const dismiss=async()=>{while(await button('Skip celebration').count())await button('Skip celebration').click();};
  async function imported(name){
   const f=fixtures.checks.find(r=>r.mode===mode&&r.name===name),code=await readFile(f.path,'utf8');
   assert.equal(createHash('sha256').update(code).digest('hex'),f.sha256);
   await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(code.trim());await button('Import save code').click();
   assert.match(await page.locator('.cr-status').innerText(),/checksum verified/);await nav('Equipment');await dismiss();
   if(mode==='on')await page.getByRole('group',{name:'Equip for',exact:true}).getByRole('button',{name:f.cat==='mochi'?'Mochi':'Soot',exact:true}).click();
   else await page.getByLabel('Equip for',{exact:true}).selectOption(f.cat);
   await page.locator('.dp-gear-grid button').filter({hasText:f.templateId==='bellsteel-relic-rare'?'Bellsteel': 'Bellsteel'}).filter({hasText:f.name==='transfer'?'weapon':'relic'}).first().click();
   assert.equal(await page.evaluate(()=>window.__depthReview.itemId),f.item);
   await dismiss();return f;
  }
  async function prediction(f,chapter,band,label,cpu=1){
   await page.waitForFunction(()=>[...document.querySelectorAll('.dp-v4-equipment-forecast .dp-v4-forecast')].length===2&&[...document.querySelectorAll('.dp-v4-equipment-forecast .dp-v4-forecast')].every(e=>e.hasAttribute('data-forecast-ms')),null,{timeout:30000});
   const rows=await region.locator('.dp-v4-forecast').evaluateAll(nodes=>nodes.map(e=>({label:e.getAttribute('aria-label'),text:e.innerText,elapsedMs:Number(e.dataset.forecastMs),computeMs:Number(e.dataset.computeMs),cached:e.dataset.cacheHit==='true'})));
   const expected=f.forecasts.find(r=>r.chapter===chapter&&r.band===band);assert(expected);
   for(const [i,side]of ['before','after'].entries()){
    assert(rows[i].text.includes(expected[side].band));assert(rows[i].text.includes(expected[side].risk));assert.doesNotMatch(rows[i].text,/\d+\s*%/);
   }
   timings.push({look,label,chapter,band,cpu,rows});return rows;
  }
  async function capture(name){
   const target=mode==='on'?region:page.locator('.dp-equip-action');await target.scrollIntoViewIfNeeded();
   const facts=await target.evaluate(root=>{
    const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),lum=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
    const leaves=[...root.querySelectorAll('button,h2,h3,p,small,label')].filter(e=>!e.children.length&&e.getClientRects().length&&e.textContent.trim()&&!e.matches(':disabled'));
    const contrast=leaves.map(e=>{let p=e,bgs;while(p){const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){bgs=stops;break;}const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){bgs=[c];break;}p=p.parentElement;}
     const a=lum(rgb(getComputedStyle(e).color)),ls=(bgs||[[29,27,40]]).map(lum),b=Math.max(Math.min(...ls),Math.min(Math.max(...ls),a));return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
    return{overflow:document.documentElement.scrollWidth-innerWidth,contrast,text:root.innerText};
   });
   const path=`${out}/${look}-${name}.png`;await page.screenshot({path});captures.push({look,name,path,...facts});
   assert.equal(facts.overflow,0);assert(facts.contrast.length>0&&facts.contrast.every(c=>c.ratio>=4.5),JSON.stringify(facts.contrast));
  }
  await page.goto('file://'+artifact+(look==='look'?'?dev=1':''));await page.getByRole('navigation',{name:'Cafe screens'}).waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();
  for(const name of ['threshold','transfer']){
   const f=await imported(name),before=await read();
   assert.equal(await region.count(),mode==='on'?1:0);
   if(mode==='on'){
    await prediction(f,3,6,name+'-initial');await capture(name);
    const boss=page.getByRole('group',{name:'Compare against boss'}).getByRole('button',{name:'Yarn Giant',exact:true});await boss.focus();await page.keyboard.press('Enter');
    await page.getByLabel('Comparison band',{exact:true}).selectOption('1');await prediction(f,1,1,name+'-boss-band');
    await nav('Cafe');await nav('Equipment');await prediction(f,3,6,name+'-return');
    // Local chapter selection resets on navigation; the complete build cache survives.
    const cached=timings.at(-1).rows;assert(cached.every(r=>r.cached));
    assert.deepEqual(await read(),before);
    if(name==='threshold')assert((await page.locator('.dp-v4-utility').innerText()).includes('Set bonus: activates 4-piece Bellsteel'));
    if(name==='transfer')assert((await region.innerText()).includes('Includes Mochi giving this piece to Soot.'));
    checks.push({look,name,beforeAfterExact:true,noMutation:true,keyboard:true,cache:true,transfer:name==='transfer'});
   }else{assert.equal((await page.evaluate(()=>window.__equipmentWorkers)).length,0);await capture(name);checks.push({look,name,offAbsent:true,noWorkers:true});}
   await button('Equip selected').click();await dismiss();
   const expected=structuredClone(f.expectedEquipped);if(mode==='on')expected.v4.journey.pending=[];
   assert.deepEqual(await read(),expected);
   if(mode==='on')assert((await region.innerText()).includes('Same crew in this matchup.'));
  }
  await imported('active');const active=await read();assert(await button('Equip selected').isDisabled());
  if(mode==='on'){assert((await region.innerText()).includes('Finish'));assert.equal(await region.locator('.dp-v4-forecast').count(),0);}
  assert.deepEqual(await read(),active);checks.push({look,activeLock:true});
  if(mode==='on'&&width===1280){
   const f=await imported('threshold'),before=await read(),cdp=await page.context().newCDPSession(page);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
   await page.getByRole('group',{name:'Compare against boss'}).getByRole('button',{name:'Rain Spool',exact:true}).click();
   await page.getByLabel('Comparison band',{exact:true}).selectOption('1');await prediction(f,2,1,'cpu4',4);
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
   assert.deepEqual(await read(),before);
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{await writeFile(out+'/checks.json',JSON.stringify({passed,mode,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,timings,errors,remote,forecast400ms:timings.filter(t=>t.cpu===1).every(t=>t.rows.every(r=>r.cached||r.elapsedMs<=400))},null,2)+'\n');await browser.close();}
console.log(JSON.stringify({passed,mode,width,checks:checks.length,captures:captures.length,timings:timings.length}));
