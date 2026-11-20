import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const mode=process.argv[2]??'3d',browser=await chromium.launch({headless:true}),rows=[];
try{for(let i=0;i<3;i++){
 const page=await browser.newPage({viewport:{width:1280,height:720}});const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.addInitScript(()=>{window.__uiLong=[];new PerformanceObserver(list=>{for(const e of list.getEntries())window.__uiLong.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true});});
 const start=Date.now();await page.goto('http://127.0.0.1:5950/tools/ui-v3/index.html?ui=v3&home='+mode);await page.locator('.uv-patrol').waitFor();const interactive=Date.now()-start;
 if(mode==='3d')await page.waitForFunction(()=>window.__depthPreviewScene?.ready,{},{timeout:60000});
 await page.waitForTimeout(2500);const warm=await page.evaluate(()=>performance.now());await page.waitForTimeout(i===0?60000:1000);
 rows.push(await page.evaluate(({interactive,warm})=>({navigationToVisibleMs:interactive,coldMaxLongTask:Math.max(0,...window.__uiLong.filter(e=>e.start<warm).map(e=>e.duration)),steadyMaxLongTask:Math.max(0,...window.__uiLong.filter(e=>e.start>=warm).map(e=>e.duration)),calls:window.__depthPreviewScene?.stats.calls??0,longTasks:window.__uiLong}),{interactive,warm}));await page.close();
}}finally{await browser.close();mkdirSync('reports/ui-v3/u2',{recursive:true});writeFileSync(`reports/ui-v3/u2/perf-${mode}.json`,JSON.stringify({mode,rows},null,2))}
console.log(JSON.stringify({mode,rows:rows.map(({longTasks,...r})=>r)}));
