import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const manifest=JSON.parse(await readFile('assets/provenance/cardrpg-depth-models.json','utf8'));
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const records=[];await mkdir('assets/cardrpg2/portraits',{recursive:true});
try{for(const asset of manifest.assets){
  const page=await browser.newPage({viewport:{width:400,height:480}});
  await page.goto('http://127.0.0.1:5526/@fs'+resolve('tools/cardrpg-depth/portrait.html')+'?id='+asset.id);
  await page.waitForFunction(()=>window.__portrait?.ready);
  const path=`assets/cardrpg2/portraits/${asset.id}.png`,data=await page.screenshot({path,omitBackground:true});
  records.push({id:asset.id,path,modelSha256:asset.sha256,sha256:createHash('sha256').update(data).digest('hex')});
  await page.close();
}}finally{await browser.close();}
await writeFile('assets/provenance/cardrpg-depth-portraits.json',JSON.stringify({tool:'Three.js / Playwright Chromium ANGLE Metal',command:'node tools/cardrpg-depth/portraits.mjs',externalReferences:[],license:'CC0-1.0',sources:await Promise.all(['tools/cardrpg-depth/portrait.html','tools/cardrpg-depth/portraits.mjs'].map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')}))),assets:records},null,2));
console.log(`${records.length} model-specific portraits`);
