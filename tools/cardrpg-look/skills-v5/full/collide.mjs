import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {open,apply,audit} from './harness.mjs';
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json')).filter(r=>Number(r.id.slice(1))>=5&&Number(r.id.slice(1))<=14);
const result={sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),method:'Every 60Hz cue-window frame, actual DOM words/numbers/badges/plates/moment/HUD; frozen animation clock, no timing claims.',rows:[],errors:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height]of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 for(const row of cases){await apply(page,row);
  await page.evaluate(fn=>{window.__v5Audit=eval('('+fn+')')},audit.toString());
  const frames=await page.evaluate(async()=>{
   const m=window.__depthReview,plan=m.plan,start=plan.beats[2].start-100,stop=Math.min(plan.duration-1,start+1000),frames=[];
   for(let t=start;t<=stop;t+=1000/60){m.animationAt=t;m.notify(false);await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;await new Promise(requestAnimationFrame);frames.push(window.__v5Audit());}
   return frames;
  });result.rows.push({id:row.id,width,frames});console.log(JSON.stringify({id:row.id,width,frames:frames.length,overlaps:frames.reduce((n,f)=>n+f.overlaps.length,0),unplaced:frames.filter(f=>f.unplaced.length).length}));
 }await page.close();
}}finally{await browser.close();await writeFile(out+'/collisions.json.gz',gzipSync(JSON.stringify(result)))}
