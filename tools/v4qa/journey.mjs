/** Independent visible-UI journey. No product state mutation, saved auth, or wallet export. */
import {createRequire} from 'node:module';
import {mkdirSync,existsSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadavg} from 'node:os';

const qa=resolve(import.meta.dirname,'../..');
const source='/Users/bao/taskbar-hero-qa-clone';
const require=createRequire(resolve(source,'apps/web/package.json'));
const {chromium}=require('playwright');
const {decodeFunctionData,parseEther}=require('viem');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const publicUrl=url=>{try{const u=new URL(url);return u.origin+u.pathname;}catch{return 'invalid-url';}};
const safeError=e=>String(e?.message??e).replace(/0x[0-9a-f]{64}/gi,'[64hex omitted]').replace(/Bearer\s+\S+/gi,'Bearer [omitted]').slice(0,500);
const readMethods=new Set(['eth_chainId','eth_blockNumber','eth_call','eth_getBalance','eth_getCode','eth_getLogs','eth_getTransactionByHash','eth_getTransactionReceipt','eth_getTransactionCount','eth_gasPrice','eth_feeHistory','eth_estimateGas','eth_getBlockByNumber','eth_getBlockByHash','net_version','web3_clientVersion']);

export async function checkExplorer(url,{local=false,fetcher=fetch}={}){
  let u;try{u=new URL(url);}catch{return {url,status:'FAIL',reason:'invalid URL'};}
  const hash=u.pathname.match(/^\/tx\/(0x[0-9a-f]{64})\/?$/i)?.[1];
  if(!hash||!['testnet.snowtrace.io','c.testnet.snowtrace.io','43113.snowtrace.io'].includes(u.hostname))return {url:publicUrl(url),status:'FAIL',reason:'wrong Fuji transaction URL'};
  if(local)return {url,status:'LOCAL_ONLY',hash,reason:'Anvil hash is not public Fuji proof; public resolution not claimed'};
  const result={url,hash,status:'FAIL',method:'Routescan public receipt API with browser-page HTTP observation'};
  const page=await fetcher(url,{signal:AbortSignal.timeout(15000)}).catch(()=>null);
  result.pageHttp=page?.status??null;
  const endpoint=`https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api?module=proxy&action=eth_getTransactionReceipt&txhash=${hash}`;
  const response=await fetcher(endpoint,{signal:AbortSignal.timeout(15000)}).catch(()=>null);
  result.apiHttp=response?.status??null;
  const data=await response?.json().catch(()=>null);
  const receipt=data?.result;
  result.apiReceiptMatches=receipt?.transactionHash?.toLowerCase()===hash.toLowerCase()&&receipt?.status==='0x1';
  if(result.apiReceiptMatches)result.status=page?.ok?'API_PROOF_PASS_PAGE_HTTP_OK':'API_PROOF_PASS_PAGE_UNVERIFIED';
  return result;
}

async function layout(page,label){
  return page.evaluate(label=>{
    const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[inert],[aria-hidden="true"]');};
    const candidates=[...document.querySelectorAll('button,a,input,h1,h2,p,dt,dd,figcaption')].filter(visible);
    return {label,viewport:{width:innerWidth,height:innerHeight},pageWidth:document.documentElement.scrollWidth,overflowX:document.documentElement.scrollWidth>innerWidth+2,clipped:candidates.filter(e=>{const r=e.getBoundingClientRect();return r.left< -2||r.right>innerWidth+2;}).slice(0,20).map(e=>({tag:e.tagName,text:(e.innerText??e.getAttribute('aria-label')??'').trim().slice(0,100),left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right)})),alerts:[...document.querySelectorAll('[role="alert"]')].filter(visible).map(e=>e.innerText.slice(0,200)),nonEnglish:[...new Set((document.body.innerText.match(/[\u3040-\u30ff\u3400-\u9fff][^\n]{0,40}/g)??[]))].slice(0,10)};
  },label);
}

