/** Independent UI fault reproduction of one-wallet reserve versus two-wallet workshop need. */
import {readFileSync,writeFileSync} from 'node:fs';
import {runJourneys} from './journey.mjs';
const qa='/Users/bao/taskbar-hero-qa';
const first=JSON.parse(readFileSync(`${qa}/reports/v4-qa/Q1/q1-cold-1/results.json`,'utf8'));
const sponsor=first.runs[0].receipts.find(r=>r.action==='Guest funding')?.payer;
if(!/^0x[0-9a-f]{40}$/i.test(sponsor??''))throw Error('Public local sponsor address not established by independent receipt');
async function rpc(method,params=[]){
 const response=await fetch('http://127.0.0.1:6202',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 const body=await response.json();if(body.error)throw Error(`Local RPC ${method} failed`);return body.result;
}
const {report}=await runJourneys({url:'http://127.0.0.1:6200',allowGuestTx:true,label:'q2-reserve-gap-1',viewports:[{width:1440,height:900}],reportRoot:`${qa}/reports/v4-qa/Q2`,beforeLocalJourney:async()=>{
 const chain=await rpc('eth_chainId');if(chain!=='0x7a69')throw Error('Expected owned Anvil chain31337');
 const balanceWei=1075000000000000000n;
 await rpc('anvil_setBalance',[sponsor,'0x'+balanceWei.toString(16)]);
 return {scenario:'Sponsor1.075AVAX: between one-wallet and two-wallet reserves before pending obligations',sponsor,chainId:chain,balanceWei:balanceWei.toString(),gasPriceWei:BigInt(await rpc('eth_gasPrice')).toString(),publicChainWrites:false};
}});
const row=report.runs[0];
const evidence={at:new Date().toISOString(),sourceSha:report.sourceSha,scope:'Local Anvil fault injection only; not execution of public Fuji guest flow',raw:'Q2/q2-reserve-gap-1/results.json',localSetup:row.localSetup,steps:row.steps,errors:row.failedRequests,failure:row.failure,visibleFailure:row.visibleFailure,localFundingReceipts:row.receipts.filter(r=>r.action==='Guest funding').length,workshopReached:row.steps.some(s=>s.name==='Fund workshop'),reserveFailureVisible:/reserve|sponsor|paused|fund|budget|available/i.test(JSON.stringify(row.visibleFailure??[]))};
writeFileSync(`${qa}/reports/v4-qa/Q2/reserve-fault-reproduction.json`,JSON.stringify(evidence,null,2)+'\n');
console.log(`COMPLETE reserve scenario; funding receipts=${evidence.localFundingReceipts}; workshop=${evidence.workshopReached}; inspect evidence before filing`);
