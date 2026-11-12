// Read-only receipt/order cross-check. Cohort recruitment and identity remain
// reviewed external inputs; neither a blockchain nor this tool proves a human.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {analyzePilot} from './pilot-evidence.mjs';
import {cosmeticIntentText,YARN_STYLES} from '../../packages/chain/src/cosmetics.ts';
const {createPublicClient,http,parseAbi,keccak256,toBytes,decodeEventLog}=
  createRequire(new URL('../../apps/web/package.json',import.meta.url))('viem');
const abi=parseAbi(['event SealPaid(address indexed player,bytes32 indexed intent,uint256 amount)',
  'event Transfer(address indexed from,address indexed to,uint256 value)',
  'function sealPayments(address,bytes32) view returns(uint256)']);
const address=/^0x[0-9a-fA-F]{40}$/,hash=/^0x[0-9a-fA-F]{64}$/;
const uuid=/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const zero='0x'+'0'.repeat(40),lower=s=>s.toLowerCase();
const eventId=l=>lower(l.transactionHash)+':'+l.logIndex;
const sameLog=(a,b)=>lower(a.address)===lower(b.address)&&a.logIndex===b.logIndex&&
  lower(a.transactionHash)===lower(b.transactionHash)&&lower(a.blockHash)===lower(b.blockHash)&&
  a.blockNumber===b.blockNumber&&a.data===b.data&&JSON.stringify(a.topics)===JSON.stringify(b.topics);

