import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { resolve } from 'node:path';
import { mkdir, writeFile, readFile, mkdtemp, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { withTimingLock } from './lock.mjs';
const files=process.argv.slice(2);const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l1/smoke';await mkdir(out,{recursive:true});
for(const [index,file] of files.entries()){
 const bytes=await readFile(file),snapshot=await mkdtemp('/tmp/cardrpg-look-smoke-');await writeFile(`${snapshot}/index.html`,bytes);
 await withTimingLock(`LOOK smoke ${index+1}`,async()=>{
  const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const errors=[],consoleErrors=[];let result;
  try{
   const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,600))});
   await page.goto('file://'+snapshot+'/index.html');await page.waitForFunction(()=>!!window.__depthReview,null,{timeout:60000});
   await page.getByRole('button',{name:'Review studio',exact:true}).click();
   await page.waitForFunction(()=>window.__depthScene?.ready||window.__b2Gallery?.sceneError,null,{timeout:25000}).catch(e=>errors.push(String(e)));
   result=await page.evaluate(()=>({ready:window.__depthScene?.ready,sceneError:window.__b2Gallery?.sceneError,look:window.__LOOK_V2__,packed:window.__LOOK_PACKED__,stats:window.__depthScene?.stats,puppets:window.__depthScene?[...window.__depthScene.puppets.values()].map(p=>({asset:p.asset,look:p.model.userData.lookV2,height:p.height,meshCount:p.materials.length})):[],body:document.body.innerText.slice(-3000)}));
   await page.screenshot({path:`${out}/${index}.png`});
  }finally{await browser.close();}
  const row={file:resolve(file),sha256:createHash('sha256').update(bytes).digest('hex'),errors,consoleErrors,...result};await writeFile(`${out}/${index}.json`,JSON.stringify(row,null,2)+'\n');console.log(JSON.stringify(row));
 });await rm(snapshot,{recursive:true});
}
