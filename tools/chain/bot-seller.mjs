// Operator-run Fuji bot. Never reads .env; never creates or mints supply.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,dirname} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const req=createRequire(resolve(root,'apps/web/package.json'));
const load=name=>import(pathToFileURL(req.resolve(name).replace('/_cjs/','/_esm/')));
const {createPublicClient,createWalletClient,http,parseEther}=await load('viem');
const {privateKeyToAccount}=await load('viem/accounts');
const {avalancheFuji}=await load('viem/chains');
const abi=name=>JSON.parse(readFileSync(resolve(root,`contracts/out/${name}.sol/${name}.json`),'utf8')).abi;
export async function keepListings({client,wallet,nft,market,price=parseEther('0.001'),target=4,version='v1',currency=0}) {
  if(await client.getChainId()!==43113||await wallet.getChainId()!==43113)throw new Error('Fuji required');
  if(target<3||target>6||price<=0n)throw new Error('Invalid bot settings');
  const marketAbi=abi(version==='v2'?'RelicMarketV2':'RelicMarket'),nftAbi=abi('RelicNFT'),owner=wallet.account.address;
  const count=await client.readContract({address:market,abi:marketAbi,functionName:'activeListingCount'});
  let own=0;
  for(let offset=0n;offset<count;offset+=100n){
    const [,items]=await client.readContract({address:market,abi:marketAbi,functionName:'getListings',args:[offset,100n]});
    own+=items.filter(l=>l.seller.toLowerCase()===owner.toLowerCase()).length;
  }
  if(own>=3)return {active:own,added:0};
  const send=async(address,contractAbi,functionName,args)=>{
    const hash=await wallet.writeContract({address,abi:contractAbi,functionName,args});
    if((await client.waitForTransactionReceipt({hash})).status!=='success')throw new Error('Transaction failed');
  };
  let added=0;
  for(const id of [1n,2n,3n,4n]){
    const balance=await client.readContract({address:nft,abi:nftAbi,functionName:'balanceOf',args:[owner,id]});
    if(!balance)continue;
    const approved=await client.readContract({address:nft,abi:nftAbi,functionName:'isApprovedForAll',args:[owner,market]});
    if(!approved)await send(nft,nftAbi,'setApprovalForAll',[market,true]);
    for(let amount=0n;amount<balance&&own+added<target;amount++){
      await send(market,marketAbi,'list',version==='v2'?[id,1n,price,currency]:[id,1n,price]);added++;
    }
    if(own+added>=target)break;
  }
  return {active:own+added,added};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(!process.argv.includes('--run')){
    console.log('Build contracts, then BOT_PRIVATE_KEY from your shell/secret manager: node tools/chain/bot-seller.mjs --run [--once]. Fuji only; requires funded AVAX and owned Relics. No minting.');
  }else try{
    const key=process.env.BOT_PRIVATE_KEY;
    if(!key||!/^0x[0-9a-fA-F]{64}$/.test(key))throw new Error('Missing bot key');
    const rpc=process.env.FUJI_RPC_URL||avalancheFuji.rpcUrls.default.http[0];
    const client=createPublicClient({chain:avalancheFuji,transport:http(rpc)});
    if(await client.getChainId()!==43113)throw new Error('Wrong chain');
    const wallet=createWalletClient({chain:avalancheFuji,account:privateKeyToAccount(key),transport:http(rpc)});
    const addresses=JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'),'utf8'));
    do{
      const v2=process.argv.includes('--v2');
      const result=await keepListings({client,wallet,nft:addresses.RelicNFT,market:v2?process.env.MARKET_V2_ADDRESS:addresses.RelicMarket,version:v2?'v2':'v1',currency:v2?1:0,price:parseEther(v2?(process.env.BOT_PRICE_YARN||'1'):(process.env.BOT_PRICE_AVAX||'0.001'))});
      console.log(`${result.active} active listings; ${result.added} replenished.${result.active<3?' Add owned Relics to the bot wallet.':''}`);
      if(process.argv.includes('--once'))break;
      await new Promise(r=>setTimeout(r,30000));
    }while(true);
  }catch{console.error('Bot stopped. Check Fuji RPC, BOT_PRIVATE_KEY, gas and owned Relics. No secret values logged.');process.exitCode=1;}
}
