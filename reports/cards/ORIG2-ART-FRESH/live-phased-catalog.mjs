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
const results=[];await mkdir(out,{recursive:false});
const browser=await chromium.launch({headless:true});
try{
for(const [width,height] of [[1280,720],[1600,900]]){
 const dir=out+'/'+width+'x'+height;await mkdir(dir);
 const result={viewport:{width,height},source,deployment:{head,identityMethod:'Fresh production asset hashes match the exact-main in-memory build',artifactProof:proofPath},phase:'merged-core-plus-read-only-proof-and-local-catalog',fullNineStagePass:false,startedAt:new Date().toISOString(),steps:[],errors:[],responses:[],transactionsPerformed:0,guestOnly:true,rpcReads:[]};
 const context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const page=await context.newPage();page.setDefaultTimeout(5000);page.setDefaultNavigationTimeout(20000);
 const err=(kind,message)=>result.errors.push({kind,message:redact(message)});
 page.on('console',m=>{if(m.type()==='error')err('console',m.text());});page.on('pageerror',e=>err('page',e.message));
 page.on('requestfailed',r=>err('request-failed',safeUrl(r.url())+' '+r.failure()?.errorText));
 page.on('response',r=>{result.responses.push({url:safeUrl(r.url()),status:r.status()});if(r.status()>=400)err('http',r.status()+' '+safeUrl(r.url()));});
 await context.route('**/*',async route=>{const request=route.request();if(['GET','HEAD','OPTIONS'].includes(request.method()))return route.continue();
 let batch=[];try{const data=request.postDataJSON();batch=Array.isArray(data)?data:[data];}catch{}
 if(request.method()==='POST'&&batch.length>0&&batch.every(allowedRead)){result.rpcReads.push(...batch.map(r=>({method:r.method})));return route.continue();}
 err('blocked-write',request.method()+' '+safeUrl(request.url()));await route.abort();});
 const visible=async l=>{await expect(l).toBeVisible();await expect(l).toBeInViewport();};
 const click=async l=>{await visible(l);await expect(l).toBeEnabled();await l.click();};
 const id=n=>page.getByTestId(n),tab=n=>page.getByRole('tab',{name:n,exact:true});
 const xp=()=>id('hud-level-xp').getByRole('progressbar',{name:'Experience'});let beforeXp;let guestDisclosure='';
 const started=Date.now();
 const actions={
 landing:async()=>{const r=await page.goto(site,{waitUntil:'domcontentloaded'});assert.ok(r?.ok());const html=await r.text();result.identity={htmlSha256:sha(html),entryScripts:await page.locator('script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('src'))),etag:r.headers().etag??null};assert.equal(result.identity.htmlSha256,proof.htmlStartSha256);for(const p of result.identity.entryScripts)assert.ok(proof.liveEntries.includes(p));guestDisclosure=await page.locator('body').innerText();const help=page.getByRole('dialog',{name:'How to play',exact:true});if(await help.isVisible())await click(page.getByRole('button',{name:'Close help',exact:true}));await visible(id('class-picker'));return {scope:'Current class-picker entry; no future landing CTA claim.'};},
 guest:async()=>{await visible(id('class-picker'));assert.match(guestDisclosure+' '+await page.locator('body').innerText(),/guest|demo|preview/i);return {scope:'Fresh unauthenticated context; guest/preview disclosure observed before dismissing initial help.',disclosure:guestDisclosure};},
 class:async()=>{await click(id('class-card-warrior'));await click(id('class-picker-choose-button'));await click(id('class-picker-confirm-button'));await visible(id('home-dashboard'));await expect(id('home-hero-card')).toContainText('Warrior');await visible(page.locator('canvas').first());beforeXp=Number(await xp().getAttribute('aria-valuenow'));return {xpBefore:beforeXp};},
 'idle-loop':async()=>{await expect.poll(async()=>Number(await xp().getAttribute('aria-valuenow')),{timeout:35000}).toBeGreaterThan(beforeXp);await expect(id('home-event-log')).toContainText(/gathered [1-9]\d* Fish|leveled up|Advanced to Chapter/);return {xpBefore:beforeXp,xpAfter:Number(await xp().getAttribute('aria-valuenow')),scope:'Real guest idle reward; no clock/state injection.'};},
 boss:async()=>{await click(tab('Map'));await visible(page.getByRole('region',{name:'Boss Gate',exact:true}));const fight=page.getByRole('button',{name:'Fight',exact:true});await visible(fight);await expect(fight).toBeDisabled();await visible(id('block-reason-boss'));assert.match(await id('block-reason-boss').innerText(),/\S/);return {scope:'Locked boss with visible reason; no victory claimed.'};},
 forge:async()=>{await click(tab('Forge'));await click(id('tab-craft'));await visible(id('craft-panel'));assert.match(await id('craft-panel').innerText(),/recipe|craft/i);const action=id('craft-btn');await action.scrollIntoViewIfNeeded();await visible(action);await expect(action).toBeDisabled();return {scope:'Current recipe and shortage action; no funded crafting or mint.',actionBounds:await action.boundingBox()};},
 bag:async()=>{await click(tab('Bag'));await visible(id('bag-screen'));const items=page.getByRole('list',{name:'Bag items',exact:true});await visible(items);await click(items.getByRole('button').first());await visible(page.getByRole('region',{name:'Item detail',exact:true}));return {scope:'Earned guest loot list and selected item detail.'};},
 market:async()=>{await click(tab('Market'));const panel=page.getByRole('tabpanel',{name:'Market',exact:true});await visible(panel);await expect(panel).toContainText('Connect your wallet to see');return {scope:'Current guest wallet requirement; no trading or wallet connection.'};}
 };
 actions.hero=async()=>{await click(tab('Hero'));const hero=page.getByRole('region',{name:'Character',exact:true});await visible(hero);await expect(hero.getByRole('group',{name:'Gear slots'}).getByRole('button')).toHaveCount(9);await visible(id('character-power'));const change=hero.getByRole('button',{name:'Change class',exact:true});await change.focus();await click(change);const dialog=page.getByRole('dialog',{name:'Change class',exact:true});await visible(dialog);await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(change).toBeFocused();assert.equal(await page.locator('#root').getAttribute('inert'),null);assert.notEqual(await page.locator('#root').getAttribute('aria-hidden'),'true');return {scope:'Real guest Hero, nine slots, power and modal open/Escape/focus restoration; no class change request.'};};
 actions.help=async()=>{await click(tab('Help'));const panel=page.getByRole('tabpanel',{name:'Help',exact:true});await visible(panel);const search=panel.getByRole('searchbox',{name:'Search help'});await search.fill('30 Yarn');await expect(panel.getByRole('heading',{level:3})).toHaveText('Forge');await search.fill('Warrior: sword');await expect(panel.getByRole('heading',{level:3})).toHaveText('Classes');await click(panel.getByRole('button',{name:'Start Exploring',exact:true}));await visible(id('home-dashboard'));return {scope:'Live phrase search and primary return-to-Home action.'};};
 actions.proof=async()=>{await click(tab('Help'));await click(tab('On-chain proof'));await expect(id('proof-snapshot')).toBeVisible({timeout:30000});await expect(id('proof-code-RelicNFT')).toContainText(/(?:[1-9][0-9,]*) bytes of deployed code/);await expect(id('proof-code-RelicMarket')).toContainText(/(?:[1-9][0-9,]*) bytes of deployed code/);await expect(id('proof-linkage')).toContainText('Matches');await expect(page.getByText(/Recent events unavailable/)).toHaveCount(0);await visible(page.getByText('Not exposed by this NFT contract'));const methods=[...new Set(result.rpcReads.map(r=>r.method))];for(const method of ['eth_chainId','eth_blockNumber','eth_getCode','eth_call','eth_getLogs'])assert.ok(methods.includes(method));return {scope:'Guest public Fuji reads; real deployed-code/linkage snapshot and bounded recent-event window. No wallet or transaction.',snapshot:await id('proof-snapshot').innerText(),nft:await id('proof-code-RelicNFT').innerText(),market:await id('proof-code-RelicMarket').innerText(),eventsUnavailable:await page.getByText(/Recent events unavailable/).isVisible(),readMethods:methods};};
 actions['catalog-off']=async()=>{await click(tab('Help'));await click(tab('Catalog preview'));const toggle=page.getByRole('switch',{name:'Catalog preview'});await visible(toggle);await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-original-art]')).toHaveCount(0);return {scope:'Local catalog starts OFF; no draft content/art rendered before opt-in.'};};
 actions['catalog-items']=async()=>{const toggle=page.getByRole('switch',{name:'Catalog preview'});await toggle.focus();await page.keyboard.press('Space');await expect(toggle).toHaveAttribute('aria-checked','true');await expect(page.getByRole('list',{name:'Preview items'}).getByRole('button')).toHaveCount(15);await page.getByLabel('Preview quality',{exact:true}).selectOption('rare');await page.getByLabel('Preview item level',{exact:true}).selectOption('6');await expect(id('draft-bonus-atk')).toHaveText('+13.566');await expect(id('draft-upgrade-cost')).toHaveText('Maximum preview level');await expect(page.locator('[data-art-missing]')).toHaveCount(0);return {scope:'Explicit local opt-in only; real published draft calculator and original item icons. No purchase or equip.',items:15,bonus:await id('draft-bonus-atk').innerText()};};
 actions['catalog-stats']=async()=>{await click(page.getByRole('group',{name:'Catalog sections'}).getByRole('button',{name:'Stats',exact:true}));await expect(page.getByRole('table',{name:'Draft stat definitions'}).getByRole('row')).toHaveCount(13);await expect(id('draft-stat-critChance')).toContainText('3.5%42%');const scroll=page.getByLabel('Scrollable draft stats');await scroll.focus();await page.keyboard.press('End');await visible(id('draft-stat-bossDamage'));await page.keyboard.press('Home');return {scope:'Twelve draft stat definitions, units and caps; keyboard-scrollable table.',stats:12};};
 actions['catalog-skills']=async()=>{await click(page.getByRole('group',{name:'Catalog sections'}).getByRole('button',{name:'Skills',exact:true}));const list=page.getByRole('list',{name:'Preview skills'});await expect(list.getByRole('button')).toHaveCount(7);await click(list.getByRole('button',{name:/Hemskip Pair/}));await page.getByLabel('Preview skill rank',{exact:true}).selectOption('3');await expect(id('draft-skill-output')).toHaveText('19.68');return {scope:'Seven local skill examples; rank3 arithmetic only, no rank entitlement or combat change.',skills:7,output:await id('draft-skill-output').innerText()};};
 actions['catalog-reset']=async()=>{const toggle=page.getByRole('switch',{name:'Catalog preview'});await click(toggle);await expect(toggle).toHaveAttribute('aria-checked','false');await expect(page.locator('[data-original-art]')).toHaveCount(0);await click(toggle);await click(tab('Guide'));await click(tab('Catalog preview'));await expect(toggle).toHaveAttribute('aria-checked','false');await page.reload({waitUntil:'domcontentloaded'});await click(tab('Help'));await click(tab('Catalog preview'));await expect(toggle).toHaveAttribute('aria-checked','false');return {scope:'OFF control, Help-tab unmount and reload reset verified; no preview state persisted.'};};
 for(const [name,action] of Object.entries(actions)){
  const step={name,status:'PASS',startedAt:new Date().toISOString()};
  try{assert.ok(Date.now()-started<180000);step.detail=await action();assert.deepEqual(result.errors,[]);step.layout=await page.evaluate(()=>({width:innerWidth,docWidth:document.documentElement.scrollWidth,height:innerHeight,docHeight:document.documentElement.scrollHeight}));assert.ok(step.layout.docWidth<=width);await page.screenshot({path:dir+'/'+name+'.png',fullPage:false});await writeFile(dir+'/'+name+'.txt',redact(await page.locator('body').innerText()));assert.deepEqual(result.errors,[]);assert.ok(Date.now()-started<180000);}
  catch(e){step.status='FAIL';step.error=redact(e.message);try{await page.screenshot({path:dir+'/'+name+'-FAIL.png'});}catch{}}
  result.steps.push(step);console.log(width+'x'+height+' '+name+' '+step.status);if(step.status==='FAIL')break;
 }
 result.status=result.steps.length===16&&result.steps.every(s=>s.status==='PASS')&&result.errors.length===0?'PASS':'FAIL';result.endedAt=new Date().toISOString();
 await writeFile(dir+'/result.json',JSON.stringify(result,null,2)+'\n');results.push(result);await context.close();
 if(result.responses.some(r=>r.status===429))break;
}
}finally{await browser.close();}
const summary={status:results.length===2&&results.every(r=>r.status==='PASS')?'PASS':'FAIL',method:'Direct Playwright, fresh guest contexts and real UI actions; no state injection; only allowlisted public read-only RPC POSTs, zero transaction methods',source,deploymentProof:proofPath,phaseAuthority:'Merged-core plus public Fuji proof and local catalog/art; not the funded nine-stage wallet demo gate',results};
await writeFile(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');process.exitCode=summary.status==='PASS'?0:1;
