// Exactly five natural battles, retaining the same scene. Heap/GPU observations, not a proof of flatness.
import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {withTimingLock} from '../lock.mjs';
const artifact=resolve('docs/cardrpg-look/b2.html'),out='reports/cardrpg-look/b2/v6/lifecycle';await mkdir(out,{recursive:true});const rows=[],errors=[];
await withTimingLock('B2 five natural battle lifecycle',async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal','--enable-precise-memory-info']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));const cdp=await page.context().newCDPSession(page);await cdp.send('HeapProfiler.enable');await page.goto('file://'+artifact);await page.getByRole('button',{name:'Watch a battle now',exact:true}).click();await page.getByLabel('Playback speed',{exact:true}).selectOption('4');
  for(let index=0;index<5;index++){
   if(index){if(index>1)await page.getByRole('button',{name:'Close replay',exact:true}).click();await page.getByRole('button',{name:'Watch replay',exact:true}).click();}
   await page.waitForFunction(()=>window.__depthReview.screen==='result',null,{timeout:120000});await cdp.send('HeapProfiler.collectGarbage');const heap=await cdp.send('Runtime.getHeapUsage');
   const state=await page.evaluate(()=>{const s=window.__depthScene;window.__b2LifeScene??=s;return {gpu:{...s.renderer.info.memory},programs:s.renderer.info.programs.length,retained:s===window.__b2LifeScene,result:window.__depthReview.battle.result,choices:window.__depthReview.battle.choices.length};});rows.push({index,heap:heap.usedSize,...state});console.log(JSON.stringify(rows.at(-1)));
  }
 }finally{await browser.close()}
});
const first=rows[0],last=rows.at(-1);await writeFile(`${out}/checks.json`,JSON.stringify({sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors,growth:{heap:last.heap-first.heap,geometries:last.gpu.geometries-first.gpu.geometries,textures:last.gpu.textures-first.gpu.textures,programs:last.programs-first.programs},note:'Five battles at4x; forcedGC between results. Measured growth only, not a flatness claim.'},null,2));
