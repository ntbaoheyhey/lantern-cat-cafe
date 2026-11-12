import assert from 'node:assert/strict';
import {startLocal,devAccount,walletFor,artifact} from './local.mjs';
const r=await startLocal({web:false});
try{
 const {config:c,client,modules:m}=r,source=devAccount(5),target=devAccount(6),buyer=devAccount(7),signer=devAccount(2);
 const abi=name=>artifact(name).abi,send=async(account,address,name,fn,args,value)=>{const hash=await walletFor(account).writeContract({address,abi:abi(name),functionName:fn,args,...(value===undefined?{}:{value})});assert.equal((await client.waitForTransactionReceipt({hash})).status,'success');return hash;};
 const publicSigner=m.voucherSigner(`0x${Buffer.from(signer.getHdKey().privateKey).toString('hex')}`,c.RelicNFT);
 for(const [i,id] of [1n,2n,10001n].entries()){
   const v={player:source.address,relicId:id,rarity:id===10001n?1:Number(id)-1,nonce:BigInt(100+i),expiry:BigInt(Math.floor(Date.now()/1000)+600)};
   await send(source,c.RelicNFT,'RelicNFT','mint',[v,await publicSigner.sign(v)]);
 }
 for(const market of [c.RelicMarket,c.RelicMarketV2])await send(source,c.RelicNFT,'RelicNFT','setApprovalForAll',[market,true]);
 await send(source,c.RelicMarket,'RelicMarket','list',[1n,1n,1n]);
 await send(source,c.RelicMarketV2,'RelicMarketV2','list',[2n,1n,0n,1]);
 const soldId=await client.readContract({address:c.RelicMarketV2,abi:abi('RelicMarketV2'),functionName:'nextListingId'});
 await send(source,c.RelicMarketV2,'RelicMarketV2','list',[10001n,1n,10n**18n,1]);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[source.address,7n*10n**18n]);
 await send(devAccount(0),c.YarnToken,'YarnToken','transfer',[buyer.address,10n**18n]);
 await send(buyer,c.YarnToken,'YarnToken','approve',[c.RelicMarketV2,10n**18n]);await send(buyer,c.RelicMarketV2,'RelicMarketV2','buy',[soldId]);
 const balanceBefore=await client.getBalance({address:target.address}),hashes=[];
 const runtime=m.chainRuntime(c,walletFor(source),source.address);
 await m.moveGuestAssets(await runtime.moveAdapter(m.CHAIN_ITEM_IDS),target.address,h=>hashes.push(h));
 for(const id of [1n,2n]){assert.equal(await client.readContract({address:c.RelicNFT,abi:abi('RelicNFT'),functionName:'balanceOf',args:[target.address,id]}),1n);assert.equal(await client.readContract({address:c.RelicNFT,abi:abi('RelicNFT'),functionName:'balanceOf',args:[source.address,id]}),0n);}
 assert.equal(await client.readContract({address:c.YarnToken,abi:abi('YarnToken'),functionName:'balanceOf',args:[target.address]}),795n*10n**16n);
 assert.equal(await client.readContract({address:c.YarnToken,abi:abi('YarnToken'),functionName:'balanceOf',args:[source.address]}),0n);
 assert.equal(await client.readContract({address:c.RelicMarketV2,abi:abi('RelicMarketV2'),functionName:'proceeds',args:[source.address,1]}),0n);
 assert.equal(await client.getBalance({address:source.address}),0n);assert((await client.getBalance({address:target.address}))>balanceBefore);
 assert.equal(hashes.length,3);console.log('PASS: V1/V2 escrow cancelled, YARN proceeds withdrawn, Relics + YARN + remaining AVAX moved via browser adapter.');
}finally{await r.stop();}