async function keyboardPrimary(page,name){
  for(let i=0;i<30;i++){
    await page.keyboard.press('Tab');
    const current=await page.evaluate(()=>({tag:document.activeElement?.tagName,text:document.activeElement?.textContent?.trim(),label:document.activeElement?.getAttribute('aria-label')}));
    if(current.tag==='BUTTON'&&(current.text===name||current.label===name))return {name,reachable:true,tabs:i+1};
  }
  return {name,reachable:false,tabs:30};
}

async function verifyReceipts(rows,build){
  const rpc=async(method,params)=>(await (await fetch('http://127.0.0.1:6202',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})})).json()).result;
  const addresses=new Map(Object.entries(build.contracts??{}).filter(([,v])=>typeof v==='string'&&/^0x[0-9a-f]{40}$/i.test(v)).map(([name,address])=>[address.toLowerCase(),name]));
  for(const row of rows){
    const [receipt,tx]=await Promise.all([rpc('eth_getTransactionReceipt',[row.hash]),rpc('eth_getTransactionByHash',[row.hash])]);
    row.verification={success:receipt?.status==='0x1',payerMatches:receipt?.from?.toLowerCase()===row.payer?.toLowerCase(),feeMatches:false,contract:addresses.get(tx?.to?.toLowerCase())??'unknown',functionName:null};
    if(receipt?.gasUsed&&receipt?.effectiveGasPrice&&typeof row.feeAvax==='string')row.verification.feeMatches=BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice)===parseEther(row.feeAvax);
    try{const name=row.verification.contract;const abi=JSON.parse(readFileSync(resolve(source,`contracts/out/${name}.sol/${name}.json`),'utf8')).abi;row.verification.functionName=decodeFunctionData({abi,data:tx.input}).functionName;}catch{/* Native transfers or unknown artifact remain explicit. */}
  }
}

