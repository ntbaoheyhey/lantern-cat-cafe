// REFERENCE: PROMPT-A3.md task2. Observe shell and automatic battle through real controls.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
const [width,height]=(process.env.A3_SIZE||'1280,720').split(',').map(Number);
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
const out=process.env.A3_OUT||`reports/cardrpg-big/a3/task2/${width}`;
const strict=process.env.A3_STRICT==='1';
const sha256=createHash('sha256').update(await readFile(artifact)).digest('hex');
await mkdir(out,{recursive:true});const receipt={artifact,sha256,width,height,strict,entry:process.env.A3_ENTRY||'route',errors:[],rows:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.setDefaultTimeout(60000);page.on('pageerror',e=>receipt.errors.push(String(e)));
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
 if(process.env.A3_ENTRY==='practice'){await page.getByRole('button',{name:/Try the practice table/}).click();await page.getByRole('button',{name:'Fight',exact:true}).click();}
 else await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();
 await page.waitForFunction(()=>window.__depthReview?.battle?.choices.length>=1);
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 const before=await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle}));
 for(const mode of strict?['on','off','on']:['on']){
  if((await page.locator('.dp-app').getAttribute('data-look-v2'))!==String(mode==='on'))await page.getByRole('button',{name:'Look A/B',exact:true}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready);await page.waitForTimeout(300);
  const row=await page.evaluate(()=>{
   const rect=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   const visible=s=>{const e=document.querySelector(s);return e.checkVisibility()&&!e.closest('[inert]');};
   const content=rect('.cr-content'),stage=rect('.dp-arena'),battle=rect('.dp-battle'),nav=rect('.cr-sidebar'),hud=rect('.cr-topbar');
   const css=getComputedStyle(document.querySelector('.dp-app'));
   return {content,stage,battle,nav,hud,stageFraction:stage.width*stage.height/(content.width*content.height),shellVisible:visible('.cr-sidebar')&&visible('.cr-topbar')&&visible('.cr-wallet'),variables:Object.fromEntries(['left','top','width','height'].map(k=>[k,css.getPropertyValue('--dp-shell-'+k)])),overflow:document.documentElement.scrollWidth-innerWidth,overlap:battle.left<nav.right-1||battle.top<hud.bottom-1,controls:[...document.querySelectorAll('.dp-battle-top button,.dp-battle-top select,.dp-battle-top input')].map(e=>({text:e.textContent||e.getAttribute('aria-label'),rect:e.getBoundingClientRect().toJSON()}))};
  });
  const path=`${out}/battle-${mode}-${receipt.rows.length}.png`;await page.screenshot({path});receipt.rows.push({...row,mode,path});
  if(strict){assert(row.shellVisible);assert(Math.abs(row.content.bottom-height)<1,'content fills remaining height');assert(row.controls.every(c=>c.rect.right<=width+1&&c.rect.left>=row.battle.left-1),'battle controls inside content');assert(!row.overlap);assert(row.stageFraction>=.7,`stage fraction ${row.stageFraction}`);assert.equal(row.overflow,0);assert.equal(await page.getByRole('button',{name:'Look A/B',exact:true}).isEnabled(),true);assert.equal(await page.getByRole('navigation',{name:'Cafe screens'}).locator('button:not(:disabled)').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify({state:window.__depthReview.state,battle:window.__depthReview.battle})),before);}
 }
 await page.getByRole('button',{name:'Skip to result',exact:true}).click();await page.getByRole('button',{name:'Improve team',exact:true}).waitFor();await page.getByRole('button',{name:'Improve team',exact:true}).click();assert.equal(await page.getByRole('navigation',{name:'Cafe screens'}).locator('button:disabled').count(),0);assert.deepEqual(receipt.errors,[]);receipt.passed=true;console.log(JSON.stringify({out,stage:receipt.rows.map(r=>r.stageFraction),passed:true}));
}finally{await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2));await browser.close();}
