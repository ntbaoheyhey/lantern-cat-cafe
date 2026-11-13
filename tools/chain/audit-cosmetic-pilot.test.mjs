import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {auditCosmeticPilot} from './audit-cosmetic-pilot.mjs';
import {cosmeticIntentText} from '../../packages/chain/src/cosmetics.ts';
const {parseAbi,encodeEventTopics,encodeAbiParameters,keccak256,toBytes}=
  createRequire(new URL('../../apps/web/package.json',import.meta.url))('viem');
const abi=parseAbi(['event SealPaid(address indexed player,bytes32 indexed intent,uint256 amount)',
 'event Transfer(address indexed from,address indexed to,uint256 value)']);
const w=n=>'0x'+n.toString(16).padStart(40,'0'),h=n=>'0x'+n.toString(16).padStart(64,'0');
function fixture(){
 const start=1800000000,end=start+10*86400,token=w(100),wallet=w(1),amount=4n*10n**18n;
 const order={id:'11111111-2222-3333-4444-555555555555',player_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  wallet,token,sku:'fern',cost:amount.toString(),created_at:new Date((start+1)*1000).toISOString(),paid_at:null};
 const intent=keccak256(toBytes(cosmeticIntentText(token,order.id)));
 const common={address:token,transactionHash:h(10),blockHash:h(102),blockNumber:102n,removed:false,
  data:encodeAbiParameters([{type:'uint256'}],[amount])};
 const log={...common,logIndex:1,args:{player:wallet,intent,amount},
  topics:encodeEventTopics({abi,eventName:'SealPaid',args:{player:wallet,intent}})};
 const burn={...common,logIndex:0,
  topics:encodeEventTopics({abi,eventName:'Transfer',args:{from:wallet,to:w(0)}})};
 const receipt={status:'success',blockNumber:102n,blockHash:h(102),transactionHash:h(10),logs:[burn,log]};
 const cohort={version:1,chainId:43113,token,mode:'synthetic',provenance:'Explicit fake RPC regression',start,end,asOf:end,
  subjects:[1,2].map(n=>({id:String(n),wallets:[w(n)],review:'participant',joinedAt:start,exposedAt:null,visits:[]}))};
 const client={getChainId:async()=>43113,getBlockNumber:async()=>132n,
  getBlock:async({blockNumber:n})=>({number:n,hash:h(Number(n)),timestamp:BigInt(n===120n?end:start+Number(n)-100)}),
  getLogs:async()=>[log],getTransactionReceipt:async()=>receipt,readContract:async()=>amount};
 return {client,cohort,orders:[order],fromBlock:100,snapshotBlock:120,log,receipt};
}
test('derives purchase from bound intent and burn, including an unacknowledged server order',async()=>{
 const f=fixture(),r=await auditCosmeticPilot(f);
 assert.equal(r.analysis.uniquePurchases,1);assert.equal(r.recoveredPendingOrders,1);
 assert.equal(r.analysis.purchaseWithin7Days.estimate,.5);assert.equal(r.analysis.burnByReview.participant,'4');
 assert.equal(r.activation,false);assert.equal(r.budgetEligibleBurn,'0');
});
test('rejects omitted, wrong-value, noncanonical and unmatched payment evidence',async()=>{
 const cases=[
  f=>{f.client.getLogs=async()=>[];},
  f=>{f.log.args.amount=1n;},
  f=>{f.receipt.status='reverted';},
  f=>{f.receipt.logs=[f.log];},
  f=>{f.client.readContract=async()=>0n;},
  f=>{f.client.getBlock=async({blockNumber:n})=>({number:n,hash:h(999),timestamp:BigInt(n===120n?f.cohort.end:f.cohort.start)});},
  f=>{f.receipt.logs[0].address=w(999);},
  f=>{f.log.removed=true;},
  f=>{f.orders[0].cost='1';},
  f=>{f.cohort.purchases=[];},
 ];
 for(const change of cases){const f=fixture();change(f);await assert.rejects(auditCosmeticPilot(f));}
});
test('requires complete time bounds, confirmations and stable snapshot',async()=>{
 for(const change of [f=>{f.client.getChainId=async()=>1;},f=>{f.confirmations=0;},
  f=>{f.client.getBlockNumber=async()=>131n;},f=>{f.cohort.start--;},f=>{f.cohort.end++;f.cohort.asOf++;}]){
  const f=fixture();const fixed=f.client.getBlock; // Keep chain time independent of edited export.
  const blocks=new Map(await Promise.all([100n,102n,120n].map(async n=>[n,await fixed({blockNumber:n})])));
  f.client.getBlock=async({blockNumber:n})=>blocks.get(n);change(f);await assert.rejects(auditCosmeticPilot(f));
 }
 const f=fixture(),read=f.client.getBlock;let snapshots=0;
 f.client.getBlock=async a=>{const b=await read(a);if(a.blockNumber===120n&&++snapshots>1)b.hash=h(999);return b;};
 await assert.rejects(auditCosmeticPilot(f),/Snapshot changed/);
});
test('does not classify unrelated item seals as cosmetic demand',async()=>{
 const f=fixture();f.orders=[];const r=await auditCosmeticPilot(f);
 assert.equal(r.unmatchedCohortPayments,1);assert.equal(r.analysis.uniquePurchases,0);
 assert.equal(r.analysis.purchaseWithin7Days.estimate,0);
});
test('reconciles a late settlement without moving it into the closed observation window',async()=>{
 const f=fixture(),read=f.client.getBlock;
 f.client.getBlock=async a=>{const b=await read(a);if(a.blockNumber===102n)b.timestamp=BigInt(f.cohort.end);return b;};
 const r=await auditCosmeticPilot(f);
 assert.equal(r.postWindowPurchases,1);assert.equal(r.analysis.uniquePurchases,0);
 assert.equal(r.analysis.purchaseWithin7Days.estimate,0);
});
