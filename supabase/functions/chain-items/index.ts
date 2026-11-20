import {readChainBody, chainFailure, chainStoreError} from '../_shared/chain-http.ts';
import {createClient} from '@supabase/supabase-js';
import {createPublicClient,http,getAddress,type Hex} from 'viem';
import {verifySessionToken} from '../../../packages/auth/src/index.ts';
import {yarnTokenAbi,seasonRewardsAbi,relicNftAbi} from '../../../packages/chain/src/abi.ts';
import fuji from '../../../packages/chain/deployments/43113.json' with {type:'json'};
import {json} from '../_shared/auth.ts';
import {voucherSigner} from '../_shared/relic.ts';
import {createItems} from '../_shared/chain-items.ts';
import {createTesterReward,testerBudgetRequired} from '../_shared/chain-rewards.ts';
import {createTesterBudgetReservation} from '../_shared/chain-tester-budget.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:json(req,{}).headers});
  if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
  const secret=Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||'';let session;
  try{session=await verifySessionToken((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{jwtSecret:secret});}
  catch{return json(req,{error:'unauthenticated'},401);}
  try{
    const body=await readChainBody(req,'chain-items');
    if(body.action==='reserve'&&Deno.env.get('CHAIN_ECONOMY_V3_ENABLED')==='1')return json(req,{error:'spool_rewards',message:'Seal earned items through the café.'},409);
    if(Deno.env.get(body.action==='reward'?'CHAIN_YARN_ENABLED':'CHAIN_ITEMS_ENABLED')!=='1')return json(req,{error:'unavailable'},503);
    const client=createPublicClient({transport:http(Deno.env.get('FUJI_RPC_URL')||'https://api.avax-test.network/ext/bc/C/rpc')});
    if(await client.getChainId()!==43113)throw new Error('wrong_chain');
    const nft=getAddress(fuji.RelicNFT),token=getAddress(Deno.env.get('YARN_TOKEN_ADDRESS')||'');
    const key=(Deno.env.get('VOUCHER_SIGNER_PRIVATE_KEY')||'') as Hex;
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await db.rpc(name,args);if(error)throw chainStoreError(error);return data;};
    let result;
    if(body.action==='reward'){
      const contract=getAddress(Deno.env.get('SEASON_REWARDS_ADDRESS')||'');
      const reservationRequired=testerBudgetRequired(Deno.env.get('CHAIN_TESTER_BUDGET_ENABLED'),Deno.env.get('CHAIN_CAMPAIGN_REWARDS_ENABLED'),Deno.env.get('CHAIN_ECONOMY_V3_ENABLED'));
      const reserve=reservationRequired?createTesterBudgetReservation({contract,
        snapshot:async()=>{
          const block=await client.getBlock({blockTag:'latest'});
          const actualToken=await client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'yarn',blockNumber:block.number});
          if(actualToken.toLowerCase()!==token.toLowerCase())throw new Error('tester_budget_token');
          const balance=await client.readContract({address:token,abi:yarnTokenAbi,functionName:'balanceOf',args:[contract],blockNumber:block.number});
          const checked=await client.getBlock({blockNumber:block.number});
          if(checked.hash!==block.hash)throw new Error('tester_budget_snapshot');
          return {chainId:43113,contract,block:block.number,blockHash:block.hash,timestamp:block.timestamp,balance};
        },reserve:row=>rpc('chain_tester_reserve',{p:row})}):undefined;
      const reward=createTesterReward({key,contract,
        reserve,reservationRequired,
        eligible:async(player,wallet)=>{const {data,error}=await db.from('chain_judge_passes').select('player_id').eq('player_id',player).eq('wallet',wallet).maybeSingle();return !error&&!!data;},
        season:()=>client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'currentSeason'}),
        nonceUsed:nonce=>client.readContract({address:contract,abi:seasonRewardsAbi,functionName:'usedNonces',args:[nonce]})});
      result=await reward(session.sub,getAddress(session.wallet));
    }else{
      const items=createItems({signer:voucherSigner(key,nft),
        sealPolicy:Deno.env.get('CHAIN_SEAL_PRICE_TRIAL')==='1'?'basket-trial-v1':'standard-v1',
        paid:(wallet,intent)=>client.readContract({address:token,abi:yarnTokenAbi,functionName:'sealPayments',args:[wallet,intent]}),
        nonceUsed:nonce=>client.readContract({address:nft,abi:relicNftAbi,functionName:'usedNonces',args:[nonce]}),
        store:{inventory:(player,wallet)=>rpc('chain_item_inventory',{p_player:player,p_wallet:wallet}),
          reserve:(player,wallet,inventory,token,rarity,cost)=>rpc('chain_seal_reserve',{p_player:player,p_wallet:wallet,p_inventory:inventory,p_token:token,p_rarity:rarity,p_cost:cost}),
          finalize:(player,intent)=>rpc('chain_seal_finalize',{p_player:player,p_intent:intent})}});
      result=await items(session.sub,getAddress(session.wallet),body);
    }
    return json(req,JSON.parse(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v)));
  }catch(error){const failure=chainFailure(error,'chain_items_unavailable');return json(req,failure.body,failure.status);}
});
