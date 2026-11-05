// Re-enter actual UI runs and prove every pooled context is released on exit.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const url='file://'+process.cwd()+'/docs/cardrpg/index.html',out='reports/cardrpg/preview-lifetime';await fs.mkdir(out,{recursive:true});
const artifactSha256=createHash('sha256').update(await fs.readFile(new URL(url))).digest('hex');
const b=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),p=await b.newPage({viewport:{width:1280,height:720}}),errors=[],rows=[];
p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text())});
try{
 await p.addInitScript(()=>{window.__previewContexts=[];const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(...args){const c=original.apply(this,args);if(c&&String(args[0]).startsWith('webgl')&&!window.__previewContexts.includes(c))window.__previewContexts.push(c);return c}});
 await p.goto(url);
 for(let cycle=1;cycle<=5;cycle++){
  await p.getByRole('button',{name:/Prepare patrol/}).click();await p.waitForFunction(()=>window.__turn3dReview?.scene?.ready&&[...document.querySelectorAll('.t3-mini-preview canvas')].length===3&&[...document.querySelectorAll('.t3-mini-preview canvas')].every(c=>c.parentElement.dataset.ready==='true'));
  await p.getByRole('button',{name:'Mochi Weapon',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.t3-picker canvas')?.parentElement.dataset.ready==='true');
  await p.getByRole('button',{name:'Close item picker',exact:true}).click();
  const live=await p.evaluate(()=>window.__previewContexts.filter(c=>!c.isContextLost()).length);assert.equal(live,5);
  await p.getByRole('button',{name:'End patrol → Cafe',exact:true}).click();await p.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
  await p.waitForFunction(()=>window.__previewContexts.every(c=>c.isContextLost()));const after=await p.evaluate(()=>({created:window.__previewContexts.length,live:window.__previewContexts.filter(c=>!c.isContextLost()).length}));rows.push({cycle,duringRun:live,...after});assert.equal(after.created,cycle*5);assert.equal(after.live,0);
 }
}finally{await b.close();await fs.writeFile(out+'/check.json',JSON.stringify({artifactSha256,date:new Date().toISOString(),method:'Five real UI loadout/picker/exit cycles. Intercepted WebGL contexts are checked with isContextLost after leaving each run; no pooling mocks.',rows,errors},null,2)+'\n')}
assert.deepEqual(errors,[]);assert.equal(rows.length,5);console.log(JSON.stringify({cycles:rows.length,errors}));
