import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const side=process.argv[2]||'after',artifact=resolve(side==='before'?'/tmp/cardrpg-v5look-before.html':'docs/cardrpg-look/v5-v0.html');
const out=process.env.V5_PERF_OUT||`reports/cardrpg-look/skills-v5/perf-${side}`,raw=process.env.V5_PERF_RAW||`/tmp/cardrpg-v5look-perf-${side}`;await mkdir(out,{recursive:true});await mkdir(raw,{recursive:true});
const fixture=JSON.parse(await readFile('reports/cardrpg-look/skills-v5/fixtures.json'));
const receipt={artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Native macOS Chromium/Metal DPR1; fixed four-action subset, first and repeat. Marked Mochi and Button Guard; actual resolved three-target row and detonation fixtures. RAF only, no screenshots/tracing in cast windows; action duration unchanged.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>receipt.errors.push(String(e)));
  await page.addInitScript(()=>{const data=window.__v5Perf={frames:[],last:0};requestAnimationFrame(function frame(t){const s=window.__depthScene?.stats;if(data.last)data.frames.push({at:t,ms:t-data.last,calls:s?.calls??0,triangles:s?.triangles??0});data.last=t;requestAnimationFrame(frame)})});
  await page.goto('file://'+artifact);await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(()=>{const m=window.__depthReview;m.watchNow();m.paused=true;m.state.settings.speed=1;m.notify(false)});
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  for(const id of ['mochi-1','clover-2','multi','burst']){
   await page.evaluate(({id,f})=>{const m=window.__depthReview;m.inspect(id==='multi'?'mallow-2':id==='burst'?'soot-4':id,-1);if(f)m.galleryBattle=structuredClone(f.battle);m.plan=null;m.paused=true;m.notify(false)}, {id,f:fixture[id]??null});
   await page.waitForFunction(()=>window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
   await page.waitForTimeout(250);
   for(const use of ['first','repeat']){
    const start=await page.evaluate(({id,f})=>{const m=window.__depthReview;m.inspect(id==='multi'?'mallow-2':id==='burst'?'soot-4':id,0,true);if(f){m.galleryBattle=structuredClone(f.battle);m.plan=structuredClone(f.plan);}
     for(const a of m.battle.actors)if(['mochi','button-guard'].includes(a.catalogId))a.statuses=[{id:'scald',stacks:5,remaining:3,source:a.id,appliedRound:1},{id:'drowsy',stacks:1,remaining:1,source:a.id,appliedRound:1},{id:'steep',stacks:3,remaining:3,source:a.id,appliedRound:1},{id:'cozy',stacks:3,remaining:2,source:a.id,appliedRound:1}];
     m.gallerySpeed=1;m.animationAt=0;m.paused=false;m.notify(false);return {at:performance.now(),duration:m.plan.duration};
    },{id,f:fixture[id]??null});
    await page.waitForFunction(()=>!window.__depthReview.plan,null,{timeout:10000});
    const data=await page.evaluate(start=>({end:performance.now(),frames:window.__v5Perf.frames.filter(f=>f.at>=start)}),start.at);
    const row={width,height,id,use,duration:start.duration,max:Math.max(...data.frames.map(f=>f.ms)),peakDraws:Math.max(...data.frames.map(f=>f.calls)),peakTriangles:Math.max(...data.frames.map(f=>f.triangles)),frames:data.frames.length};
    await writeFile(`${raw}/${width}-${id}-${use}.json`,JSON.stringify({start,...data}));receipt.rows.push(row);
    await writeFile(`${out}/casts.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(row));
   }
  }
  await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/casts.json`,JSON.stringify(receipt,null,2))}
