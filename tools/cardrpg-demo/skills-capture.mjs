import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {pinExistingFonts} from '../visual-support.mjs';
const out=process.env.CARDRPG_ART_OUT||'reports/cardrpg/art',records=[],errors=[];await fs.mkdir(out+'/shots/effects',{recursive:true});await fs.mkdir(out+'/shots/signatures',{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),repeats=[];
try{
 for(const [width,height] of [[1280,720]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await pinExistingFonts(page);await page.goto('http://127.0.0.1:5520/?demo&squad=1&squad3d=1&squadDebug=1');await page.getByRole('button',{name:'Effects',exact:true}).click();
  const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
  for(const id of ids)for(let beat=0;beat<5;beat++){
   await page.evaluate(({id,beat})=>window.__turn3dReview.controller.inspect(id,beat),{id,beat});await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.view().actors.length});await page.waitForTimeout(70);await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});await page.waitForTimeout(50);
   const file=`${out}/shots/effects/${width}-${id}-${beat}.png`,data=await page.locator('.t3-stage').screenshot({path:file});const info=await page.evaluate(()=>{const r=window.__turn3dReview;return {stats:r.scene.stats,audit:r.scene.labelAudit,recipe:r.controller.frame.plan.skillId,beat:r.controller.frame.beat.kind}});records.push({id,beat,width,height,file,sha256:createHash('sha256').update(data).digest('hex'),...info});
   // Isolate the exact rendered spell geometry from the shared cafe/models for a second shape audit.
   const signature=await page.evaluate(()=>{const r=window.__turn3dReview,s=r.scene;window.__vfxVisibility=s.scene.children.map(o=>[o,o.visible]);for(const o of s.scene.children)o.visible=o===s.spells.root;s.renderer.render(s.scene,s.camera);return s.renderer.domElement.toDataURL('image/png').split(',')[1]});
   await fs.writeFile(`${out}/shots/signatures/${width}-${id}-${beat}.png`,Buffer.from(signature,'base64'));
   await page.evaluate(()=>{for(const [o,v]of window.__vfxVisibility)o.visible=v;const r=window.__turn3dReview;r.scene.render(r.view())});
   if(width===1280){await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});const again=await page.locator('.t3-stage').screenshot();repeats.push({id,beat,equal:data.equals(again)})}
  }
  await page.close();console.log(JSON.stringify({width,frames:records.length,missing:records.filter(r=>r.audit.missing.length).length}));
 }
}finally{await browser.close();await fs.writeFile(out+'/effect-captures.jsonl',records.map(r=>JSON.stringify(r)).join('\n')+'\n');await fs.writeFile(out+'/effect-captures.json',JSON.stringify({date:new Date().toISOString(),records:'effect-captures.jsonl',frames:records.length,recipes:[...new Set(records.map(r=>r.id))].length,errors,missing:records.filter(r=>r.audit.missing.length).map(r=>({id:r.id,beat:r.beat,width:r.width,missing:r.audit.missing})),overlaps:records.filter(r=>r.audit.overlaps),repeats,exactRepeated:repeats.filter(r=>r.equal).length,maxCalls:Math.max(...records.map(r=>r.stats.calls)),maxTriangles:Math.max(...records.map(r=>r.stats.triangles))},null,2))}
assert.deepEqual(errors,[]);for(const row of records)assert.equal(row.recipe,row.id,`Wrong recipe captured for ${row.id}`);
