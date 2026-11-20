import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2]??'u8',out=`reports/ui-v3/${dir}`;mkdirSync(out,{recursive:true});
const url='file://'+resolve('docs/ui-v3/index.html'),rows=[];
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});
try {
 for(let run=1;run<=3;run++){
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],remote=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  await page.addInitScript(()=>{
   const data=window.__uPerf={tasks:[],frames:[],interactive:0};new PerformanceObserver(list=>{data.tasks.push(...list.getEntries().map(e=>({at:e.startTime,ms:e.duration})))}).observe({type:'longtask',buffered:true});
   let last=0;requestAnimationFrame(function sample(t){if(last)data.frames.push({at:t,ms:t-last});last=t;if(!data.interactive&&document.querySelector('.uv-patrol'))data.interactive=performance.now();requestAnimationFrame(sample)});
  });
  await page.goto(url);await page.locator('.uv-patrol').waitFor({timeout:60000});await page.waitForTimeout(2500);
  const warm=await page.evaluate(()=>performance.now());await page.waitForTimeout(run===1?60000:1000);
  rows.push(await page.evaluate(({run,warm,errors,remote})=>{const d=window.__uPerf;return {run,cpu:4,interactiveMs:d.interactive,coldMaxFrameMs:Math.max(0,...d.frames.filter(f=>f.at<warm).map(f=>f.ms)),coldMaxLongTaskMs:Math.max(0,...d.tasks.filter(f=>f.at<warm).map(f=>f.ms)),steadyMaxLongTaskMs:Math.max(0,...d.tasks.filter(f=>f.at>=warm).map(f=>f.ms)),idleWindowMs:performance.now()-warm,drawCalls:window.__depthPreviewScene?.stats.calls??0,errors,remote,loader:window.__b2Load,tasks:d.tasks};},{run,warm,errors,remote}));
  console.log(JSON.stringify({...rows.at(-1),tasks:undefined,loader:undefined}));await page.close();
 }
 const page=await browser.newPage({viewport:{width:1280,height:720}});await page.goto(url);await page.getByRole('button',{name:'Night Patrol'}).click();const start=Date.now();await page.getByRole('button',{name:'Fight',exact:true}).click();await page.getByRole('heading',{name:'Victory',exact:true}).waitFor({timeout:25000});const fightMs=Date.now()-start;console.log(JSON.stringify({fightMs}));assert(fightMs<=25000);await page.getByRole('button',{name:'Next',exact:true}).click();await page.locator('.uv-patrol').waitFor();
 await page.getByRole('button',{name:'Recruit',exact:true}).click();await page.locator('.uv-odds>summary').click();await page.getByRole('table',{name:'Published rarity odds'}).waitFor();await page.close();
 const dev=await browser.newPage();await dev.goto(url+'?dev=1');await dev.getByRole('button',{name:'Open menu',exact:true}).click();await dev.getByRole('button',{name:'Review studio',exact:true}).waitFor();await dev.getByRole('button',{name:'Mechanics lab',exact:true}).click();await dev.getByRole('dialog',{name:'Review tools'}).waitFor();await dev.keyboard.press('Escape');assert.equal(await dev.getByRole('dialog',{name:'Review tools'}).count(),0);await dev.close();
 const build=JSON.parse(readFileSync('docs/ui-v3/build.json','utf8'));writeFileSync(`${out}/offline.json`,JSON.stringify({artifact:build.sha256,bytes:build.bytes,fightMs,rows,method:'Three fresh file:// contexts, CPU4, 1280x720, cache disabled. First has sixty-second idle after 2.5s warmup. Full navigation-to-interactive and cold RAF maximum are reported separately; Lane A 183.3ms was a cold frame maximum, not interactive latency.',gate:{interactive:rows.every(r=>r.interactiveMs<=223.3),idle:rows.every(r=>r.steadyMaxLongTaskMs<=50),draws:rows.every(r=>r.drawCalls<=90),bytes:build.bytes<=40000000,offline:rows.every(r=>!r.errors.length&&!r.remote.length)}},null,2));
}finally{await browser.close();writeFileSync(`${out}/offline-raw.json`,JSON.stringify(rows,null,2));}
