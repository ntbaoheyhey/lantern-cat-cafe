/** Record the real public explorer page in a fresh browser; never recreate its UI. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/explorer-capture-${attempt}.json`),directory=resolve(root,`work/v4ship-prep/S11-explorer-${attempt}`);
assert(!existsSync(output)&&!existsSync(directory)&&!existsSync(resolve(root,'STOP-V4SHIP')));mkdirSync(directory,{recursive:true});
const expected=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S11/explorer-recording-preflight-2.json')));
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={at:new Date().toISOString(),url:expected.url,method:'Native Chromium video recording of the live public Snowtrace transaction. Fresh profile; read-only navigation, no wallet connection, no page replacement, no screenshots.',expected:expected.observed,errors:[],publicExplorerFootagePass:false};
let browser,context,page,video;
try{
 browser=await chromium.launch({headless:true});context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:directory,size:{width:1280,height:720}}});page=await context.newPage();video=page.video();
 page.on('pageerror',e=>report.errors.push(String(e.message).replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,180)));
 const response=await page.goto(expected.url,{waitUntil:'domcontentloaded',timeout:45000});report.status=response?.status();
 await page.getByText('Success',{exact:true}).first().waitFor({timeout:25000});
 const body=await page.locator('body').innerText();
 report.observed={success:/\bSuccess\b/.test(body),block:new RegExp(String(expected.observed.block).split('').join(',?')).test(body),token:/\bYARN\b/.test(body),fuji:/Fuji/i.test(body),title:await page.title(),url:page.url()};
 assert(report.observed.success&&report.observed.block&&report.observed.token&&report.observed.url===expected.url,'Public transaction fields did not match');
 report.verifiedAt=new Date().toISOString();await page.getByText('Success',{exact:true}).first().scrollIntoViewIfNeeded();
 report.verifiedHoldStartedMs=Date.now();await page.waitForTimeout(12000);report.verifiedHoldMs=Date.now()-report.verifiedHoldStartedMs;
 assert(!existsSync(resolve(root,'STOP-V4SHIP')));report.publicExplorerFootagePass=true;
}catch(error){report.failure=String(error.message).replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g,'[token]').slice(0,600);}
finally{
 await context?.close();await browser?.close();
 if(video){
  const path=await video.path(),bytes=readFileSync(path);report.video={path:relative(root,path),bytes:bytes.length,sha256:hash(bytes)};
  try{report.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_entries','stream=codec_name,width,height,nb_read_frames:format=duration,size','-of','json',path],{encoding:'utf8'}));}catch{report.publicExplorerFootagePass=false;report.probeFailure=true;}
 }
 report.humanReviewPass=false;report.submissionGatePass=false;writeFileSync(output,JSON.stringify(report,null,2)+'\n');
}
console.log(JSON.stringify({output:relative(root,output),publicExplorerFootagePass:report.publicExplorerFootagePass,status:report.status,observed:report.observed,video:report.video,failure:report.failure}));if(!report.publicExplorerFootagePass)process.exitCode=1;
