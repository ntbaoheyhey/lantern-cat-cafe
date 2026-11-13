import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {sha} from './runtime.mjs';
import {openAudioScreen} from '../../../scripts/audio/ui-fixtures.mjs';
Object.assign(process.env,{CHAIN_LOCAL_WEB_PORT:'5996',CHAIN_LOCAL_API_PORT:'5997',CHAIN_LOCAL_RPC_PORT:'8546'});
const {startLocal,devAccount,walletFor,artifact}=await import('../local.mjs');
const require=createRequire(new URL('../../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test'),{parseEther}=require('viem');
const B='reports/v3-shell/b2/econ';mkdirSync(`${B}/shots`,{recursive:true});
const local=await startLocal({web:true}),browser=await chromium.launch({headless:true,args:['--autoplay-policy=no-user-gesture-required']});
const p=await browser.newPage({viewport:{width:1280,height:720},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
const report={fixture:'Throwaway local Anvil only. Judge quest is real; eight additional bound Stars and Worn quality on its earned Epic are explicit visual-test fixtures, not claimed production rewards. Treasury transfers fund the test wallet. Browser signs real burn transactions.',sinks:[],errors};
try{
 await openAudioScreen(p,'wallet-deed');
 const wallet=await p.evaluate(async()=>{const g=await import('/src/game/cardrpg/chain/guest.ts');return g.existingGuestAddress();});assert(wallet);
 const row=(await local.db.query('select player_id,state from chain_v3_accounts where wallet=$1',[wallet.toLowerCase()])).rows[0];assert(row);
 const s=structuredClone(row.state);s.stars+=8;s.gear[0].quality=1000;
 await local.db.query('update chain_v3_accounts set state=$2,revision=revision+1 where player_id=$1',[row.player_id,JSON.stringify(s)]);
 const w=walletFor(devAccount(0)),hash=await w.writeContract({address:local.config.YarnToken,abi:artifact('YarnToken').abi,functionName:'transfer',args:[wallet,parseEther('30')]});
 assert.equal((await local.client.waitForTransactionReceipt({hash})).status,'success');
 await p.reload();await p.locator('.uv-shell').waitFor();await p.keyboard.press('Shift');
 await p.evaluate(()=>window.dispatchEvent(new CustomEvent('chain:open',{detail:'Café'})));await p.getByRole('button',{name:'Studio',exact:true}).waitFor();
 const ledger=async()=>(await local.db.query('select state from chain_v3_accounts where player_id=$1',[row.player_id])).rows[0].state;
 for(const [id,label] of [['polish','Polish'],['decor','Decor'],['display','Showcase']]){
  await p.getByRole('button',{name:'Studio',exact:true}).click();
  const dialog=p.getByRole('dialog',{name:'Café studio',exact:true});await dialog.waitFor();await dialog.getByRole('button',{name:label,exact:true}).click();
  const text=await dialog.getByLabel('Recipe cost and odds').innerText();assert(text.includes('100%'));
  const screenshot=`${B}/shots/sink-${id}.png`;await p.waitForTimeout(250);await p.screenshot({path:screenshot});
  const before=await ledger(),supply=await local.client.readContract({address:local.config.YarnToken,abi:artifact('YarnToken').abi,functionName:'totalSupply'});
  await dialog.getByRole('button',{name:'Review burn'}).click();
  const confirm=p.getByRole('dialog',{name:'Confirm',exact:true});await confirm.waitFor();assert((await confirm.innerText()).includes('100%'));
  await confirm.getByRole('button',{name:'Confirm & unlock',exact:true}).click();await confirm.waitFor({state:'hidden',timeout:30000});
  const after=await ledger(),intent=after.intents.at(-1);assert.equal(intent.kind,'sink');assert.equal(intent.recipe.id,id);assert.equal(intent.ready,true);
  assert.equal(before.stars-after.stars,intent.recipe.starThread);
  const paid=await local.client.readContract({address:local.config.YarnToken,abi:artifact('YarnToken').abi,functionName:'sealPayments',args:[wallet,local.modules.economyIntentHash(intent.id)]});assert.equal(paid,BigInt(intent.cost));
  const afterSupply=await local.client.readContract({address:local.config.YarnToken,abi:artifact('YarnToken').abi,functionName:'totalSupply'});assert.equal(supply-afterSupply,paid);
  if(id==='polish')assert.equal(after.gear.find(g=>g.id===intent.recipe.item.id).quality,intent.recipe.quality);
  else assert(after.styles.includes(intent.recipe.style));
  const href=await p.locator('.b-chain-receipts a').last().getAttribute('href'),transactionHash=href.split('/').at(-1),receipt=await local.client.waitForTransactionReceipt({hash:transactionHash});assert.equal(receipt.status,'success');
  report.sinks.push({id,quote:text,benefit:intent.recipe.benefit,stars:intent.recipe.starThread,yarnBurn:intent.cost,transactionHash,status:receipt.status,blockNumber:Number(receipt.blockNumber),screenshot:{path:screenshot,sha256:sha(screenshot)},supplyDelta:paid.toString()});
  console.log(`PASS ${id}: visible quote, exact burn, persisted benefit`);
 }
 assert.equal(errors.length,0);writeFileSync(`${B}/SINK-BROWSER.json`,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();await local.stop();}
