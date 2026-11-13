import {writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {chromium,openFixture,config} from './browser-fixture.mjs';
import {root,evidenceMeta} from './check-gates.mjs';
import {resolve} from 'node:path';
const out=resolve(root,'reports/v3-battle/a2/P8');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']}),rows=[];
try{
 const {page,errors}=await openFixture(browser,config.fixtures[0]);
 await page.evaluate(()=>{const m=window.__depthReview;m.tutorialBattle=null;m.state.run=null;m.watching=false;m.paused=false;m.plan=null;m.start(1,'campaign',1);m.enter(m.state.run.nodes[0].id);});
 await page.clock.runFor(500);await page.locator('.c2-formation').waitFor();
 for(const [width,height] of [[1280,720],[1440,900],[390,844]]){
  await page.setViewportSize({width,height});await page.clock.runFor(400);
  await page.screenshot({path:resolve(out,`controls-${width}.png`)});
  rows.push(await page.evaluate(()=>({width:innerWidth,tools:[...document.querySelectorAll('.c2-tool')].map(e=>({label:e.getAttribute('aria-label'),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,loaded:[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth>0)})),fight:{name:document.querySelector('.c2-fight')?.textContent,color:getComputedStyle(document.querySelector('.c2-fight')).backgroundImage}})));
 }
 const inputs=await Promise.all(['controls-before.png','controls-1280.png'].map(p=>sharp(resolve(out,p)).resize(640,360).toBuffer()));
 await sharp({create:{width:1280,height:388,channels:3,background:'#171620'}}).composite([{input:Buffer.from('<svg width="1280" height="28"><text x="12" y="20" font-size="17" fill="white">Formation controls — before / icon controls and orange Fight action</text></svg>'),left:0,top:0},...inputs.map((input,i)=>({input,left:i*640,top:28}))]).png().toFile(resolve(out,'compare-controls.png'));
 await writeFile(resolve(out,'controls-metrics.json'),JSON.stringify({_meta:evidenceMeta(),rows,errors},null,2)+'\n');
 assert.deepEqual(errors,[]);
 for(const row of rows){for(const control of row.tools){assert.ok(control.loaded);assert.ok(control.width>=44&&control.height>=44);}assert.ok(row.fight.color.includes('184, 88, 46'),'orange action must survive shared button styles');}
 console.log('PASS: all three viewports, loaded icons,44px tools, orange Fight');
}finally{await browser.close();}
