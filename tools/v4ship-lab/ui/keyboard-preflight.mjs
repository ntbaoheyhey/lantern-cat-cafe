/** Keyboard-only dialog activation/trap/return on an identified shipping build. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ui-keyboard-preflight-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-2.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')===build.indexSha256);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true}),report={at:new Date().toISOString(),buildPath,buildSourceCommit:build.sourceCommit,scope:'Landing dialogs, keyboard activation and focus containment/return; no sign-in or transactions; no full accessibility claim',rows:[],pass:false};
try{for(const [width,height] of [[1280,720],[1440,900]]){
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'}),page=await context.newPage();
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(u.hostname==='127.0.0.1'&&['5997','5998','8546'].includes(u.port)||['data:','blob:'].includes(u.protocol)||u.protocol==='https:'&&r.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname))await route.continue();else await route.abort();});
 try{await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
 for(const [opener,name] of [['Connect wallet','Wallet sign-in'],['Economy','economy'],['Odds','odds']]){
  assert(!existsSync(resolve(root,'STOP-V4SHIP')));
  const button=page.getByRole('button',{name:opener,exact:true}),dialog=page.getByRole('dialog',{name,exact:true});
  await button.focus();await page.keyboard.press('Enter');await dialog.waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const initialFocusInside=await dialog.evaluate(e=>e.contains(document.activeElement));
  const focusableCount=await dialog.locator('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]').count();
  const tabs=[];
  for(const key of ['Tab','Shift+Tab'])for(let i=0;i<focusableCount+2;i++){await page.keyboard.press(key);tabs.push({key,inside:await dialog.evaluate(e=>e.contains(document.activeElement))});}
  await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
  const returned=await button.evaluate(e=>document.activeElement===e);
  const after=await page.evaluate(()=>({tag:document.activeElement?.tagName,label:document.activeElement?.getAttribute('aria-label')??'',text:document.activeElement===document.body?'[body]':document.activeElement?.textContent?.trim().slice(0,80)}));
  report.rows.push({width,height,opener,dialog:name,initialFocusInside,focusableCount,tabs,returned,after,pass:initialFocusInside&&tabs.every(t=>t.inside)&&returned});
 }
 }finally{await context.close();}
}report.pass=report.rows.length===6&&report.rows.every(r=>r.pass);
}catch(e){report.failure=e.message.slice(0,300);}
finally{await browser.close();writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({output:relative(root,output),pass:report.pass,rows:report.rows.map(({width,opener,initialFocusInside,returned,pass})=>({width,opener,initialFocusInside,returned,pass})),failure:report.failure}));if(!report.pass)process.exitCode=1;
