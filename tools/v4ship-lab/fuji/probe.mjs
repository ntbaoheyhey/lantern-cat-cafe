// Read-only experiment; no wallet, signer, env files, private RPC or transaction submission.
import {readFileSync,writeFileSync} from 'node:fs';
const url='https://api.avax-test.network/ext/bc/C/rpc';
const root=new URL('../../../',import.meta.url);
let id=0;
async function rpc(method,params=[]){
 const start=performance.now();
 const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:++id,method,params}),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error(`RPC HTTP${response.status}`);
 const data=await response.json();if(data.error)throw Error(`RPC code${data.error.code}`);
 return {value:data.result,ms:performance.now()-start};
}
const chain=await rpc('eth_chainId');if(Number(chain.value)!==43113)throw Error('Wrong chain');
const sequential=[];let start=performance.now();
for(let i=0;i<10;i++)sequential.push(await rpc('eth_gasPrice'));
const sequentialMs=performance.now()-start;
start=performance.now();
const response=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Array.from({length:10},()=>({jsonrpc:'2.0',id:++id,method:'eth_gasPrice',params:[]}))),signal:AbortSignal.timeout(20000)});
const batch=await response.json(),batchMs=performance.now()-start;
const latest=(await rpc('eth_getBlockByNumber',['latest',false])).value;
const blocks=[latest];
for(let i=1;i<=20;i++)blocks.push((await rpc('eth_getBlockByNumber',['0x'+(BigInt(latest.number)-BigInt(i)).toString(16),false])).value);
const ms=b=>b.timestampMilliseconds?Number(b.timestampMilliseconds):Number(b.timestamp)*1000;
const gaps=blocks.slice(0,-1).map((b,i)=>ms(b)-ms(blocks[i+1]));
const registry=JSON.parse(readFileSync(new URL('packages/chain/deployments/43113.json',root),'utf8'));
const contracts=[];
for(const name of ['RelicNFT','RelicMarket','YarnToken','SeasonRewards','RelicMarketV2']){
 const address=registry[name];if(!address){contracts.push({name,missingRegistry:true});continue;}
 const code=(await rpc('eth_getCode',[address,latest.number])).value;contracts.push({name,address,codeBytes:(code.length-2)/2});
}
const hashes=blocks.flatMap(b=>b.transactions).slice(0,10),receipts=[];
for(const hash of hashes){const r=(await rpc('eth_getTransactionReceipt',[hash])).value;if(r)receipts.push({hash,status:r.status,gasUsed:String(BigInt(r.gasUsed)),effectiveGasPriceWei:String(BigInt(r.effectiveGasPrice)),feeWei:String(BigInt(r.gasUsed)*BigInt(r.effectiveGasPrice)),source:'network sample, not game sponsorship',confirmationMs:null});}
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
const report={at:new Date().toISOString(),chainId:43113,rpc:url,readOnly:true,methods:{sequential:{requests:10,totalMs:sequentialMs,medianRpcMs:median(sequential.map(x=>x.ms))},batch:{requests:10,totalMs:batchMs,success:Array.isArray(batch)&&batch.length===10&&batch.every(x=>x.result&&!x.error)}},latestBlock:String(BigInt(latest.number)),latestTimestamp:new Date(ms(latest)).toISOString(),millisecondHeader:!!latest.timestampMilliseconds,intervalsMs:gaps,medianIntervalMs:median(gaps),gasPriceWei:String(BigInt(sequential.at(-1).value)),contracts,receipts,sponsoredConfirmation:{measured:false,reason:'No locally configured sponsor credential; do not infer submit-to-receipt timing from historical receipts or RPC latency.'}};
writeFileSync(new URL('reports/v4-ship/S1/fuji-readonly.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,receipts:receipts.length,intervalsMs:undefined}));
