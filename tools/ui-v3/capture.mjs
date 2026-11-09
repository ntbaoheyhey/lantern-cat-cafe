import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdirSync,writeFileSync,readFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const phase=process.argv[2]??'before',dir=`reports/ui-v3/${phase}`;
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-angle=metal']:[]});const rows=[];
try{
for(const [width,height] of [[1280,720],[1440,900]])for(const look of ['on','off']){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const entry=process.env.UI_V3_ARTIFACT?'file://'+process.env.UI_V3_ARTIFACT:'http://127.0.0.1:5950/tools/ui-v3/index.html';
 await page.goto(`${entry}?look=${look}${phase==='before'?'':'&ui=v3'}`);
 await page.waitForFunction(()=>!!window.__depthReview);
 async function shot(name){
  if(phase!=='before'){const ready={home:'.uv-patrol',team:'.uv-team-seats',collection:'.uv-cat-grid',inventory:'.uv-gear-grid',gacha:'.uv-recruit-stage',prepare:'.uv-fight',result:'.uv-result-title',map:'.dp-map',battle:'.uv-battle-cat'}[name];if(ready)await page.locator(ready).first().waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('.uv-sheet-content p')).some(e=>/^Opening(?:…| the .*…)$/.test(e.textContent??'')));}
  await page.waitForTimeout(180);
  await page.evaluate(()=>document.fonts.ready);
  const png=`/tmp/ui-v3-${phase}-${width}-${look}-${name}.png`,out=`${dir}/${width}-${look}-${name}.webp`;
  await page.screenshot({path:png});execFileSync('/tmp/ui-v3-python/bin/python',['-c','from PIL import Image;import sys;Image.open(sys.argv[1]).save(sys.argv[2],quality=76)',png,out]);unlinkSync(png);
  rows.push({width,height,look,screen:name,file:out,actual:await page.evaluate(()=>window.__depthReview.screen),errors:[...errors]});
 }
 if(phase==='before')await page.waitForFunction(()=>document.querySelector('.dp-miniature-canvas [data-ready="true"]')||window.__depthPreviewScene?.ready,{},{timeout:45000}).catch(()=>{});else await page.locator('.uv-shell').waitFor();
 await shot('home');
 await page.evaluate(()=>{const m=window.__depthReview;m.state.tutorial=4;m.notify(false)});
 for(const screen of ['team','collection','journal','inventory','gacha','codex','relics','save','map']){
  await page.evaluate(screen=>{const m=window.__depthReview;if(screen==='map')m.start(1,'campaign',1);else m.go(screen)},screen);
  await page.waitForFunction(s=>window.__depthReview.screen===s,screen);
  await page.waitForTimeout(200);await shot(screen);
 }
 await page.evaluate(()=>window.__depthReview.tutorial());await page.waitForSelector('.dp-fight, .uv-fight');await shot('prepare');
 await page.evaluate(()=>window.__depthReview.fight());await page.waitForFunction(()=>window.__depthReview.sceneReady||!!window.__depthReview.sceneError,{},{timeout:45000});
 await page.waitForFunction(()=>!!window.__depthReview.plan,{},{timeout:20000});await page.evaluate(()=>{const m=window.__depthReview;m.paused=true;if(m.plan)m.animationAt=m.plan.duration*.45;m.notify(false)});await shot('battle');
 await page.evaluate(()=>window.__depthReview.skip());await page.waitForFunction(()=>window.__depthReview.screen==='result');await shot('result');
 // Reviewer-only comparison has its own explicit dev URL.
 await page.goto(`${entry}?look=${look}${phase==='before'?'':'&ui=v3'}&dev=1`);await page.waitForFunction(()=>!!window.__depthReview);await page.evaluate(()=>window.__depthReview.go('evidence'));await page.waitForTimeout(250);await shot('evidence');
 await page.close();
}
}finally{await browser.close();writeFileSync(`${dir}/manifest.json`,JSON.stringify(rows,null,2)+'\n')}
console.log(JSON.stringify({phase,captures:rows.length,errors:rows.filter(r=>r.errors.length).length}));
