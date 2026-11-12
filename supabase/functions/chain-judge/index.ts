import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, getAddress } from 'viem';
import { verifySessionToken } from '../../../packages/auth/src/index.ts';
import { json } from '../_shared/auth.ts';
import { createJudge } from '../_shared/chain-judge.ts';
import { dripIpHash } from '../_shared/guest-drip.ts';
import { voucherSigner } from '../_shared/relic.ts';
import { usedNoncesAbi } from '@taskbar-hero/chain';
import fuji from '../../../packages/chain/deployments/43113.json' with {type:'json'};

Deno.serve(async req => {
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers:json(req,{}).headers});
  if(req.method!=='POST') return json(req,{error:'method_not_allowed'},405);
  if(Deno.env.get('CHAIN_JUDGE_ENABLED')!=='1') return json(req,{error:'unavailable'},503);
  const secret=Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||'';
  let session;
  try {session=await verifySessionToken((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{jwtSecret:secret});}
  catch {return json(req,{error:'unauthenticated'},401);}
  try {
    const {action}=await req.json();
    const address=getAddress(fuji.RelicNFT);
    const client=createPublicClient({transport:http(Deno.env.get('FUJI_RPC_URL')||'https://api.avax-test.network/ext/bc/C/rpc')});
    if(await client.getChainId()!==43113)throw new Error('wrong_chain');
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const judge=createJudge({signer:voucherSigner(Deno.env.get('VOUCHER_SIGNER_PRIVATE_KEY')||'',address),
      nonceUsed:nonce=>client.readContract({address,abi:usedNoncesAbi,functionName:'usedNonces',args:[nonce]}),
      store:{reserve:async(player,wallet,ip,boss)=>{
        const {data,error}=await db.rpc('chain_judge_reserve',{p_player:player,p_wallet:wallet,p_ip:ip,p_boss:boss});
        if(error)throw new Error('issuance_unavailable');return data;
      }}});
    const result=await judge(session.sub,getAddress(session.wallet),await dripIpHash(req.headers.get('x-forwarded-for'),secret),action);
    return json(req,JSON.parse(JSON.stringify(result,(_,v)=>typeof v==='bigint'?v.toString():v)));
  } catch {return json(req,{error:'judge_unavailable'},503);}
});
