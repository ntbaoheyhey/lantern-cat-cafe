/** Independent browser fixtures catch false passes in the UI observation tool. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve,relative} from 'node:path';
import {existsSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {observeDocument} from './observe.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ui-collector-check-${attempt}.json`);
assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1280,height:720}});
const rows=[];
async function check(name,html,verify){
 await page.setContent(`<style>body{margin:0;background:white;color:black;font:16px/24px sans-serif}</style>${html}`);
 const result=await page.evaluate(observeDocument);let pass=true,error;
 try{verify(result);}catch(e){pass=false;error=e.message;}
 rows.push({name,pass,error,result});
}
try{
 await check('solid contrast', '<p>Readable text</p>', r=>assert.equal(r.texts[0].ratio,21));
 await check('low contrast detected','<p style="color:#ccc">Faint text</p>',r=>assert.equal(r.texts[0].contrast,'fail'));
 await check('overflow actually clips','<p style="width:24px;white-space:nowrap;overflow:hidden">Clipped long text</p>',r=>assert(r.texts[0].clipping.some(c=>c.axis==='x')));
 await check('body overflow propagates to viewport','<style>body{overflow:hidden}main{position:fixed;inset:0}</style><main><p>Visible fixed text</p></main>',r=>assert.equal(r.texts[0].clipping.length,0));
 await check('viewport clipping retained','<style>body{overflow:hidden}</style><p style="position:fixed;top:705px;margin:0">Partly outside</p>',r=>assert(r.texts[0].clipping.some(c=>c.axis==='y')));
 await check('offscreen scroll rows are retained separately','<div style="height:30px;overflow:auto"><p style="margin:0">Top text</p><p style="margin:16px 0 0">Hidden scrolled text</p></div>',r=>{assert.equal(r.texts.length,1);assert.equal(r.texts[0].text,'Top text');assert.equal(r.scrollHidden.length,1);assert.equal(r.scrollHidden[0].text,'Hidden scrolled text');});
 await check('ancestor opacity is not hidden by opaque child','<div style="opacity:.5"><p style="background:white">Translucent text</p></div>',r=>assert.equal(r.texts[0].contrast,'unknown'));
 await check('filled border image is unknown','<p style="border:20px solid;border-image:linear-gradient(red,blue) 10 fill">Image-backed text</p>',r=>assert.equal(r.texts[0].unknownReason,'border-image-fill'));
 await check('gradient interior crosses text luminance','<p style="background:linear-gradient(black,white);color:#777">Gradient text</p>',r=>assert.equal(r.texts[0].ratio,1));
 await check('copy outside paragraphs plus receipt excludes data','<main class="ship-journey"><header><span>Fuji testnet has no value</span></header><p>Do one thing</p></main><aside role="status"><strong>Relic minted</strong><dl><dt>Fee</dt><dd>0.1 AVAX</dd></dl><small>Café pays gas</small></aside>',r=>{assert.equal(r.proseWords,13);assert.equal(r.allVisibleWords,16);});
}finally{await browser.close();}
const report={at:new Date().toISOString(),observerSha256:createHash('sha256').update(readFileSync(resolve(root,'tools/v4ship-lab/ui/observe.mjs'))).digest('hex'),scope:'Independent CSS examples; no app accessibility pass',rows,pass:rows.every(r=>r.pass)};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),pass:report.pass,checks:rows.map(({name,pass,error})=>({name,pass,error}))}));
if(!report.pass)process.exitCode=1;
