// Exercise the real live toggle in the owned battle view; no account mutations.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {withTimingLock} from './lock.mjs';
const out=process.env.LOOK_OUT||'reports/cardrpg-look/validation/l1/ab';await mkdir(out,{recursive:true});
const bytes=await readFile('docs/cardrpg-look/index.html'),snapshot=await mkdtemp('/tmp/cardrpg-look-ab-');await writeFile(`${snapshot}/index.html`,bytes);
const receipt={sha256:createHash('sha256').update(bytes).digest('hex'),method:'Real Look A/B toggle; each fresh size opens Review studio and performs Classic → Atelier. Account equality and actual renderer/model identity checked.',rows:[]};
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]])await withTimingLock(`LOOK A/B ${width}`,async()=>{
 const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),errors=[];
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await page.goto(`file://${snapshot}/index.html`);await page.waitForFunction(()=>!!window.__depthReview,null,{timeout:90000});
  await page.getByRole('button',{name:'Review studio',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:90000});
  const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
  for(const enabled of [false,true]){
   await page.evaluate(()=>{window.__lookPreviousScene=window.__depthScene});await page.getByRole('button',{name:'Look A/B',exact:true}).click();
   await page.waitForFunction(enabled=>window.__LOOK_V2__===enabled&&window.__depthScene!==window.__lookPreviousScene&&window.__depthScene?.ready,enabled,{timeout:90000});
   const detail=await page.evaluate(()=>({look:window.__LOOK_V2__,models:[...window.__depthScene.puppets.values()].map(p=>({id:p.asset,look:p.model.userData.lookV2===true})),canvases:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth>innerWidth+1,account:JSON.stringify(window.__depthReview.state),oldDisposed:window.__lookPreviousScene.disposed,stats:{...window.__depthScene.stats}}));
   assert.equal(detail.account,before);assert.equal(detail.oldDisposed,true);assert.equal(detail.overflow,false);assert.ok(detail.models.filter(m=>['mochi','soot','clover'].includes(m.id)).every(m=>m.look===enabled));
   delete detail.account;const file=`${width}x${height}-${enabled?'atelier':'classic'}.png`;await page.screenshot({path:`${out}/${file}`});receipt.rows.push({width,height,enabled,...detail,file,errors:[...errors]});await writeFile(`${out}/checks.json`,JSON.stringify(receipt,null,2)+'\n');
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,height,toggles:2,errors}));
 }finally{await browser.close()}
});}finally{await rm(snapshot,{recursive:true})}
