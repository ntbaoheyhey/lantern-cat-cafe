// Browser performance of the built candidate. The visible app is driven through its public UI.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, chromium, openSquad } from './squad-support.mjs';
const out = resolve(root, 'reports/squad'); mkdirSync(out, { recursive: true });
const browser = await chromium.launch(), rows = [];
const base = process.env.SQUAD_PRODUCTION_URL ?? 'http://127.0.0.1:5395';
const quantile = (a, q) => { const s = [...a].sort((x,y)=>x-y); return +(s[Math.floor((s.length-1)*q)] ?? 0).toFixed(3); };
try {
  for (const mode of ['group', 'boss', 'calm', 'idle']) {
    const { page, errors, writes } = await openSquad(browser, { base, debug:false, calm:mode==='calm' });
    const cdp = await page.context().newCDPSession(page); await cdp.send('Performance.enable');
    if (mode !== 'idle') await page.getByRole('button', { name: mode === 'boss' ? 'Yarn Giant' : 'Training', exact:true }).click();
    const maxInitialEnemies = await page.locator('.sq-targets button').count();
    if (mode !== 'idle') await page.getByRole('button', { name:'Start encounter', exact:true }).click();
    // Warm font/texture caches and leave the initial navigation out of the sample.
    await page.waitForTimeout(1500);
    const start = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const durationMs = mode === 'idle' ? 5000 : 18000;
    const frames = await page.evaluate(async durationMs => {
      const deltas=[], longTasks=[]; let last=performance.now(), request;
      const observer=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(e=>e.duration)));
      observer.observe({type:'longtask',buffered:false});
      const frame=now=>{deltas.push(now-last);last=now;request=requestAnimationFrame(frame);};request=requestAnimationFrame(frame);
      await new Promise(resolve=>setTimeout(resolve,durationMs));cancelAnimationFrame(request);observer.disconnect();
      return {deltas:deltas.slice(1),longTasks};
    },durationMs);
    const end=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));
    const wall=end.Timestamp-start.Timestamp;
    const row={mode,viewport:'1280x720',durationMs,initialEnemies:maxInitialEnemies,frameCount:frames.deltas.length,
      frameP50Ms:quantile(frames.deltas,.5),frameP95Ms:quantile(frames.deltas,.95),frameP99Ms:quantile(frames.deltas,.99),
      longTasks:frames.longTasks,rendererTaskPercent:+((end.TaskDuration-start.TaskDuration)/wall*100).toFixed(3),
      scriptPercent:+((end.ScriptDuration-start.ScriptDuration)/wall*100).toFixed(3),
      heapStartBytes:start.JSHeapUsedSize,heapEndBytes:end.JSHeapUsedSize,errors,writes,
      runTime:await page.locator('.sq-hud').innerText(),reviewHookPresent:await page.evaluate(()=>'__squadReview' in window)};
    rows.push(row); console.log(JSON.stringify(row)); await page.close();
  }
} finally { await browser.close(); }
const machine={os:execFileSync('uname',['-sm'],{encoding:'utf8'}).trim(),cpu:execFileSync('sysctl',['-n','machdep.cpu.brand_string'],{encoding:'utf8'}).trim(),ramBytes:Number(execFileSync('sysctl',['-n','hw.memsize'],{encoding:'utf8'})),node:process.version};
writeFileSync(resolve(out,'performance.json'),JSON.stringify({date:'2026-11-05',machine,method:'Production build, headless Chromium, public UI, normal wall clock. RAF cadence is a browser-frame proxy, not a hardware GPU benchmark. CDP TaskDuration measures renderer busy time, not whole-machine CPU. Separate maximum-effects fixture follows.',rows},null,2)+'\n');
for (const r of rows) {assert.deepEqual(r.errors,[]);assert.deepEqual(r.writes,[]);assert.equal(r.reviewHookPresent,false);}
