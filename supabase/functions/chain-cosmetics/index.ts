import {createClient} from '@supabase/supabase-js';
import {createPublicClient,http,getAddress} from 'viem';
import {verifySessionToken} from '../../../packages/auth/src/index.ts';
import {yarnTokenAbi} from '../../../packages/chain/src/abi.ts';
import {json} from '../_shared/auth.ts';
import {readChainBody,chainFailure,chainStoreError} from '../_shared/chain-http.ts';
import {createCosmetics} from '../_shared/chain-cosmetics.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:json(req,{}).headers});
  if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
  let session;
  try{session=await verifySessionToken((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),{
    jwtSecret:Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||''});}
  catch{return json(req,{error:'unauthenticated'},401);}
  try{
    const body=await readChainBody(req,'chain-cosmetics');
    if(Deno.env.get('CHAIN_COSMETICS_ENABLED')!=='1')return json(req,{error:'unavailable'},503);
    const token=getAddress(Deno.env.get('YARN_TOKEN_ADDRESS')||'');
    const client=createPublicClient({transport:http(Deno.env.get('FUJI_RPC_URL')||'https://api.avax-test.network/ext/bc/C/rpc')});
    if(await client.getChainId()!==43113)throw new Error('wrong_chain');
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await db.rpc(name,args);if(error)throw chainStoreError(error);return data;};
    const cosmetics=createCosmetics({enabled:true,token,
      paid:(wallet,intent)=>client.readContract({address:token,abi:yarnTokenAbi,functionName:'sealPayments',args:[wallet,intent]}),
      store:{state:(p,w)=>rpc('chain_cosmetic_state',{p_player:p,p_wallet:w}),
        reserve:(p,w,s,t)=>rpc('chain_cosmetic_reserve',{p_player:p,p_wallet:w,p_sku:s,p_token:t}),
        finalize:(p,w,i)=>rpc('chain_cosmetic_finalize',{p_player:p,p_wallet:w,p_intent:i}),
        equip:(p,w,s)=>rpc('chain_cosmetic_equip',{p_player:p,p_wallet:w,p_sku:s})}});
    return json(req,await cosmetics(session.sub,getAddress(session.wallet),body));
  }catch(error){const failure=chainFailure(error,'chain_cosmetics_unavailable');return json(req,failure.body,failure.status);}
});
