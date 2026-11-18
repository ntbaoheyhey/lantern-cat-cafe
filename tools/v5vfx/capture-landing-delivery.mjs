import {chromium} from './browser-fixture.mjs';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const dir=resolve('work/v5/CXV/films/M-landing-delivery-R1');
try{await access(dir);throw Error('Refusing prior evidence overwrite');}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(dir,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const candidatePath='/Users/bao/th-v5-ag2/work/v5/AGV/landing.avif';
const originalPath='/Users/bao/taskbar-hero-chain/apps/web/public/art/v3-shell/landing.webp';
const candidate=await readFile(candidatePath),original=await readFile(originalPath);
const index=Buffer.from(await (await fetch(url)).arrayBuffer());
if(hash(index)!=='d75197ff94529a92091902510795dd1ec3000e516e8ef02ec13108b6a4d4ef84')throw Error('Served build changed; revalidate before capture');
const served=Buffer.from(await (await fetch(new URL('/art/v3-shell/landing.avif',url))).arrayBuffer());
const report={utc:new Date().toISOString(),url,viewport:[1280,720],sourceCommit:'85cb62233d016faf5c5235ffe178408df1682af3',indexSha256:hash(index),
 runnerSha256:hash(await readFile(new URL(import.meta.url))),candidate:{path:candidatePath,sha256:hash(candidate),bytes:candidate.length},original:{path:originalPath,sha256:hash(original),bytes:original.length},
 served:{sha256:hash(served),bytes:served.length},runtimePatch:'None in baseline; original/candidate substitute only the landing image response in isolated browser contexts. No app/source/style edits.',conditions:[]};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['served','original','candidate']){
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[],blocked=[],resources=[],pending=[];let substitutions=0;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',response=>{const request=response.request();if(['script','stylesheet'].includes(request.resourceType()))pending.push(response.body().then(body=>resources.push({url:response.url(),sha256:hash(body),bytes:body.length})));});
  await page.route('**/*',route=>{
   const u=new URL(route.request().url());
   if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){blocked.push(u.origin+u.pathname);return route.abort();}
   if(u.pathname==='/art/v3-shell/landing.avif'&&mode!=='served'){substitutions++;return route.fulfill({status:200,contentType:mode==='original'?'image/webp':'image/avif',body:mode==='original'?original:candidate});}
   return route.continue();
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const i=document.querySelector('.b-keyart');return i?.complete&&i.naturalWidth===1440;});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(800);
  const state=await page.evaluate(()=>{const i=document.querySelector('.b-keyart'),r=i.getBoundingClientRect();return{url:location.href,image:{src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight,x:r.x,y:r.y,displayWidth:r.width,displayHeight:r.height},text:document.querySelector('.b-landing').innerText};});
  if(state.url!==url||state.image.width!==1440||state.image.height!==810||errors.length)throw Error(JSON.stringify({mode,state,errors}));
  if(substitutions!==(mode==='served'?0:1))throw Error('Unexpected substitution count');
  const path=resolve(dir,mode+'.png');await page.screenshot({path});
  await Promise.all(pending);
  const preview=resolve(dir,mode+'-1024.jpg');execFileSync('ffmpeg',['-v','error','-i',path,'-vf','scale=1024:576','-q:v','2',preview]);
  report.conditions.push({mode,utc:new Date().toISOString(),state,errors,blocked,substitutions,resources:resources.sort((a,b)=>a.url.localeCompare(b.url)),path,sha256:hash(await readFile(path)),preview,previewSha256:hash(await readFile(preview))});
  await context.close();
 }
 if(JSON.stringify(report.conditions[0].resources)!==JSON.stringify(report.conditions[1].resources)||JSON.stringify(report.conditions[0].resources)!==JSON.stringify(report.conditions[2].resources))throw Error('Nonimage resources changed');
 if(hash(Buffer.from(await (await fetch(url)).arrayBuffer()))!==report.indexSha256)throw Error('Build changed during capture');
 report.completedUTC=new Date().toISOString();
 await writeFile(resolve(dir,'capture.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({conditions:report.conditions.length,sourceCommit:report.sourceCommit,indexSha256:report.indexSha256,saving:served.length-candidate.length,report:resolve(dir,'capture.json')}));
}finally{await browser.close();}
