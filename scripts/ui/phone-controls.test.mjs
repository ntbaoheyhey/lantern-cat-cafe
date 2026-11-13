import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {measurePhoneControls} from './phone-controls.mjs';
import {measureScreen} from './measure-screen.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
test('phone audit accepts vertical scrolling and rejects controls clipped inside a fixed-width page',async()=>{
 const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});
 try{
  await page.setContent('<style>body{margin:0;overflow:hidden}.uv-sheet{position:fixed;height:300px;overflow:auto;width:300px}button{display:block;width:260px;height:44px}</style><section class="uv-sheet"><button>First</button><div style="height:700px"></div><button>Last</button></section>');
  const good=await page.evaluate(measurePhoneControls);assert.equal(good.tested,2);assert.deepEqual(good.unreachable,[]);
  assert.equal(await page.locator('.uv-sheet').evaluate(e=>e.scrollTop),0,'Audit restores the original scroll position');
  await page.setContent('<style>body{margin:0;overflow:hidden}.uv-sheet{position:fixed;overflow:hidden;width:300px}button{width:440px;height:44px}</style><section class="uv-sheet"><button>Clipped action</button></section>');
  const screen=await page.evaluate(measureScreen);assert.equal(screen.horizontalOverflow,false);assert.equal(screen.horizontalClippedControls.length,1);
  const bad=await page.evaluate(measurePhoneControls);assert.equal(bad.unreachable.length,1);assert.equal(bad.unreachable[0].horizontalFit,false);
 }finally{await browser.close();}
});
