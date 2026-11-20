// Running immutable e1731dc offline artifact; original figures and mid-impact recipes.
import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const out='reports/turn3d-polish/shots/before', records=[], errors=[];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
try {
 for(const [width,height] of [[1280,720],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(resolve('docs/turn3d/index.html')).href);
  await page.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7);
  await page.locator('#play').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));
  const shot=async(name)=>{
   await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.view().actors.length});
   await page.waitForTimeout(150);
   await page.evaluate(()=>{const r=window.__turn3dReview;r.scene.render(r.view())});
   await page.waitForTimeout(70);
   const file=`${out}/${name}-${width}.png`,bytes=await page.locator('[data-testid="turn3d-prototype"]').screenshot({path:file});
   records.push({name,width,height,file,sha256:createHash('sha256').update(bytes).digest('hex'),stats:await page.evaluate(()=>window.__turn3dReview.scene.stats)});
  };
  await page.waitForFunction(()=>window.__turn3dReview.controller.canChoose);
  await page.evaluate(()=>{const c=window.__turn3dReview.controller;c.fixedTime=1;c.notify()});await shot('opening');
  await page.getByRole('button',{name:'Effects',exact:true}).click();
  const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
  for(const id of ids){await page.evaluate(id=>window.__turn3dReview.controller.inspect(id,2),id);await shot(`effect-${id}`)}
  await page.getByRole('button',{name:'Miniatures',exact:true}).click();
  const roles=await page.getByLabel('Model',{exact:true}).locator('option').evaluateAll(es=>es.map(e=>e.value));
  for(const role of roles){await page.evaluate(role=>{const c=window.__turn3dReview.controller;c.model={role,clip:'idle',angle:.65};c.fixedTime=1;c.notify()},role);await shot(`model-${role}`)}
  await page.close();console.log(`${width}: ${ids.length} effects, ${roles.length} figures, opening`);
 }
}finally{await browser.close();await fs.writeFile('reports/turn3d-polish/before-captures.json',JSON.stringify({base:'e1731dc2660e6ad7a60d797d45a965e6a8ba67f5',records,errors},null,2)+'\n')}
if(errors.length)throw Error(errors.join('\n'));
