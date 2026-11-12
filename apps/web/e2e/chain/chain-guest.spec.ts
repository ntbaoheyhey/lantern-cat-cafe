import { expect, test, type Page, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createPublicClient, getAddress, http, parseEther, type Address, type Hash } from 'viem';
import { avalancheFuji } from 'viem/chains';
import { relicMarketAbi, relicNftAbi } from '../../../../packages/chain/src/abi';
const route='/?demo=1&squad=1&cardrpg2=1&a6=1';
const client=createPublicClient({chain:avalancheFuji,transport:http('http://127.0.0.1:5981')});
const config=()=>JSON.parse(readFileSync('public/chain-local.json','utf8')) as {RelicNFT:Address;RelicMarket:Address};
const holding=(who:Address,id:bigint)=>client.readContract({address:config().RelicNFT,abi:relicNftAbi,functionName:'balanceOf',args:[who,id]});
async function login(page:Page){
  await page.goto(route);await page.getByRole('button',{name:'▶ Play as guest'}).click();
  await expect(page.getByTestId('chain-gas')).toHaveText('▲ 0.0500');
  const who=getAddress((await page.getByTestId('chain-address').getAttribute('title'))!);
  expect(await client.getBalance({address:who})).toBe(parseEther('0.05'));
  await page.getByRole('button',{name:'◈ Market',exact:true}).click();
  return {who,room:page.getByRole('dialog',{name:'Fuji market',exact:true})};
}
async function receipt(room:Locator){
  const result=room.getByRole('dialog',{name:'Transaction confirmed'});await expect(result).toBeVisible();
  const hash=(await result.locator('code').innerText()) as Hash;
  expect((await client.getTransactionReceipt({hash})).status).toBe('success');
  await expect(result.getByRole('link',{name:'↗ Snowtrace'})).toHaveAttribute('href',`https://testnet.snowtrace.io/tx/${hash}`);
  await result.getByRole('button',{name:'Close receipt'}).click();return hash;
}
async function tab(room:Locator,name:string){await room.getByRole('navigation',{name:'Chain screens'}).getByRole('button',{name,exact:true}).click();}
async function artReady(room:Locator){await room.locator('img').evaluateAll(async imgs=>{await Promise.all(imgs.map(i=>(i as HTMLImageElement).decode()));});}
async function findListing(room:Locator,id:bigint){
  const row=room.getByTestId(`listing-${id}`);
  if(!await row.count())await room.getByRole('button',{name:'Next listings'}).click();
  await expect(row).toBeVisible();return row;
}
test('guest → drip → scripted boss → mint → list → second guest buy → cancel; balances are real',async({page,browser})=>{
  const began=Date.now(),seller=await login(page),room=seller.room;
  await room.getByRole('button',{name:'🎟 Judge pass'}).click();
  await expect(room.locator('[data-testid^="voucher-"]')).toHaveCount(2);
  await room.getByRole('button',{name:'⚔ Fight boss'}).click();await expect(room.getByRole('button',{name:'✓ Victory'})).toBeVisible();
  await room.getByRole('button',{name:'Next vouchers'}).click();
  await room.getByTestId('voucher-3').getByRole('button',{name:'✦ Mint to Fuji'}).click();
  const mintHash=await receipt(room);expect(await holding(seller.who,3n)).toBe(1n);
  await tab(room,'Bag');await expect(room.getByTestId('holding-3')).toBeVisible();
  await room.getByTestId('holding-3').getByRole('button',{name:'◇ Treasure'}).click();
  await expect(room.getByAltText('Mochi Treasure')).toBeVisible();
  await room.getByTestId('holding-3').getByRole('button',{name:'↑ List'}).click();
  await room.getByRole('textbox',{name:'Price in AVAX'}).fill('0.001234567891234567');
  const listingId=await client.readContract({address:config().RelicMarket,abi:relicMarketAbi,functionName:'nextListingId'});
  await room.getByRole('button',{name:'✓ Confirm',exact:true}).click();const listHash=await receipt(room);
  expect(await holding(seller.who,3n)).toBe(0n);expect(await holding(config().RelicMarket,3n)).toBe(2n); // bot + seller escrow
  await expect(room.getByTestId('holding-3')).toHaveCount(0);await expect(room.getByAltText('Mochi Treasure')).toHaveCount(0);
  const sellerBefore=await client.getBalance({address:seller.who});
  const second=await browser.newContext({baseURL:'http://127.0.0.1:5980',viewport:{width:1280,height:900}});
  try{
    const buyerPage=await second.newPage(),buyer=await login(buyerPage);expect(buyer.who).not.toBe(seller.who);
    await tab(buyer.room,'Market');const row=await findListing(buyer.room,listingId);
    await row.getByRole('button',{name:'↓ Buy'}).click();const buyHash=await receipt(buyer.room);
    expect(await holding(buyer.who,3n)).toBe(1n);expect(await holding(seller.who,3n)).toBe(0n);
    expect(await client.getBalance({address:seller.who})).toBe(sellerBefore+parseEther('0.001234567891234567'));
    await tab(buyer.room,'Bag');await expect(buyer.room.getByTestId('holding-3')).toBeVisible();
    await buyer.room.getByTestId('holding-3').getByRole('button',{name:'↑ List'}).click();
    await buyer.room.getByRole('textbox',{name:'Price in AVAX'}).fill('0.000000000000000001');
    const cancelId=await client.readContract({address:config().RelicMarket,abi:relicMarketAbi,functionName:'nextListingId'});
    await buyer.room.getByRole('button',{name:'✓ Confirm',exact:true}).click();await receipt(buyer.room);
    expect(await holding(buyer.who,3n)).toBe(0n);
    await tab(buyer.room,'Market');await buyer.room.getByRole('button',{name:'☐ Mine'}).click();
    await buyer.room.getByTestId(`listing-${cancelId}`).getByRole('button',{name:'↩ Cancel'}).click();const cancelHash=await receipt(buyer.room);
    expect(await holding(buyer.who,3n)).toBe(1n);
    expect(await client.readContract({address:config().RelicMarket,abi:relicMarketAbi,functionName:'isActive',args:[cancelId]})).toBe(false);
    await tab(buyer.room,'History');await expect(buyer.room.getByRole('link',{name:new RegExp(cancelHash.slice(0,10))})).toBeVisible();
    await buyerPage.screenshot({path:'../../reports/chain/shots/H3-history.png'});
    test.info().annotations.push({type:'transactions',description:JSON.stringify({mintHash,listHash,buyHash,cancelHash,elapsedMs:Date.now()-began})});
  }finally{await second.close();}
  expect(Date.now()-began).toBeLessThan(120000);
  await tab(room,'Market');await artReady(room);await page.screenshot({path:'../../reports/chain/shots/H3-market.png'});
  await page.setViewportSize({width:390,height:844});await artReady(room);
  await expect(room.getByRole('button',{name:'Close market'})).toBeInViewport();
  await page.screenshot({path:'../../reports/chain/shots/H4-mobile.png'});
});
