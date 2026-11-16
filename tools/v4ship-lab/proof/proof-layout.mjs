/** Synthetic DOM isolates CSS geometry; never counts as transaction or funnel evidence. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {proofContrast} from './proof-contrast.mjs';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true});
const report={at:new Date().toISOString(),method:'Synthetic DOM with production styles, no chain receipts or funnel claims.',rows:[],pass:false};
try{
 for(const width of [1280,1440]){
  const page=await browser.newPage({viewport:{width,height:width===1280?720:900}});
  await page.goto('http://127.0.0.1:5994/?demo=1&squad=1&cardrpg2=1&a6=1&dev=1');
  await page.getByRole('button',{name:'Play free',exact:true}).click();await page.getByRole('button',{name:'Start trial',exact:true}).waitFor();
  await page.evaluate(()=>{
   const main=document.querySelector('.ship-journey');
   main.innerHTML='<section class="ship-wallet-proof ship-trial-card"><h1>Layout diagnostic</h1><p>Diagnostic text only.</p><a href="#diagnostic">Diagnostic wallet link</a><strong>Diagnostic balance</strong><div class="ship-proof-columns"><section><h2>Items</h2><ul><li><a href="#diagnostic">Diagnostic item</a></li></ul></section><section><h2>Transactions</h2><ol>'+Array.from({length:15},(_,i)=>'<li><a href="#diagnostic">Diagnostic row '+(i+1)+'</a></li>').join('')+'</ol></section></div><button>Diagnostic refresh</button><small><a href="#diagnostic">Diagnostic attribution</a></small></section>';
   const toast=document.createElement('aside');toast.className='ship-receipt-toast';toast.innerHTML='<button aria-label="Diagnostic dismiss">×</button><strong>Layout diagnostic</strong><small>Diagnostic sponsorship label</small><a href="#diagnostic">Diagnostic receipt link</a>';main.parentElement.append(toast);
  });
  const geometry=await page.evaluate(()=>{
   const box=selector=>document.querySelector(selector).getBoundingClientRect();
   const wallet=box('.ship-wallet-proof>a'),balance=box('.ship-wallet-proof>strong'),columns=box('.ship-proof-columns'),refresh=box('.ship-wallet-proof>button'),credit=box('.ship-wallet-proof>small');
   const button=document.querySelector('.ship-receipt-toast>button');
   return {walletBeforeBalance:wallet.bottom<=balance.top,balanceBeforeColumns:balance.bottom<=columns.top,refreshBeforeAttribution:refresh.bottom<=credit.top,contentFitsViewport:credit.bottom<=innerHeight,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,dismissClipped:button.scrollWidth>button.clientWidth||button.scrollHeight>button.clientHeight};
  });
  const normal=await proofContrast(page);await page.getByRole('button',{name:'Diagnostic dismiss'}).hover();await page.waitForTimeout(200);const hoverDismiss=await proofContrast(page);
  await page.getByRole('button',{name:'Diagnostic refresh'}).hover();await page.waitForTimeout(200);const hoverRefresh=await proofContrast(page);
  const row={width,geometry,normal,hoverDismiss,hoverRefresh};report.rows.push(row);
  assert(geometry.walletBeforeBalance&&geometry.balanceBeforeColumns&&geometry.refreshBeforeAttribution&&geometry.contentFitsViewport&&!geometry.horizontalOverflow&&!geometry.dismissClipped);
  for(const rows of [normal,hoverDismiss,hoverRefresh])assert(rows.length>0&&rows.every(r=>r.pass));
  await page.close();
 }
 report.pass=true;console.log('Both desktop sizes pass CSS geometry and default/hover proof-text contrast.');
}catch(error){report.failure=String(error.message).slice(0,200);process.exitCode=1;console.log('CSS diagnostic failed; evidence recorded.');}
finally{writeFileSync(resolve(root,'reports/v4-ship/S4/proof-layout.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
