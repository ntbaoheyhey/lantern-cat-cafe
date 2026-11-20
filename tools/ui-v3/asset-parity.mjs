import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2]??'u9',build=JSON.parse(readFileSync('docs/ui-v3/build.json','utf8'));
const browser=await chromium.launch({headless:true});const errors=[];
try {
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+resolve('docs/ui-v3/index.html'));await page.locator('.uv-patrol').waitFor();
 const actual=await page.evaluate(async()=>{
  const result={};for(const [key,url] of Object.entries(window.__cardAssets)){
   const bytes=await(await fetch(url)).arrayBuffer();const hash=await crypto.subtle.digest('SHA-256',bytes);
   result[key]=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  }return result;
 });
 const mismatches=Object.keys({...actual,...build.assetHashes}).filter(k=>actual[k]!==build.assetHashes[k]);
 const receipt={status:mismatches.length||errors.length?'FAIL':'PASS',artifact:build.sha256,checked:Object.keys(actual).length,mismatches,errors,method:'Every restored blob SHA256 compared with the exact build transport input, including all dictionary-patched models; no sampling.'};
 mkdirSync(`reports/ui-v3/${dir}`,{recursive:true});writeFileSync(`reports/ui-v3/${dir}/asset-parity.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));assert.equal(receipt.status,'PASS');
}finally{await browser.close()}
