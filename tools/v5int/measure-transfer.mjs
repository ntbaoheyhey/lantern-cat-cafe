/** Cold production fixtures; all bytes from navigation through battle readiness. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {loadRules} from '../cardrpg-big/a4-load.mjs';
import {transferSummary} from '../v4ship-lab/rehearsal/metrics.mjs';
import {waitForBattleReady} from '../v4ship-lab/rehearsal/battle-ready.mjs';

const root=resolve(import.meta.dirname,'../..');
const args=Object.fromEntries(process.argv.slice(2).map(arg=>{
 const match=/^--([a-z-]+)=(.*)$/.exec(arg);assert(match,'Use --name=value');return [match[1],match[2]];
}));
assert(Object.keys(args).every(key=>['label','scenario','url','capture'].includes(key)),'Unknown argument');
const label=args.label??'baseline',scenario=args.scenario??'all',url=new URL(args.url??'http://127.0.0.1:6301');
assert(/^[a-z0-9-]+$/.test(label),'Use a distinct lowercase evidence label');
assert(['wave1','wave3','boss','all'].includes(scenario),'Unknown encounter');
assert(['localhost','127.0.0.1'].includes(url.hostname)&&url.port==='6301','Use owned production preview port 6301');
const out=resolve(root,'work/v5/CXI/transfer',label),reportPath=resolve(out,scenario+'.json');
assert(!existsSync(reportPath),'Preserve existing measurements; choose a new label');
const stop=()=>{
 for(const file of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+file),'STOP: '+file);
};
stop();mkdirSync(out,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const config=JSON.parse(readFileSync(resolve(root,'scripts/v3a2/fixtures.json'),'utf8'));
const productionIndex=readFileSync(resolve(root,'apps/web/dist/index.html'));
const served=await fetch(url);assert(served.ok,'Production preview unavailable');
assert.equal(hash(Buffer.from(await served.arrayBuffer())),hash(productionIndex),'Preview is not the current production build');
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const report={at:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
 indexSha256:hash(productionIndex),harnessSha256:hash(readFileSync(import.meta.filename)),viewport:{width:1280,height:720},
 method:'Fresh Chromium context, service workers blocked, HTTP cache disabled. Count the full encoded response of every request started from navigation to visible battle-ready UI, including navigation and responses finishing after readiness. Production bundles only; unchanged official rules/fixtures are prepared outside the browser, then selected through the existing review interface.',
 limits:['These are cold combat fixture entries, not guest authentication, sponsored transaction, or campaign journey evidence.','No development server/source module is requested by the browser. The existing dev=1 review switch only selects the official fixture.'],
 rows:[],complete:false,budgetPass:false};
const save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
const modules=await loadRules(),R=await modules.load('packages/game-rules/src/cardrpg/depth/index.ts');
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const fixture of config.fixtures.filter(f=>scenario==='all'||f.id===scenario)){
  stop();
  const context=await browser.newContext({viewport:report.viewport,deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),cdp=await context.newCDPSession(page),records=new Map();
  const row={fixture:fixture.id,enemies:fixture.enemies,errors:[],httpFailures:[],blocked:[],publicReads:[],developmentPaths:[],complete:false};
  report.rows.push(row);
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  cdp.on('Network.requestWillBeSent',event=>{
   const requestUrl=new URL(event.request.url);if(!['http:','https:'].includes(requestUrl.protocol))return;
   const path=requestUrl.pathname;
   if(/^\/(?:@vite|@fs|src)(?:\/|$)|\.tsx?$/.test(path))row.developmentPaths.push(path);
   records.set(event.requestId,{id:event.requestId,path,type:event.type,observed:0,finished:false,failed:false,cached:false});
  });
  cdp.on('Network.responseReceived',event=>{
   const record=records.get(event.requestId);if(!record)return;
   record.observed=event.response.encodedDataLength??0;
   record.cached=Boolean(event.response.fromDiskCache||event.response.fromServiceWorker||event.response.fromPrefetchCache);
   if(event.response.status>=400)row.httpFailures.push({path:record.path,status:event.response.status});
  });
  cdp.on('Network.dataReceived',event=>{const record=records.get(event.requestId);if(record)record.observed+=event.encodedDataLength;});
  cdp.on('Network.loadingFinished',event=>{const record=records.get(event.requestId);if(record)Object.assign(record,{finished:true,totalBytes:event.encodedDataLength,observed:event.encodedDataLength});});
  cdp.on('Network.loadingFailed',event=>{const record=records.get(event.requestId);if(record)Object.assign(record,{finished:true,failed:true,failure:event.errorText});});
  cdp.on('Network.requestServedFromCache',event=>{const record=records.get(event.requestId);if(record)record.cached=true;});
  page.on('pageerror',error=>row.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')row.errors.push(message.text());});
  await context.route('**/*',route=>{
   const target=new URL(route.request().url());
   const publicFont=target.protocol==='https:'&&route.request().method()==='GET'&&['fonts.googleapis.com','fonts.gstatic.com'].includes(target.hostname);
   const publicIndexer=target.protocol==='https:'&&target.hostname==='api.routescan.io'&&target.pathname.startsWith('/v2/network/testnet/evm/43113/')&&route.request().method()==='GET';
   if(['data:','blob:'].includes(target.protocol)||target.origin===url.origin||publicFont||publicIndexer)return route.continue();
   if(target.href==='https://api.avax-test.network/ext/bc/C/rpc'&&route.request().method()==='POST'){
    const payload=route.request().postDataJSON(),calls=Array.isArray(payload)?payload:[payload];
    const readMethods=new Set(['eth_chainId','net_version','eth_blockNumber','eth_getBalance','eth_call','eth_getCode','eth_getTransactionCount','eth_getBlockByNumber','eth_getBlockByHash','eth_getLogs','eth_getTransactionReceipt']);
    if(calls.length&&calls.every(call=>readMethods.has(call?.method))){row.publicReads.push(...calls.map(call=>call.method));return route.continue();}
    row.blocked.push({path:target.origin+target.pathname,methods:calls.map(call=>call?.method)});return route.abort();
   }
   row.blocked.push(target.origin+target.pathname);return route.abort();
  });
  await page.addInitScript(()=>localStorage.setItem('lantern.coach.v3',JSON.stringify({disabled:true})));
  try{
   const started=performance.now();
   await page.goto(url.origin+'/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3&dev=1');
   await page.getByRole('button',{name:'Play free',exact:true}).click({timeout:60000});
   await page.waitForFunction(()=>window.__depthReview,null,{timeout:60000});
   // Let the real cafe mount before selecting a review encounter. Otherwise a
   // fast fixture injection can skip home requests and undercount cold entry.
   await page.locator('.uv-home-crew img').first().waitFor({state:'visible'});
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('.uv-home-crew img')].map(image=>image.decode())));
   const state=R.setFormationC2(R.setGameplayA6(R.createDepthAccount(config.seed),true));state.tutorial=4;
   Object.assign(state.settings,{speed:1,quality:'high',reducedMotion:false});
   for(const card of state.account.cards){card.level=6;state.skills[card.cardId]=R.CAT_BY_ID[card.cardId].skills.map(skill=>skill.id);}
   const battle=R.createBattle({seed:config.seed,chapter:fixture.chapter,cats:R.battleCats(state),enemies:fixture.enemies,gameplayV4:true,skillsV5:true,gameplayA6:true,formationC2:true});
   battle.v4.committed=true;
   await page.evaluate(({state,battle})=>{
    const model=window.__depthReview;model.state=state;
    Object.assign(model,{tutorialBattle:battle,galleryBattle:null,replay:null,plan:null,roundPlan:null,watching:true,paused:true,sceneStarted:true,screen:'map'});model.notify(false);
   },{state,battle});
   await waitForBattleReady(page,90000);
   const boundary=new Map([...records.values()].map(record=>[record.id,record.observed]));row.battleReadyMs=Math.round(performance.now()-started);
   for(let attempt=0;attempt<300&&[...boundary.keys()].some(id=>!records.get(id)?.finished);attempt++)await page.waitForTimeout(100);
   row.transfer=transferSummary(records,boundary);
   row.top15=[...row.transfer.resources].sort((a,b)=>(b.totalBytes??0)-(a.totalBytes??0)).slice(0,15);
   row.complete=row.transfer.valid&&!row.errors.length&&!row.httpFailures.length&&!row.blocked.length&&!row.developmentPaths.length;
   row.budgetPass=row.complete&&row.transfer.conservativeTransferBytes<=8_000_000;
   if(args.capture==='true'){
    row.captures=[];
    await page.evaluate(()=>{window.__depthReview.paused=true;cancelAnimationFrame(window.__depthScene.raf);});
    for(const [index,time] of [10,10.6,11.2].entries()){
     await page.evaluate(time=>{const scene=window.__depthScene;scene.render({...scene.view(),fixedTime:time,paused:true},0);},time);
     const path=resolve(out,fixture.id+'-'+index+'.png');await page.screenshot({path});row.captures.push(relative(root,path));
    }
   }
  }catch(error){row.failure=String(error.message).slice(0,500);}
  finally{await cdp.detach();await context.close();save();}
  console.log(JSON.stringify({fixture:fixture.id,totalBytes:row.transfer?.conservativeTransferBytes,complete:row.complete,budgetPass:row.budgetPass,failure:row.failure,errors:row.errors}));
  console.log('top15 '+fixture.id+' '+JSON.stringify(row.top15?.map(({path,totalBytes})=>({path,bytes:totalBytes}))??[]));
 }
 report.complete=report.rows.length>0&&report.rows.every(row=>row.complete);
 report.budgetPass=report.complete&&report.rows.every(row=>row.budgetPass);
}finally{await browser.close();await modules.vite.close();save();}
console.log(JSON.stringify({report:relative(root,reportPath),complete:report.complete,budgetPass:report.budgetPass}));
if(!report.complete)process.exitCode=1;
