import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const out=`reports/v3-shell/b2/q8/${process.argv[2]??'live-final'}`;mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true}),raw=[],pending=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('response',r=>{if(r.url()==='https://api.avax-test.network/ext/bc/C/rpc')pending.push((async()=>{raw.push({at:new Date().toISOString(),request:r.request().postDataJSON(),status:r.status(),response:await r.json()});})().catch(e=>raw.push({error:e.message})));});
 page.on('requestfailed',r=>{if(r.url()==='https://api.avax-test.network/ext/bc/C/rpc')raw.push({at:new Date().toISOString(),request:r.postDataJSON(),failure:r.failure()});});
 await page.goto('http://127.0.0.1:5995/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1');
 await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
 await page.locator('[aria-label="Live Fuji counters"][aria-busy="false"]').waitFor({timeout:180000});
 const result=await page.evaluate(async()=>{
  const {COUNTER_POLICY:policy}=await import('/src/game/cardrpg/shell/LiveCounters.tsx');
  const stats={reasons:{},links:{}};
  for(const el of document.querySelectorAll('[data-counter]')){
   const key=el.dataset.counter,text=el.querySelector('strong').textContent;
   if(text!=='Offline')stats[key]=text.split(' / ')[0];
   else stats.reasons[key]=el.querySelector('a').title;
   stats.links[key]=el.querySelector('a').href;
   if(key==='transactions')stats.transactionScope=el.querySelector('small').textContent;
  }
  return {stats,policy};
 });
 await page.screenshot({path:`${out}/live-fuji.png`});await Promise.all(pending);
 writeFileSync(`${out}/live-fuji-rpc.json`,JSON.stringify({chainId:43113,readOnly:true,requests:raw},null,2)+'\n');
 const signed=path=>({path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')});
 const counters=['deeds','burned','fused','transactions'].map(id=>({id,value:result.stats[id]===undefined?null:Number(String(result.stats[id]).replaceAll(',','')),source:'fuji-rpc',chainId:43113,rawRpc:signed(`${out}/live-fuji-rpc.json`),reason:result.stats.reasons?.[id]}));
 writeFileSync(`${out}/live-fuji-result.json`,JSON.stringify({at:new Date().toISOString(),...result,counters,screenshot:signed(`${out}/live-fuji.png`)},null,2)+'\n');
 console.log(JSON.stringify({stats:result.stats,requests:raw.length,numeric:counters.filter(r=>r.value!==null).length}));
 assert(counters.filter(r=>r.value!==null).length>=3);
 const calls=raw.flatMap(r=>Array.isArray(r.request)?r.request:[r.request]).filter(Boolean);
 assert(calls.every(r=>!r.method.startsWith('eth_send')));for(const r of calls.filter(r=>r.method==='eth_getLogs'))assert(BigInt(r.params[0].toBlock)-BigInt(r.params[0].fromBlock)<=99n);
 for(const request of raw){const pages=[request.request].flat().filter(r=>r?.method==='eth_getLogs');assert(pages.reduce((n,r)=>n+BigInt(r.params[0].toBlock)-BigInt(r.params[0].fromBlock)+1n,0n)<=100n);}
}finally{await browser.close();}
