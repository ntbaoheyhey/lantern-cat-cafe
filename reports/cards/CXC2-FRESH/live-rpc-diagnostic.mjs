import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
const root='/private/tmp/tbh-main-after-cxc2'; const { chromium }=createRequire(root+'/apps/web/package.json')('@playwright/test');
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});const page=await context.newPage();const reads=[];
await context.route('**/*',async route=>{
 const req=route.request();if(['GET','HEAD','OPTIONS'].includes(req.method()))return route.continue();
 let batch=[];try{const raw=req.postDataJSON();batch=Array.isArray(raw)?raw:[raw];}catch{}
 for(const r of batch){const p=r?.params??[],c=p[0];reads.push({method:r?.method,keys:r&&typeof r==='object'?Object.keys(r):[],paramCount:p.length,firstType:typeof c,callKeys:c&&typeof c==='object'&&!Array.isArray(c)?Object.keys(c):[],to:typeof c?.to==='string'&&/^0x[0-9a-f]{40}$/i.test(c.to)?c.to:null,selector:typeof c?.data==='string'?c.data.slice(0,10):null,dataLength:typeof c?.data==='string'?c.data.length:null,blockTag:typeof p[1]==='string'&&/^(?:0x[0-9a-f]+|latest)$/i.test(p[1])?p[1]:typeof p[1]});}
 if(req.method()==='POST'&&batch.length&&batch.every(r=>['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_getLogs'].includes(r.method)))return route.continue();
 await route.abort();
});
try{
 await page.goto('https://taskbarhero-eight.vercel.app/',{waitUntil:'domcontentloaded'});
 const help=page.getByRole('dialog',{name:'How to play',exact:true});if(await help.isVisible())await page.getByRole('button',{name:'Close help',exact:true}).click();
 await page.getByTestId('class-card-warrior').click();await page.getByTestId('class-picker-choose-button').click();await page.getByTestId('class-picker-confirm-button').click();
 await page.getByRole('tab',{name:'Help',exact:true}).click();await page.getByRole('tab',{name:'On-chain proof',exact:true}).click();
 await page.getByTestId('proof-snapshot').waitFor({state:'visible',timeout:30000});
 await writeFile('/private/tmp/tbh-t001-ledger/reports/cards/CXC2-FRESH/live/rpc-request-shapes.json',JSON.stringify({scope:'Diagnostic only; all eth_call requests aborted; no signing or transaction method permitted',reads},null,2)+'\n');
 console.log(JSON.stringify({callShapes:reads.filter(r=>r.method==='eth_call')}));
}finally{await browser.close();}
