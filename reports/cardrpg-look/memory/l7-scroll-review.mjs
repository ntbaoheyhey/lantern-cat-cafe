// Supplemental visual review of content below the initial fold; no timings.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {withTimingLock} from '../../../tools/cardrpg-look/lock.mjs';
const artifact=resolve('docs/cardrpg-look/index.html');
const out='reports/cardrpg-look/validation/l7/scroll-review';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sha=hash(await readFile(artifact));
await mkdir(out,{recursive:true});
const receipt={artifact:sha,method:'Additional below-fold inspection after native first-fold screenshots; no timing claims.',rows:[]};
for(const [width,height]of [[1024,600],[1280,720],[1440,900]])await withTimingLock(`LOOK L7 below-fold review ${width}`,async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('file://'+artifact);
  await page.getByRole('button',{name:'Look atelier',exact:true}).click();
  await page.locator('.look-loading').waitFor({state:'hidden',timeout:120000});
  const panel=page.locator('.look-atelier');
  const tabs=page.getByRole('navigation',{name:'Atelier views',exact:true});
  const images=[];
  for(const [tab,target,label]of [
    ['Before / after','.look-wipe-range','comparison-slider'],
    ['Before / after','.look-rounds','rounds'],
    ['Notes & measurements','.look-reading table','metrics'],
  ]){
   await tabs.getByRole('button',{name:tab,exact:true}).click();
   await page.locator(target).waitFor();
   await page.locator('.look-reading img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
   await page.locator(target).scrollIntoViewIfNeeded();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const file=`${out}/${width}-${label}.png`;
   await page.screenshot({path:file});
   images.push({file,sha256:hash(await readFile(file))});
  }
  const layout=await panel.evaluate(el=>({scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflow:document.documentElement.scrollWidth>innerWidth+1}));
  assert.equal(layout.overflow,false);assert.deepEqual(errors,[]);
  receipt.rows.push({width,height,dpr:2,images,layout,errors});
 }finally{
  await browser.close();
  await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
 }
});
assert.equal(hash(await readFile(artifact)),sha);
console.log(JSON.stringify({complete:true,configs:receipt.rows.length,artifact:sha}));
