import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {open,apply,audit} from './harness.mjs';
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));
const result={rows:[],errors:[]};const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height] of [[1024,600],[1280,720],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));await open(page,artifact);
 for(const id of ['P1','P4','P7','P8']){
  await apply(page,cases.find(c=>c.id===id));const badge=page.locator('.dp-status-badge').first();await page.locator('.dp-battle-top button').first().focus();await badge.focus();await page.getByRole('tooltip').waitFor();
  const text=await page.getByRole('tooltip').innerText(),box=await page.getByRole('tooltip').boundingBox();assert.ok(text.length>10&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1);
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('tooltip').count(),0);
  if(id==='P4'){await page.locator('.dp-status-more').first().focus();await page.getByRole('tooltip').waitFor();await page.keyboard.press('Escape');assert.equal(await page.getByRole('tooltip').count(),0)}
  await page.evaluate(()=>{const m=window.__depthReview;m.plan=null;m.state.settings.reducedMotion=true;m.notify(false)});
  const sample=async t=>page.evaluate(t=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:t,paused:true},0);s.dirty=false;return [...s.cardEffects.pools].map(([name,p])=>[name,p.mesh.count,Array.from(p.mesh.instanceMatrix.array.slice(0,p.mesh.count*16)),Array.from(p.alpha.array.slice(0,p.mesh.count))])},t);
  const a=await sample(3.2),b=await sample(9.2);assert.deepEqual(a,b);const check=await page.evaluate(audit);assert.ok(check.badges>0);assert.equal(check.overflow,false);
  result.rows.push({id,width,text,reducedMotionStatic:true,keyboardEscape:true,check});
 }await page.close();
}}finally{await browser.close();await writeFile(out+'/ui.json',JSON.stringify(result,null,2))}
assert.deepEqual(result.errors,[]);console.log(JSON.stringify({cases:result.rows.length,errors:result.errors}));
