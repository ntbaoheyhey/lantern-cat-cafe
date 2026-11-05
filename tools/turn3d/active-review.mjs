// A fresh browser, actual controls, no log or privileged state hook.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:720}}),rows=[],errors=[];
page.on('pageerror',e=>errors.push(String(e)));const path='reports/turn3d/shots';
const capture=async name=>{await page.screenshot({path:`${path}/${name}.png`});rows.push({name,caption:await page.locator('.t3-caption').innerText(),turns:await page.locator('.t3-order').innerText(),party:await page.locator('.t3-party').innerText()});};
try{
 await page.goto('http://127.0.0.1:5515/?demo&squad=1&squad3d=1');
 await page.getByText('Mochi — your turn',{exact:true}).waitFor();await capture('fresh-pass-3-opening');
 await page.keyboard.press('2');await page.getByRole('button',{name:'Target Spool Ram',exact:true}).click();
 await page.getByText('Soot — your turn',{exact:true}).waitFor();await capture('fresh-pass-3-interrupted');
 await page.keyboard.press('2');await page.getByRole('button',{name:'Target Sock Skipper',exact:true}).first().hover();await capture('fresh-pass-3-row-preview');
 await page.getByRole('button',{name:'Target Sock Skipper',exact:true}).first().click();
 await page.getByText('Clover — your turn',{exact:true}).waitFor();await page.keyboard.press('2');await page.getByRole('button',{name:'Target Soot',exact:true}).hover();await capture('fresh-pass-3-heal-choice');await page.getByRole('button',{name:'Target Soot',exact:true}).click();
 await page.getByLabel('Animation speed').selectOption('4');await page.getByLabel('Auto all cats').check();
 const start=Date.now();await page.getByRole('region',{name:'Encounter result'}).waitFor({timeout:240000});
 await page.screenshot({path:`path/campaign-result.png`.replace('path',path),fullPage:true});
 rows.push({name:'campaign-complete',result:await page.getByRole('region',{name:'Encounter result'}).innerText(),autoWallMs:Date.now()-start,note:'x4 after three manual choices; not x1 human-pacing evidence'});
 console.log(JSON.stringify({rows:rows.length,result:rows.at(-1),errors}));
}finally{await fs.writeFile('reports/turn3d/active-review.json',JSON.stringify({date:new Date().toISOString(),method:'Fresh browser, visible UI and hotkeys; no log, no rules hook. Self-play by primary session.',rows,errors},null,2));await browser.close()}
