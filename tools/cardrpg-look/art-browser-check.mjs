// Native Chromium image decoding, real-size layout and offline comparison controls.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out='reports/cardrpg-look/validation/l6/art-browser';
await mkdir(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const source=await readFile('docs/cardrpg-look/art.html');
const result={artifact:hash(source),manifest:hash(await readFile('apps/web/src/game/cardrpg/look-assets.json')),rows:[]};
for(const [width,height] of [[1024,600],[1280,720],[1440,900]])await withTimingLock(`LOOK L6 card art ${width}`,async()=>{
 const browser=await chromium.launch({channel:'chromium'});
 const errors=[],requests=[];
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url())});
  await page.goto(`file://${resolve('docs/cardrpg-look/art.html')}`);
  await page.evaluate(()=>window.__artReady);
  const detail=await page.evaluate(async()=>{
   const images=await Promise.all([...document.querySelectorAll('[data-pixels]')].map(async image=>{
    const bitmap=await createImageBitmap(await(await fetch(image.currentSrc)).blob());
    const rect=image.getBoundingClientRect(),expected=image.dataset.pixels.split(',').map(Number);
    const result={name:image.alt,width:bitmap.width,height:bitmap.height,expected,display:[rect.width,rect.height],complete:image.complete};
    bitmap.close();return result;
   }));
   return {images,cards:document.querySelectorAll('article').length,
    overflow:document.documentElement.scrollWidth>innerWidth+1,
    rightEdge:Math.max(...[...document.querySelectorAll('article')].map(e=>e.getBoundingClientRect().right)),manifest:window.__artManifestSha};
  });
  assert.equal(detail.cards,12);assert.equal(detail.images.length,72);assert.equal(detail.overflow,false);
  assert(detail.rightEdge<=width);assert.equal(detail.manifest,result.manifest);
  for(const image of detail.images){assert.equal(image.complete,true);assert.deepEqual([image.width,image.height],image.expected,image.name);assert.deepEqual(image.display,image.expected.map(n=>n/2),image.name)}
  await page.screenshot({path:`${out}/${width}-dark.png`,fullPage:true});
  await page.getByRole('button',{name:'Light backdrop',exact:true}).click();
  await page.screenshot({path:`${out}/${width}-light.png`,fullPage:true});
  await page.getByRole('button',{name:'Show before',exact:true}).click();
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
  const before=await page.evaluate(()=>[...document.querySelectorAll('[data-before]')].every(e=>e.src===e.dataset.before));
  assert.equal(before,true);
  await page.getByRole('button',{name:'Show atelier',exact:true}).click();
  await page.evaluate(()=>Promise.all([...document.images].map(image=>image.decode())));
  const restored=await page.evaluate(()=>[...document.querySelectorAll('[data-after]')].every(e=>e.src===e.dataset.after));
  assert.equal(restored,true);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
  result.rows.push({width,height,dpr:2,...detail,before,restored,errors,requests});
  await writeFile(`${out}/checks.json`,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({width,images:detail.images.length,before,restored,errors}));
 }finally{await browser.close()}
});
