/** Deliberate chunk failure/stall; separate from ordinary no-error journey evidence. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Use a fresh evidence label');
const stop=()=>{for(const file of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+file),'STOP: '+file);};stop();
const dir=resolve(root,'work/v5/CXI/recovery',label);assert(!existsSync(dir));mkdirSync(dir,{recursive:true});
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3',hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const indexSha256=hash(readFileSync(resolve(root,'apps/web/dist/index.html')));
assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),indexSha256);
const report={url,utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),indexSha256,viewport:{width:1280,height:720},scope:'Intentional route module abort and stalled download. Ordinary guest controls and real timers. These failures are injected and do not reproduce an identified AGS network trace.',rows:[],complete:false};
const save=()=>writeFileSync(resolve(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test'),sharp=require('sharp');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const mode of ['reject','stall']){
  stop();const row={mode,complete:false,intercepted:[],pageErrors:[],consoleErrors:[],blockedWrites:[]};report.rows.push(row);save();
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'}),page=await context.newPage();
  let inject=true,release;const held=new Promise(done=>{release=done;});
  page.on('pageerror',e=>row.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(m.text());});
  await page.route('**/*',async route=>{
   const request=route.request(),target=new URL(request.url());
   if(inject&&/\/assets\/EncounterV3-[\w-]+\.js$/.test(target.pathname)){
    row.intercepted.push(target.pathname);if(mode==='reject')return route.abort('failed');await held;return route.continue();
   }
   if(request.method()!=='POST')return route.continue();
   let body;try{body=request.postDataJSON();}catch{row.blockedWrites.push(target.pathname);return route.abort();}
   const calls=Array.isArray(body)?body:[body];
   if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
   row.blockedWrites.push(target.origin+target.pathname);return route.abort();
  });
  try{
   await page.goto(url);await page.getByRole('button',{name:'Play free',exact:true}).click();const start=performance.now();await page.locator('.uv-patrol').click();
   if(mode==='reject')await page.getByRole('alert').filter({hasText:'Couldn’t open Prepare'}).waitFor();
   else await page.getByText('This is taking longer than expected.',{exact:true}).waitFor({timeout:15000});
   row.recoveryMs=Math.round(performance.now()-start);assert(row.intercepted.length>0);
   row.recoveryText=await page.locator('.uv-sheet-content').innerText();assert(await page.getByRole('button',{name:'Reload page',exact:true}).isVisible());
   row.controls=await page.getByRole('button',{name:/^(Reload page|Back to café)$/}).evaluateAll(buttons=>buttons.map(button=>{const b=button.getBoundingClientRect();return{name:button.textContent,x:b.x,y:b.y,width:b.width,height:b.height,inViewport:b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight};}));
   assert.equal(row.controls.length,2);assert(row.controls.every(button=>button.inViewport),'Both recovery controls must be visible without scrolling');
   row.sheet=resolve(dir,mode+'-1024.jpg');await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(row.sheet);
   await page.getByRole('button',{name:'Back to café',exact:true}).click();await page.locator('.uv-sheet').waitFor({state:'hidden'});assert(await page.locator('.uv-patrol').isVisible());row.returnedToCafe=true;
   inject=false;release();
   if(mode==='reject'){
    await page.locator('.uv-patrol').click();await page.getByRole('button',{name:'Reload page',exact:true}).click();await page.waitForLoadState('load');
    await page.locator('.uv-patrol').click();await page.getByRole('button',{name:'Fight',exact:true}).waitFor();
    await page.getByRole('button',{name:'Route',exact:true}).click();await page.getByRole('button',{name:'Return to preparation',exact:true}).waitFor();row.reloadRestoredRoute=true;
   }
   row.complete=!row.blockedWrites.length;
  }catch(error){row.failure=String(error.message).slice(0,1500);row.visibleText=(await page.locator('body').innerText()).slice(0,2500);}
  finally{inject=false;release();await context.close();save();}
  console.log(JSON.stringify({mode,complete:row.complete,recoveryMs:row.recoveryMs,failure:row.failure}));if(!row.complete)break;
 }
}finally{await browser.close();report.complete=report.rows.length===2&&report.rows.every(row=>row.complete);save();}
process.exitCode=report.complete?0:1;
