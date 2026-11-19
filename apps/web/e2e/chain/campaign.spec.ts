import {enterGuest, openMarket, chainTab} from './navigation';
import {test,expect,type Page,type Locator} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {createPublicClient,http,parseEther,type Address} from 'viem';
import {avalancheFuji} from 'viem/chains';
import {relicNftAbi,relicMarketV2Abi,yarnTokenAbi,seasonRewardsAbi} from '../../../../packages/chain/src/abi';
import {TRADE_BY_ID} from '../../../../packages/game-rules/src/cardrpg/trade';
const client=createPublicClient({chain:avalancheFuji,transport:http('http://127.0.0.1:5981')});
const config=()=>JSON.parse(readFileSync('public/chain-local.json','utf8')) as Record<string,Address>;
async function login(page:Page){
 await enterGuest(page);
 await expect(page.getByTestId('chain-gas')).toHaveText('0.0500');
 const who=(await page.getByTestId('chain-address').getAttribute('title')) as Address;
 await openMarket(page,true);
 return {who,room:page.getByRole('dialog',{name:'Fuji market',exact:true})};
}
const tab=chainTab;
async function receipt(room:Locator){const sheet=room.page().getByRole('dialog',{name:'Confirmed',exact:true});await expect(sheet).toBeVisible();await sheet.getByRole('button',{name:'Close receipt'}).click();}
test('server campaign → earned Epic → lost export response → seal → trade; no offline copy or duplicated mint',async({page,browser})=>{
 const c=config(),seller=await login(page),room=seller.room;
 const projections:unknown[]=[];const exports:{id:string;revision:number}[]=[];let lost=false;
 await page.route('**/functions/v1/chain-campaign',async route=>{
  const input=route.request().postDataJSON(),response=await route.fetch(),json=await response.json();projections.push(json);
  if(input.command?.type==='export'){
   exports.push({id:input.id,revision:input.revision});
   if(!lost){lost=true;await route.abort('failed');return;}
  }
  await route.fulfill({response,json});
 });
 await tab(room,'Campaign');const panel=room.getByRole('region',{name:'Campaign',exact:true});
 const progress=panel.getByTestId('campaign-progress');await expect(progress).toHaveAttribute('data-revision','0');
 const initialRewards=room.getByRole('region',{name:'Campaign rewards',exact:true});await initialRewards.getByRole('button',{name:'Weekly',exact:true}).click();await expect(initialRewards.getByRole('alert')).toHaveText('Win a boss first.');
 const advance=async(action:Locator)=>{const revision=Number(await progress.getAttribute('data-revision'));await action.click();await expect(progress).toHaveAttribute('data-revision',String(revision+1));};
 await panel.getByRole('button',{name:'Crew',exact:true}).click();
 for(const cat of ['mochi','soot','clover'])await advance(panel.getByRole('button',{name:'Train '+cat}));
 await panel.getByRole('button',{name:'Route',exact:true}).click();
 await advance(panel.getByRole('button',{name:'Start 1',exact:true}));
 for(let step=0;step<40&&!['won','lost'].includes((await progress.getAttribute('data-phase'))!);step++){
  const choices=panel.getByTestId('campaign-choice');
  const names=await choices.allTextContents();
  const preferred=['recycle','brew','leave','Points','Heal'].find(n=>names.includes(n));
  await advance(preferred?panel.getByRole('button',{name:preferred,exact:true}):choices.first());
 }
 await expect(progress).toHaveAttribute('data-phase','won');
 const rewards=room.getByRole('region',{name:'Campaign rewards',exact:true});
 const balance=()=>client.readContract({address:c.YarnToken!,abi:yarnTokenAbi,functionName:'balanceOf',args:[seller.who]});
 const beforeClaim=await balance();
 await rewards.getByRole('button',{name:'Weekly',exact:true}).click();
 await expect(rewards.getByLabel('Campaign reward amount')).toHaveText('1.5');
 await rewards.getByRole('button',{name:'Claim',exact:true}).click();await receipt(room);
 expect(await balance()).toBe(beforeClaim+parseEther('1.5'));
 await expect(rewards.getByText('Claimed',{exact:true})).toBeVisible();
 // Reopening quotes recovers on-chain payment without creating a new nonce.
 await rewards.getByRole('button',{name:'Close',exact:true}).click();
 await rewards.getByRole('button',{name:'Weekly',exact:true}).click();
 await expect(rewards.getByText('Claimed',{exact:true})).toBeVisible();expect(await balance()).toBe(beforeClaim+parseEther('1.5'));
 await rewards.getByRole('button',{name:'Close',exact:true}).click();
 await rewards.getByRole('button',{name:'Rank',exact:true}).click();await expect(rewards.getByRole('alert')).toHaveText('Season still open.');
 const currentWeek=await client.readContract({address:c.SeasonRewards!,abi:seasonRewardsAbi,functionName:'currentWeek'});
 expect(await client.readContract({address:c.SeasonRewards!,abi:seasonRewardsAbi,functionName:'routineClaimedInWeek',args:[seller.who,currentWeek]})).toBe(parseEther('1.5'));

 await panel.getByRole('button',{name:'Export',exact:true}).click();
 const item=panel.getByTestId('campaign-export');await expect(item).toBeVisible();
 const itemId=(await item.getAttribute('data-item'))!,token=BigInt(TRADE_BY_ID[itemId]!.tokenId!);
 await page.setViewportSize({width:390,height:844});expect(await room.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.screenshot({path:'../../reports/chain/shots/H4-campaign-mobile.png'});
 await page.setViewportSize({width:1280,height:900});
 await item.getByRole('button',{name:'Export'}).click();await item.getByRole('button',{name:'Confirm'}).click();
 await expect(panel.getByRole('alert')).toHaveText('Unavailable. Retry.');
 const committedRevision=Number(await progress.getAttribute('data-revision'))+1;
 await page.reload();await openMarket(page);await tab(room,'Campaign');
 await expect(progress).toHaveAttribute('data-revision',String(committedRevision));
 await panel.getByRole('button',{name:'Export',exact:true}).click();await expect(panel.getByTestId('campaign-export')).toHaveCount(0);
 expect(exports).toHaveLength(2);expect(exports[1]).toEqual(exports[0]);
 for(const json of projections)for(const field of ['seed','origins','snapshot','lastBattle','request_hash'])expect(JSON.stringify(json)).not.toContain('"'+field+'"');
 await tab(room,'Judge');await room.getByRole('button',{name:'Judge pass'}).click();await room.getByRole('button',{name:'Claim',exact:true}).click();await receipt(room);
 await tab(room,'Seal');const drop=room.getByTestId('drop-'+itemId);await expect(drop).toHaveCount(1);
 const supply=()=>client.readContract({address:c.YarnToken!,abi:yarnTokenAbi,functionName:'totalSupply'});
 const holding=(owner:Address)=>client.readContract({address:c.RelicNFT!,abi:relicNftAbi,functionName:'balanceOf',args:[owner,token]});
 const beforeSeal=await supply(),sealCost=parseEther(process.env.CHAIN_SEAL_PRICE_TRIAL==='1'?'5':'10');
 await expect(drop.locator('output')).toHaveText(''+(process.env.CHAIN_SEAL_PRICE_TRIAL==='1'?'5':'10'));
 await drop.getByRole('button',{name:'Seal to Fuji'}).click();await receipt(room);expect(await holding(seller.who)).toBe(1n);expect(await supply()).toBe(beforeSeal-sealCost);
 // A refresh/recovery of the same source retains exactly one minted unit.
 await room.getByRole('button',{name:'Refresh chain'}).click();await expect(drop.getByRole('button',{name:'Recover'})).toBeVisible();
  await drop.getByRole('button',{name:'Recover'}).click();await expect(room.locator('footer').getByRole('status')).toHaveText('');expect(await holding(seller.who)).toBe(1n);
 await tab(room,'Bag');await room.getByLabel('Currency',{exact:true}).selectOption('1');await room.getByTestId('holding-'+token).getByRole('button',{name:'List'}).click();
 const price=parseEther('1.234567891234567891');await room.page().getByRole('dialog',{name:'List',exact:true}).getByRole('textbox',{name:'Price in YARN'}).fill('1.234567891234567891');
 const listing=await client.readContract({address:c.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'nextListingId'});
 await room.page().getByRole('dialog',{name:'List',exact:true}).getByRole('button',{name:'Confirm',exact:true}).click();await receipt(room);expect(await holding(seller.who)).toBe(0n);
 const other=await browser.newContext({baseURL:'http://127.0.0.1:5980'});
 try{
  const buyer=await login(await other.newPage());await tab(buyer.room,'Judge');await buyer.room.getByRole('button',{name:'Judge pass'}).click();await buyer.room.getByRole('button',{name:'Claim',exact:true}).click();await receipt(buyer.room);
  await tab(buyer.room,'Market');await buyer.room.getByLabel('Currency',{exact:true}).selectOption('1');
  const lot=buyer.room.getByTestId('listing-'+listing);while(!await lot.count())await buyer.room.getByRole('button',{name:'Next listings'}).click();
  const beforeSale=await supply(),fee=price*500n/10000n,burn=fee*4000n/10000n;
  const treasuryBefore=await client.readContract({address:c.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'proceeds',args:[c.treasury!,1]});
  await lot.getByRole('button',{name:'Buy'}).click();await buyer.room.page().getByRole('dialog',{name:'Buy',exact:true}).getByRole('button',{name:'Confirm purchase',exact:true}).click();await receipt(buyer.room);
  expect(await holding(buyer.who)).toBe(1n);expect(await holding(seller.who)).toBe(0n);expect(await supply()).toBe(beforeSale-burn);
  expect(await client.readContract({address:c.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'proceeds',args:[c.treasury!,1]})).toBe(treasuryBefore+fee-burn);
  expect(await client.readContract({address:c.RelicMarketV2!,abi:relicMarketV2Abi,functionName:'proceeds',args:[seller.who,1]})).toBe(price-fee);
 }finally{await other.close();}
});
