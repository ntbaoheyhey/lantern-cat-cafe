import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const [root, head, proofPath, out] = process.argv.slice(2); assert.ok(root && head && proofPath && out);
const site='https://taskbarhero-eight.vercel.app/';
const proof=JSON.parse(await readFile(proofPath,'utf8'));
assert.equal(proof.status,'ARTIFACT_MATCH');assert.equal(proof.expectedHead,head);
assert.equal(execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),head);
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),'');
const {chromium,expect}=createRequire(root+'/apps/web/package.json')('@playwright/test');
const {getFunctionSelector,decodeFunctionData,encodeFunctionData,multicall3Abi}=createRequire(root+'/apps/web/package.json')('viem');
const nft='0xb1a1edb7a75db6e7067e747ddee32b39c2296f2d',market='0x10fcc46e439d3e31fb1720b337c45cadb9b2ff93';
const selectors=[getFunctionSelector('relicNFT()'),getFunctionSelector('activeListingCount()')];
const multicall='0xca11bde05977b3631167028862be2a173976ca11';
function allowedCall(c){
 if(!c||typeof c.to!=='string'||typeof c.data!=='string'||!Object.keys(c).every(k=>['to','data'].includes(k)))return false;
 if(c.to.toLowerCase()===market)return selectors.includes(c.data);
 if(c.to.toLowerCase()!==multicall)return false;
 try{const decoded=decodeFunctionData({abi:multicall3Abi,data:c.data});if(decoded.functionName!=='aggregate3')return false;const calls=decoded.args[0];
 return calls.length===2&&new Set(calls.map(x=>x.callData)).size===2&&calls.every(x=>x.target.toLowerCase()===market&&selectors.includes(x.callData)&&typeof x.allowFailure==='boolean')&&encodeFunctionData({abi:multicall3Abi,functionName:'aggregate3',args:[calls]}).toLowerCase()===c.data.toLowerCase();
 }catch{return false;}
}
const hex=x=>typeof x==='string'&&/^0x[0-9a-f]{1,16}$/i.test(x);
function allowedRead(r){
 if(!r||r.jsonrpc!=='2.0'||Object.keys(r).some(k=>!['jsonrpc','id','method','params'].includes(k)))return false;
 const p=r.params??[];if(!Array.isArray(p))return false;
 if(['eth_chainId','eth_blockNumber'].includes(r.method))return p.length===0;
 if(r.method==='eth_getBlockByNumber')return p.length===2&&hex(p[0])&&p[1]===false;
 if(r.method==='eth_getCode')return p.length===2&&typeof p[0]==='string'&&[nft,market].includes(p[0].toLowerCase())&&hex(p[1]);
 if(r.method==='eth_call')return p.length===2&&allowedCall(p[0])&&hex(p[1]);
 if(r.method==='eth_getLogs'){const q=p[0];return p.length===1&&q&&Array.isArray(q.address)&&q.address.length===2&&q.address.every(a=>typeof a==='string'&&[nft,market].includes(a.toLowerCase()))&&new Set(q.address.map(a=>a.toLowerCase())).size===2&&hex(q.fromBlock)&&hex(q.toBlock)&&BigInt(q.toBlock)>=BigInt(q.fromBlock)&&BigInt(q.toBlock)-BigInt(q.fromBlock)<100n&&Array.isArray(q.topics)&&q.topics.length===0&&Object.keys(q).every(k=>['address','fromBlock','toBlock','topics'].includes(k));}
 return false;
}
const sha=x=>createHash('sha256').update(x).digest('hex');
const safeUrl=u=>{try{const v=new URL(u);return v.origin===new URL(site).origin?v.origin+v.pathname:'[external endpoint]';}catch{return '[invalid URL]';}};
const redact=x=>String(x).replace(/https?:\/\/[^\s"')]+/g,safeUrl).replace(/(?:Bearer\s+|eyJ)[A-Za-z0-9._-]+/g,'[redacted]');
const source={head,tree:proof.testedTree,role:'Clean exact-main checkout; production bytes match an in-memory build of this head'};

await mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true});
const evidence={head,source,startedAt:new Date().toISOString(),status:'PREPARING',clockInjection:false,syntheticFixture:false,preparedSave:'Earned via real UI, then cloned in memory unchanged for the two viewport runs',networkWrites:0,transactionsPerformed:0,preparation:[],runs:[]};
const checkpoint=async()=>writeFile(out+'/result.json',JSON.stringify(evidence,null,2)+'\n');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const number=text=>Number(String(text).replace(/[^\d.]/g,''));
async function openContext(size,state){
 const context=await browser.newContext({viewport:size,serviceWorkers:'block',...(state?{storageState:state}:{})});
 const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(20000);
 const errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(redact(m.text()));});page.on('pageerror',e=>errors.push(redact(e.message)));page.on('requestfailed',r=>errors.push(redact(safeUrl(r.url())+' '+r.failure()?.errorText)));
 await context.route('**/*',async route=>{const request=route.request();if(['GET','HEAD','OPTIONS'].includes(request.method()))return route.continue();let batch=[];try{const x=request.postDataJSON();batch=Array.isArray(x)?x:[x];}catch{}
 if(request.method()==='POST'&&batch.length>0&&batch.every(allowedRead))return route.continue();errors.push('blocked-write '+request.method()+' '+safeUrl(request.url()));evidence.networkWrites++;await route.abort();});
 return {context,page,errors};
}
const click=async locator=>{await locator.scrollIntoViewIfNeeded();await expect(locator).toBeVisible();await expect(locator).toBeInViewport();await expect(locator).toBeEnabled();await locator.click();};
const tab=(page,name)=>page.getByRole('tab',{name,exact:true});
const id=(page,name)=>page.getByTestId(name);
async function enter(page){
 const response=await page.goto(site+'#landing',{waitUntil:'domcontentloaded'});assert.ok(response?.ok());assert.equal(sha(await response.text()),proof.htmlStartSha256);
 const help=page.getByRole('dialog',{name:'How to play',exact:true});if(await help.isVisible())await click(page.getByRole('button',{name:'Close help',exact:true}));
 await expect(id(page,'landing-hero')).toBeVisible();
}
async function choose(page){await click(id(page,'landing-start'));await expect(id(page,'class-picker')).toBeVisible();await click(id(page,'class-card-warrior'));await click(id(page,'class-picker-choose-button'));await click(id(page,'class-picker-confirm-button'));await expect(id(page,'home-dashboard')).toBeVisible();}
async function equip(page){await click(tab(page,'Bag'));const best=page.getByRole('button',{name:'Equip best',exact:true});if(await best.isEnabled()){await click(best);await expect(id(page,'block-reason-equip-best')).toHaveText('Best gear already equipped');return true;}return false;}
async function craftOptions(page,slot,rarity){await click(tab(page,'Forge'));await click(id(page,'tab-craft'));await click(id(page,'slot-'+slot));await click(id(page,'rarity-'+rarity));return id(page,'craft-btn');}
async function craft(page){await click(id(page,'craft-btn'));await expect(id(page,'craft-confirm-box')).toBeVisible();await click(id(page,'craft-confirm-btn'));await expect(id(page,'craft-confirm-box')).toHaveCount(0);}
async function gate(page){await click(tab(page,'Map'));const values=await page.locator('.boss-map-power-values strong').allTextContents();assert.equal(values.length,2);const rec=number(values[0]),power=number(values[1]);const button=page.getByRole('button',{name:'Fight',exact:true});return {recommended:rec,power,fightEnabled:await button.isEnabled(),reason:await id(page,'block-reason-boss').isVisible()?await id(page,'block-reason-boss').innerText():null};}
async function fish(page){return number(await page.getByRole('listitem',{name:/^Fish /}).getAttribute('aria-label'));}
try{
 const prep=await openContext({width:1280,height:720});await enter(prep.page);await choose(prep.page);await prep.page.screenshot({path:out+'/preparation-start.png'});const start=Date.now();let prepared=false;
 for(let tick=0;tick<180;tick++){
  await pause(30000);assert.deepEqual(prep.errors,[]);const equipped=await equip(prep.page);const condition=await gate(prep.page);
  const afford=await (await craftOptions(prep.page,'weapon','common')).isEnabled();
  const row={tick,at:new Date().toISOString(),elapsedSeconds:Math.round((Date.now()-start)/1000),equipped,...condition,commonCraftReady:afford,craft:null};
  if(condition.fightEnabled&&condition.recommended>0&&condition.power>=condition.recommended*1.5&&afford){evidence.preparation.push(row);prepared=true;break;}
  const slot=['weapon','armor','helmet','gloves','boots'][tick%5];
  for(const rarity of ['rare','uncommon','common']){const action=await craftOptions(prep.page,slot,rarity);if(await action.isEnabled()){await craft(prep.page);row.craft={slot,rarity};await equip(prep.page);break;}}
  await click(tab(prep.page,'Home'));evidence.preparation.push(row);await checkpoint();console.log('prepare',JSON.stringify(row));if(Date.now()-start>5400000)break;
 }
 assert.deepEqual(prep.errors,[]);
 if(!prepared){evidence.status='PRECONDITION_NOT_REACHED';evidence.demoStarted=false;await prep.page.screenshot({path:out+'/preparation-incomplete.png'});await checkpoint();process.exitCode=2;}
 else{
  await click(tab(prep.page,'Home'));await prep.page.screenshot({path:out+'/prepared-home.png'});const earned=await prep.context.storageState();assert.ok(earned.origins.every(x=>x.origin===new URL(site).origin));assert.ok(earned.origins.every(x=>x.localStorage.every(k=>!/(session|jwt|private.?key|secret)/i.test(k.name))));evidence.preparationSeconds=Math.round((Date.now()-start)/1000);evidence.earnedSaveSha256=sha(JSON.stringify(earned));evidence.status='RUNNING_TIMED_DEMO';await checkpoint();await prep.context.close();
  for(const size of [{width:1280,height:720},{width:1600,height:900}]){
   const ctx=await openContext(size,earned);const page=ctx.page;const run={viewport:size,steps:[],errors:ctx.errors,startedAt:new Date().toISOString(),status:'RUNNING',preparedSaveSha256:evidence.earnedSaveSha256};evidence.runs.push(run);const dir=out+'/'+size.width+'x'+size.height;await mkdir(dir);const timedStart=Date.now();
   const actions={
    landing:async()=>{await enter(page);await expect(id(page,'landing-hero')).toContainText('ERC-1155');return {scope:'Real landing on verified live deployment; prepared guest progress disclosed.'};},
    guest:async()=>{await click(id(page,'landing-start'));await expect(id(page,'class-picker')).toBeVisible();return {scope:'Play as guest action; prior legitimately earned local save retained.'};},
    class:async()=>{await click(id(page,'class-card-warrior'));await click(id(page,'class-picker-choose-button'));await click(id(page,'class-picker-confirm-button'));await expect(id(page,'home-dashboard')).toBeVisible();return {scope:'Actual class confirmation; no hidden state injection.'};},
    'idle-loop':async()=>{const before=await fish(page);await expect.poll(()=>fish(page),{timeout:35000}).toBeGreaterThan(before);return {fishBefore:before,fishAfter:await fish(page),scope:'Real wall-clock auto claim; no fake clock.'};},
    boss:async()=>{const before=await gate(page);assert.ok(before.fightEnabled);await click(page.getByRole('button',{name:'Fight',exact:true}));await click(page.getByRole('button',{name:'Skip fight',exact:true}));await expect(page.getByText('Victory!',{exact:true})).toBeVisible();const chest=page.getByRole('dialog',{name:'First clear chest!',exact:true});await expect(chest).toBeVisible();const skip=chest.getByRole('button',{name:'Skip',exact:true});if(await skip.isVisible())await click(skip);await click(chest.getByRole('button',{name:'Collect',exact:true}));await expect(chest).toHaveCount(0);return {before,scope:'Real guest fight, actual victory and first-clear collection; Skip accelerates replay only.'};},
    forge:async()=>{const action=await craftOptions(page,'weapon','common');await expect(action).toBeEnabled();const before=await fish(page);await craft(page);const after=await fish(page);assert.ok(after<before);return {fishBefore:before,fishAfter:after,scope:'Actual affordable guest craft and payment through UI.'};},
    bag:async()=>{await click(tab(page,'Bag'));const items=page.getByRole('list',{name:'Bag items',exact:true});assert.ok(await items.getByRole('button').count()>0);await click(items.getByRole('button').first());await expect(page.getByRole('region',{name:'Item detail',exact:true})).toBeVisible();return {scope:'Earned and crafted guest items; real detail/actions.'};},
    'on-chain-proof':async()=>{await click(tab(page,'Help'));await click(tab(page,'On-chain proof'));await expect(id(page,'proof-snapshot')).toBeVisible({timeout:30000});await expect(id(page,'proof-code-RelicNFT')).toContainText(/(?:[1-9][0-9,]*) bytes of deployed code/);await expect(id(page,'proof-code-RelicMarket')).toContainText(/(?:[1-9][0-9,]*) bytes of deployed code/);await expect(id(page,'proof-linkage')).toContainText('Matches');await expect(page.getByText(/Recent events unavailable/)).toHaveCount(0);return {scope:'Real read-only Fuji43113 code/linkage/recent events; no wallet transaction.',snapshot:await id(page,'proof-snapshot').innerText()};},
    market:async()=>{await click(tab(page,'Market'));await expect(page.getByRole('tabpanel',{name:'Market',exact:true})).toContainText('Connect your wallet to see');return {scope:'Correct guest wallet requirement; mint/list/buy is a separate still-unverified funded scenario.',walletConnected:false};}
   };
   for(const [name,action] of Object.entries(actions)){
    const step={name,startedAt:new Date().toISOString(),elapsedStartMs:Date.now()-timedStart,status:'PASS'};
    try{step.detail=await action();assert.deepEqual(ctx.errors,[]);const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));assert.ok(layout.scrollWidth<=size.width&&layout.scrollHeight<=size.height);step.layout=layout;await page.screenshot({path:dir+'/'+name+'.png'});await writeFile(dir+'/'+name+'.txt',redact(await page.locator('body').innerText()));step.elapsedEndMs=Date.now()-timedStart;assert.ok(step.elapsedEndMs<=180000);}
    catch(e){step.status='FAIL';step.error=redact(e.message);await page.screenshot({path:dir+'/'+name+'-FAIL.png'}).catch(()=>{});}
    run.steps.push(step);await checkpoint();console.log(size.width+'x'+size.height,name,step.status);if(step.status==='FAIL')break;
   }
   run.elapsedMs=Date.now()-timedStart;run.status=run.steps.length===9&&run.steps.every(s=>s.status==='PASS')&&run.elapsedMs<=180000&&!ctx.errors.length?'PASS':'FAIL';await ctx.context.close();await checkpoint();if(run.status!=='PASS')break;
  }
  evidence.status=evidence.runs.length===2&&evidence.runs.every(r=>r.status==='PASS')?'TIMED_GUEST_PASS_WALLET_PENDING':'DEMO_FAIL';evidence.fundedWalletStatus='NOT_VERIFIED';await checkpoint();if(evidence.status==='DEMO_FAIL')process.exitCode=1;
 }
}catch(e){evidence.status=evidence.runs.length?'DEMO_FAIL':'PREPARATION_FAIL';evidence.error=redact(e.message);await checkpoint();process.exitCode=1;}
finally{evidence.endedAt=new Date().toISOString();await checkpoint();await browser.close();}
