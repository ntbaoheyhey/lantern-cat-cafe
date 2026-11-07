// REFERENCE: tools/cardrpg-big2/embed-evidence.mjs; F7 before/after requirement.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const artifact=resolve(process.env.BIG_ARTIFACT||'docs/cardrpg3/index.html');
const out=process.env.BIG_COMPARISON_OUT||'reports/cardrpg-big/integration/delivery/comparisons';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const rows=[],errors=[],requests=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto('file://'+artifact);
 await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor({timeout:120000});
 const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 await page.getByRole('button',{name:'Review studio',exact:true}).click();
 await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:'Before / after',exact:true}).click();
 const choices=page.locator('.b2-studio-body select');
 const count=await choices.locator('option').count();
 const expected=JSON.parse(await readFile('docs/cardrpg3/build.json','utf8')).evidence.rows;
 assert.equal(count,expected);
 for(let i=0;i<count;i++){
  await choices.selectOption(String(i));
  const images=await page.locator('.b2-comparison img').evaluateAll(async images=>{
   await Promise.all(images.map(i=>i.decode()));
   return images.map(i=>({alt:i.alt,width:i.naturalWidth,height:i.naturalHeight,local:/^(data:|blob:)/.test(i.src)}));
  });
  assert(images.length>0&&images.every(i=>i.width>0&&i.height>0&&i.local));
  rows.push({index:i,label:await choices.locator('option:checked').textContent(),images});
  if([0,24,48,73,count-1].includes(i))await page.screenshot({path:`${out}/comparison-${i}.png`});
 }
 await page.getByRole('button',{name:'Return to cafe',exact:true}).click();
 assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.state)),before);
 assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
}finally{
 await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors,requests},null,2));
}
console.log(JSON.stringify({comparisons:rows.length,images:rows.reduce((n,r)=>n+r.images.length,0),errors,requests}));
