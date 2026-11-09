// Visual pose samples; distinct trajectories alone do not prove clearance.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { withTimingLock } from './lock.mjs';
import { observePose } from './pose-observation.mjs';
const source=process.env.LOOK_ARTIFACT||'docs/cardrpg-look/index.html';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l1/poses';
await mkdir(out,{recursive:true});
const bytes=await readFile(source), snapshot=await mkdtemp('/tmp/cardrpg-look-poses-');
await writeFile(`${snapshot}/index.html`,bytes);
const receipt={source,sha256:createHash('sha256').update(bytes).digest('hex'),method:'Actual runtime AnimationMixer, six samples per skill, yaw -.12. Visual samples do not prove all-time collision freedom.',rows:[]};
try {
for(const cat of (process.env.LOOK_OWNERS||'mochi,soot,clover').split(','))for(let skill=1;skill<=4;skill++){
 const id=`${cat}-${skill}`;
 await withTimingLock(`LOOK six poses ${id}`,async()=>{
  const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:2}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(`file://${snapshot}/index.html`);await page.waitForFunction(()=>!!window.__depthReview,null,{timeout:90000});
   await page.getByRole('button',{name:'Review studio',exact:true}).click();
   await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});
   await page.getByRole('button',{name:'Focus stage',exact:true}).click();
   await page.waitForTimeout(100);
   await page.evaluate(id=>window.__b2Gallery.inspect(id,-1),id);
   await page.waitForTimeout(180);
   await page.waitForFunction(cat=>[...window.__depthScene.puppets.values()].some(p=>p.asset===cat),cat);
   for(const progress of [0,.18,.36,.54,.72,.96]){
    const detail=await page.evaluate(observePose,{cat,id,progress});
    const file=`${id}-${Math.round(progress*100)}.png`;
    await page.screenshot({path:`${out}/${file}`,clip:detail.canvas});
    receipt.rows.push({cat,id,progress,file,...detail,errors:[...errors]});
   }
   if(errors.length)throw Error(errors.join('\n'));
   await writeFile(`${out}/poses.json`,JSON.stringify(receipt,null,2)+'\n');
   console.log(JSON.stringify({id,samples:6,errors}));
  }finally{await browser.close()}
 });
}
}finally{await rm(snapshot,{recursive:true})}
