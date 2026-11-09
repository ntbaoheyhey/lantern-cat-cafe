import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const artifact=resolve('docs/cardrpg-look/v5.html'),out='reports/cardrpg-look/skills-v5/v3/perf',raw='/tmp/cardrpg-v5look-v3/perf';await mkdir(out,{recursive:true});await mkdir(raw,{recursive:true});
const {frames}=JSON.parse(await readFile('/tmp/cardrpg-v5look-v3/frames.json'));
const result={artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Native macOS Chromium Metal DPR1, each of nine published fixture cues first/repeat at1280 and1440, RAF only, no screenshots/traces.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
 await page.addInitScript(()=>{window.__v5Perf={frames:[],last:0};requestAnimationFrame(function frame(t){const d=window.__v5Perf,s=window.__depthScene?.stats;if(d.last)d.frames.push({at:t,ms:t-d.last,calls:s?.calls??0,triangles:s?.triangles??0});d.last=t;requestAnimationFrame(frame)})});
 await page.goto('file://'+artifact);await page.waitForFunction(()=>window.__depthReview);await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.notify(false)});await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 for(const [name,f]of Object.entries(frames)){
 await page.evaluate(f=>{const m=window.__depthReview;m.galleryBattle=structuredClone(f.battle);m.plan=null;m.paused=true;m.notify(false)},f);await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));await page.waitForTimeout(250);
 for(const use of ['first','repeat']){
  const start=await page.evaluate(f=>{const m=window.__depthReview;m.galleryBattle=structuredClone(f.battle);m.plan=structuredClone(f.plan);m.animationAt=0;m.gallerySpeed=1;m.paused=false;m.notify(false);return performance.now()},f);
  await page.waitForFunction(()=>!window.__depthReview.plan,null,{timeout:10000});
  const data=await page.evaluate(start=>window.__v5Perf.frames.filter(f=>f.at>=start),start);
  const row={name,use,width,max:Math.max(...data.map(f=>f.ms)),peakDraws:Math.max(...data.map(f=>f.calls)),peakTriangles:Math.max(...data.map(f=>f.triangles)),frames:data.length};
  result.rows.push(row);await writeFile(`${raw}/${width}-${name}-${use}.json`,JSON.stringify(data));await writeFile(`${out}/casts.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(row));
 }
 }
 await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/casts.json`,JSON.stringify(result,null,2))}
