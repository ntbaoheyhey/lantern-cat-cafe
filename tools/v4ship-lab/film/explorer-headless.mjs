/** Compare real public-page recording in two standard headless engines. No desktop access. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S10/explorer-headless-comparison-${attempt}.json`),directory=resolve(root,`work/v4ship-prep/S10-explorer-headless-${attempt}`);
assert(!existsSync(output)&&!existsSync(directory)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(directory,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex'),safe=s=>String(s).replace(/\u001b\[[0-9;]*m/g,'').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,500);
const expectedPath='reports/v4-ship/S11/explorer-recording-preflight-2.json',expected=JSON.parse(readFileSync(resolve(root,expectedPath)));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium,webkit}=require('@playwright/test');
const report={at:new Date().toISOString(),url:expected.url,expected:expected.observed,expectedEvidence:{path:expectedPath,sha256:sha(readFileSync(resolve(root,expectedPath)))},harnessSha256:sha(readFileSync(import.meta.filename)),playwrightVersion:require('@playwright/test/package.json').version,method:'Two installed engines, standard fresh headless contexts, read-only navigation and native video. No desktop control, cookies imported, stealth settings, CAPTCHA solving, page replacement or screenshots.',rows:[],complete:false,publicExplorerFootagePass:false,humanReviewPass:false,submissionGatePass:false};
const save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
for(const [name,engine,options] of [['chromium-full',chromium,{channel:'chromium',headless:true}],['webkit',webkit,{headless:true}]]){
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));let browser,context,page,video;
 const row={name,options,errors:[],teardownErrors:[],publicExplorerFootagePass:false};report.rows.push(row);const start=performance.now();
 try{
  browser=await engine.launch(options);row.browserVersion=browser.version();
  const raw=resolve(directory,name);mkdirSync(raw);context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:raw,size:{width:1280,height:720}}});
  page=await context.newPage();video=page.video();row.pageCreatedMs=performance.now()-start;
  page.on('pageerror',e=>row.errors.push(safe(e.message)));
  const response=await page.goto(expected.url,{waitUntil:'domcontentloaded',timeout:45000});row.httpStatus=response?.status();row.navigationMs=performance.now()-start;row.title=await page.title();
  assert(row.httpStatus===200&&!/just a moment|security verification|access denied/i.test(row.title),'Public receipt unavailable; challenge page is not receipt footage');
  const success=page.getByText('Success',{exact:true}).first();await success.waitFor({timeout:25000});
  const observe=async()=>{
   const body=await page.locator('body').innerText(),url=new URL(page.url()),target=new URL(expected.url);
   const links=await page.locator('a[href]').evaluateAll(elements=>elements.map(e=>e.getAttribute('href')));
   return {success:await success.isVisible(),block:new RegExp(String(expected.observed.block).split('').join(',?')).test(body),yarn:/\bYARN\b/.test(body),publicTransaction:url.hostname===target.hostname&&url.pathname.toLowerCase()===target.pathname.toLowerCase(),payerLink:links.some(href=>href?.toLowerCase().includes(expected.observed.from.toLowerCase())),recipientLink:links.some(href=>href?.toLowerCase().includes(expected.observed.to.toLowerCase()))};
  };
  row.before=await observe();assert(Object.values(row.before).every(Boolean),'Visible public transaction fields did not match');
  row.feeContext=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/^(transaction|network) fee:?$/i.test(e.textContent.trim())).slice(0,6).map(e=>({label:e.textContent,context:e.parentElement?.innerText.slice(0,600),subscripts:[...e.parentElement?.querySelectorAll('sub')??[]].map(s=>s.textContent)})));
  await success.scrollIntoViewIfNeeded();row.verifiedHoldStartedMs=performance.now()-start;await page.waitForTimeout(12000);row.verifiedHoldMs=performance.now()-start-row.verifiedHoldStartedMs;
  row.after=await observe();assert(Object.values(row.after).every(Boolean),'Public receipt changed during video hold');
  assert(!existsSync(resolve(root,'STOP-V4SHIP')));row.publicExplorerFootagePass=true;
 }catch(error){row.failure=safe(error.message);}
 finally{
  try{await context?.close();}catch(error){row.teardownErrors.push(safe(error.message));}
  try{await browser?.close();}catch(error){row.teardownErrors.push(safe(error.message));}
  if(video)try{
   const path=await video.path(),bytes=readFileSync(path);row.video={path:relative(root,path),bytes:bytes.length,sha256:sha(bytes)};
   row.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,nb_read_frames:format=duration,size','-of','json',path],{encoding:'utf8'}));
   const stream=row.probe.streams.find(s=>s.width===1280&&s.height===720);assert(stream&&Number(stream.nb_read_frames)>0,'Video did not contain recorded frames');
   if(row.publicExplorerFootagePass)assert(Number(row.probe.format.duration)>=12,'Verified hold missing from video duration');
  }catch(error){row.publicExplorerFootagePass=false;row.videoFailure=safe(error.message);}
  row.publicExplorerFootagePass&&=!row.errors.length&&!row.teardownErrors.length;row.totalMs=performance.now()-start;save();
 }
 console.log(JSON.stringify({name,status:row.httpStatus,title:row.title,ms:row.totalMs,footagePass:row.publicExplorerFootagePass,video:row.video,failure:row.failure}));
}
report.complete=report.rows.length===2;report.publicExplorerFootagePass=report.rows.some(r=>r.publicExplorerFootagePass);save();
console.log(JSON.stringify({output:relative(root,output),complete:report.complete,publicExplorerFootagePass:report.publicExplorerFootagePass}));
if(!report.publicExplorerFootagePass)process.exitCode=1;
