/** Same-build landing response-only comparison. No public files are changed. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium,judgeUrl,runtimeEvidence} from './production-fixture.mjs';
const root=resolve(import.meta.dirname,'../..'),req=createRequire(resolve(root,'apps/web/package.json')),sharp=req('sharp'),hash=b=>createHash('sha256').update(b).digest('hex');
const out=resolve(process.argv[2]),candidatePath=resolve(process.argv[3]);assert(out.startsWith(root+'/work/v5/CXI/')&&!existsSync(out));await mkdir(out,{recursive:true});
for(const n of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+n));
const paths={original:root+'/apps/web/public/art/v3-shell/landing.webp',candidate:candidatePath},bytes={};for(const[k,p]of Object.entries(paths))bytes[k]=await readFile(p);
bytes.served=Buffer.from(await(await fetch(new URL('/art/v3-shell/landing.avif',judgeUrl))).arrayBuffer());
const identity=runtimeEvidence(),report={utc:new Date().toISOString(),url:judgeUrl,viewport:[1280,720],...identity,harnessSha256:hash(await readFile(import.meta.filename)),inputs:Object.fromEntries(Object.entries(bytes).map(([k,b])=>[k,{path:paths[k],sha256:hash(b),bytes:b.length}])),conditions:[],bytePolicy:'report-only',runtimeChange:'Image response only in isolated browser contexts; no application/source/style/public-file mutations.'};
assert.equal(hash(Buffer.from(await(await fetch(judgeUrl)).arrayBuffer())),identity.indexSha256);
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['served','original','candidate','fallback']){
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],blocked=[],resources=[],pending=[];let substitutions=0,fallbacks=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(['script','stylesheet'].includes(r.request().resourceType()))pending.push(r.body().then(b=>resources.push({url:r.url(),sha256:hash(b)})));});
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){blocked.push(u.origin+u.pathname);return route.abort();}
   if(u.pathname==='/art/v3-shell/landing.webp')fallbacks++;
   if(u.pathname==='/art/v3-shell/landing.avif'&&mode!=='served'){substitutions++;return route.fulfill(mode==='fallback'?{status:404,body:''}:{status:200,contentType:mode==='original'?'image/webp':'image/avif',body:bytes[mode]});}return route.continue();});
  await page.goto(judgeUrl,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>{const i=document.querySelector('.b-keyart');return i?.complete&&i.naturalWidth===1440;});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
  const state=await page.evaluate(()=>{const i=document.querySelector('.b-keyart'),r=i.getBoundingClientRect();return{url:location.href,src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,rect:{x:r.x,y:r.y,width:r.width,height:r.height},text:document.querySelector('.b-landing').innerText};});
  assert.equal(state.url,judgeUrl);assert.equal(state.height,810);assert.equal(substitutions,mode==='served'?0:1);assert.equal(fallbacks,mode==='fallback'?1:0);assert.deepEqual(errors,[]);
  const path=resolve(out,mode+'.png');await page.screenshot({path});await Promise.all(pending);const b=await readFile(path),meta=await sharp(b).metadata(),stats=await sharp(b).stats();assert.deepEqual([meta.width,meta.height],[1280,720]);
  const review=resolve(out,mode+'-1024.png');await sharp(b).resize(1024,576).png().toFile(review);report.conditions.push({mode,utc:new Date().toISOString(),state,errors,blocked,substitutions,fallbacks,resources:resources.sort((a,b)=>a.url.localeCompare(b.url)),path,sha256:hash(b),dimensions:[meta.width,meta.height],bytes:b.length,entropy:stats.entropy,review,reviewSha256:hash(await readFile(review)),reviewDimensions:[1024,576]});await context.close();
 }
 for(const r of report.conditions){assert.deepEqual(r.resources,report.conditions[0].resources);assert.equal(r.state.text,report.conditions[0].state.text);}
 assert.equal(report.conditions[1].sha256,report.conditions[3].sha256,'Original fallback pixels differ');assert.equal(runtimeEvidence().indexSha256,identity.indexSha256);report.pass=true;
}finally{await browser.close();report.finishedUTC=new Date().toISOString();await writeFile(resolve(out,'capture.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({out,pass:report.pass,conditions:report.conditions.length,source:identity.sourceCommit,index:identity.indexSha256}));
