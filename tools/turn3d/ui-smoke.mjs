import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:5511/?demo&squad=1&squad3d=1&squadDebug=1');await page.waitForFunction(()=>window.__turn3dReview?.scene?.stats.loaded>=7);await page.waitForFunction(()=>window.__turn3dReview.controller.canChoose);await page.waitForTimeout(300);
await page.screenshot({path:'reports/turn3d/shots/first-ui.png'});
console.log(JSON.stringify({errors,state:await page.evaluate(()=>({active:window.__turn3dReview.controller.active.name,phase:window.__turn3dReview.controller.battle.phase,stats:window.__turn3dReview.scene.stats,body:document.body.scrollWidth}))}));await browser.close();
