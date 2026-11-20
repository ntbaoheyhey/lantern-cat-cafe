import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),rows=[],errors=[];
for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:5512/?demo&squad=1&squad3d=1&squadDebug=1');await page.getByRole('button',{name:'Effects',exact:true}).click();
 const ids=await page.getByLabel('Effect action').locator('option').evaluateAll(es=>es.map(e=>e.value));
 for(const id of ids){await page.evaluate(id=>window.__turn3dReview.controller.inspect(id,2),id);await page.waitForFunction(()=>{const r=window.__turn3dReview;return r.scene.stats.loaded===r.view().actors.length});await page.waitForTimeout(60);
  rows.push(await page.evaluate(({width,height,id})=>{const r=window.__turn3dReview;r.scene.render(r.view());const boxes=[...document.querySelectorAll('.t3-anchor')].map(e=>{const b=e.getBoundingClientRect();return {id:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height}});const overlap=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlap.push([a.id,b.id])}return {width,height,id,stats:r.scene.stats,audit:r.scene.labelAudit,domCount:boxes.length,overlap}}, {width,height,id}));
 }
 await page.screenshot({path:`reports/turn3d-polish/shots/review/labels-${width}.png`});await page.close();
}
await browser.close();await fs.writeFile('reports/turn3d-polish/label-audit-trial.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({errors,rows:rows.length,missing:rows.filter(r=>r.audit.missing.length).map(r=>({size:r.width,id:r.id,missing:r.audit.missing})),overlaps:rows.filter(r=>r.overlap.length).map(r=>({size:r.width,id:r.id,overlap:r.overlap})),maxCalls:Math.max(...rows.map(r=>r.stats.calls)),maxTriangles:Math.max(...rows.map(r=>r.stats.triangles))}));
