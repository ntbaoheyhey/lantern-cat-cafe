// file://, offline, no server. Exercises the actual bundled review component.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium, root } from './visual-support.mjs';
const browser=await chromium.launch(), records=[], axe=readFileSync(process.env.AXE_PATH??'/private/tmp/taskbar-hero-ui-axe-4.10.3.min.js','utf8');
try {
  for(const [width,height]of [[1280,720],[1440,900],[1920,1080]]) {
    const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'}),errors=[],external=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url())});
    await page.context().setOffline(true);await page.goto(pathToFileURL(resolve(root,'docs/gameplay2/index.html')).href);
    await page.getByTestId('cafe-adventure').waitFor();await page.evaluate(()=>document.fonts.ready);
    await page.locator('#game').scrollIntoViewIfNeeded();
    for(const scenario of ['Boss tells','Workshop kit','Ember set','Moss set','Star set','Away summary','Tour preview','Fresh start']) {
      await page.getByRole('button',{name:scenario,exact:true}).click();
      if(scenario==='Boss tells'){await page.getByRole('button',{name:'Dodge 1',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Dodge 1',exact:true}).isDisabled(),true);}
      if(scenario==='Away summary')await page.getByRole('region',{name:'While you were away'}).waitFor();
      if(scenario==='Workshop kit'){await page.getByRole('navigation',{name:'Adventure pages'}).getByRole('button',{name:'Workshop',exact:true}).click();await page.getByRole('button',{name:/^Craft Moss paw/}).click();}
    }
    await page.addScriptTag({content:axe});
    const violations=await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    const decoded=await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(n=>n.decode().then(()=>true,()=>false))));
    const rows=await page.locator('#timeline tbody tr').count();
    records.push({width,height,errors,external,violations,overflow,decoded:decoded.every(Boolean),timelineRows:rows,protocol:'file:',offline:true});
    await page.locator('#game').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(root,`reports/gameplay2/demo-${width}.png`)});await page.close();
  }
} finally {await browser.close();}
writeFileSync(resolve(root,'reports/gameplay2/demo-check.json'),JSON.stringify(records,null,2));console.log(JSON.stringify(records,null,2));
for(const r of records){assert.deepEqual(r.errors,[]);assert.deepEqual(r.external,[]);assert.deepEqual(r.violations,[]);assert.equal(r.overflow,false);assert.ok(r.decoded);assert.equal(r.timelineRows,9);}
