/** Read-only complete deployed-contract log snapshot. No keys, accounts or sends. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {createPublicClient,http}=require('viem'),rpc='https://api.avax-test.network/ext/bc/C/rpc';
const client=createPublicClient({transport:http(rpc,{retryCount:0,timeout:15000})});
const contracts=JSON.parse(readFileSync(resolve(root,'packages/chain/deployments/43113.json'))),out=resolve(root,'reports/v4-ship/S4/fuji-events.json');
const json=value=>JSON.stringify(value,(_,v)=>typeof v==='bigint'?v.toString():v,2)+'\n';

const prior=existsSync(out)?JSON.parse(readFileSync(out)):null;
if(prior&&JSON.stringify(prior.contracts)!==JSON.stringify(contracts))throw Error('Registry changed');
let result=prior;
if(!result){
 if(await client.getChainId()!==43113)throw Error('Wrong network');
 const head=await client.getBlockNumber({cacheTime:0}),deployment={};
 for(const [name,address] of Object.entries(contracts)){
  let lo=0n,hi=head;if(!await client.getBytecode({address,blockNumber:head}))throw Error('Missing bytecode');
  while(lo<hi){if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');const mid=(lo+hi)/2n;if(await client.getBytecode({address,blockNumber:mid}))hi=mid;else lo=mid+1n;}
  deployment[name]=String(lo);console.log(JSON.stringify({contract:name,firstCodeBlock:String(lo)}));
 }
 const start=Object.values(deployment).map(BigInt).reduce((a,b)=>a<b?a:b);
 result={at:new Date().toISOString(),chainId:43113,rpc,contracts,deployment,start:String(start),through:String(head),next:String(start),complete:false,logs:[]};writeFileSync(out,json(result));
}
let pages=0;const end=BigInt(result.through);
const delay=async milliseconds=>{for(let left=milliseconds;left>0;left-=1000){if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');await new Promise(r=>setTimeout(r,Math.min(1000,left)));}};
if(result.nextAllowedAt){console.log(JSON.stringify({backoffUntil:new Date(result.nextAllowedAt).toISOString()}));await delay(Math.max(0,result.nextAllowedAt-Date.now()));}
for(let from=BigInt(result.next);from<=end;){
 if(existsSync(resolve(root,'STOP-V4SHIP'))){writeFileSync(out,json(result));throw Error('STOP-V4SHIP');}
 const to=from+99n<end?from+99n:end;let logs;
 try{logs=await client.getLogs({address:Object.values(contracts),fromBlock:from,toBlock:to});}
 catch(error){result.nextAllowedAt=Date.now()+600000;writeFileSync(out,json(result));console.log(JSON.stringify({readFailedAt:String(from),backoffUntil:new Date(result.nextAllowedAt).toISOString(),error:String(error.shortMessage??error.message).slice(0,120)}));await delay(600000);continue;}
 if(logs.some(l=>l.removed||!l.transactionHash))throw Error('Unstable/incomplete log');
 result.logs.push(...logs);result.next=String(to+1n);delete result.nextAllowedAt;from=to+1n;
 if(++pages%10===0){writeFileSync(out,json(result));console.log(JSON.stringify({through:String(to),target:result.through,logs:result.logs.length}));}
 await delay(2000);
}
result.complete=true;result.completedAt=new Date().toISOString();result.throughBlockHash=(await client.getBlock({blockNumber:end})).hash;
writeFileSync(out,json(result));console.log(JSON.stringify({complete:true,start:result.start,through:result.through,logs:result.logs.length}));
