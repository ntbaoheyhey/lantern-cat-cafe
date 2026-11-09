// S7 targeted meta-screen checks; fixture UI, not held-out acceptance or human playtest.
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules} from './load.mjs';
import {contrast} from './contrast.mjs';
const require=createRequire(resolve('apps/web/package.json')),{chromium}=require('@playwright/test');
const out=process.env.V5_UI_OUT,artifact=process.env.V5_UI_ARTIFACT;assert(out&&artifact);await mkdir(out,{recursive:true});
const suite=await loadRules(),R=await suite.load('packages/game-rules/src/cardrpg/depth/index.ts');
const fixture=JSON.parse(await readFile('packages/game-rules/src/cardrpg/depth/skills-v5/fixtures/events-v2.json','utf8')).fixtures.find(f=>f.id==='rupture');
const prepared=R.createBattle(fixture.initial),finished=R.playBattle(R.createBattle(fixture.initial),'auto');
const cats=R.CATS.map(c=>({id:c.id,role:R.COMBO_ROLES_V5[c.id],descriptions:c.skills.map(s=>R.kitSkillV5(s).description)}));
await suite.vite.close();
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']}),rows=[];
try{for(const [width,height] of [[1280,720],[1440,900],[1024,600]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],network=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,route=>{network.push(route.request().url());return route.abort();});
 await page.goto(pathToFileURL(resolve(artifact)).href);await page.waitForFunction(()=>!!window.__depthReview);
 await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial='complete';m.go('collection');});
 for(const cat of cats){
  await page.evaluate(id=>{const m=window.__depthReview;m.cardId=id;m.notify(false);},cat.id);
  const kit=page.locator(`[data-v5-kit="${cat.id}"]`);await kit.waitFor();assert((await kit.innerText()).includes(cat.role));
  const descriptions=await page.locator('.dp-skill-summary small').allTextContents();assert.deepEqual(descriptions,cat.descriptions);
 }
 const glossary=page.locator('.dp-v5-glossary');await glossary.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await glossary.locator('dt').count(),8);
 assert((await glossary.innerText()).includes('Bleed'));assert((await glossary.innerText()).includes('Scald'));
 await glossary.scrollIntoViewIfNeeded();await page.screenshot({path:out+`/collection-${width}.png`});
 await page.evaluate(()=>{const m=window.__depthReview;m.state.skillsV5=false;m.notify(false);});assert.equal(await page.locator('[data-v5-kit],.dp-v5-glossary').count(),0);
 await page.evaluate(b=>{const m=window.__depthReview;m.state.skillsV5=true;m.replay=b;m.watching=false;m.sceneStarted=false;m.go('prepare');},prepared);
 const hints=page.getByRole('complementary',{name:'Combo partners'});await hints.waitFor();assert((await hints.innerText()).includes('Rupture'));
 await page.getByRole('button',{name:'Select Biscuit for placement'}).click();assert.equal(await page.locator('.dp-v4-prepare [data-v5-kit="biscuit"]').count(),1);
 const geometry=await page.locator('.dp-page').evaluate(el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,overflow:el.scrollWidth>el.clientWidth+1};});assert(geometry.left>=0&&geometry.right<=width+1&&!geometry.overflow);
 const colors=await hints.evaluate(el=>{const s=getComputedStyle(el);return {foreground:s.color,background:s.backgroundColor};});const ratio=contrast(colors.foreground,colors.background);assert(ratio>=4.5);
 await hints.scrollIntoViewIfNeeded();await page.screenshot({path:out+`/prepare-${width}.png`});
 await page.evaluate(b=>{const m=window.__depthReview;m.replay=b;m.go('result');},finished);
 const moments=page.getByRole('region',{name:'Combo moments'});await moments.waitFor();assert((await moments.innerText()).includes('Rupture'));await moments.scrollIntoViewIfNeeded();await page.screenshot({path:out+`/result-${width}.png`});
 const resultText=await moments.innerText();await page.evaluate(()=>{const m=window.__depthReview;m.replay.initial.skillsV5=false;m.notify(false);});await moments.waitFor({state:'detached'});
 assert.deepEqual(errors,[]);assert.deepEqual(network,[]);rows.push({width,height,cats:cats.length,skillDescriptions:cats.length*4,keywords:8,glossaryKeyboard:true,prepareSelection:true,resultText,offHidden:true,geometry,colors,contrast:ratio,errors,network});await page.close();
}}finally{await browser.close();}
await writeFile(out+'/checks.json',JSON.stringify({artifact,artifactSha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),scope:'Three-width Collection/Prepare/Result fixture UI and OFF hiding; no human recognition, balance or render-performance claim.',rows},null,2));console.log(JSON.stringify({checks:rows.length,status:'PASS'}));