export async function runJourneys({url,viewports=[{width:1440,height:900},{width:1280,height:720},{width:390,height:844}],runs=1,allowGuestTx=false,label='q1-cold-1',buildPath=resolve(qa,'reports/v4-qa/Q1/build-1.json'),reportRoot=resolve(qa,'reports/v4-qa/Q1'),capture=true,guardLoad=true}={}){
  if(!/^[a-z0-9-]+$/i.test(label))throw Error('Safe unique label required');
  const target=new URL(url);const local=['127.0.0.1','localhost'].includes(target.hostname);
  if(local&&!['6200','6203'].includes(target.port))throw Error('Only owned QA preview ports allowed');
  if(!['http:','https:'].includes(target.protocol))throw Error('HTTP URL required');
  if(!local&&target.protocol!=='https:')throw Error('Public URL must use HTTPS');
  const dir=resolve(reportRoot,label),raw=resolve(qa,'work/v4qa',label);
  if(existsSync(dir)||existsSync(raw))throw Error('Never overwrite earlier run evidence');
  mkdirSync(dir,{recursive:true});mkdirSync(raw,{recursive:true});
  const build=local?JSON.parse(readFileSync(buildPath,'utf8')):null;
  const report={started:new Date().toISOString(),url:target.href,label,sourceSha:build?.sourceSha??'live-unattested',mode:allowGuestTx?'product guest transactions':'read-only',local,timingScope:'shared-machine, indicative',runs:[],screenshots:0};
  const save=()=>writeFileSync(resolve(dir,'results.json'),JSON.stringify(report,null,2)+'\n');save();
  let browser;
  try{
    for(let n=0;n<runs;n++)for(const viewport of viewports){
      if(existsSync(resolve(qa,'STOP-V4QA')))throw Error('STOP-V4QA');
      if(guardLoad)while(loadavg()[0]>9){console.log(`DEFER browser ${viewport.width} load1=${loadavg()[0].toFixed(2)}`);await sleep(300000);}
      if(!browser)browser=await chromium.launch({headless:true});
      const runId=`${n+1}-${viewport.width}x${viewport.height}`;
      const row={id:runId,viewport,started:new Date().toISOString(),clicks:0,errors:[],failedRequests:[],blockedRequests:[],steps:[],layouts:[],focus:[],receipts:[],renderedReceipts:[],explorer:[],requests:[],assertions:[],skipped:[]};report.runs.push(row);save();
      let isolated=false;const began=Date.now();
      const context=await browser.newContext({viewport,locale:'en-US',reducedMotion:'no-preference',recordVideo:capture?{dir:resolve(raw,'videos'),size:viewport}:undefined});
      const page=await context.newPage();page.setDefaultTimeout(45000);
      const shot=async(stage)=>{
        if(!capture||report.screenshots>=12)return;
        const bytes=await page.screenshot({type:'jpeg',quality:55,fullPage:false,timeout:15000});
        if(bytes.length<=200000){const name=`${runId}-${stage}.jpg`;writeFileSync(resolve(dir,name),bytes);(row.screenshots??=[]).push(name);report.screenshots++;}
        else{const name=`${runId}-${stage}.jpg`;writeFileSync(resolve(raw,name),bytes);(row.largeScreenshots??=[]).push({path:resolve(raw,name),bytes:bytes.length});}
      };
      const mark=(name,pass,detail)=>row.assertions.push({name,pass,...detail});
      const click=async(name)=>{const button=page.getByRole('button',{name,exact:true});await button.waitFor({state:'visible'});await button.click();row.clicks++;row.steps.push({name,atMs:Date.now()-began});};
      const fixture=async action=>{const r=await fetch(`http://127.0.0.1:6201/__fixture/${action}`,{method:'POST'});if(!r.ok)throw Error(`Local isolation ${action} HTTP${r.status}`);};
      try{
        if(local&&allowGuestTx){await fixture('begin');isolated=true;}
        await context.route('**/*',async route=>{
          const request=route.request(),u=new URL(request.url());let permit=false;
          if(['data:','blob:'].includes(u.protocol))permit=true;
          else if(local)permit=(['127.0.0.1','localhost'].includes(u.hostname)&&['6200','6201','6202','6203'].includes(u.port))||(request.method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname));
          else if(['GET','HEAD','OPTIONS'].includes(request.method()))permit=true;
          else if(allowGuestTx)permit=true;
          else{try{const data=request.postDataJSON();const batch=Array.isArray(data)?data:[data];permit=batch.every(x=>readMethods.has(x.method));}catch{permit=false;}}
          if(!permit){row.blockedRequests.push({url:publicUrl(request.url()),method:request.method()});await route.abort();}else await route.continue();
        });
        await page.addInitScript(()=>{
          window.__v4qaReceipts=[];window.__v4qaRendered=[];
          addEventListener('chain:receipt',event=>{const p=event.detail;window.__v4qaReceipts.push({hash:p.hash,wallet:p.wallet,payer:p.payer,action:p.action,feeAvax:p.feeAvax,confirmationMs:p.confirmationMs,local:p.local,observedAt:performance.now()});});
          const observer=new MutationObserver(()=>{const e=document.querySelector('[data-receipt-hash]');if(!e)return;const hash=e.getAttribute('data-receipt-hash');if(window.__v4qaRendered.some(r=>r.hash===hash))return;const rect=e.getBoundingClientRect();window.__v4qaRendered.push({hash,text:e.innerText,href:e.querySelector('a')?.href,payerTitle:e.querySelector('[title]')?.getAttribute('title'),visible:rect.width>0&&rect.height>0,withinViewport:rect.left>=0&&rect.right<=innerWidth+2&&rect.top>=0&&rect.bottom<=innerHeight+2});});observer.observe(document,{subtree:true,childList:true,attributes:true});
        });
        page.on('pageerror',e=>row.errors.push({kind:'page',message:safeError(e)}));
        page.on('console',m=>{if(m.type()==='error')row.errors.push({kind:'console',message:safeError(m.text())});});
        page.on('response',r=>{if(r.status()>=400)row.failedRequests.push({status:r.status(),url:publicUrl(r.url())});});
        page.on('requestfailed',r=>row.failedRequests.push({url:publicUrl(r.url()),error:r.failure()?.errorText}));
        const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
        const network=new Map();cdp.on('Network.responseReceived',e=>network.set(e.requestId,{url:publicUrl(e.response.url),type:e.type,status:e.response.status,cached:!!e.response.fromDiskCache,mime:e.response.mimeType}));
        cdp.on('Network.loadingFinished',e=>{const r=network.get(e.requestId);if(r)row.requests.push({...r,bytes:e.encodedDataLength,atMs:Date.now()-began});});
        const demo=new URL(target);if(!demo.search)demo.search='?demo=1&squad=1&cardrpg2=1&a6=1';
        if(demo.searchParams.has('dev'))throw Error('Development route not permitted');
        await page.goto(demo.href,{waitUntil:'domcontentloaded',timeout:60000});
        await page.getByRole('button',{name:'Play free',exact:true}).waitFor();
        row.layouts.push(await layout(page,'landing'));row.focus.push(await keyboardPrimary(page,'Play free'));await shot('landing');
        if(!allowGuestTx){
          row.skipped.push('Guest entry and dependent battle/receipts require product wallet/funding operations; read-only run does not claim a full demo PASS.');
          row.explorer=await Promise.all((await page.locator('a[href*="snowtrace.io/tx/"]').evaluateAll(es=>[...new Set(es.map(e=>e.href))])).map(href=>checkExplorer(href,{local})));
          mark('landing_visible',true);mark('landing_no_horizontal_overflow',!row.layouts[0].overflowX);mark('play_free_keyboard_reachable',row.focus[0].reachable);
          row.verdict=row.errors.length||row.failedRequests.length||row.assertions.some(a=>!a.pass)?'FAIL':'READ_ONLY_PASS';
        }else{
          await click('Play free');await page.getByRole('button',{name:'Start trial',exact:true}).waitFor();
          row.focus.push(await keyboardPrimary(page,'Start trial'));row.layouts.push(await layout(page,'trial-intro'));
          await click('Start trial');await page.locator('.dp-battle:not(.dp-hidden)').waitFor({state:'visible',timeout:60000});
          row.firstBattleMs=Date.now()-began;row.firstBattleClicks=row.clicks;
          row.assetReadiness=await page.locator('.dp-battle:not(.dp-hidden)').evaluate(e=>{const imgs=[...e.querySelectorAll('img')];return {images:imgs.length,ready:imgs.filter(x=>x.complete&&x.naturalWidth>0).length};});
          row.transferAtBattle={bytes:row.requests.reduce((s,r)=>s+r.bytes,0),top10:[...row.requests].sort((a,b)=>b.bytes-a.bytes).slice(0,10),measurement:'CDP loadingFinished encodedDataLength by first visible battle; incomplete in-flight responses separately listed'};
          row.inFlightAtBattle=[...network.values()].filter(r=>!row.requests.some(x=>x.url===r.url)).map(r=>r.url).slice(0,20);
          await shot('battle');row.layouts.push(await layout(page,'battle'));
          await page.getByRole('button',{name:'Mint trial reward',exact:true}).waitFor({state:'visible',timeout:180000});
          await click('Mint trial reward');await page.getByRole('button',{name:'Fund workshop',exact:true}).waitFor({timeout:90000});row.firstReceiptMs=Date.now()-began;
          row.layouts.push(await layout(page,'first-receipt'));await shot('first-receipt');
          for(const name of ['Fund workshop','Seal Epic','Forge Legendary','List for 5 YARN','Buy with demo wallet','Withdraw Spool']){
            await click(name);await page.waitForFunction(name=>{const e=[...document.querySelectorAll('.ship-workshop button')].find(e=>e.textContent?.trim()===name);return !e;},name,{timeout:90000});
            row.layouts.push(await layout(page,name));save();
          }
          await click('Face the boss');await page.getByRole('heading',{name:'My café on Avalanche',exact:true}).waitFor({timeout:180000});
          row.layouts.push(await layout(page,'wallet-proof'));await shot('wallet-proof');
          row.receipts=await page.evaluate(()=>window.__v4qaReceipts);row.renderedReceipts=await page.evaluate(()=>window.__v4qaRendered);
          if(local)await verifyReceipts(row.receipts,build);
          const links=[...new Set([...row.renderedReceipts.map(r=>r.href).filter(Boolean),...await page.locator('a[href*="snowtrace.io/tx/"]').evaluateAll(es=>es.map(e=>e.href))])];
          for(const href of links)row.explorer.push(await checkExplorer(href,{local}));
          row.actionTypes=[...new Set(row.receipts.map(r=>r.verification?`${r.verification.contract}.${r.verification.functionName??r.action}`:r.action))];
          mark('first_battle_within_30s',row.firstBattleMs<=30000,{indicative:true});mark('first_receipt_within_180s',row.firstReceiptMs<=180000,{indicative:true});mark('first_battle_at_most_3clicks',row.firstBattleClicks<=3);
          mark('seven_step_journey_complete',true);mark('at_least_5_action_types',row.actionTypes.length>=5);
          mark('receipts_success_fee_payer',row.receipts.length>0&&row.receipts.every(r=>r.verification?r.verification.success&&r.verification.feeMatches&&r.verification.payerMatches:true));
          mark('receipt_event_fields',row.receipts.length>0&&row.receipts.every(r=>r.confirmationMs!==null&&r.confirmationMs>=0&&r.feeAvax!==undefined&&/^0x[0-9a-f]{40}$/i.test(r.payer)));
          mark('every_receipt_visibly_labeled',row.receipts.every(r=>row.renderedReceipts.some(v=>v.hash===r.hash&&v.visible&&/Confirmed/.test(v.text)&&/Fee/.test(v.text)&&/paid gas/.test(v.text)&&v.payerTitle?.includes(r.payer)&&v.href?.endsWith(r.hash))));
          mark('no_horizontal_overflow',row.layouts.every(r=>!r.overflowX&&r.clipped.length===0));mark('primary_keyboard_access',row.focus.every(r=>r.reachable));
          mark('cold_visible_battle_transfer_under_8MB',row.transferAtBattle.bytes<=8_000_000,{inFlight:row.inFlightAtBattle.length});
          mark('public_explorer_proof',local?null:row.explorer.every(e=>e.apiReceiptMatches),{scope:local?'unverified on public chain; local hashes excluded':'public Fuji'});
          row.verdict=row.assertions.some(a=>a.pass===false)||row.errors.length||row.failedRequests.length?'FAIL':'PASS_LOCAL_ONLY';
        }
      }catch(error){
        row.failure=safeError(error);row.verdict='FAIL';
        row.receipts=await page.evaluate(()=>window.__v4qaReceipts??[]).catch(()=>[]);row.renderedReceipts=await page.evaluate(()=>window.__v4qaRendered??[]).catch(()=>[]);
        row.lastLayout=await layout(page,'failure').catch(()=>null);await shot('failure').catch(()=>{});
      }finally{
        row.elapsedMs=Date.now()-began;row.ended=new Date().toISOString();
        const video=page.video();await context.close();if(video)row.video=await video.path();
        if(isolated)await fixture('rollback');save();console.log(`${runId} ${row.verdict} steps=${row.steps.length} receipts=${row.receipts.length}`);
      }
    }
  }finally{await browser?.close();report.ended=new Date().toISOString();save();}
  const md=['# Independent QA journey results',`Source: ${report.sourceSha}; mode: ${report.mode}; ${report.timingScope}.`,'','| Run | Verdict | Battle ms | Receipt ms | Clicks | Errors | HTTP/network failures |','|---|---|---:|---:|---:|---:|---:|',...report.runs.map(r=>`| ${r.id} | ${r.verdict} | ${r.firstBattleMs??'not reached'} | ${r.firstReceiptMs??'not reached'} | ${r.clicks} | ${r.errors.length} | ${r.failedRequests.length} |`),'','Read-only runs omit wallet/funding-dependent actions. Local Anvil receipts are not public Fuji evidence.','See results.json for assertions, visual bounds, decoded contract actions, proof and cold-network requests.'];
  writeFileSync(resolve(dir,'RESULTS.md'),md.join('\n')+'\n');return {report,dir};
}
