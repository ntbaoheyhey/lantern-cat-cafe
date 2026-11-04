// Exercise the delivered file:// artifact with all network requests disabled.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { root, chromium } from './visual-support.mjs';
const browser=await chromium.launch(), results=[];
try {
 for(const [width,height] of [[1280,720],[1440,900],[1920,1080]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('http{,s}://**',r=>{external.push(r.request().url());return r.abort()});
  await page.goto(pathToFileURL(resolve(root,'docs/visual/index.html')).href);
  await page.locator('img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager'));
  for(const size of ['1280','1440','1920']){
   await page.locator('#size').selectOption(size);
   const decoded=await page.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>i.decode()));return imgs.every(i=>i.naturalWidth>0)});assert.equal(decoded,true);
  }
  await page.locator('#size').selectOption(String(width));
  const range=page.locator('#wipe-home');await range.focus();await page.keyboard.press('ArrowRight');assert.equal(await range.inputValue(),'51');
  assert.equal(await page.locator('#home .compare').evaluate(e=>e.style.getPropertyValue('--split')),'51%');
  await page.locator('#mode').click();assert.equal(await range.isDisabled(),true);
  const side=await page.locator('#home .compare').evaluate(e=>{const a=e.querySelector('.before').getBoundingClientRect(),b=e.querySelector('.after').getBoundingClientRect();return a.right<=b.left+1&&Math.abs(a.width-b.width)<1});assert.equal(side,true);
  await page.locator('#mode').click();await page.locator('#pause').click();
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.locator('#pause').click();
  const frame=page.locator('#motion .frames').first();const first=await frame.evaluate(e=>getComputedStyle(e).backgroundPosition);await page.waitForTimeout(600);const next=await frame.evaluate(e=>getComputedStyle(e).backgroundPosition);assert.notEqual(first,next);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').length),0);
  await page.addScriptTag({content:readFileSync(process.env.AXE_PATH??'/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js','utf8')});
  const violations=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
  const broken=[];for(const href of await page.locator('a').evaluateAll(nodes=>nodes.map(n=>n.href)))if(href.startsWith('file:')&&!existsSync(fileURLToPath(href.split('#')[0])))broken.push(href);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  results.push({width,height,decodedImages:await page.locator('img').count(),violations,errors,external,broken,overflow,sliderKeyboard:true,sideBySide:true,animationAdvances:true,reducedAndHiddenStatic:true});
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/tmp/tbh-visual-gallery-${width}.png`});await page.close();
 }
}finally{await browser.close();}
writeFileSync(resolve(root,'reports/visual/gallery-check.json'),'[\n'+results.map(r=>'  '+JSON.stringify(r)).join(',\n')+'\n]\n');console.log(JSON.stringify(results));
for(const r of results){assert.deepEqual(r.violations,[]);assert.deepEqual(r.errors,[]);assert.deepEqual(r.external,[]);assert.deepEqual(r.broken,[]);assert.equal(r.overflow,false)}
