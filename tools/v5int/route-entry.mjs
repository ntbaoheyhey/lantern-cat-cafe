/** Desktop route detour through ordinary controls, with a fresh browser and cache disabled. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a fresh evidence label');
for(const name of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+name),'STOP: '+name);
const out=resolve(root,'work/v5/CXI/route',label);assert(!existsSync(out),'Preserve earlier evidence');mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex'),indexSha256=hash(readFileSync(resolve(root,'apps/web/dist/index.html')));
assert.equal(hash(Buffer.from(await (await fetch(url)).arrayBuffer())),indexSha256,'Preview differs from current build');
const req=createRequire(resolve(root,'apps/web/package.json')),{chromium}=req('@playwright/test');
const report={url,utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),indexSha256,viewport:{width:1280,height:720},scope:'Cold desktop practice-route detour, return to preparation, battle and invitation receipt. No patrol reward or public transaction claimed.',steps:[],errors:[],httpFailures:[],blocked:[],complete:false};
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
 await page.goto(url);await page.getByRole('button',{name:'Play free',exact:true}).click();
 await page.locator('.uv-patrol').click();
 await page.getByRole('button',{name:'Route',exact:true}).click();
 await page.locator('[aria-label="Practice route"],[aria-label="Choose a chapter"]').first().waitFor();step('route menu visible');
 report.menu=await page.locator('.uv-sheet-content').innerText();
 report.buttons=await page.locator('.uv-sheet-content button').evaluateAll(nodes=>nodes.map(n=>({name:n.getAttribute('aria-label')||n.innerText,disabled:n.disabled})));
 const sharp=req('sharp');await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(resolve(out,'menu-1024.jpg'));
 const next=page.getByRole('button',{name:'Return to preparation',exact:true});
 if(await next.count())await next.click();else await page.getByRole('button',{name:/^Chapter 1 .*Open$/}).click();
 const openNode=page.locator('.a6-scenic-stop:not(:disabled)');
 if(await openNode.count())await openNode.first().click();
 await page.getByRole('button',{name:'Fight',exact:true}).waitFor({timeout:5000});step('fight available');
 await page.getByRole('button',{name:'Fight',exact:true}).click();await page.locator('.dp-battle').waitFor({timeout:5000});step('battle visible');
 const tutorial=page.getByRole('dialog',{name:'Tutorial',exact:true});await tutorial.waitFor();
 for(let i=0;i<12&&await tutorial.isVisible();i++)await tutorial.getByRole('button',{name:/^(Next|Got it)$/}).click();
 await page.getByRole('button',{name:'Complete lesson',exact:true}).waitFor({timeout:30000});step('practice receipt visible');
 report.receipt=await page.locator('[data-practice-receipt="true"]').innerText();assert.match(report.receipt,/Practice complete.*free invitation/s);
 const deployment=page.getByRole('complementary',{name:'Avalanche deployment',exact:true});report.deployment={text:await deployment.innerText(),url:await deployment.getByRole('link').getAttribute('href')};
 assert.match(report.deployment.text,/Local battle.*no transaction sent/s);assert.match(report.deployment.url,/^https:\/\/testnet\.snowtrace\.io\/address\/0x[a-fA-F0-9]{40}$/);
 await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(resolve(out,'receipt-1024.jpg'));
 report.complete=!report.errors.length&&!report.httpFailures.length&&!report.blocked.length;
 await context.close();
}catch(error){report.failure=String(error.message).slice(0,1000);if(page&&!page.isClosed()){report.visibleText=(await page.locator('body').innerText()).slice(0,4000);const sharp=req('sharp');await sharp(await page.screenshot()).resize({width:1024}).jpeg({quality:82}).toFile(resolve(out,'failure-1024.jpg'));}}
finally{await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({complete:report.complete,steps:report.steps,errors:report.errors,failure:report.failure}));process.exitCode=report.complete?0:1;
