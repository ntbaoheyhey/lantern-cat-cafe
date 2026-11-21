// User-run diagnostics: authenticates existing wallets, reads chain state and simulates only.
// Never requests a public drip/judge pass, broadcasts a transaction or prints credentials.
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {root,startLocal,devAccount,localApi,localOrigin,artifact} from './local.mjs';
const req=createRequire(resolve(root,'apps/web/package.json'));
const load=name=>import(pathToFileURL(req.resolve(name).replace('/_cjs/','/_esm/')));
const {createPublicClient,http,getAddress,recoverTypedDataAddress,formatEther}=await load('viem');
const {privateKeyToAccount}=await load('viem/accounts');
const {avalancheFuji}=await load('viem/chains');
const {createSiweMessage}=await load('viem/siwe');
const fields=[{name:'player',type:'address'},{name:'amount',type:'uint256'},{name:'season',type:'uint256'},{name:'nonce',type:'uint256'},{name:'expiry',type:'uint256'}];

export async function signatureType({contract,signer,claim,signature}) {
  for(const type of ['TesterClaim','Claim']) {
    try {
      const recovered=await recoverTypedDataAddress({domain:{name:'TaskbarHeroSeasonRewards',version:'1',chainId:43113,verifyingContract:contract},types:{[type]:fields},primaryType:type,message:claim,signature});
      if(recovered.toLowerCase()===signer.toLowerCase())return type;
    }catch{/* Malformed signatures must not expose their bytes through error output. */}
  }
  return 'unrecognized';
}

export function safeFailure(error) {
  const names=new Set(['InvalidConfig','InvalidClaim','InvalidSignature','NonceUsed','WeeklyCap','ERC20InsufficientBalance']);
  const kinds=new Set(['ContractFunctionRevertedError','ContractFunctionExecutionError','EstimateGasExecutionError','InsufficientFundsError','FeeCapTooLowError','TipAboveFeeCapError','HttpRequestError','TimeoutError','RpcRequestError','InvalidAddressError','InvalidPrivateKeyError','MethodNotFoundRpcError','MethodNotSupportedRpcError','AccountTypeNotSupportedError','TransactionExecutionError','TransactionReceiptNotFoundError']);
  let kind='request_failed';
  const visited=new Set();
  for(let cause=error;cause&&typeof cause==='object'&&!visited.has(cause);cause=cause.cause) {
    visited.add(cause);
    if(names.has(cause.data?.errorName))return {kind:'contract_revert',revert:cause.data.errorName};
    if(kinds.has(cause.name))kind=cause.name;
  }
  return {kind};
}

async function main() {
  const dry=process.argv.includes('--dry-run');
  if(!dry&&!process.argv.includes('--fuji')) {
    console.log('Usage: node tools/chain/diagnose-rewards.mjs --fuji | --dry-run');return;
  }
  let local,stage='configuration';
  const report={mode:dry?'local-dry-run':'public-fuji-read-only',checks:[],passed:false};
  try {
    if(dry)local=await startLocal({web:false});
    const contract=getAddress(dry?local.config.SeasonRewards:process.env.SEASON_REWARDS_ADDRESS||'');
    const client=createPublicClient({chain:avalancheFuji,transport:http(dry?local.config.rpcUrl:process.env.FUJI_RPC_URL||avalancheFuji.rpcUrls.default.http[0])});
    if(await client.getChainId()!==43113)throw new Error('wrong_chain');
    const api=dry?localApi:new URL(process.env.SUPABASE_URL).origin;
    const origin=dry?localOrigin:new URL(process.env.WEB_ORIGIN).origin;
    const abi=artifact('SeasonRewards').abi;
    const read=(functionName,args=[])=>client.readContract({address:contract,abi,functionName,args});
    const signer=await read('signer'),yarn=await read('yarn');
    const pool=await client.readContract({address:yarn,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[contract]});
    Object.assign(report,{contract,signer,poolYarn:formatEther(pool)});
    const post=async(name,body={},token)=>{
      stage=name;
      const response=await fetch(api+'/functions/v1/'+name,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
      if(!response.ok){report.httpStatus=response.status;throw new Error('api_request_failed');}
      return response.json();
    };
    const accounts=dry?[devAccount(5),devAccount(6)]:[privateKeyToAccount(process.env.SMOKE_SELLER_PRIVATE_KEY||''),privateKeyToAccount(process.env.SMOKE_BUYER_PRIVATE_KEY||'')];
    for(const account of accounts) {
      const row={wallet:account.address};report.checks.push(row);
      const {nonce}=await post('auth-nonce');
      const message=createSiweMessage({address:account.address,domain:new URL(origin).host,uri:origin,version:'1',chainId:43113,nonce,statement:'Sign in to Lantern Cat Cafe.',issuedAt:new Date(),expirationTime:new Date(Date.now()+600000)});
      const session=await post('auth-verify',{message,signature:await account.signMessage({message})});
      if(dry)await post('chain-judge',{action:'pass'},session.token);
      const reward=await post('chain-items',{action:'reward'},session.token);
      stage='inspect_reward';
      row.nonceUsed=reward.used;
      row.testerClaimed=await read('testerClaimed',[account.address]);
      if(reward.used){row.simulation='already_claimed';continue;}
      const claim={...reward.claim,amount:BigInt(reward.claim.amount),season:BigInt(reward.claim.season),nonce:BigInt(reward.claim.nonce),expiry:BigInt(reward.claim.expiry)};
      row.signatureType=await signatureType({contract,signer,claim,signature:reward.signature});
      row.playerMatches=claim.player.toLowerCase()===account.address.toLowerCase();
      row.amountYarn=formatEther(claim.amount);
      row.seasonMatches=claim.season===await read('currentSeason');
      row.secondsUntilExpiry=Number(claim.expiry-(await client.getBlock()).timestamp);
      row.gasBalanceAvax=formatEther(await client.getBalance({address:account.address}));
      const request={account:account.address,address:contract,abi,functionName:'claimTester',args:[claim,reward.signature]};
      stage='simulate_claimTester';
      try{await client.simulateContract(request);row.simulation='ok';}
      catch(error){row.simulation=safeFailure(error);continue;}
      stage='estimate_claimTester';
      try{row.gasEstimate=(await client.estimateContractGas(request)).toString();}
      catch(error){row.gasEstimate=safeFailure(error);}
    }
    report.passed=report.checks.length===2&&report.checks.every(row=>row.simulation==='ok'&&typeof row.gasEstimate==='string'&&row.signatureType==='TesterClaim');
  }catch(error){report.failure={stage,...safeFailure(error)};}
  finally {
    await local?.stop();
    const output=JSON.stringify(report,null,2);
    const path=resolve(root,'reports/chain/REWARD-DIAGNOSTIC'+(dry?'-DRY-RUN':'')+'.json');
    writeFileSync(path,output+'\n');console.log(output);
    if(!report.passed)process.exitCode=1;
  }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
