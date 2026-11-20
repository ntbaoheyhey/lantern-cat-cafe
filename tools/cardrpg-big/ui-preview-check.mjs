// REFERENCE: memory/PROMPT.md WAITING-L1 items1/6. Lean touched-screen functional check, not timing.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
const artifactSha256=sha(await readFile(artifact));assert.equal(artifactSha256,process.env.UI_VISUAL_SHA);
const [width,height]=(process.env.UI_VISUAL_SIZE||'1280,720').split(',').map(Number);
const out=process.env.UI_VISUAL_OUT||`reports/cardrpg-big/ui-hitch/functional/${width}`;
await mkdir(out,{recursive:true});
const receipt={artifactSha256,width,height,method:'Real navigation, retained preview identity, banner/pull/reveal/auto-fight/result, liveLooktoggle/account equality. Screenshots outside timing windows.',errors:[],remote:[],rows:[],toggles:[],started:new Date().toISOString()};
const save=()=>writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.setDefaultTimeout(60000);
 page.on('pageerror',e=>receipt.errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))receipt.remote.push(r.url());});
 const nav=label=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name:label,exact:true}).click();
 const ready=()=>page.waitForFunction(()=>window.__depthPreviewScene?.ready&&document.querySelector('.dp-miniature-canvas canvas'));
 const state=()=>page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 const capture=async name=>{
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,canvas:document.querySelectorAll('.dp-miniature-canvas canvas').length,
   controls:[...document.querySelectorAll('.cr-content button,.cr-content select')].filter(e=>e.getClientRects().length&&e.getBoundingClientRect().right>innerWidth+1).map(e=>e.textContent.slice(0,70)),
   images:[...document.querySelectorAll('.cr-content img')].filter(e=>e.getClientRects().length).length}));
  const path=`${out}/${name}.png`;await page.screenshot({path});receipt.rows.push({name,...data,path,sha256:sha(await readFile(path))});await save();
  assert.equal(data.overflow,0);assert.deepEqual(data.controls,[]);
 };
 await page.goto('file://'+artifact);await ready();await page.evaluate(()=>{window.__previewIdentity=window.__depthPreviewScene;});
 await nav('Team & cards');assert(await page.evaluate(()=>window.__depthPreviewScene===window.__previewIdentity));
 await nav('Companions');await ready();assert.equal(await page.locator('.dp-collection-layout .cr-card-grid .dp-cat').count(),12);
 await page.getByRole('button',{name:/^Soot,/}).first().click();await ready();
 await page.locator('.cr-content').evaluate(e=>e.scrollTo(0,0));await capture('collection');
 await nav('Equipment');await ready();assert.equal(await page.locator('.dp-doll-slots > button').count(),4);await capture('equipment');
 await nav('Save & settings');await page.getByRole('button',{name:'Add 1500 demo stamps',exact:true}).click();await page.getByRole('button',{name:'Add 1500 demo stamps',exact:true}).click();
 await nav('Invitations');await ready();assert(await page.evaluate(()=>window.__depthPreviewScene===window.__previewIdentity));await capture('invitations');
 await page.getByRole('button',{name:'Invite once · 150 stamps',exact:true}).click();await page.getByRole('region',{name:'Invitation results',exact:true}).waitFor();
 await page.getByRole('button',{name:'Invite ten · 1500 stamps',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('.dp-batch-grid > article').length===10);
 await capture('ten-results');
 const before=await state();
 for(const mode of [false,true]){
  await page.getByRole('button',{name:'Look A/B',exact:true}).click();await ready();
  assert.equal(await page.locator('.dp-app').getAttribute('data-look-v2'),String(mode));assert.equal(await state(),before);
  receipt.toggles.push({mode,statePreserved:true});
 }
 await nav('Cafe');await page.getByRole('button',{name:/^Tangled Cafe/}).click();await page.locator('.dp-node:enabled').first().click();
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.waitForFunction(()=>window.__depthReview.battle.choices.length>0);
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();await page.getByRole('button',{name:'Continue to rewards',exact:true}).waitFor();await capture('result');
 await page.getByRole('button',{name:'Continue to rewards',exact:true}).click();if(await page.locator('.dp-reward').count())await page.locator('.dp-reward').first().click();await nav('Night route');
 assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.remote,[]);receipt.passed=true;
}catch(e){receipt.failure=String(e);throw e;}finally{receipt.ended=new Date().toISOString();await save();await browser.close();console.log(JSON.stringify({out,passed:receipt.passed,failure:receipt.failure}));}
