import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {createPublicClient,http,parseAbi}=require('viem'),{avalancheFuji}=require('viem/chains');
const registry=JSON.parse(readFileSync('packages/chain/deployments/43113.json','utf8'));
const requests=[],sizes=process.argv.slice(2).map(Number);
const client=createPublicClient({chain:avalancheFuji,transport:http('https://api.avax-test.network/ext/bc/C/rpc',{
 timeout:6000,retryCount:2,
 fetchFn:async(url,init)=>{
  const p=spawn('curl',['--silent','--show-error','--max-time','6','-X','POST','-H','content-type: application/json','--data-binary','@-',url]);
  let body='';p.stdout.on('data',v=>body+=v);p.stdin.end(init.body);
  const code=await new Promise(resolve=>p.on('close',resolve));if(code)throw Error(`curl exit ${code}`);
  return new Response(body,{headers:{'content-type':'application/json'}});
 },
 onFetchRequest:async request=>{requests.push({at:new Date().toISOString(),request:await request.clone().json()});},
 onFetchResponse:async response=>{const body=await response.clone().text();let data;try{data=JSON.parse(body);}catch{data=body.slice(0,500);}requests.push({at:new Date().toISOString(),status:response.status,response:data});},
})});
const blockNumber=await client.getBlockNumber(),rows=[];
for(const size of sizes){
 const started=Date.now();
 try{
  const values=await client.multicall({contracts:Array.from({length:size},(_,i)=>({address:registry.RelicNFT,abi:parseAbi(['function relicExists(uint256) view returns (bool)']),functionName:'relicExists',args:[BigInt(30001+i)]})),blockNumber,allowFailure:false,batchSize:0});
  rows.push({size,ms:Date.now()-started,returned:values.length,minted:values.filter(Boolean).length});
 }catch(e){rows.push({size,ms:Date.now()-started,error:e.shortMessage??e.message,details:e.details});}
 console.log(rows.at(-1));
 writeFileSync(`reports/v3-shell/b2/q8/rpc-probe-${sizes.join('-')}.json`,JSON.stringify({blockNumber:String(blockNumber),rows,requests},null,2)+'\n');
}
