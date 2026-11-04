import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE),{chromium}=require(process.env.PLAYWRIGHT_CORE);
const browser=await chromium.launch({args:['--no-sandbox'],executablePath:process.env.CHROMIUM_EXECUTABLE});
const results=[];
try{
 for(const width of [1280,1600])for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width,height:width*9/16},reducedMotion});
  await page.route('https://fonts.gstatic.com/**',async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,1200));await route.fulfill({response});});
  await page.addInitScript(()=>{
   localStorage.setItem('taskbar-hero.howToPlaySeen','1');window.landingShifts=[];
   new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.landingShifts.push({value:entry.value,sources:entry.sources.map(s=>(s.node instanceof Element?s.node:s.node?.parentElement)?.outerHTML??'')});}).observe({type:'layout-shift',buffered:true});
  });
  await page.goto(process.env.PROOF_URL+'/#landing',{waitUntil:'domcontentloaded'});
  await page.getByTestId('landing-start').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const shifts=await page.evaluate(()=>window.landingShifts);
  const overflow=await page.locator('.landing__guest-btn,.landing__wallet-btn-wrap,.landing__proof-item').evaluateAll(es=>es.some(e=>e.scrollWidth>e.clientWidth));
  const linksWrap=await page.locator('.landing__proof-link').evaluateAll(es=>es.some(e=>e.getBoundingClientRect().height>parseFloat(getComputedStyle(e).lineHeight)+1));
  const result={width,reducedMotion,shifts,overflow,linksWrap,platform:process.platform,browser:browser.version()};results.push(result);console.log(JSON.stringify(result));
  assert.deepEqual(shifts,[]);assert.equal(overflow,false);assert.equal(linksWrap,false);await page.close();
 }
}finally{await browser.close();writeFileSync(process.env.PROOF_RESULT,JSON.stringify(results,null,2)+'\n');}
