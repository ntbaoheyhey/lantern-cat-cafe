import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root='/Users/bao/taskbar-hero-ovn-sys';
const require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium,expect}=require('@playwright/test');
const out=resolve('/Users/bao/taskbar-hero-ui-ledger/reports/ui/cards/OVN-U2/live-edge-r2');mkdirSync(out,{recursive:true});
const report={at:new Date().toISOString(),site:'https://taskbarhero-eight.vercel.app',methodology:'Real live assets, browser-local synthetic sessions/wallet, all Supabase function requests mocked before network; no real token, wallet, signature, transaction or DB write.',cases:[]};
const save=()=>writeFileSync(resolve(out,'edge.json'),JSON.stringify(report,null,2)+'\n');
const browser=await chromium.launch();
try{
for(const width of [1280,1600])for(const state of ['api-error','expired','wrong-network']){
 const page=await browser.newPage({viewport:{width,height:width===1280?720:900}});
 const row={width,state,errors:[],requestsMocked:0};report.cases.push(row);save();
 page.on('pageerror',e=>row.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')row.errors.push({text:m.text(),url:m.location().url});});
 await page.route('**/functions/v1/**',route=>{row.requestsMocked++;return route.fulfill({status:state==='expired'?401:503,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({error:state==='expired'?'unauthorized':'server_busy'})});});
 await page.addInitScript(({state})=>{
  localStorage.setItem('taskbar-hero.howToPlaySeen','1');
  if(state!=='wrong-network')sessionStorage.setItem('taskbar-hero.session',JSON.stringify({token:'browser-local-audit-only',playerId:'browser-local-audit-only',wallet:'0x70997970C51812dc3A010C7d01b50e0d17dc79C8',expiresAt:Date.now()+60000}));
  else{window.__auditWalletCalls=[];window.ethereum={isMetaMask:true,on:()=>{},removeListener:()=>{},request:async({method})=>{window.__auditWalletCalls.push(method);if(['eth_accounts','eth_requestAccounts'].includes(method))return ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8'];if(method==='eth_chainId')return '0x1';if(['wallet_requestPermissions','wallet_getPermissions'].includes(method))return [{parentCapability:'eth_accounts'}];throw Error('No other synthetic wallet operations allowed');}};}
 },{state});
 await page.goto(report.site+'/#'+(state==='wrong-network'?'landing':'home'));
 if(state==='api-error'){
  await expect(page.getByRole('alert').filter({hasText:'Could not load your cat'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Retry',exact:true})).toBeInViewport({ratio:1});
  row.message='Could not load your cat; Retry visible';
 }else if(state==='expired'){
  await page.waitForTimeout(1500); row.noticeVisible=await page.getByText(/Your session expired/).isVisible();
  row.sessionCleared=await page.evaluate(()=>sessionStorage.getItem('taskbar-hero.session')===null);
  row.message=row.noticeVisible?await page.getByText(/Your session expired/).textContent():null;row.classPickerVisible=await page.getByTestId('class-picker').isVisible();
 }else{
  const welcome=page.getByRole('button',{name:'Start playing',exact:true});if(await welcome.count())await welcome.click();
  const connect=page.getByRole('button',{name:'Connect wallet',exact:true});if(await connect.count())await connect.click();
  await expect(page.getByRole('button',{name:'Switch to Fuji',exact:true})).toBeVisible();
  row.message=await page.getByText('Wrong network. Switch to Avalanche Fuji.',{exact:true}).textContent();
  row.walletMethods=await page.evaluate(()=>window.__auditWalletCalls);
  row.signedOrSent=row.walletMethods.some(x=>/sign|send/i.test(x));
 }
 row.geometry=await page.evaluate(()=>({documentOverflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,controls:[...document.querySelectorAll('.wallet button,.wallet-msg')].map(x=>{const r=x.getBoundingClientRect();return{text:x.textContent,x:r.x,y:r.y,right:r.right,bottom:r.bottom};})}));
 await page.screenshot({path:resolve(out,`${state}-${width}.png`)});save();await page.close();
}
report.complete=true;save();
}finally{await browser.close();save();}
console.log(JSON.stringify(report.cases));
