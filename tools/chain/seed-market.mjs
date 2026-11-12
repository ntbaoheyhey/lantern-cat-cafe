// User-run only on public Fuji; dry mode uses disposable local accounts.
// Reuses the two existing judge-pass vouchers, without drip, reward or boss requests.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root,startLocal,devAccount,localApi,localOrigin,artifact} from './local.mjs';
import {keepListings} from './bot-seller.mjs';
import {safeFailure} from './diagnose-rewards.mjs';
const req=createRequire(resolve(root,'apps/web/package.json'));
const load=name=>import(pathToFileURL(req.resolve(name).replace('/_cjs/','/_esm/')));
const {createPublicClient,createWalletClient,http,getAddress,parseEther}=await load('viem');
const {privateKeyToAccount}=await load('viem/accounts');
const {avalancheFuji}=await load('viem/chains');
const {createSiweMessage}=await load('viem/siwe');
const dry=process.argv.includes('--dry-run');
if(!dry&&!(process.argv.includes('--fuji')&&process.argv.includes('--run'))){
  console.log('Usage: node tools/chain/seed-market.mjs --dry-run | --fuji --run. Public mode uses BOT_PRIVATE_KEY, FUJI_RPC_URL, SUPABASE_URL and WEB_ORIGIN. Reuse the smoke buyer wallet; no new tester claims.');
  process.exit(0);
}
let local,stage='configuration';
try {
  if(dry)local=await startLocal({web:false});
  const config=dry?local.config:JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'),'utf8'));
  const rpc=dry?config.rpcUrl:process.env.FUJI_RPC_URL;
  const api=dry?localApi:new URL(process.env.SUPABASE_URL).origin;
  const origin=dry?localOrigin:new URL(process.env.WEB_ORIGIN).origin;
  if(!rpc||(!dry&&(!rpc.startsWith('https://')||!api.startsWith('https://')||!origin.startsWith('https://'))))throw new Error('configuration');
  const account=dry?devAccount(6):privateKeyToAccount(process.env.BOT_PRIVATE_KEY||'');
  const client=createPublicClient({chain:avalancheFuji,transport:http(rpc),pollingInterval:200});
  const wallet=createWalletClient({chain:avalancheFuji,account,transport:http(rpc)});
  assert.equal(await client.getChainId(),43113);
  const nft=getAddress(config.RelicNFT),market=getAddress(config.RelicMarketV2);
  const nftAbi=artifact('RelicNFT').abi,marketAbi=artifact('RelicMarketV2').abi;
  const read=(address,abi,functionName,args=[])=>client.readContract({address,abi,functionName,args});
  const send=async(address,abi,functionName,args)=>{
    stage=functionName;
    const {request}=await client.simulateContract({account:account.address,address,abi,functionName,args});
    const hash=await wallet.writeContract({...request,account});
    assert.equal((await client.waitForTransactionReceipt({hash,timeout:60000})).status,'success');
    return hash;
  };
  const post=async(name,body={},token)=>{
    stage=name;
    const response=await fetch(api+'/functions/v1/'+name,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    assert.equal(response.status,200,'Backend unavailable');
    return response.json();
  };
  let session;
  const login=async()=>{
    if(session)return session;
    const {nonce}=await post('auth-nonce');
    const message=createSiweMessage({address:account.address,domain:new URL(origin).host,uri:origin,version:'1',chainId:43113,nonce,statement:'Sign in to Taskbar Hero.',issuedAt:new Date(),expirationTime:new Date(Date.now()+600000)});
    session=(await post('auth-verify',{message,signature:await account.signMessage({message})})).token;
    return session;
  };
  const mint=async v=>{
    assert.equal(v.player.toLowerCase(),account.address.toLowerCase());
    return send(nft,nftAbi,'mint',[{player:v.player,relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature]);
  };
  // The local fixture supplies the third Relic already held by the public smoke buyer.
  if(dry){const pass=await post('chain-judge',{action:'boss'},await login());await mint(pass.vouchers.find(v=>v.relicId==='3'));}
  const run=async()=>{
    stage='inventory';
    const count=await read(market,marketAbi,'activeListingCount');
    let own=0;
    for(let offset=0n;offset<count;offset+=100n){
      const [,rows]=await read(market,marketAbi,'getListings',[offset,100n]);
      own+=rows.filter(l=>l.seller.toLowerCase()===account.address.toLowerCase()).length;
    }
    if(own>=3)return {active:own,added:0,minted:0};
    const ids=[1n,2n,3n,4n];
    const balances=await read(nft,nftAbi,'balanceOfBatch',[ids.map(()=>account.address),ids]);
    let available=BigInt(own)+balances.reduce((a,b)=>a+b,0n),minted=0;
    if(available<3n){
      const pass=await post('chain-judge',{action:'pass'},await login());
      const vouchers=[];
      for(const v of pass.vouchers){
        if(!['1','2'].includes(v.relicId)||v.used)continue;
        if(!await read(nft,nftAbi,'usedNonces',[BigInt(v.nonce)]))vouchers.push(v);
      }
      if(available+BigInt(vouchers.length)<3n)throw new Error('insufficient_inventory');
      for(const voucher of vouchers){
        if(available>=3n)break;
        await mint(voucher);available++;minted++;
      }
    }
    stage='list';
    const result=await keepListings({client,wallet,nft,market,version:'v2',currency:1,price:parseEther('1'),target:3});
    assert(result.active>=3);
    return {...result,minted};
  };
  const result=await run();
  if(dry){
    stage='verify seed';
    assert.deepEqual(result,{active:3,added:3,minted:2});
    assert.deepEqual(await run(),{active:3,added:0,minted:0},'retry creates no extra supply or listings');
    const [,rows]=await read(market,marketAbi,'getListings',[0n,100n]);
    const owned=rows.filter(l=>l.seller.toLowerCase()===account.address.toLowerCase());
    assert.equal(owned.length,3);
    assert(owned.every(l=>l.price===parseEther('1')&&l.currency===1));
    assert.equal(await read(config.SeasonRewards,artifact('SeasonRewards').abi,'testerClaimed',[account.address]),false);
    console.log('PASS: locked-Anvil seed, 3 listings at 1 YARN, existing pass vouchers only, no tester claim, repeat is a no-op.');
  }else console.log(`PASS: ${result.active} active V2 listings; ${result.added} added at 1 test YARN; ${result.minted} existing pass vouchers minted. Testnet — no real value.`);
}catch(error){console.error(`Seed stopped at ${stage}. ${JSON.stringify(safeFailure(error))} Reuse the smoke buyer wallet; it needs gas and at least 3 owned/pass Relics. No secret values logged.`);process.exitCode=1;}
finally {await local?.stop();}
