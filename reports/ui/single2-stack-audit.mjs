// Candidate-only route mocks. No live backend, wallet signature or transaction.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer } from 'node:net';
const [rootText, outText] = process.argv.slice(2);
const root=resolve(rootText), web=resolve(root,'apps/web'), out=resolve(outText);
const require=createRequire(resolve(web,'package.json'));
const {chromium,expect}=require('@playwright/test');
const {build,preview}=await import(pathToFileURL(require.resolve('vite')).href);
mkdirSync(out,{recursive:true});
const report={head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),method:'Isolated local candidate builds; synthetic sessions and provider; all function/RPC traffic mocked; sign/send requests rejected',cases:[]};
const save=()=>writeFileSync(resolve(out,'audit.json'),JSON.stringify(report,null,2)+'\n');
const serverPort=5310, guestPort=5311;
for(const port of [serverPort,guestPort]){const s=createServer();await new Promise((ok,fail)=>{s.once('error',fail);s.listen(port,ok);});await new Promise(ok=>s.close(ok));}
process.env.VITE_GAME_V2='1';
process.env.VITE_SUPABASE_URL='http://127.0.0.1:5312';
process.env.VITE_SUPABASE_ANON_KEY='local-test-public-key';
await build({root:web,envDir:false,build:{outDir:'dist/single2-audit-server'}});
process.env.VITE_SUPABASE_URL='';process.env.VITE_SUPABASE_ANON_KEY='';
await build({root:web,envDir:false,mode:'g1-perf',build:{outDir:'dist-v2/e2e-5311'}});
const servers=[];let browser;
try{
 servers.push(await preview({root:web,envDir:false,build:{outDir:'dist/single2-audit-server'},preview:{port:serverPort,strictPort:true}}));
 servers.push(await preview({root:web,envDir:false,build:{outDir:'dist-v2/e2e-5311'},preview:{port:guestPort,strictPort:true}}));
 browser=await chromium.launch();
 // A real fresh local guest supplies a schema-valid state, not invented API fields.
 const seed=await browser.newPage();await seed.addInitScript(()=>localStorage.setItem('taskbar-hero.howToPlaySeen','1'));
 await seed.goto(`http://localhost:${guestPort}/#landing`);await seed.getByTestId('landing-start').click();
 await seed.getByTestId('class-picker-choose-button').click();await seed.getByTestId('class-picker-confirm-button').click();
 await expect(seed.getByTestId('home-dashboard')).toBeVisible();
 const fixture=await seed.evaluate(()=>({state:window.__g1Loop.getSnapshot().state,storage:Object.fromEntries(Object.entries(localStorage))}));await seed.close();
 for(const width of [1280,1600])for(const state of ['nonce-503','expired','wrong-network','connected-hud','connected-unsigned','offline','api-503']){
  const context=await browser.newContext({viewport:{width,height:width===1280?720:900}}),page=await context.newPage();
  const row={width,state,errors:[],expectedTransportDiagnostics:[],requestsMocked:[],checks:[],walletMethods:[]};report.cases.push(row);save();
  page.on('pageerror',e=>row.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'){
   const item={text:m.text(),url:m.location().url};
   if(item.url.startsWith('http://127.0.0.1:5312/functions/v1/')&&/Failed to load resource.*(?:401|503)/.test(item.text))row.expectedTransportDiagnostics.push(item);
   else row.errors.push(item);
  }});
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith('/functions/v1/')){
    row.requestsMocked.push(url.pathname);
    const status=state==='expired'?401:state==='connected-hud'?200:503;
    const body=status===200?fixture.state:{error:status===401?'unauthenticated':'auth_unavailable',retryAfter:30};
    return route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-expose-headers':'Retry-After','Retry-After':'30'},body:JSON.stringify(body)});
   }
   if(!['GET','HEAD','OPTIONS'].includes(req.method())){
    row.errors.push({unexpectedRequest:url.origin+url.pathname,method:req.method()});return route.abort('blockedbyclient');
   }
   return route.continue();
  });
  await page.addInitScript(({state,fixture})=>{
   localStorage.setItem('taskbar-hero.howToPlaySeen','1');
   if(['connected-hud','connected-unsigned','offline'].includes(state))for(const [key,value]of Object.entries(fixture.storage))localStorage.setItem(key,value);
   const address='0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
   if(['expired','connected-hud','api-503'].includes(state))sessionStorage.setItem('taskbar-hero.session',JSON.stringify({token:'browser-local-audit-only',playerId:'local-audit-only',wallet:address,expiresAt:Date.now()+3600000}));
   window.__auditWalletCalls=[];
   window.ethereum={isMetaMask:true,on:()=>{},removeListener:()=>{},request:async({method})=>{
    window.__auditWalletCalls.push(method);
    if(['eth_accounts','eth_requestAccounts'].includes(method))return [address];
    if(method==='eth_chainId')return state==='wrong-network'?'0x1':'0xa869';
    if(['wallet_requestPermissions','wallet_getPermissions'].includes(method))return [{parentCapability:'eth_accounts'}];
    throw Error('Synthetic provider forbids '+method);
   }};
  },{state,fixture});
  try{
   const port=state==='offline'?guestPort:serverPort;
   await page.goto(`http://localhost:${port}/#${['expired','connected-hud','connected-unsigned','offline','api-503'].includes(state)?'home':'landing'}`);
   const connect=page.getByRole('button',{name:'Connect wallet',exact:true});
   if(['nonce-503','wrong-network','connected-hud','connected-unsigned'].includes(state)){
    await expect(connect).toBeVisible();await connect.click();
   }
   if(state==='nonce-503'){
    await page.getByRole('button',{name:'Sign in',exact:true}).click();
    const notice=page.getByRole('alert').filter({hasText:'Wallet sign-in is temporarily unavailable, guest play still works.'});
    await expect(notice).toBeVisible();await page.waitForTimeout(5500);await expect(notice).toBeVisible();
    await page.screenshot({path:resolve(out,`${state}-${width}.png`)});
    await notice.getByRole('button',{name:/Dismiss/}).click();await expect(notice).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();
    assert.equal(row.requestsMocked.filter(x=>x.endsWith('/auth-nonce')).length,1);assert.ok(!row.requestsMocked.some(x=>x.endsWith('/auth-verify')));
    row.checks.push('Persistent for5.5s; dismissible; retry remains; one nonce request; no verification');
   }else if(state==='expired'){
    await expect(page.getByTestId('session-expired-notice')).toContainText('Your session expired');
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('taskbar-hero.session')),null);
    const choose=page.getByTestId('class-picker-choose-button'),confirm=page.getByTestId('class-picker-confirm-button');
    await choose.focus();await page.keyboard.press('Enter');await expect(confirm).toBeFocused();
    await page.keyboard.press('Escape');await expect(choose).toBeFocused();await expect(confirm).toHaveCount(0);
    await page.keyboard.press('Enter');await page.keyboard.press('Tab');await expect(page.getByTestId('class-picker-cancel-button')).toBeFocused();await page.keyboard.press('Enter');await expect(choose).toBeFocused();
    row.checks.push('Expiry explained; session cleared; Enter/Escape/Cancel preserve focus');
   }else if(state==='wrong-network'){
    await expect(page.getByRole('alert')).toContainText('Wrong network. Switch to Avalanche Fuji.');await expect(page.getByRole('button',{name:'Switch to Fuji',exact:true})).toBeVisible();
    await page.getByTestId('landing-start').click();await page.getByTestId('class-picker-choose-button').click();await page.getByTestId('class-picker-confirm-button').click();await expect(page.getByTestId('home-dashboard')).toBeVisible();
    row.checks.push('Network message and action remain visible on Home');
   }else if(['connected-hud','connected-unsigned'].includes(state)){
    await expect(page.getByTestId('home-dashboard')).toBeVisible();await expect(page.locator(state==='connected-hud'?'.wallet-badge':'.wallet-addr')).toBeVisible();
    const powerNode=page.getByTestId('hud-power-chip'),liveNode=page.locator('header [data-sync-status]');
    await expect(powerNode).toBeInViewport({ratio:1});await expect(liveNode).toBeInViewport({ratio:1});
    const power=await powerNode.boundingBox(),live=await liveNode.boundingBox();
    assert.ok(power&&live);assert.ok(power.x+power.width<=live.x||live.x+live.width<=power.x||power.y+power.height<=live.y||live.y+live.height<=power.y,'Power and Live overlap');
    row.hud={power,live};row.checks.push('Connected Power/Live rectangles do not overlap');
   }else if(state==='offline'){
    await expect(page.getByTestId('home-dashboard')).toBeVisible();await context.setOffline(true);await page.evaluate(()=>dispatchEvent(new Event('offline')));
    await expect(page.locator('header [data-sync-status="offline"]')).toBeVisible();row.checks.push('Offline status visible; guest remains painted');
   }else{
    await expect(page.getByRole('alert').filter({hasText:'Could not load your cat'})).toBeVisible();await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeInViewport({ratio:1});row.checks.push('API503 explanation and Retry visible');
   }
   row.geometry=await page.evaluate(()=>({overflowX:document.documentElement.scrollWidth>innerWidth,overflowY:document.documentElement.scrollHeight>innerHeight}));assert.deepEqual(row.geometry,{overflowX:false,overflowY:false});
   row.walletMethods=await page.evaluate(()=>window.__auditWalletCalls);assert.ok(!row.walletMethods.some(x=>/sign|send/i.test(x)));
   await page.screenshot({path:resolve(out,`${state}-${width}-final.png`)});assert.deepEqual(row.errors,[]);row.passed=true;
  }catch(e){row.passed=false;row.failure=String(e);await page.screenshot({path:resolve(out,`${state}-${width}-failure.png`)}).catch(()=>{});}
  finally{save();await context.close();}
 }
 report.complete=true;save();console.log(JSON.stringify(report.cases.map(({state,width,passed,failure})=>({state,width,passed,failure}))));
 assert.ok(report.cases.every(x=>x.passed),'Mocked stack audit has failures; see audit.json');
}finally{save();await browser?.close();for(const server of servers)await new Promise(ok=>server.httpServer.close(ok));}
