/** Desktop judge journey through ordinary controls, with a fresh browser and cache disabled. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a fresh evidence label');
for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
const out=resolve(root,'work/v5/CXI/journey',label);assert(!existsSync(out),'Preserve earlier evidence');mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),indexSha256=hash(readFileSync(resolve(root,'apps/web/dist/index.html')));
assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),indexSha256,'Preview differs from current build');
const req=createRequire(resolve(root,'apps/web/package.json')),{chromium}=req('@playwright/test');
const report={url,utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),indexSha256,viewport:{width:1280,height:720},scope:'Cold frontend guest play through ordinary controls to encounter rewards; public transaction proof is a separate owner-run step.',steps:[],errors:[],httpFailures:[],blocked:[],complete:false};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
let page;
try{
 const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'});page=await context.newPage();
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)report.httpFailures.push({url:response.url(),status:response.status()});});
 await page.route('**/*',route=>{
  const request=route.request(),target=new URL(request.url());
  if(request.method()!=='POST')return route.continue();
  if(target.origin===new URL(url).origin){report.blocked.push(target.pathname);return route.abort();}
  const body=request.postDataJSON(),calls=Array.isArray(body)?body:[body];
  if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&calls.every(call=>/^eth_(chainId|blockNumber|getBalance|call|getCode|getTransactionCount|getBlockByNumber|getBlockByHash|getLogs|getTransactionReceipt)$|^net_version$/.test(call?.method)))return route.continue();
  report.blocked.push(target.origin+target.pathname);return route.abort();
 });
 const start=performance.now(),step=name=>report.steps.push({name,ms:Math.round(performance.now()-start)});
 const completeTutorial=async()=>{
  const tutorial=page.getByRole('dialog',{name:'Tutorial',exact:true});
  await tutorial.waitFor({timeout:5000});
  for(let lesson=0;lesson<12&&await tutorial.isVisible();lesson++){
   const instruction=await tutorial.locator('p').innerText();
   await tutorial.getByRole('button',{name:/^(Next|Got it)$/}).click();step('tutorial: '+instruction);
  }
  assert(!await tutorial.isVisible(),'Visible tutorial did not finish');
 };
 const remaining=()=>Math.max(1,90_000-(performance.now()-start));
 await page.goto(url);await page.getByRole('button',{name:'Play free',exact:true}).click();step('guest entered');
 await page.locator('.uv-patrol').click();step('prepare opened');
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.locator('.dp-battle').waitFor();step('battle visible');
 await completeTutorial();
 await page.getByRole('button',{name:'Complete lesson',exact:true}).waitFor({timeout:remaining()});step('practice completed');
 report.practice={ms:Math.round(performance.now()-start),text:await page.locator('[data-practice-receipt="true"]').innerText(),scope:'Practice completion and free invitation availability; no currency or blockchain transaction claimed.'};
 assert.match(report.practice.text,/Practice complete.*free invitation/s);
 await page.screenshot({path:resolve(out,'practice.png')});
 await page.getByRole('button',{name:'Complete lesson',exact:true}).click();await completeTutorial();
 await page.getByRole('group',{name:'Free welcome',exact:true}).getByRole('button',{name:'Welcome',exact:true}).click();
 await page.getByRole('heading',{name:'Welcome home',exact:true}).waitFor({timeout:remaining()});step('free friend welcomed');
 await page.locator('.uv-sheet-heading').getByRole('button',{name:'Close',exact:true}).click();
 await page.locator('.uv-patrol').click();
 await page.getByRole('button',{name:'Fight',exact:true}).click();step('patrol battle started');
 const speed=page.getByRole('button',{name:'Change playback speed',exact:true});
 await speed.click();await speed.click();assert.equal(await speed.innerText(),'×3');step('selected visible 3x patrol playback');report.playback=3;
 await page.locator('.a6-result-receipt [data-reward-id]').first().waitFor({timeout:remaining()});step('patrol rewards visible');
 report.totalMs=Math.round(performance.now()-start);report.receiptText=await page.locator('.a6-result-receipt').innerText();
 report.rewards=await page.locator('.a6-result-receipt [data-reward-id]').evaluateAll(nodes=>nodes.map(node=>({id:node.dataset.rewardId,label:node.getAttribute('aria-label'),text:node.textContent})));
 report.outcome=await page.locator('.a6-result-story').getAttribute('data-outcome');
 await page.screenshot({path:resolve(out,'result.png')});
 report.complete=report.rewards.length>0&&report.outcome==='party'&&!report.errors.length&&!report.httpFailures.length&&!report.blocked.length;
 report.budgetPass=report.complete&&report.totalMs<30_000;
 await context.close();
}catch(error){report.failure=String(error.message).slice(0,1000);if(page&&!page.isClosed()){report.visibleText=(await page.locator('body').innerText()).slice(0,8000);const sharp=req('sharp');await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(resolve(out,'failure.jpg'));}}
finally{await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
assert(report.complete,'Desktop judge journey did not meet the requested result; inspect the saved evidence');
