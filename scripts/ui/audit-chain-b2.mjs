/** Chain-room U1 screenshots against disposable local Anvil, never Fuji writes. */
import {createRequire} from 'node:module';import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {measureScreen} from './measure-screen.mjs';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url)),{chromium}=require('@playwright/test');
const browser=await chromium.launch({headless:true});const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),rows=[],errors=[];
p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));
const save=()=>writeFileSync('reports/v3-shell/b2/UI-AUDIT-CHAIN-RAW.json',JSON.stringify({method:'Disposable Anvil at 8546; local API at 5997; local web at 5996. Public test fixtures only; no live transactions.',screens:rows,errors},null,2)+'\n');
const capture=async(id,notes=[])=>{await p.waitForTimeout(300);const m=await p.evaluate(measureScreen),path=`reports/v3-shell/b2/shots/ui-before/${id}.png`;await p.screenshot({path});rows.push({id,family:id.startsWith('market')?'market':'wallet',viewport:{width:1280,height:720},screenshot:{path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')},...m,notes});save();console.log(id,m.visibleWords,m.plainTextButtons);};
const tab=async name=>{await p.getByRole('navigation',{name:'Chain screens'}).getByRole('button',{name,exact:true}).click();await p.waitForTimeout(500);};
try{
 await p.addInitScript(()=>localStorage.setItem('lantern.coach.v3','{"disabled":true}'));
 await p.goto('http://127.0.0.1:5996/?demo=1&squad=1&cardrpg2=1&a6=1&formationc2=1');
 await p.getByRole('button',{name:'Play free',exact:true}).click();await p.locator('.uv-shell').waitFor();
 await p.evaluate(()=>window.dispatchEvent(new Event('chain:wallet')));await p.locator('.chain-panel').waitFor();await capture('wallet-panel');await p.getByRole('button',{name:'Close Fuji',exact:true}).click();
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('chain:open',{detail:'Market'})));await p.locator('.chain-room').waitFor();await p.getByRole('button',{name:'Buy',exact:true}).first().waitFor();
 await capture('market-browse',['Market has no separate item-detail panel; item art/name/price are embedded in each listing.']);
 await p.getByRole('button',{name:'Buy',exact:true}).first().click();await p.locator('.chain-success').waitFor().catch(()=>{});await capture('market-buy',['Local fixture purchase. No purchase confirmation dialog exists; Buy directly submits.']);
 await p.getByRole('button',{name:'Close receipt',exact:true}).click();
 await p.getByRole('button',{name:'Mine',exact:true}).click();await capture('market-my-listings');
 await tab('Bag');await capture('market-list',['Listing fields are embedded in the Bag item card; no dedicated listing dialog.']);
 await tab('Judge');await p.getByRole('button',{name:'Judge pass',exact:false}).click();await p.getByRole('button',{name:'Fight boss',exact:false}).click();
 await tab('Café');await p.getByRole('button',{name:'Complete quest',exact:true}).waitFor();await capture('wallet-cafe');
 await p.getByRole('button',{name:'Complete quest',exact:true}).click();await p.getByRole('button',{name:'Mint free Deed',exact:true}).waitFor();await capture('wallet-deed');
 await p.getByRole('button',{name:'Mint free Deed',exact:true}).click();await p.locator('.b-chain-receipts a').first().waitFor({timeout:60000});
 for(const name of ['Withdraw','Seal','Fusion','Spool']){await p.locator('.b-economy-play > nav').getByRole('button',{name,exact:true}).click();await capture(`wallet-${name.toLowerCase()}`);}
 await tab('History');await p.waitForTimeout(1000);await capture('wallet-history');
 await tab('Style');await capture('wallet-style');
 await tab('Forge');await capture('wallet-ornament-forge');
 await p.context().setOffline(true);await p.getByRole('button',{name:'Refresh chain',exact:true}).click();await p.waitForTimeout(700);await capture('wallet-offline');
}catch(e){errors.push(e.message);throw e;}finally{save();await browser.close();}
