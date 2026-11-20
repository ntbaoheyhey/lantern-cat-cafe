import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {pinExistingFonts} from '../visual-support.mjs';
const out='reports/turn3d-polish',records=[],errors=[];await fs.mkdir(out+'/shots/effects',{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),repeats=[];
try{
 for(const [width,height] of [[1280,720],[1440,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await pinExistingFonts(page);await page.goto('http://127.0.0.1:5512/?demo&squad=1&squad3d=1&squadDebug=1');await page.getByRole('button',{name:'Effects',exact:true}).click();
  const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
  for(const id of ids)for(let beat=0;beat<5;beat++){
   await page.evaluate(({id,beat})=>window.__turn3dReview.controller.inspect(id,beat),{id,beat});await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.view().actors.length});await page.waitForTimeout(70);await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await page.waitForTimeout(50);
   const file=`${out}/shots/effects/${width}-${id}-${beat}.png`,data=await page.locator('.sq-arena-frame').screenshot({path:file});const info=await page.evaluate(()=>{const r=window.__turn3dReview;return {stats:r.scene.stats,audit:r.scene.labelAudit,recipe:r.controller.frame.plan.skillId,beat:r.controller.frame.beat.kind}});records.push({id,beat,width,height,file,sha256:createHash('sha256').update(data).digest('hex'),...info});
   if(width===1280){await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});const again=await page.locator('.sq-arena-frame').screenshot();repeats.push({id,beat,equal:data.equals(again)})}
  }
  await page.close();console.log(JSON.stringify({width,frames:records.length,missing:records.filter(r=>r.audit.missing.length).length}));
 }
}finally{await browser.close();await fs.writeFile(out+'/effect-captures.jsonl',records.map(r=>JSON.stringify(r)).join('\n')+'\n');await fs.writeFile(out+'/effect-captures.json',JSON.stringify({date:new Date().toISOString(),records:'effect-captures.jsonl',frames:records.length,recipes:[...new Set(records.map(r=>r.id))].length,errors,missing:records.filter(r=>r.audit.missing.length).map(r=>({id:r.id,beat:r.beat,width:r.width,missing:r.audit.missing})),overlaps:records.filter(r=>r.audit.overlaps),repeats,exactRepeated:repeats.filter(r=>r.equal).length,maxCalls:Math.max(...records.map(r=>r.stats.calls)),maxTriangles:Math.max(...records.map(r=>r.stats.triangles))},null,2))}
assert.deepEqual(errors,[]);
