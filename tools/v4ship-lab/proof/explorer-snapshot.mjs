/** Indexed discovery plus independent Fuji receipt verification. No writes to chain. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('/Users/bao/taskbar-hero-chain/apps/web/package.json'),{createPublicClient,http}=require('viem');
const prior=JSON.parse(readFileSync('reports/v4-ship/S4/fuji-events.json'));
const sleep=async ms=>{for(let left=ms;left>0;left-=1000){if(existsSync('STOP-V4SHIP'))throw Error('STOP-V4SHIP');await new Promise(r=>setTimeout(r,Math.min(1000,left)));}};
const client=createPublicClient({transport:http(prior.rpc,{retryCount:0,timeout:15000})});
const out='reports/v4-ship/S4/explorer-snapshot.json';
console.log(JSON.stringify({respectRpcBackoffUntil:new Date(prior.nextAllowedAt??Date.now()).toISOString()}));
await sleep(Math.max(0,(prior.nextAllowedAt??0)-Date.now())+1000);
assert.equal(await client.getChainId(),43113);await sleep(2000);
const head=await client.getBlockNumber({cacheTime:0});await sleep(2000);
const indexResponse=await fetch('https://api.routescan.io/v2/network/testnet/evm/43113/blocks?limit=1');assert(indexResponse.ok);const tip=(await indexResponse.json()).items?.[0];assert.equal(tip.chainId,'43113');assert(Number.isSafeInteger(tip.number));
assert.equal((await client.getBlock({blockNumber:BigInt(tip.number)})).hash,tip.id);await sleep(2000);
const indexedThrough=(BigInt(tip.number)<head?BigInt(tip.number):head)-20n;assert(head-indexedThrough<=500n);
const block=await client.getBlock({blockNumber:head});
const result={at:new Date().toISOString(),complete:false,chainId:43113,through:String(head),throughBlockHash:block.hash,deployment:prior.deployment,contracts:prior.contracts,source:'Routescan indexed data; receipts independently checked on Fuji RPC',attribution:'Powered by Routescan.io APIs',logs:[],pages:[],verifiedTransactions:[]};
const save=()=>writeFileSync(out,JSON.stringify(result,null,2)+'\n');
for(const [name,address] of Object.entries(prior.contracts)){
 for(let page=1;;page++){
  const url=new URL('https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api');url.search=new URLSearchParams({module:'logs',action:'getLogs',address,fromBlock:prior.deployment[name],toBlock:String(indexedThrough),page:String(page),offset:'1000'});
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});assert(response.ok,'Indexed query failed; no retry across services');
  const data=await response.json();assert.equal(data.status,'1');assert(Array.isArray(data.result));
  result.pages.push({contract:name,page,count:data.result.length});console.log(JSON.stringify(result.pages.at(-1)));
  if(!data.result.length)break;
  assert(page<=100,'Unexpected index size; review before fetching more');
  for(const log of data.result){assert.equal(log.address.toLowerCase(),address.toLowerCase());assert(BigInt(log.blockNumber)>=BigInt(prior.deployment[name])&&BigInt(log.blockNumber)<=head);result.logs.push({...log,data:log.data||'0x',blockNumber:String(BigInt(log.blockNumber)),transactionIndex:Number(BigInt(log.transactionIndex==='0x'?'0':log.transactionIndex)),logIndex:Number(BigInt(log.logIndex==='0x'?'0':log.logIndex)),removed:false});}
  save();await sleep(1000);
 }
 await sleep(1000);
}
for(let first=indexedThrough+1n;first<=head;first+=100n){
 const last=first+99n<head?first+99n:head;
 const tail=await client.getLogs({address:Object.values(prior.contracts),fromBlock:first,toBlock:last});
 result.logs.push(...tail.map(l=>({...l,blockNumber:String(l.blockNumber)})));await sleep(2500);
}
result.tail={from:String(indexedThrough+1n),to:String(head),source:'Fuji RPC'};save();
const hashes=[...new Set(result.logs.map(l=>l.transactionHash))];
for(const hash of hashes){
 const receipt=await client.getTransactionReceipt({hash});assert.equal(receipt.status,'success');
 const expected=result.logs.filter(l=>l.transactionHash===hash);
 const actual=receipt.logs.filter(l=>Object.values(prior.contracts).some(a=>a.toLowerCase()===l.address.toLowerCase()));
 assert.equal(expected.length,actual.length);
 for(const log of expected){const verified=actual.find(l=>l.logIndex===log.logIndex);assert(verified);assert.equal(verified.address.toLowerCase(),log.address.toLowerCase());assert.equal(verified.data,log.data);assert.deepEqual(verified.topics,log.topics);assert.equal(String(verified.blockNumber),log.blockNumber);assert.equal(verified.blockHash,log.blockHash);}
 result.verifiedTransactions.push(hash);save();console.log(JSON.stringify({verified:result.verifiedTransactions.length,total:hashes.length}));await sleep(2500);
}
assert.equal((await client.getBlock({blockNumber:head})).hash,result.throughBlockHash);
const covered=prior.logs.filter(l=>BigInt(l.blockNumber)<BigInt(prior.next));
assert(covered.every(a=>result.logs.some(b=>b.transactionHash===a.transactionHash&&b.logIndex===a.logIndex)));
result.complete=true;result.completedAt=new Date().toISOString();result.rpcCheckpointOverlap={logs:covered.length,allMatched:true};save();console.log(JSON.stringify({complete:true,logs:result.logs.length,verifiedTransactions:hashes.length,through:result.through}));
