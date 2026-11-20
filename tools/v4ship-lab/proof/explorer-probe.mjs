/** Compare an indexed history query with the existing RPC checkpoint; no sends. */
import {readFileSync,writeFileSync} from 'node:fs';
const base='https://api.routescan.io/v2/network/testnet/evm/43113/etherscan/api';
const snapshot=JSON.parse(readFileSync('reports/v4-ship/S4/fuji-events.json'));
const out={at:new Date().toISOString(),provider:'Routescan',documentedKeylessLimit:'2 requests/s; 10000/day',reads:[]};
for(const [name,address] of Object.entries(snapshot.contracts)){
 const url=new URL(base);url.search=new URLSearchParams({module:'logs',action:'getLogs',address,fromBlock:snapshot.deployment[name],toBlock:snapshot.through,page:'1',offset:'1000'});
 const start=performance.now(),r=await fetch(url,{signal:AbortSignal.timeout(20000)});let data;try{data=await r.json();}catch{}
 const logs=Array.isArray(data?.result)?data.result:null;
 out.reads.push({contract:name,http:r.status,status:data?.status,message:data?.message,count:logs?.length,ms:Math.round(performance.now()-start)});
 if(logs)writeFileSync(`reports/v4-ship/S4/raw/explorer-${name}.json`,JSON.stringify(logs));
 console.log(JSON.stringify(out.reads.at(-1)));
 if(!r.ok||!logs)break;
 await new Promise(r=>setTimeout(r,1000));
}
writeFileSync('reports/v4-ship/S4/explorer-probe.json',JSON.stringify(out,null,2)+'\n');
