/** Local read-only wallet fixtures; no provider, contract or account network calls. */
import {createRequire} from 'node:module';
import {access,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const root=process.cwd(),require=createRequire(root+'/apps/web/package.json');
const {chromium,expect}=require('@playwright/test'),{parseAbi,encodeFunctionResult,toFunctionSelector}=require('viem');
const abi=parseAbi(['function balanceOfBatch(address[], uint256[]) view returns (uint256[])','function rarityOf(uint256) view returns (uint8)']);
const wire={balances:toFunctionSelector(abi[0]),full:encodeFunctionResult({abi,functionName:'balanceOfBatch',result:[1n,1n,1n,1n]}),empty:encodeFunctionResult({abi,functionName:'balanceOfBatch',result:[0n,0n,0n,0n]}),rarities:[0,1,2,3,9].map(result=>encodeFunctionResult({abi,functionName:'rarityOf',result}))};
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)??'/tmp/cardrpg-c-relic-final';await mkdir(output,{recursive:true});
const report={scope:'Isolated browser accounts and local EIP-1193 fixtures only.',checks:[],shots:[],errors:[],complete:false},browser=await chromium.launch({channel:'chromium',headless:true});
try{for(const[width,height]of[[1280,720],[1440,900]])for(const reduced of[false,true]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 await page.goto('http://127.0.0.1:5970/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1');await page.getByRole('button',{name:'Cats',exact:true}).waitFor();
 await page.evaluate(async({root,wire})=>{window.__relicR=await import('/@fs'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');window.__relicWire=wire;}, {root,wire});
 const snap=()=>page.evaluate(()=>{const s=window.__depthReview.state;return JSON.stringify({account:s.account,equipment:s.equipment,team:s.team,rows:s.rows,run:s.run,skills:s.skills,settings:s.settings});});
 const setup=async(mode,offline=false,active=false)=>{
  if(await access(root+'/reports/cardrpg-c/STOP-C').then(()=>true,()=>false))throw Error('STOP-C');
  await page.evaluate(()=>window.__depthReview.go('hub'));await page.locator('.a6-relic-cabinet').waitFor({state:'hidden'});
  await page.evaluate(({mode,offline,active,reduced})=>{
   const m=window.__depthReview,R=window.__relicR,w=window.__relicWire,address='0x1111111111111111111111111111111111111111';
   m.offline=offline;m.replay=null;m.tutorialBattle=null;m.galleryBattle=null;m.watching=false;m.sceneStarted=false;
   m.state=R.setGameplayA6(R.createDepthAccount(918331,0),true);m.state.tutorial=4;m.state.freeInvite=true;m.state.settings.reducedMotion=reduced;
   const f=window.__relicFixture={mode,calls:[],listeners:new Map(),release:null};
   window.ethereum=mode==='absent'?undefined:{on(event,fn){if(!f.listeners.has(event))f.listeners.set(event,new Set());f.listeners.get(event).add(fn);},removeListener(event,fn){f.listeners.get(event)?.delete(fn);},async request({method,params}){
    f.calls.push({method,block:method==='eth_call'?params[1]:undefined});
    if(f.mode==='error')throw Error('Provider unavailable. Request details: '+'0xabcdef'.repeat(500));
    if(method==='eth_accounts'){if(f.mode==='pending')await new Promise(resolve=>f.release=resolve);return f.mode==='disconnected'?[]:[address];}
    if(method==='eth_chainId')return f.mode==='wrong-chain'?'0x1':'0xa869';
    if(method==='eth_blockNumber')return '0x2a';
    if(method==='eth_call'){if(params[0].data.startsWith(w.balances))return f.mode==='empty'?w.empty:w.full;const id=Number(BigInt('0x'+params[0].data.slice(-64)));return w.rarities[f.mode==='invalid'?4:id-1];}
    throw Error('Unexpected RPC '+method);
   }};
   if(active){m.state=R.selectRelic(R.acceptRelicSnapshot(m.state,43113,R.RELIC_FIXTURE).state,4).state;m.state=R.startRun(m.state,1,918331).state;}
   R.observeDiscoveriesV4(m.state);m.state.v4.journey.pending=[];m.go('relics');
  },{mode,offline,active,reduced});
  await page.locator('.a6-relic-cabinet').waitFor();return snap();
 };
 const capture=async(label,save=reduced)=>{
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.uv-sheet').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));
  await page.waitForFunction(()=>[...document.images].filter(i=>i.getClientRects().length).every(i=>i.complete&&i.naturalWidth));
  const geometry=await page.locator('.a6-relic-cabinet').evaluate(el=>{const sheet=el.closest('.uv-sheet-content').getBoundingClientRect(),fit=n=>{const r=n.getBoundingClientRect();return r.top>=sheet.top&&r.bottom<=sheet.bottom&&r.left>=sheet.left&&r.right<=sheet.right;};return{overflow:el.scrollWidth>el.clientWidth+1,buttonsFit:[...el.querySelectorAll('button')].every(fit),cardsFit:[...el.querySelectorAll('article')].every(fit),statusFits:fit(el.querySelector('.a6-relic-status')),noteFits:fit(el.querySelector('.a6-relic-note')),galleryHeight:el.querySelector('.a6-relic-collection').clientHeight};});
  expect(geometry.overflow,label).toBe(false);expect(geometry.buttonsFit,label).toBe(true);expect(geometry.cardsFit,label).toBe(true);expect(geometry.statusFits,label).toBe(true);expect(geometry.noteFits,label).toBe(true);expect(geometry.galleryHeight,label).toBeGreaterThan(250);
  if(save){const name=`${width}-${label}.webp`;await page.screenshot({path:output+'/capture.png'});execFileSync('cwebp',['-quiet','-q','82',output+'/capture.png','-o',output+'/'+name]);report.shots.push({name,width,height,label,...geometry});}
  const wallet=await page.evaluate(()=>({calls:window.__relicFixture.calls,styles:[...document.querySelectorAll('.a6-relic-cabinet button:disabled')].map(b=>({selected:b.closest('article')?.dataset.selected==='true',color:getComputedStyle(b).backgroundColor,shadow:getComputedStyle(b).boxShadow}))}));
  expect(wallet.calls.every(c=>['eth_accounts','eth_chainId','eth_blockNumber','eth_call'].includes(c.method)),label+' read-only RPC').toBe(true);expect(wallet.calls.filter(c=>c.method==='eth_call').every(c=>c.block==='0x2a'),label+' pinned block').toBe(true);
  for(const style of wallet.styles){expect(style.color,label+' unavailable style').toBe(style.selected?'rgb(221, 228, 199)':'rgb(221, 213, 197)');expect(style.shadow).toBe('none');}
  report.checks.push({width,height,reduced,label,...geometry,readOnlyRpc:true,pinnedBlock:true,disabledStyles:wallet.styles.length});
 };
 const read=()=>page.getByRole('button',{name:'Read connected wallet',exact:true}),status=page.locator('.a6-relic-status');
 if(process.argv.includes('--navigation-only')){
  await setup('full');await page.evaluate(()=>{const m=window.__depthReview;m.state.cleared=[1,2];m.state.account.cards[0].level=2;m.go('hub');});
  const chip=page.locator('.uv-relic'),before=await snap();await expect(chip).toHaveText('Relic Fuji · +0%');await chip.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'Relics',exact:true})).toHaveAttribute('aria-current','page');await capture('entry');
  await read().focus();await page.keyboard.press('Enter');await expect(status).toContainText('block 42');await page.getByRole('button',{name:'Equip Legendary lantern cup',exact:true}).focus();await page.keyboard.press('Enter');await expect(chip).toHaveText('Relic Fuji · +8%');await capture('entry-equipped');
  await page.getByRole('button',{name:'Gear',exact:true}).click();await page.locator('.a6-relic-cabinet').waitFor({state:'hidden'});await page.getByRole('button',{name:'Relics',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.a6-relic-slot')).toContainText('Team bonus +8%');
  await page.keyboard.press('Escape');await expect(chip).toBeFocused();await page.evaluate(()=>{for(const fn of window.__relicFixture.listeners.get('accountsChanged')??[])fn();});await expect(chip).toHaveText('Relic Fuji · +0%');expect(await snap()).toBe(before);
  report.checks.push({width,height,reduced,keyboardEntry:true,bagReturn:true,closedWalletChange:true,accountUnchanged:true});await context.close();continue;
 }
 for(const[mode,message]of[
  ['absent','Kết nối ví để dùng Relic Fuji. You can keep playing.'],
  ['disconnected','Connect a wallet to this app before reading its Relics.'],
  ['wrong-chain','Select Avalanche Fuji 43113 in your wallet, then retry.'],
  ['error','Could not read your Fuji collection. Try again; you can keep playing.'],
  ['invalid','This collection does not match the supported Fuji Relics. You can keep playing.'],
  ['empty','No supported Relics in this wallet. Your team is ready to play.'],
 ]){
  const before=await setup(mode);await read().focus();await page.keyboard.press('Enter');await expect(status).toHaveText(message);await expect(read()).toBeEnabled();await expect(page.locator('.a6-relic-slot')).toContainText('Team bonus +0%');expect(await snap()).toBe(before);
  await expect(page.getByRole('button',{name:mode==='empty'?'Not in your wallet':'Read wallet first',exact:true})).toHaveCount(4);
  await expect(page.locator('.a6-relic-slot')).toContainText(mode==='empty'?'No supported keepsakes found. You can keep playing.':'Read your connected Fuji wallet to choose a keepsake.');await capture(mode);
  if(mode==='error'){
   await page.evaluate(()=>window.__relicFixture.mode='full');await read().focus();await page.keyboard.press('Enter');await expect(status).toHaveText('Collection read at Fuji block 42. Choose one keepsake.');await expect(page.locator('.a6-relic-slot')).toContainText('Choose a keepsake from your collection.');await capture('retry');
   for(const[name,bonus]of[['Common service cup',2],['Rare mending cup',4],['Epic ringing cup',6],['Legendary lantern cup',8]]){
    const equip=page.getByRole('button',{name:'Equip '+name,exact:true});await equip.focus();await page.keyboard.press('Enter');await expect(page.locator('.a6-relic-slot')).toContainText('Team bonus +'+bonus+'%');expect(await snap()).toBe(before);await capture('equipped-'+bonus,bonus===8&&reduced);
   }
   await page.getByRole('button',{name:'Unequip treasure'}).focus();await page.keyboard.press('Enter');await expect(page.locator('.a6-relic-slot')).toContainText('Team bonus +0%');expect(await snap()).toBe(before);await capture('unequipped',false);
  }
 }
 for(const event of['accountsChanged','chainChanged','disconnect']){
  const before=await setup('full');await read().click();await expect(status).toContainText('block 42');await page.getByRole('button',{name:'Equip Legendary lantern cup'}).click();
  await page.evaluate(event=>{for(const fn of window.__relicFixture.listeners.get(event)??[])fn();},event);await expect(status).toHaveText('Wallet changed. Read your Fuji Relics again.');await expect(page.locator('.a6-relic-slot')).toContainText('Team bonus +0%');expect(await snap()).toBe(before);await capture(event,event==='disconnect'&&reduced);
 }
 const before=await setup('pending');await read().click();await expect(page.getByRole('button',{name:'Reading Fuji…'})).toBeDisabled();await expect(page.getByRole('button',{name:'Reading collection…',exact:true})).toHaveCount(4);await capture('pending');
 await page.evaluate(()=>{for(const fn of window.__relicFixture.listeners.get('accountsChanged')??[])fn();window.__relicFixture.mode='full';window.__relicFixture.release();});
 await expect(status).toHaveText('Wallet changed. Read your Fuji Relics again.');await page.waitForFunction(()=>window.__relicFixture.calls.filter(c=>c.method==='eth_call').length===5);expect(await page.evaluate(()=>window.__depthReview.state.relics)).toEqual([]);expect(await snap()).toBe(before);await capture('stale',false);
 if(reduced){await setup('pending');await read().click();await expect(status).toHaveText('Fuji is taking too long. Try again later; your game is ready.',{timeout:10000});await capture('timeout');await page.evaluate(()=>window.__relicFixture.mode='empty');await read().click();await expect(status).toHaveText('No supported Relics in this wallet. Your team is ready to play.');await page.evaluate(()=>window.__relicFixture.release());await capture('timeout-retry');}
 for(const offline of[false,true]){
  const before=await setup('full',offline,true);await expect(status).toHaveText('Finish your route to change the keepsake.');for(const button of await page.locator('.a6-relic-cabinet button').all())await expect(button).toBeDisabled();expect(await snap()).toBe(before);await capture(offline?'demo-route':'wallet-route');
 }
 await setup('full',true);await page.getByRole('button',{name:'Load demo relics',exact:true}).focus();await page.keyboard.press('Enter');await expect(status).toHaveText('Demo collection loaded. These are sample holdings.');await expect(page.locator('.a6-relic-slot')).toContainText('Choose a keepsake from your collection.');await capture('demo-loaded');
 const calls=await page.evaluate(()=>window.__relicFixture.calls);expect(calls).toEqual([]);
 await page.keyboard.press('Escape');await expect(page.locator('.a6-relic-cabinet')).toHaveCount(0);await expect(page.getByRole('button',{name:'Open menu'})).toBeFocused();
 report.checks.push({width,height,reduced,returnToCafe:true,keyboard:true});await context.close();
}expect(report.errors).toEqual([]);report.complete=true;
}finally{await browser.close();await writeFile(output+'/review.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({checks:report.checks.length,shots:report.shots.length,errors:report.errors,complete:report.complete}));
