// REFERENCE: PROMPT-A5 E2. Targeted desktop flow, not elapsed engagement or a full screenshot pack.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const width=Number(process.argv[2]||1280),height=width===1440?900:width===1024?600:720;
const artifact=process.env.A5_E2_ARTIFACT||'/tmp/cardrpg-a5-e2-artifact/index.html',out=`${process.env.A5_E2_BROWSER_OUT||'reports/cardrpg-big/a5/e2'}/browser-${width}`;
await mkdir(out,{recursive:true});const browser=await chromium.launch({channel:'chromium',headless:true,args:['--use-angle=metal']});
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],remote=[],captures=[],checks=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url());});
const button=name=>page.getByRole('button',{name,exact:true}),nav=async name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
const read=()=>page.evaluate(()=>window.__depthReview.state);
async function loadSave(name){await nav('Save & settings');await page.getByLabel('Save code',{exact:true}).fill(await readFile(`reports/cardrpg-big/a5/e2/rules/${name}.save`,'utf8'));await button('Import save code').click();}
async function dismiss(){for(let n=0;n<8;n++){const skip=button('Skip celebration');if(!await skip.count())break;await skip.click();}}
async function capture(name,selector,{scroll=true}={}){
 if(scroll)await page.locator(selector).scrollIntoViewIfNeeded();
 const metrics=await page.evaluate(selector=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number),luma=c=>c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);
  const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('details:not([open])');
  const contrast=[...document.querySelectorAll(selector+' *')].filter(e=>visible(e)&&!e.children.length&&e.textContent.trim()&&!e.matches('option,progress,button:disabled')).map(e=>{
   let p=e,backgrounds;
   while(p){
    const style=getComputedStyle(p),stops=[...style.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map(m=>rgb(m[0]));
    // A gradient can be fully opaque while backgroundColor is transparent.
    // Use the full luminance interval, never the unrelated ancestor behind it.
    if(stops.length&&stops.every(c=>c.length===3||c[3]===1)){backgrounds=stops;break;}
    const c=rgb(style.backgroundColor);if(c.length===3||c[3]===1){backgrounds=[c];break;}p=p.parentElement;
   }
   const a=luma(rgb(getComputedStyle(e).color)),values=(backgrounds||[[29,27,40]]).map(luma),lo=Math.min(...values),hi=Math.max(...values);
   const b=Math.max(lo,Math.min(hi,a));return{text:e.textContent.trim(),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),backgrounds};
  });return{overflow:document.documentElement.scrollWidth-innerWidth,contrast};
 },selector);await page.screenshot({path:`${out}/${name}.png`});captures.push({name,selector,...metrics});assert.equal(metrics.overflow,0,name);
 assert(metrics.contrast.every(c=>c.ratio>=4.5),JSON.stringify(metrics.contrast.filter(c=>c.ratio<4.5)));
}
let passed=false;
try{
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 const primary=await page.locator('.dp-v4-home .cr-primary').boundingBox();assert(primary&&primary.y+primary.height<=height);
 assert.match(await page.locator('.dp-v4-home').innerText(),/Next star|Tomorrow|The kettle/);await capture('home','.dp-v4-home');
 await loadSave('route-start');await page.getByRole('heading',{name:'Three stars to chase'}).waitFor();
 const before=await read();assert.equal(Object.keys(before.v4.journey.stars).length,0);
 await capture('prepare-goals','.dp-v4-star-target');await button('Fight').click();await button('Skip to result').click();await page.getByRole('heading',{name:'Victory',exact:true}).waitFor();
 await button('Continue to rewards').click();await page.getByRole('status',{name:'New discovery',exact:true}).waitFor();
 const celebration=await page.locator('.dp-v4-celebration').evaluate(e=>({text:e.innerText,animation:getComputedStyle(e).animationName,sequence:e.dataset.discoverySequence}));
 assert.equal(celebration.animation,'none');assert.match(celebration.text,/3 route stars/);
 await capture('celebration','.dp-v4-celebration',{scroll:false});await dismiss();
 const earned=await read();assert.equal(Object.values(earned.v4.journey.stars).reduce((sum,r)=>sum+r.conditions.filter(Boolean).length,0),3);
 assert.equal(earned.v4.journey.found.filter(d=>d.id==='stars:3').length,1);
 await page.locator('.dp-reward').first().click();await capture('route-stars','.dp-map');
 const badges=await page.locator('.dp-node.visited .dp-v4-stars').getAttribute('aria-label');assert.equal(badges,'3 of 3 stars');
 const nodeOverflow=await page.locator('.dp-node').evaluateAll(nodes=>nodes.map(n=>({text:n.innerText,overflow:n.scrollWidth-n.clientWidth})).filter(n=>n.overflow>1));assert.deepEqual(nodeOverflow,[]);
 checks.push('actual automatic first encounter earns3stars; reduced-motion celebration skips; visited node retains badges');
 await loadSave('earned-stars');await dismiss();await nav('Collection journal');await page.getByRole('region',{name:'Discoveries',exact:true}).waitFor();
 const beforeClaim=await read(),initialMoney={...beforeClaim.account.currencies};
 await button('Collect 3-star reward').click();await button('Collect 9-star reward').click();
 const claimed=await read(),fixture=JSON.parse(await readFile('reports/cardrpg-big/a5/e2/rules/checks.json','utf8'));
 assert.deepEqual(claimed.account.currencies,fixture.afterClaim.account.currencies);assert.deepEqual(claimed.v4.journey.claims,['stars-3','stars-9']);
 assert.equal(claimed.account.currencies.stamps-initialMoney.stamps,30);assert.deepEqual(claimed.account.daily.earned,fixture.afterClaim.account.daily.earned);
 await capture('discoveries','.dp-v4-discoveries');await nav('Cafe');await capture('earned-home','.dp-v4-home');
 checks.push('public-command-earned15stars import;3/9milestones grant actual capped reward amounts once; journal persists');
 await page.goto('file://'+artifact+'?dev=1');await button('Look A/B').waitFor({timeout:120000});await button('Look A/B').click();
 await capture('home-look','.dp-v4-home');await loadSave('route-start');await capture('prepare-goals-look','.dp-v4-star-target');
 await loadSave('earned-stars');await dismiss();await nav('Collection journal');await capture('discoveries-look','.dp-v4-discoveries');
 checks.push('same newHome,Prepare goals and journal verified in the second look theme');
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);passed=true;
}finally{
 await writeFile(out+'/checks.json',JSON.stringify({passed,width,height,artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),checks,captures,errors,remote,limitations:['Targeted gameplay uses Skip; no x1 time, engagement cadence or full screenshot-pack claim.','B renderer remains unadopted; exactversion1forwarding tested separately in DOM tests.']},null,2));await browser.close();
}
