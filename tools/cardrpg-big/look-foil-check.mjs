// REFERENCE: assets/provenance/look-meta.md; look-meta.css. Real rendered gloss and reduced-motion evidence.
import assert from 'node:assert/strict';
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
const output=process.env.LOOK_FOIL_OUT||'reports/cardrpg-big/look-ui/foil-l0';
const sha=b=>createHash('sha256').update(b).digest('hex');
const receipt={artifact,sha256:sha(await readFile(artifact)),method:'Actual UI unlock fixture and legendary filter, two rendered card crops 2.25 seconds apart; repeat with system reduced motion. Screenshot deltas are visual evidence, not timing measurements.',errors:[],requests:[],rows:[]};
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'no-preference'});
 page.on('pageerror',e=>receipt.errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))receipt.requests.push(r.url());});
 await page.goto('file://'+artifact);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
 const nav=name=>page.getByRole('navigation',{name:'Cafe screens'}).getByRole('button',{name,exact:true}).click();
 await nav('Save & settings');await page.getByRole('button',{name:'Unlock all cats and build materials',exact:true}).click();
 await nav('Companions');await page.getByRole('combobox',{name:'Rarity',exact:true}).selectOption('legendary');
 const card=page.locator('.cr-card-grid .dp-card-legendary').first();
 await card.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
 const state=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 for(const mode of ['animated','reduced']){
  await page.emulateMedia({reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  const style=await card.locator('.cr-portrait').evaluate(e=>{const s=getComputedStyle(e,'::before');return {opacity:s.opacity,animation:s.animationName,duration:s.animationDuration,zIndex:s.zIndex,portraitZ:getComputedStyle(e.querySelector('img')).zIndex};});
  assert(Number(style.portraitZ)>Number(style.zIndex));
  assert.equal(style.animation,mode==='animated'?'dp-look-foil':'none');
  const captures=[];
  for(let frame=0;frame<2;frame++){
   if(frame)await page.waitForTimeout(2250);
   const path=`${output}/${mode}-${frame}.png`;
   await card.screenshot({path});captures.push({path,sha256:sha(await readFile(path))});
  }
  receipt.rows.push({mode,style,captures});
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.state)),state);
 assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.requests,[]);
 receipt.accountUnchanged=true;
}finally{await browser.close();await writeFile(`${output}/checks.json`,JSON.stringify(receipt,null,2)+'\n');}
console.log(JSON.stringify({output,rows:receipt.rows.length,errors:receipt.errors}));
