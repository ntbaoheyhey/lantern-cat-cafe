import {createClient} from '@supabase/supabase-js';
import {createPublicClient,http,getAddress,type Hex} from 'viem';
import {verifySessionToken} from '../../../packages/auth/src/index.ts';
import {json} from '../_shared/auth.ts';
import {readChainBody,chainStoreError,chainFailure,ChainRequestError,routineError} from '../_shared/chain-http.ts';
import {createCampaignClaim} from '../_shared/chain-campaign-claim.ts';
import {CAMPAIGN_RULES_HASH} from '../_shared/chain-campaign-manifest.ts';
Deno.serve(async req=>{
  if(req.method!=='OPTIONS'&&Deno.env.get('CHAIN_ECONOMY_V3_ENABLED')==='1')return json(req,{error:'spool_rewards',message:'Rewards now accrue as Spool in the café.'},409);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:json(req,{}).headers});
  if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
  let session;
  try{session=await verifySessionToken((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),
    {jwtSecret:Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||''});}
  catch{return json(req,{error:'unauthenticated'},401);}
  try{
    const body=await readChainBody(req,'chain-campaign-reward');
    if(Deno.env.get('CHAIN_CAMPAIGN_REWARDS_ENABLED')!=='1')throw new ChainRequestError('routine_disabled');
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await db.rpc(name,args);if(error)throw chainStoreError(error);return data;};
    const claim=createCampaignClaim({enabled:true,contract:getAddress(Deno.env.get('SEASON_REWARDS_ADDRESS')||''),
      token:getAddress(Deno.env.get('YARN_TOKEN_ADDRESS')||''),key:(Deno.env.get('VOUCHER_SIGNER_PRIVATE_KEY')||'') as Hex,
      rulesHash:CAMPAIGN_RULES_HASH,client:createPublicClient({transport:http(Deno.env.get('FUJI_RPC_URL')||'https://api.avax-test.network/ext/bc/C/rpc',{timeout:10000,retryCount:1})}),
      read:(p,w,c,k,t)=>rpc('chain_campaign_reward_evidence',{p_player:p,p_wallet:w,p_contract:c,p_kind:k,p_period:t}),
      reserve:r=>rpc('chain_reward_reserve',{p:r}),
      renew:r=>rpc('chain_reward_renew',{p:r}),
      stored:async(source,receipt)=>{const {data,error}=await db.from('chain_reward_reservations').select('*').eq('source_id',source).eq('receipt_id',receipt).maybeSingle();if(error)throw chainStoreError(error);return data;}});
    const result=await claim(session.sub,getAddress(session.wallet),body.action as 'quote'|'claim',body.kind as 'weekly-boss'|'season-rank');
    return json(req,JSON.parse(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v)));
  }catch(error){const failure=chainFailure(routineError(error),'routine_unavailable');return json(req,failure.body,failure.status);}
});