export async function auditCosmeticPilot({client,cohort,orders,fromBlock,snapshotBlock,confirmations=12}) {
  assert(!Object.hasOwn(cohort,'purchases'),'Receipt list must be derived from chain');
  analyzePilot({...cohort,purchases:[]});
  assert([fromBlock,snapshotBlock,confirmations].every(n=>Number.isSafeInteger(n)&&n>=0)&&fromBlock<=snapshotBlock,'Invalid block bounds');
  assert(confirmations>=12,'At least twelve blocks of confirmation required');
  assert.equal(await client.getChainId(),43113,'Fuji only');
  const head=await client.getBlockNumber({cacheTime:0});
  assert(BigInt(snapshotBlock+confirmations)<=head,'Unconfirmed snapshot');
  const first=await client.getBlock({blockNumber:BigInt(fromBlock)});
  const snapshot=await client.getBlock({blockNumber:BigInt(snapshotBlock)});
  assert(first.timestamp<=BigInt(cohort.start)&&snapshot.timestamp>=BigInt(cohort.end),'Scan must bracket the whole closed cohort window');
  assert(cohort.asOf>=Number(snapshot.timestamp),'Export predates the chain snapshot');
  assert(hash.test(snapshot.hash),'Snapshot hash required');
  const token=lower(cohort.token),wallets=new Map();
  for(const s of cohort.subjects)for(const w of s.wallets)wallets.set(lower(w),s);
  const byIntent=new Map(),byId=new Set(),accountSku=new Set();
  for(const o of orders){
    assert(uuid.test(o.id)&&uuid.test(o.player_id)&&!byId.has(o.id),'Duplicate/invalid server order');byId.add(o.id);
    assert(address.test(o.wallet)&&wallets.has(lower(o.wallet))&&address.test(o.token)&&lower(o.token)===token,'Foreign server order');
    assert(YARN_STYLES.some(s=>s.id===o.sku&&s.cost===o.cost),'Order differs from shipped catalog');
    const createdAt=Date.parse(o.created_at)/1000;
    assert(Number.isFinite(createdAt)&&createdAt>=wallets.get(lower(o.wallet)).joinedAt&&createdAt<cohort.end,'Pre-existing or out-of-window order');
    if(o.paid_at!==null)assert(Number.isFinite(Date.parse(o.paid_at))&&Date.parse(o.paid_at)>=Date.parse(o.created_at),'Invalid order completion');
    const key=o.player_id+':'+o.sku;assert(!accountSku.has(key),'Repeated permanent account style');accountSku.add(key);
    const intent=keccak256(toBytes(cosmeticIntentText(token,o.id)));
    byIntent.set(lower(o.wallet)+':'+intent,{...o,intent,createdAt});
  }
  const ranges=[],scanned=new Map();
  for(let from=fromBlock;from<=snapshotBlock;from+=100){
    const to=Math.min(from+99,snapshotBlock);
    const logs=await client.getLogs({address:token,event:abi[0],fromBlock:BigInt(from),toBlock:BigInt(to),strict:true});
    assert(Array.isArray(logs),'Incomplete RPC log response');
    for(const l of logs){
      assert(lower(l.address)===token&&!l.removed&&hash.test(l.blockHash)&&hash.test(l.transactionHash)&&
        l.blockNumber>=BigInt(from)&&l.blockNumber<=BigInt(to)&&Number.isSafeInteger(l.logIndex)&&l.logIndex>=0,'Foreign/noncanonical log');
      const id=eventId(l);if(scanned.has(id))assert(sameLog(scanned.get(id),l),'Conflicting duplicate event');
      scanned.set(id,l);
    }
    ranges.push({from,to,events:logs.length});
  }
  const purchases=[],payments=new Map(),blocks=new Map(),receipts=new Map(),usedBurns=new Set();
  let unmatchedCohortPayments=0,recoveredPendingOrders=0,postWindowPurchases=0;
  for(const log of scanned.values()){
    const w=lower(log.args.player),o=byIntent.get(w+':'+log.args.intent);
    if(!o){if(wallets.has(w))unmatchedCohortPayments++;continue;}
    assert(!payments.has(o.id),'Order has multiple chain payments');payments.set(o.id,log);
    assert.equal(log.args.amount,BigInt(o.cost),'Incorrect order burn');
    const height=log.blockNumber;
    if(!blocks.has(height))blocks.set(height,await client.getBlock({blockNumber:height}));
    const block=blocks.get(height);
    assert.equal(lower(block.hash),lower(log.blockHash),'Reorganized payment block');
    const timestamp=Number(block.timestamp);
    assert(timestamp>=Math.floor(o.createdAt),'Payment predates its server order');
    if(!receipts.has(log.transactionHash))receipts.set(log.transactionHash,await client.getTransactionReceipt({hash:log.transactionHash}));
    const receipt=receipts.get(log.transactionHash);
    assert(receipt.status==='success'&&receipt.blockNumber===height&&lower(receipt.blockHash)===lower(block.hash)&&
      lower(receipt.transactionHash)===lower(log.transactionHash),'Receipt not canonical/successful');
    assert(receipt.logs.some(l=>sameLog(l,log)),'Scanned payment absent from receipt');
    assert(receipt.logs.every(l=>!l.removed&&l.blockNumber===height&&lower(l.blockHash)===lower(block.hash)&&
      lower(l.transactionHash)===lower(log.transactionHash)),'Inconsistent receipt log identity');
    const matchingBurns=receipt.logs.filter(l=>{
      if(lower(l.address)!==token||l.logIndex>=log.logIndex||usedBurns.has(eventId(l)))return false;
      try{const e=decodeEventLog({abi,data:l.data,topics:l.topics,strict:true});return e.eventName==='Transfer'&&
        lower(e.args.from)===w&&lower(e.args.to)===zero&&e.args.value===BigInt(o.cost);}
      catch{return false;}
    });
    assert.equal(matchingBurns.length,1,'Order needs one matching supply burn');usedBurns.add(eventId(matchingBurns[0]));
    if(o.paid_at===null)recoveredPendingOrders++;
    if(timestamp>=cohort.end){postWindowPurchases++;continue;}
    purchases.push({chainId:43113,token,wallet:w,txHash:log.transactionHash,blockHash:block.hash,
      block:Number(height),logIndex:log.logIndex,receiptStatus:1,canonical:true,timestamp,
      orderId:o.id,sku:o.sku,amountWei:o.cost});
  }
  for(const o of byIntent.values()){
    const paid=await client.readContract({address:token,abi,functionName:'sealPayments',args:[o.wallet,o.intent],blockNumber:BigInt(snapshotBlock)});
    assert(paid===0n||paid===BigInt(o.cost),'Irrecoverable under/overpaid order; requires review');
    assert.equal(paid, payments.has(o.id)?BigInt(o.cost):0n,'Receipt scan and immutable payment disagree');
    if(o.paid_at!==null&&Date.parse(o.paid_at)/1000<=Number(snapshot.timestamp))assert(paid>0n,'Server completed an unpaid order');
  }
  const unchanged=await client.getBlock({blockNumber:BigInt(snapshotBlock)});
  assert.equal(lower(unchanged.hash),lower(snapshot.hash),'Snapshot changed during audit');
  const input={...cohort,purchases};
  const analysis=analyzePilot(input);
  return {version:1,mode:'read-only order/receipt cross-check',analysis,
    snapshot:{block:snapshotBlock,hash:snapshot.hash,timestamp:Number(snapshot.timestamp)},
    ranges,orders:orders.length,unmatchedCohortPayments,recoveredPendingOrders,postWindowPurchases,
    evidenceHash:createHash('sha256').update(JSON.stringify({input,orders,ranges,snapshot:snapshot.hash})).digest('hex'),
    input,activation:false,budgetEligibleBurn:'0',
    limits:'Reviewed enrollment, visits, bot labels and complete order export are external assertions. Unmatched SealPaid may be item seals or omitted orders and need classification. One RPC is not independent attestation; testnet purchases are not real-money demand. No routine issuer is enabled.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [source,target,...flags]=process.argv.slice(2);
  assert(source&&target&&flags.includes('--read-only'),'Usage: node tools/chain/audit-cosmetic-pilot.mjs reviewed-export.json audit.json --read-only');
  assert(resolve(source)!==resolve(target),'Do not overwrite source evidence');
  const config=JSON.parse(readFileSync(source,'utf8'));
  // Fixed public endpoint; no keys, arbitrary authenticated URL or wallet client.
  const client=createPublicClient({transport:http('https://api.avax-test.network/ext/bc/C/rpc',{retryCount:3,timeout:20000})});
  const result=await auditCosmeticPilot({...config,client});
  writeFileSync(target,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({orders:result.orders,purchases:result.analysis.uniquePurchases,activation:false}));
}
