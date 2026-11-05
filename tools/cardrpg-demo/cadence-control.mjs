// Empty-page control for RAF pacing. This diagnoses the measurement environment;
// it does not relax the game's strict percentile gate or measure GPU execution.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const out='reports/cardrpg/cadence-control';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const rows=[];
try {
  for(const [width,height] of [[1024,600],[1280,720],[1440,900]]) {
    const page=await browser.newPage({viewport:{width,height}});
    const raf=await page.evaluate(()=>new Promise(resolve=>{
      const frames=[]; let last=0,first=0;
      requestAnimationFrame(function tick(t){
        if(last)frames.push(t-last); else first=t;
        last=t;
        if(t-first>=5000)resolve(frames); else requestAnimationFrame(tick);
      });
    }));
    assert.ok(raf.length>=120,'Enough empty-page samples');
    const sorted=[...raf].sort((a,b)=>a-b);
    rows.push({width,height,samples:raf.length,p95Ms:sorted[Math.floor((sorted.length-1)*.95)],p99Ms:sorted[Math.floor((sorted.length-1)*.99)],raf});
    await page.close();
  }
} finally {
  await browser.close();
  await fs.writeFile(out+'/measurement.json',JSON.stringify({date:new Date().toISOString(),method:'Five seconds of requestAnimationFrame on an empty about:blank page per viewport, Chromium headless with ANGLE Metal requested. No game code, rendering, network, animation or work between callbacks. Diagnostic only; strict game thresholds remain unchanged.',rows},null,2)+'\n');
}
console.log(JSON.stringify(rows.map(({raf,...r})=>r)));
