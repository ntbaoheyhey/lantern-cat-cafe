// Real Chromium tab visibility, complementing the reproducible synthetic audit.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium, root, sampleData, openSample } from './gameplay2-support.mjs';
const data=await sampleData(),browser=await chromium.launch({headless:false,ignoreDefaultArgs:['--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling']});
let report;
try{
  const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce'});
  const {page,evidence}=await openSample({newPage:()=>context.newPage()},data,{debug:true});
  await page.bringToFront();await page.waitForTimeout(2000);
  const snapshot=()=>page.evaluate(()=>({visibility:document.visibilityState,seconds:window.__cafeDebug.snapshot().seconds,storedSeconds:JSON.parse(localStorage.getItem('taskbar-hero:cafe-sample:1')).state.seconds}));
  const cdp=await page.context().newCDPSession(page);
  const {windowId}=await cdp.send('Browser.getWindowForTarget');
  await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});
  await page.waitForFunction(()=>document.hidden);
  const before=await snapshot();await page.waitForTimeout(10000);const after=await snapshot();
  await cdp.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});await page.bringToFront();await page.waitForFunction(()=>!document.hidden);await page.waitForTimeout(1500);const resumed=await snapshot();
  report={method:'Headful Chromium window minimized for 10s, then restored through Browser.setWindowBounds; background-throttling overrides removed. No document visibility override or fake clock. Earlier second-tab attempts did not become hidden and are preserved in logs.',before,after,resumed,...evidence};
  assert.equal(before.visibility,'hidden');assert.equal(after.seconds,before.seconds);assert.ok(resumed.seconds>after.seconds);assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.writes,[]);
}finally{await browser.close();if(report)writeFileSync(resolve(root,'reports/gameplay2/visibility.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report));
