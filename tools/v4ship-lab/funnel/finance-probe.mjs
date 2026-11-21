/** S3 financing experiment: two fresh guests, unchanged capped gifts, local Anvil only. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {loadLabRuntime} from '../../chain/economy-lab/runtime.mjs';
const require=createRequire(new URL('../../../apps/web/package.json',import.meta.url));
const {parseEther,formatEther,createWalletClient,http,getAddress}=require('viem');
const {generatePrivateKey,privateKeyToAccount}=require('viem/accounts');
const {avalancheFuji}=require('viem/chains');
const {createSiweMessage}=require('viem/siwe');
Object.assign(process.env,{CHAIN_LOCAL_WEB_PORT:'5994',CHAIN_LOCAL_RPC_PORT:'8546',CHAIN_LOCAL_API_PORT:'5997'});
const {startLocal,artifact}=await import('../../chain/local.mjs');
const local=await startLocal({web:false,campaignRewards:false}),c=local.config,receipts=[];
let step='guest sign-in';
const report={at:new Date().toISOString(),environment:'Disposable Anvil, no public writes',methods:[],receipts};
try{
 const signIn=async()=>{
  const account=privateKeyToAccount(generatePrivateKey());
  assert.equal(await local.client.getBalance({address:account.address}),0n);
  const nonce=await local.modules.issueNonce(local.authDeps);
  const message=createSiweMessage({domain:'127.0.0.1:5994',address:account.address,nonce:nonce.nonce,chainId:43113,uri:'http://127.0.0.1:5994',version:'1',statement:'Sign in to Lantern Cat Cafe.',issuedAt:new Date(),expirationTime:new Date(Date.now()+600000)});
  const auth=await local.modules.verifySignIn(local.authDeps,{message,signature:await account.signMessage({message})});
  const session=await local.modules.verifySessionToken(auth.token,{jwtSecret:local.authDeps.config.jwtSecret});
  const wallet=createWalletClient({account,chain:avalancheFuji,transport:http(c.rpcUrl)});
  return {account,wallet,player:session.sub};
 };
 const seller=await signIn(),buyer=await signIn();
 const balance=who=>local.client.readContract({address:c.YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[who.account.address]});
 const send=async(who,contract,fn,args,action)=>{
  step=action;const before=performance.now();
  const hash=await who.wallet.writeContract({address:c[contract],abi:artifact(contract).abi,functionName:fn,args});
  const receipt=await local.client.waitForTransactionReceipt({hash});assert.equal(receipt.status,'success');
  receipts.push({action,hash,confirmationMs:Math.round(performance.now()-before),feeAvax:formatEther(receipt.gasUsed*receipt.effectiveGasPrice),payer:who.account.address});return hash;
 };
 const mint=(who,v,action)=>send(who,'RelicNFT','mint',[{player:getAddress(v.player),relicId:BigInt(v.relicId),rarity:v.rarity,nonce:BigInt(v.nonce),expiry:BigInt(v.expiry)},v.signature],action);
 for(const who of [seller,buyer]){
  step='capped guest gas';assert.equal((await local.drip(who.player,who.account.address,'1'.repeat(64))).status,'confirmed');
  step='capped Judge entitlement';const pass=await local.judge(who.player,who.account.address,'1'.repeat(64),'pass');
  if(who===seller)await mint(who,pass.vouchers[0],'first reward mint');
  step='capped tester reward';const gift=await local.reward(who.player,who.account.address.toLowerCase());
  assert.equal(gift.claim.amount,parseEther('20'));
  await send(who,'SeasonRewards','claimTester',[gift.claim,gift.signature],'20 YARN tester claim');
  assert.equal(await balance(who),parseEther('20'));
 }
 const call=command=>local.economy(seller.player,seller.account.address,{id:crypto.randomUUID(),command});
 step='Guard trial eligibility';assert(local.modules.judgeTrial(false).won);await assert.rejects(()=>call({action:'quest'}));
 report.methods.push({method:'Guard trial plus pass entitlement',cafeQuestAccepted:false});
 step='existing boss eligibility';assert((await local.judge(seller.player,seller.account.address,'1'.repeat(64),'finale')).battle.won);
 step='demo quest';const quest=await call({action:'quest'});assert.equal(quest.state.gear.length,4);
 const seal=await call({action:'seal',instance:'quest:weapon'}),cost=BigInt(seal.intent.cost)+parseEther('18');
 report.methods.push({method:'One guest gift, no transfer',availableYarn:'20',sealPlusFusionYarn:formatEther(cost),shortfallYarn:formatEther(cost-parseEther('20')),feasible:false});
 assert.equal(cost,parseEther('31'));
 await send(buyer,'YarnToken','transfer',[seller.account.address,parseEther('12')],'Disclosed 12 YARN gift from second demo wallet');
 assert.equal(await balance(seller),parseEther('32'));assert.equal(await balance(buyer),parseEther('8'));
 await send(seller,'YarnToken','seal',[seal.hash,BigInt(seal.intent.cost)],'13 YARN seal burn');
 await mint(seller,(await call({action:'finalize',intent:seal.intent.id})).voucher,'sealed Epic mint');
 const fusion=await call({action:'fusion',instances:['quest:outfit','quest:charm'],tokens:[seal.intent.token],sealedStars:0});
 await send(seller,'YarnToken','seal',[fusion.hash,BigInt(fusion.intent.cost)],'18 YARN fusion burn');
 const burnTx=await send(seller,'RelicNFT','safeBatchTransferFrom',[seller.account.address,local.modules.ECONOMY_DEAD,fusion.intent.burnIds.map(BigInt),fusion.intent.burnAmounts.map(BigInt),fusion.hash],'sealed fusion input to dead address');
 const fused=await call({action:'finalize',intent:fusion.intent.id,burnTx});await mint(seller,fused.voucher,'Legendary mint');
 const token=BigInt(fused.voucher.relicId);
 await send(seller,'RelicNFT','setApprovalForAll',[c.RelicMarketV2,true],'market approval');
 await send(seller,'RelicMarketV2','list',[token,1n,parseEther('5'),1],'list Legendary for 5 YARN');
 const [ids,items]=await local.client.readContract({address:c.RelicMarketV2,abi:artifact('RelicMarketV2').abi,functionName:'getListings',args:[0n,100n]});
 const index=items.findIndex(x=>x.relicId===token&&x.seller.toLowerCase()===seller.account.address.toLowerCase());assert(index>=0);
 await send(buyer,'YarnToken','approve',[c.RelicMarketV2,parseEther('5')],'buyer market allowance');
 await send(buyer,'RelicMarketV2','buy',[ids[index]],'second wallet purchase');
 await send(seller,'RelicMarketV2','withdraw',[1,seller.account.address],'withdraw sale proceeds');
 assert.equal(await balance(seller),parseEther('5.75'));assert.equal(await balance(buyer),parseEther('3'));
 assert.equal(await local.client.readContract({address:c.RelicNFT,abi:artifact('RelicNFT').abi,functionName:'balanceOf',args:[buyer.account.address,token]}),1n);
 const deed=await call({action:'deed'});await mint(seller,deed.voucher,'free Deed mint');
 const policy=(await loadLabRuntime()).ECONOMY_LAB.policy;
 const gross=parseEther('6')*10000n/BigInt(10000-policy.spool.feeBp);
 const withdrawal=await call({action:'withdraw',amount:gross.toString(),deed:deed.state.deed});
 const claim=withdrawal.withdrawal.claim;
 await send(seller,'SeasonRewards','claim',[{...claim,player:getAddress(claim.player),amount:BigInt(claim.amount),season:BigInt(claim.season),nonce:BigInt(claim.nonce),expiry:BigInt(claim.expiry)},withdrawal.withdrawal.signature],'Spool withdrawal');
 assert.equal(await balance(seller),parseEther('11.75'));
 report.methods.push({method:'Two capped tester gifts, visible 12 YARN transfer, 5 YARN sale',totalTesterYarn:'40',sealPlusFusionYarn:'31',marketFeeYarn:'0.25',sellerAfterSaleYarn:'5.75',buyerAfterSaleYarn:'3',sellerAfterSpoolYarn:'11.75',feasible:true});
 Object.assign(report,{pass:true,retentionBasisPoints:policy.spool.feeBp,limitations:['Financing is a disclosed second demo-wallet gift, not player earnings.','Bound Epic inputs are consumed by the authoritative ledger; the one sealed Epic is transferred to the dead address.','This local transaction probe does not prove G-FUNNEL or public Fuji performance.','Spool retention follows the explicit REV2 policy: 25% remains in the pool.']});
 console.log(JSON.stringify({pass:true,receipts:receipts.length,methods:report.methods}));
}catch{report.pass=false;report.failedStep=step;process.exitCode=1;console.error('Financing probe failed at '+step+'; raw RPC error suppressed.');}
finally{writeFileSync('reports/v4-ship/S3/finance-probe.json',JSON.stringify(report,null,2)+'\n');await local.stop();}
