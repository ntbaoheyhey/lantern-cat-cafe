/** Independent UI fault reproduction of one-wallet reserve versus two-wallet workshop need. */
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runJourneys} from './journey.mjs';
const qa='/Users/bao/taskbar-hero-qa';
const attempt=process.argv[2]??'2';
if(!/^\d+$/.test(attempt))throw Error('Numeric evidence attempt required');
const label=`q2-reserve-gap-${attempt}`;
const first=JSON.parse(readFileSync(`${qa}/reports/v4-qa/Q1/q1-cold-1/results.json`,'utf8'));
const funding=first.runs[0].receipts.find(r=>r.action==='Guest funding');
if(funding?.local!==true)throw Error('Independent receipt must identify local funding');
const sponsor=funding.payer;
if(!/^0x[0-9a-f]{40}$/i.test(sponsor??''))throw Error('Public local sponsor address not established by independent receipt');
async function rpc(method,params=[]){
 const response=await fetch('http://127.0.0.1:6202',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const body=await response.json();if(body.error)throw Error(`Local RPC ${method} failed`);return body.result;
}
let originalBalanceWei;
const {report}=await runJourneys({url:'http://127.0.0.1:6200',allowGuestTx:true,label,viewports:[{width:1440,height:900}],reportRoot:`${qa}/reports/v4-qa/Q2`,beforeLocalJourney:async({build})=>{
 const chain=await rpc('eth_chainId'),clientVersion=await rpc('web3_clientVersion');
 if(chain!=='0xa869'||!/^anvil\//i.test(clientVersion))throw Error('Expected owned Anvil fixture configured as chain43113');
 const listeners=execFileSync('lsof',['-nP','-iTCP:6202','-sTCP:LISTEN','-Fp'],{encoding:'utf8'}).trim().split('\n').filter(v=>/^p\d+$/.test(v));
 if(listeners.length!==1)throw Error('Expected exactly one owned RPC listener');
 const rpcPid=Number(listeners[0].slice(1));
 const parentPid=Number(execFileSync('ps',['-p',String(rpcPid),'-o','ppid='],{encoding:'utf8'}).trim());
 if(parentPid!==build.supervisorPid)throw Error('RPC process is not owned by this QA production supervisor');
 originalBalanceWei=BigInt(await rpc('eth_getBalance',[sponsor,'latest'])).toString();
 const balanceWei=1075000000000000000n;
 await rpc('anvil_setBalance',[sponsor,'0x'+balanceWei.toString(16)]);
 return {scenario:'Sponsor1.075AVAX: between one-wallet and two-wallet reserves before pending obligations',sponsor,chainId:chain,clientVersion,rpcPid,parentPid,originalBalanceWei,balanceWei:balanceWei.toString(),gasPriceWei:BigInt(await rpc('eth_gasPrice')).toString(),publicChainWrites:false};
}});
const row=report.runs[0];
const restoredBalanceWei=BigInt(await rpc('eth_getBalance',[sponsor,'latest'])).toString();
const evidence={at:new Date().toISOString(),sourceSha:report.sourceSha,scope:'Local Anvil fault injection only; not execution of public Fuji guest flow',raw:`Q2/${label}/results.json`,localSetup:row.localSetup,restoredBalanceWei,rollbackVerified:originalBalanceWei!==undefined&&originalBalanceWei===restoredBalanceWei,steps:row.steps,errors:row.failedRequests,failure:row.failure,visibleFailure:row.visibleFailure,localFundingReceipts:row.receipts.filter(r=>r.action==='Guest funding').length,workshopReached:row.steps.some(s=>s.name==='Fund workshop'),reserveFailureVisible:/reserve|sponsor|paused|fund|budget|available/i.test(JSON.stringify(row.visibleFailure??[]))};
writeFileSync(`${qa}/reports/v4-qa/Q2/reserve-fault-reproduction-${attempt}.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(`COMPLETE reserve scenario; funding receipts=${evidence.localFundingReceipts}; workshop=${evidence.workshopReached}; inspect evidence before filing`);
