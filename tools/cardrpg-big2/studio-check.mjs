// REFERENCE: tools/cardrpg-big2/ReviewStudio.tsx. Run under shared timing lock.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const artifact=resolve(process.env.BIG_ARTIFACT||'/tmp/cardrpg-big2-delivery-index.html'),out=process.env.BIG_STUDIO_OUT||'reports/cardrpg-big2/delivery/studio';
await mkdir(out,{recursive:true});const errors=[],rows=[],requests=[],interactions=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{for(const [width,height]of [[1280,720],[1440,900],[1024,600]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
 await page.goto('file://'+artifact);await page.getByRole('heading',{name:'A small light. A brave little team.'}).waitFor();
 const before=await page.evaluate(()=>JSON.stringify(window.__depthReview.state));
 await page.getByRole('button',{name:'Review studio',exact:true}).click();await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
 const owners=await page.getByLabel('Gallery unit',{exact:true}).locator('option').evaluateAll(os=>os.map(o=>o.value));assert.equal(owners.length,25);
 // Native selection transfers focus away from the uncontrolled slider.
 // Playwright selectOption alone keeps its prior focus and prevents the RAF sync.
 const covered=[];
 for(const owner of owners){await page.getByLabel('Gallery unit',{exact:true}).focus();await page.getByLabel('Gallery unit',{exact:true}).selectOption(owner);await page.waitForFunction(()=>window.__b2Gallery.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId));
  const actions=await page.getByLabel('Gallery action',{exact:true}).locator('option').evaluateAll(os=>os.map(o=>o.value));
  for(const id of actions){await page.getByLabel('Gallery action',{exact:true}).focus();await page.getByLabel('Gallery action',{exact:true}).selectOption(id);await page.waitForFunction(()=>Number(document.querySelector('[aria-label="Gallery progress"]').value)===0);{const slider=page.getByLabel('Gallery progress',{exact:true}),box=await slider.boundingBox();await slider.click({position:{x:box.width*.46,y:box.height/2}});}const check=await page.evaluate(()=>{const input=document.querySelector('[aria-label="Gallery progress"]'),r=input.getBoundingClientRect();return{id:window.__b2Gallery.galleryId,at:window.__b2Gallery.animationAt,plan:window.__b2Gallery.plan.presentationId,value:input.value,bounds:{x:r.x,y:r.y,width:r.width,height:r.height},focused:document.activeElement===input};});interactions.push({width,height,owner,id,...check});if(check.at<=0)await page.screenshot({path:`${out}/failed-slider-${width}-${id}.png`});assert.equal(check.id,id);assert.equal(check.plan,id);assert.ok(check.at>0,JSON.stringify(interactions.at(-1)));covered.push(id);}
 }
 assert.equal(covered.length,86);
 if(process.env.BIG_STUDIO_EXPECT_SOUND==='1'){
 await page.getByRole('button',{name:'Preview sound off',exact:true}).click();await page.getByRole('button',{name:'Preview sound on',exact:true}).waitFor();
 const previewVolume=page.getByRole('slider',{name:'Preview sound volume',exact:true});await previewVolume.focus();await previewVolume.press('Home');for(let n=0;n<7;n++)await previewVolume.press('ArrowRight');
 assert.equal(await page.evaluate(()=>window.__b2Gallery.audio.volume),.35);
 await page.getByRole('button',{name:'Preview sound on',exact:true}).click();await page.getByRole('button',{name:'Preview sound off',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.__b2Gallery.audio.enabled),false);
 }
 await page.getByLabel('Gallery unit',{exact:true}).selectOption('marigold');await page.getByLabel('Gallery action',{exact:true}).selectOption('marigold-4');
 for(const camera of ['close','wide','far']){await page.getByLabel('Gallery camera',{exact:true}).focus();await page.getByLabel('Gallery camera',{exact:true}).selectOption(camera);{const slider=page.getByLabel('Gallery progress',{exact:true}),box=await slider.boundingBox();await slider.click({position:{x:box.width*.46,y:box.height/2}});}await page.screenshot({path:`${out}/${width}-${camera}.png`});}
 await page.getByRole('button',{name:'Frame meter',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.b2-frame-meter output')?.textContent.includes('triangles'));await page.screenshot({path:`${out}/${width}-meter.png`});await page.getByRole('button',{name:'Frame meter',exact:true}).click();
 await page.getByRole('navigation',{name:'Review panels'}).getByRole('button',{name:'Before / after',exact:true}).click();const captures=await page.locator('.b2-studio-body select option').count();assert.ok(captures>=12);
 const badImages=await page.locator('.b2-comparison img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));return imgs.filter(i=>!i.naturalWidth).length;});assert.equal(badImages,0);await page.screenshot({path:`${out}/${width}-comparison.png`});
 await page.getByRole('button',{name:'Brief checklist',exact:true}).click();await page.screenshot({path:`${out}/${width}-checklist.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(await page.getByRole('button',{name:'Open gallery',exact:true}).count()){
 await page.getByRole('button',{name:'Open gallery',exact:true}).click();await page.getByLabel('Gallery unit',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Brief checklist',exact:true}).click();await page.getByRole('button',{name:'Open comparison',exact:true}).click();await page.getByRole('heading',{name:'Look closer',exact:true}).waitFor();
 await page.getByRole('button',{name:'Brief checklist',exact:true}).click();await page.getByRole('button',{name:'Open Mechanics lab',exact:true}).click();assert.equal(await page.locator('.b2-lab input[type=checkbox]:checked').count(),0);
 }
 await page.getByRole('button',{name:'Return to cafe',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.stringify(window.__depthReview.state)),before);
 await page.getByRole('button',{name:'Mechanics lab',exact:true}).click();assert.equal(await page.locator('.b2-lab input[type=checkbox]:checked').count(),0);await page.getByRole('button',{name:'Return to cafe',exact:true}).click();
 rows.push({width,height,owners:owners.length,actions:covered,captures,accountUnchanged:true,overflow:false});await page.close();
}
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
}finally{await browser.close();await writeFile(`${out}/checks.json`,JSON.stringify({artifact,sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors,requests,interactions},null,2));}
console.log(JSON.stringify({sizes:rows.length,errors,requests}));
