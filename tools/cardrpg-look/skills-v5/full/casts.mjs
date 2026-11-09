import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {open,apply} from './harness.mjs';
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cats=['mochi','soot','clover','panko','mallow','sorrel','biscuit','inkcap','cinnamon','brioche','velvet','marigold'];
const fixtures=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));
const cues=[...cats.map(c=>({id:c+'-4',gallery:c+'-4',progress:0})),...cats.map(c=>({id:c+'-1',gallery:c+'-1',progress:0})),...fixtures.filter(r=>['P6','P9','P10','P11'].includes(r.id))];
const result={sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),selection:'Twelve ultimates + twelve basics (provisional common-skill set until published use counts); four reaction fixtures.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal','--enable-precise-memory-info']});
try{for(const [width,height,cpu]of JSON.parse(process.env.V5_CAST_CONFIGS||'[[1280,720,1],[1440,900,1],[1440,900,4]]')){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 await page.addInitScript(()=>{window.__v5Frames=[];let last=0;requestAnimationFrame(function frame(t){const s=window.__depthScene;if(last)window.__v5Frames.push({at:t,ms:t-last,draws:s?.stats.calls??0,tris:s?.stats.triangles??0,particles:s?.stats.particles??0,programs:s?.renderer.info.programs?.length??0});last=t;requestAnimationFrame(frame)})});
 await open(page,artifact);
 for(const row of cues){
  // Mount the actor arrangement with zero elapsed: only anticipation starts in the measured call below.
  await apply(page,row.gallery?row:{...row,frame:{...row.frame,plan:null}});
  for(const use of ['first','repeat']){
   const start=await page.evaluate(row=>{const m=window.__depthReview;if(row.gallery)m.inspect(row.gallery,0,true);else{m.galleryBattle=structuredClone(row.frame.battle);m.plan=structuredClone(row.frame.plan);m.animationAt=0;m.paused=false;m.gallerySpeed=1;m.notify(false)}return performance.now()},row);
   await page.waitForFunction(()=>!window.__depthReview.plan,null,{timeout:15000});
   const frames=await page.evaluate(start=>window.__v5Frames.filter(f=>f.at>=start),start);
   const data={id:row.id,width,height,cpu,use,max:Math.max(...frames.map(f=>f.ms)),draws:Math.max(...frames.map(f=>f.draws)),tris:Math.max(...frames.map(f=>f.tris)),particles:Math.max(...frames.map(f=>f.particles)),frames};result.rows.push(data);
   await writeFile(out+'/casts.json.gz',gzipSync(JSON.stringify(result)));console.log(JSON.stringify({...data,frames:frames.length}));
  }
 }await page.close();
}}finally{await browser.close();await writeFile(out+'/casts.json.gz',gzipSync(JSON.stringify(result)))}
