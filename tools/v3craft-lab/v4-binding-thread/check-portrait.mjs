import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const {chromium}=createRequire(resolve(root,'apps/web/package.json'))('@playwright/test');
const phase=process.argv[2];
if(!['before','after'].includes(phase))throw new Error('Expected before or after');
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const [width,height] of [[1280,720],[1440,900]]) {
  const page=await browser.newPage({viewport:{width,height}});
  await page.route('**/__binding_portrait_check__',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Portrait decode</title>'}));
  await page.goto('http://127.0.0.1:5990/__binding_portrait_check__');
  results.push(await page.evaluate(async({width,height})=>{
   const rows=[];
   for(const url of ['/units/binding-thread/portrait.webp','/units/binding-thread/runtime.webp']) {
    const response=await fetch(url,{cache:'no-store'}),im=new Image();
    im.src=url+'?portraitCheck='+Date.now();
    let decoded=false,error=null;
    try{await im.decode();decoded=true;}catch(e){error=String(e);}
    rows.push({url,status:response.status,contentType:response.headers.get('content-type'),decoded,width:im.naturalWidth,height:im.naturalHeight,error});
   }
   return {viewport:{width,height},images:rows};
  },{width,height}));
  await page.close();
 }
}finally{await browser.close();}
const out=resolve(root,'reports/v4-art/REVIEW/A10/binding-portrait');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,phase+'.json'),JSON.stringify({phase,utc:new Date().toISOString(),scope:'isolated production URL decode at two viewports; SHIP must rerun integrated journeys',results},null,2)+'\n');
console.log(JSON.stringify({phase,results}));
if(phase==='after'&&results.some(r=>r.images.some(i=>!i.decoded)))process.exitCode=1;
