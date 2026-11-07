import {chromium} from '/Users/bao/taskbar-hero-cardrpg-look/apps/web/node_modules/@playwright/test/index.mjs';
import {withTimingLock} from '/Users/bao/taskbar-hero-cardrpg-look/tools/cardrpg-look/lock.mjs';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
await withTimingLock('LOOK static slice three sizes',async()=>{
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[];
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]]){
const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('file:///Users/bao/taskbar-hero-cardrpg-look/docs/cardrpg-look/slice.html');await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
await page.locator('input').first().fill('72');const detail=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.images].map(i=>[i.naturalWidth,i.naturalHeight]),wipe:document.querySelector('article').style.getPropertyValue('--wipe'),videos:document.querySelectorAll('video').length}));
assert.equal(detail.overflow,false);assert.equal(detail.wipe,'72%');assert.equal(detail.videos,3);assert.deepEqual(errors,[]);
await page.screenshot({path:`reports/cardrpg-look/validation/l1/slice-${width}.png`,fullPage:true});rows.push({width,height,...detail,errors});await page.close();
}await writeFile('reports/cardrpg-look/validation/l1/slice-checks.json',JSON.stringify({rows},null,2)+'\n');}finally{await browser.close()}
});
