// REFERENCE: A5 E2 Home follow-up. Targeted primary-action/goal checks, not a new cadence or Z pack.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
assert([1280,1440,1024].includes(width));
const root='reports/cardrpg-big/a5/e2-home',attempt=process.env.A5_HOME_ATTEMPT||'1';
const out=`${root}/browser-${width}-attempt-${attempt}`,artifact='/tmp/cardrpg-a5-home-artifact/index.html';
await mkdir(out,{recursive:false});
const fixtures=JSON.parse(await readFile(root+'/fixtures/checks.json'));
const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const checks=[],captures=[],errors=[],remote=[];let passed=false;
try{
 for(const look of ['baseline','look']){
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
  await page.goto('file://'+artifact+(look==='look'?'?dev=1':''));
  await home.waitFor({timeout:120000});
  if(look==='look')await button('Look A/B').click();else assert.equal(await button('Feel lab').count(),0);
  await capture('fresh');await home.getByRole('button',{name:'Skip lesson',exact:true}).click();
  assert(!(await home.innerText()).includes('Try the practice table'));
  await home.getByRole('button',{name:'Open your welcome invitation →',exact:true}).click();
  assert.equal((await read()).screen,'gacha');await button('Open free welcome invitation').click();
  await button('Choose your first upgrade').waitFor({state:'visible',timeout:20000});
  await nav('Cafe');await home.getByRole('button',{name:'Equip your first piece →',exact:true}).click();
  assert.equal((await read()).screen,'inventory');await button('Tailor for Soot').click();await button('Equip selected').click();
  await nav('Cafe');await capture('ready');const before=(await read()).state;
  await home.getByRole('button',{name:'Explore Tangled Cafe →',exact:true}).focus();await page.keyboard.press('Enter');
  let now=await read();assert.equal(now.screen,'map');assert.equal(now.state.run.chapter,1);
  assert.deepEqual(now.state.account.currencies,before.account.currencies);
  checks.push(`${look}: Skip lesson, welcome, paid crafting/equip, Home keyboard primary starts chapter1 without extra spending`);
  await imported('active');const active=(await read()).state;await capture('active');
  await home.getByRole('button',{name:'Continue your route →',exact:true}).click();now=await read();
  assert.deepEqual(now.state,active);assert(['map','prepare','result'].includes(now.screen));
  checks.push(`${look}: exact earned active route continues without replacing or settling it`);
  await imported('band');await page.getByRole('combobox',{name:'Challenge band',exact:true}).selectOption('2');
  await capture('next-chapter');await home.getByRole('button',{name:'Explore Rooftop Orchard →',exact:true}).click();now=await read();
  assert.equal(now.state.run.chapter,2);assert.equal(now.state.run.challengeLevel,2);assert.equal(now.screen,'map');
  checks.push(`${look}: next unlocked chapter uses selected band2 in a labelled synthetic UI fixture`);
  await imported('all-stars');assert((await home.innerText()).includes('Explore another stop for a new star.'));
  assert(!(await home.innerText()).includes('Win your first route encounter.'));await capture('new-star');
  checks.push(`${look}: all recorded stars earned gives a new-stop goal, not a first-star instruction`);
  await page.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),
  checks,captures,errors,remote,method:'Fresh UI opening through explicit Skip lesson, earned welcome/craft commands; immutable earned active checkpoint plus labelled synthetic band/star fixtures. Baseline normal mode; Look selected through dev=1 reviewer UI. No combat/cadence claim.'},null,2)+'\n');
 await browser.close();
}
console.log(JSON.stringify({passed,width,checks:checks.length,captures:captures.length}));
