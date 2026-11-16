/** Read-only comparison of current global history with wallet-scoped event evidence. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..'),require=createRequire(resolve(root,'apps/web/package.json'));
const {createPublicClient,http,pad,decodeEventLog,parseAbi,formatEther}=require('viem');
const config=JSON.parse(readFileSync(resolve(root,'apps/web/public/chain-local.json')));
const local=createPublicClient({transport:http(config.rpcUrl)}),head=await local.getBlockNumber({cacheTime:0});
const addresses=['RelicNFT','RelicMarket','YarnToken','RelicMarketV2','SeasonRewards'].map(k=>config[k]);
const start=performance.now(),logs=await local.getLogs({address:addresses,fromBlock:0n,toBlock:head});
const globalMs=performance.now()-start,pilot=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S3/ui/1440-pilot.json')));
const hash=pilot.receiptLink.split('/').at(-1),receipt=await local.getTransactionReceipt({hash}),wallet=receipt.from.toLowerCase();
const walletTopic=pad(wallet),mine=logs.filter(l=>l.topics.includes(walletTopic));
const kinds=parseAbi(['event TransferSingle(address indexed operator,address indexed from,address indexed to,uint256 id,uint256 value)','event TransferBatch(address indexed operator,address indexed from,address indexed to,uint256[] ids,uint256[] values)']);
let deadTransfers=0;
for(const log of logs)try{const event=decodeEventLog({abi:kinds,data:log.data,topics:log.topics});if(event.args.to.toLowerCase()==='0x000000000000000000000000000000000000dead')deadTransfers++;}catch{}
const scopedStart=performance.now(),scoped=[];
for(let position=1;position<=3;position++){
 const topics=Array(position+1).fill(null);topics[position]=walletTopic;
 scoped.push(...await local.request({method:'eth_getLogs',params:[{address:addresses,fromBlock:'0x0',toBlock:'0x'+head.toString(16),topics}]}));
}
const unique=rows=>new Set(rows.map(l=>l.transactionHash)).size;
const result={at:new Date().toISOString(),local:{head:String(head),wallet,global:{logs:logs.length,transactions:unique(logs),elapsedMs:globalMs},walletFiltered:{logs:mine.length,transactions:unique(mine)},indexedQueries:{calls:3,transactions:unique(scoped),elapsedMs:performance.now()-scopedStart},deadTransfers,receipt:{hash,gasUsed:String(receipt.gasUsed),effectiveGasPrice:String(receipt.effectiveGasPrice),feeAvax:formatEther(receipt.gasUsed*receipt.effectiveGasPrice)}},fuji:[]};
const fuji=createPublicClient({transport:http('https://api.avax-test.network/ext/bc/C/rpc',{retryCount:0,timeout:12000})}),fujiHead=await fuji.getBlockNumber({cacheTime:0});
const nft='0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D';
for(const width of [10000n,100n]){const before=performance.now();try{const rows=await fuji.getLogs({address:nft,fromBlock:fujiHead-width+1n,toBlock:fujiHead});result.fuji.push({width:Number(width),pass:true,logs:rows.length,elapsedMs:performance.now()-before});}catch(e){result.fuji.push({width:Number(width),pass:false,error:String(e.shortMessage??e.message).slice(0,160),elapsedMs:performance.now()-before});}}
writeFileSync(resolve(root,'reports/v4-ship/S4/log-probe.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
