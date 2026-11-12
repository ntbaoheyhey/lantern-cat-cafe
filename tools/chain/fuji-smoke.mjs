// User-run only on public Fuji. --dry-run uses a fresh disposable localhost chain.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {root,startLocal,devAccount,localApi,localOrigin,artifact} from './local.mjs';
import {safeFailure} from './diagnose-rewards.mjs';
const req=createRequire(resolve(root,'apps/web/package.json')),load=n=>import(pathToFileURL(req.resolve(n).replace('/_cjs/','/_esm/')));
const {createPublicClient,createWalletClient,http,parseEther,getAddress}=await load('viem');
const {privateKeyToAccount}=await load('viem/accounts');const {avalancheFuji}=await load('viem/chains');
const {createSiweMessage}=await load('viem/siwe');
const dry=process.argv.includes('--dry-run');
if(!dry&&!process.argv.includes('--fuji')){console.log('Usage: node tools/chain/fuji-smoke.mjs --dry-run | --fuji. Public mode needs two test wallets in env, public contract addresses, SUPABASE_URL and WEB_ORIGIN.');process.exit(0);}
let local,stage='configuration',passed=false,failure;const receipts=[];let config;
try{
 if(dry)local=await startLocal({web:false});
 config=dry?local.config:{...JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'),'utf8')),rpcUrl:process.env.FUJI_RPC_URL||avalancheFuji.rpcUrls.default.http[0],YarnToken:getAddress(process.env.YARN_TOKEN_ADDRESS||''),RelicMarketV2:getAddress(process.env.MARKET_V2_ADDRESS||''),SeasonRewards:getAddress(process.env.SEASON_REWARDS_ADDRESS||'')};
 const client=createPublicClient({chain:avalancheFuji,transport:http(config.rpcUrl),pollingInterval:100});assert.equal(await client.getChainId(),43113);
 const seller=dry?devAccount(5):privateKeyToAccount(process.env.SMOKE_SELLER_PRIVATE_KEY||''),buyer=dry?devAccount(6):privateKeyToAccount(process.env.SMOKE_BUYER_PRIVATE_KEY||'');assert.notEqual(seller.address,buyer.address);
 const api=dry?localApi:process.env.SUPABASE_URL,origin=dry?localOrigin:new URL(process.env.WEB_ORIGIN).origin;
 const abi=n=>artifact(n).abi;
 const read=(name,address,fn,args=[])=>client.readContract({address,abi:abi(name),functionName:fn,args});
 const post=async(name,body={},token)=>{const response=await fetch(`${api}/functions/v1/${name}`,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});assert.equal(response.status,200,`HTTP ${name}`);return response.json();};
 const record=async(label,hash)=>{assert.equal((await client.waitForTransactionReceipt({hash,timeout:60000})).status,'success');receipts.push({label,hash});return hash;};
 const send=async(account,address,name,fn,args,value)=>{
   stage=`${name}.${fn}`;
   const wallet=createWalletClient({chain:avalancheFuji,account,transport:http(config.rpcUrl)});
   const simulation=await client.simulateContract({account:account.address,address,abi:abi(name),functionName:fn,args,...(value===undefined?{}:{value})});
   // Simulation carries an address-only account. Restore the local signer so
   // public RPCs receive a signed transaction instead of a request to sign it.
   return record(stage,await wallet.writeContract({...simulation.request,account}));
 };
 const login=async(account)=>{
   stage='SIWE';const {nonce}=await post('auth-nonce');const message=createSiweMessage({address:account.address,domain:new URL(origin).host,uri:origin,version:'1',chainId:43113,nonce,statement:'Sign in to Taskbar Hero.',issuedAt:new Date(),expirationTime:new Date(Date.now()+600000)});
   const session=await post('auth-verify',{message,signature:await account.signMessage({message})});
   if(dry)await client.request({method:'anvil_setBalance',params:[account.address,'0x0']});
   stage='guest-drip';const drip=await post('guest-drip',{},session.token);await record('guest-drip',drip.txHash);
   assert((await client.getBalance({address:account.address}))>0n);return session.token;
 };
 const s=await login(seller),b=await login(buyer);
 stage='judge pass';await post('chain-judge',{action:'pass'},s);await post('chain-judge',{action:'pass'},b);
 stage='authoritative boss';const pass=await post('chain-judge',{action:'boss'},s);assert.equal(pass.battle.won,true);
 const mint=async(account,v)=>{assert.equal(v.used,false);return send(account,config.RelicNFT,'RelicNFT','mint',[{player:v.player,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature]);};
 const claim=async(account,token)=>{stage='tester grant';const r=await post('chain-items',{action:'reward'},token);assert.equal(r.used,false);const c=r.claim;await send(account,config.SeasonRewards,'SeasonRewards','claimTester',[{...c,amount:BigInt(c.amount),season:BigInt(c.season),nonce:BigInt(c.nonce),expiry:BigInt(c.expiry)},r.signature]);};
 await claim(seller,s);await claim(buyer,b);
 await mint(seller,pass.vouchers.find(v=>v.relicId==='3'));
 await send(seller,config.RelicNFT,'RelicNFT','setApprovalForAll',[config.RelicMarketV2,true]);
 const avaxPrice=parseEther('0.001'),first=await read('RelicMarketV2',config.RelicMarketV2,'nextListingId');
 await send(seller,config.RelicMarketV2,'RelicMarketV2','list',[3n,1n,avaxPrice,0]);
 await send(buyer,config.RelicMarketV2,'RelicMarketV2','buy',[first],avaxPrice);
 assert.equal(await read('RelicNFT',config.RelicNFT,'balanceOf',[buyer.address,3n]),1n);
 const feeBps=await read('RelicMarketV2',config.RelicMarketV2,'feeBps');assert.equal(feeBps,500n);
 assert.equal(await read('RelicMarketV2',config.RelicMarketV2,'proceeds',[seller.address,0]),avaxPrice-avaxPrice*feeBps/10000n);
 await send(seller,config.RelicMarketV2,'RelicMarketV2','withdraw',[0,seller.address]);
 await mint(seller,pass.vouchers.find(v=>v.relicId==='1'));
 const cancelId=await read('RelicMarketV2',config.RelicMarketV2,'nextListingId');
 await send(seller,config.RelicMarketV2,'RelicMarketV2','list',[1n,1n,0n,1]);await send(seller,config.RelicMarketV2,'RelicMarketV2','cancel',[cancelId]);
 assert.equal(await read('RelicNFT',config.RelicNFT,'balanceOf',[seller.address,1n]),1n);
 stage='reserve seal';const {items}=await post('chain-items',{action:'inventory'},s);const item=items.find(i=>i.item_id==='star-thread');assert(item);
 const {intent,hash}=await post('chain-items',{action:'reserve',inventory:item.id},s);
 const supply=await read('YarnToken',config.YarnToken,'totalSupply');
 await send(seller,config.YarnToken,'YarnToken','seal',[hash,BigInt(intent.cost)]);
 stage='finalize seal';const {voucher}=await post('chain-items',{action:'finalize',intent:intent.id},s);await mint(seller,voucher);
 assert.equal(await read('YarnToken',config.YarnToken,'totalSupply'),supply-BigInt(intent.cost));
 const yarnPrice=parseEther('1.234567891234567891'),second=await read('RelicMarketV2',config.RelicMarketV2,'nextListingId');
 await send(seller,config.RelicMarketV2,'RelicMarketV2','list',[10001n,1n,yarnPrice,1]);
 await send(buyer,config.YarnToken,'YarnToken','approve',[config.RelicMarketV2,yarnPrice]);await send(buyer,config.RelicMarketV2,'RelicMarketV2','buy',[second]);
 stage='fee and ownership checks';const fee=yarnPrice*feeBps/10000n,burn=fee*4000n/10000n;
 assert.equal(await read('RelicNFT',config.RelicNFT,'balanceOf',[seller.address,10001n]),0n);assert.equal(await read('RelicNFT',config.RelicNFT,'balanceOf',[buyer.address,10001n]),1n);
 assert.equal(await read('YarnToken',config.YarnToken,'totalSupply'),supply-BigInt(intent.cost)-burn);
 const treasury=await read('RelicMarketV2',config.RelicMarketV2,'treasury');
 // A fresh local market has exact treasury proceeds; public deployments may already have sales.
 const owing=await read('RelicMarketV2',config.RelicMarketV2,'proceeds',[treasury,1]);assert(owing>=fee-burn);
 await send(seller,config.RelicMarketV2,'RelicMarketV2','withdraw',[1,seller.address]);
 passed=true;console.log(`PASS: ${dry?'Anvil dry-run':'public Fuji'} judge loop, ${receipts.length} confirmed transactions.`);
}catch(error){failure=safeFailure(error);console.error(`FAIL at ${stage}. ${JSON.stringify(failure)} No secret values logged.`);process.exitCode=1;}
finally{
 const path=resolve(root,`reports/chain/FUJI-SMOKE${dry?'-DRY-RUN':''}.md`);
 writeFileSync(path,`# ${dry?'Anvil dry-run — NOT public Fuji':'Public Fuji smoke'}\n\n${passed?'PASS':'FAIL'} · ${new Date().toISOString()} · chain 43113 · Testnet — no real value.\n\n${dry?'All hashes below belong to disposable localhost state; they are not Snowtrace evidence.':'All links below are public Fuji receipts.'}\n\nLast stage: ${stage}.\n${failure?`\nFailure: ${JSON.stringify(failure)}\n`:''}\n| Step | Transaction |\n|---|---|\n${receipts.map(r=>`| ${r.label} | ${dry?'`'+r.hash+'`':`[${r.hash}](https://testnet.snowtrace.io/tx/${r.hash})`} |`).join('\n')}\n`);
 await local?.stop();
}
