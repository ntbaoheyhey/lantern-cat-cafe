// Verify the delivered file:// artifact, without external resources or a server.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {root,chromium} from './visual-support.mjs';
const url=pathToFileURL(resolve(root,'docs/gameplay/index.html')).href,axe=readFileSync(process.env.AXE_PATH??'/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js','utf8');
const browser=await chromium.launch(),records=[];
try{
 for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],network=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url());});
  await page.route('https://**/*',r=>r.abort());await page.route('http://**/*',r=>r.abort());await page.goto(url);
  for(const size of ['1280','1920']){
    await page.locator('#size').selectOption(size);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
    assert.equal(await page.locator('img').evaluateAll(images=>images.some(i=>!i.complete||!i.naturalWidth)),false);
  }
  await page.locator('#size').selectOption('1280');await page.locator('input[type=range]').first().focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('output').first().textContent(),'51%');
  await page.locator('#mode').click();assert.ok(await page.locator('body').evaluate(e=>e.classList.contains('side-by-side')));
  await page.locator('#mode').click();await page.locator('#motion').click();
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.locator('#motion').click();await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  const links=await page.locator('a[href]').evaluateAll(as=>as.map(a=>a.href));
  const missing=links.filter(href=>href.startsWith('file:')&&!existsSync(fileURLToPath(href.split('#')[0])));
  await page.addScriptTag({content:axe});const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  await page.screenshot({path:resolve(root,`reports/gameplay/gallery-${width}.png`)});
  records.push({width,height,images:await page.locator('img').count(),errors,network,missing,violations,overflow});
  await page.close();
 }
}finally{await browser.close();}
writeFileSync(resolve(root,'reports/gameplay/gallery-check.json'),JSON.stringify(records,null,2)+'\n');console.log(JSON.stringify(records));
assert.ok(records.every(r=>!r.errors.length&&!r.network.length&&!r.missing.length&&!r.violations.length&&!r.overflow));
