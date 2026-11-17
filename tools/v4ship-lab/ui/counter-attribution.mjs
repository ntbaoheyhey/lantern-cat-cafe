/** QA-4: measured CSS comparison on the real local production landing; no screenshots. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const root=resolve(import.meta.dirname,'../../..');
const attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/counter-attribution-${attempt}.json`);
assert(!existsSync(output));assert(!existsSync(resolve(root,'STOP-V4SHIP')));
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-18.json';
const build=JSON.parse(readFileSync(resolve(root,buildPath)));
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(sha(Buffer.from(await (await fetch('http://127.0.0.1:5998')).arrayBuffer())),build.indexSha256);
const candidates={
 current:'',
 wrap:'@media(max-width:760px){.b-landing .b-live{flex-wrap:wrap}.b-landing .b-live>.b-index-credit{flex-basis:100%}}',
 grid:'@media(max-width:760px){.b-landing .b-live{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.b-landing .b-live>.b-index-credit{grid-column:1/-1}}',
};
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});
const report={at:new Date().toISOString(),buildPath,sourceCommit:build.sourceCommit,indexSha256:build.indexSha256,harnessSha256:sha(readFileSync(import.meta.filename)),candidates,rows:[],complete:false,scope:'Read-only landing layout experiment; no screenshot, public mutation or global G-UI claim.'};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
try{
 for(const [width,height] of [[390,844],[760,900],[761,900],[1280,720],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message.slice(0,160)));
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(['data:','blob:'].includes(url.protocol)||url.hostname==='127.0.0.1'&&['5997','5998','8546'].includes(url.port)||request.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname))return route.continue();
   return route.abort();
  });
  await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
  await page.locator('.b-index-credit').waitFor();await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.querySelectorAll('.b-live strong')].every(element=>element.textContent!=='…'));
  for(const [method,css] of Object.entries(candidates)){
   const style=css?await page.addStyleTag({content:css}):null;
   for(const mixer of [false,true]){
    const toggle=page.locator('.th-audio summary[aria-label="Audio mixer"]');
    assert.equal(await toggle.count(),1);
    const expanded=await toggle.evaluate(element=>element.parentElement.open);
    if(expanded!==mixer)await toggle.click();
    const measured=await page.evaluate(()=>{
     const rect=element=>{const r=element.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
     const elements=[...document.querySelectorAll('.b-landing .b-live a')].map(element=>({label:element.textContent.trim(),rect:rect(element),visible:element.checkVisibility(),scrollWidth:element.scrollWidth,clientWidth:element.clientWidth}));
     return {elements,withinViewport:elements.every(e=>e.rect.left>=-0.5&&e.rect.right<=innerWidth+0.5&&e.rect.top>=-0.5&&e.rect.bottom<=innerHeight+0.5),bodyWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,primary:rect(document.querySelector('.b-landing .b-primary')),mixerOpen:!!document.querySelector('.th-audio details[open]')};
    });
    report.rows.push({width,height,method,mixer,...measured,errors:[...errors]});save();
   }
   await style?.evaluate(element=>element.remove());
  }
  await context.close();
 }
 report.complete=true;
}finally{await browser.close();save();}
console.log(JSON.stringify({output,complete:report.complete,rows:report.rows.length,passByMethod:Object.fromEntries(Object.keys(candidates).map(method=>[method,report.rows.filter(row=>row.method===method&&row.withinViewport&&!row.errors.length).length]))}));
