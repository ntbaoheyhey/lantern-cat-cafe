import {readChainBody, chainFailure, chainStoreError} from '../_shared/chain-http.ts';
import { createClient } from '@supabase/supabase-js';
import { getAddress, type Hex } from 'viem';
import { verifySessionToken } from '../../../packages/auth/src/index.ts';
import { json } from '../_shared/auth.ts';
import { createDrip, dripIpHash, type DripStore } from '../_shared/guest-drip.ts';

Deno.serve(async req => {
  if(req.method === 'OPTIONS') return new Response(null, {status:204,headers:json(req,{}).headers});
  if(req.method !== 'POST') return json(req, {error:'method_not_allowed'}, 405);
  if(Deno.env.get('GUEST_DRIP_ENABLED') !== '1') return json(req, {error:'unavailable'}, 503);
  const secret = Deno.env.get('SUPABASE_JWT_SECRET') || Deno.env.get('AUTH_JWT_SECRET') || '';
  let session;
  try {session = await verifySessionToken((req.headers.get('authorization') || '').replace(/^Bearer\s+/i,''), {jwtSecret:secret});}
  catch {return json(req, {error:'unauthenticated'}, 401);}
  try {
    await readChainBody(req,'guest-drip');
    // Reuse the documented existing secret; a dedicated sponsor can override it.
    const key = Deno.env.get('SPONSOR_PRIVATE_KEY') || Deno.env.get('VOUCHER_SIGNER_PRIVATE_KEY');
    if(!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) return json(req,{error:'unavailable'},503);
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false}});
    const call = async (name: string, args: Record<string, unknown>) => {
      const {data,error} = await db.rpc(name,args);
      if(error) throw chainStoreError(error);
      return data;
    };
    const store: DripStore = {
      reserve: a => call('chain_drip_reserve',{p_player:a.player,p_wallet:a.wallet,p_ip:a.ip,p_sponsor:a.sponsor,p_nonce:a.nonce,p_gas_price:a.gasPrice,p_balance:a.balance}),
      signed: (wallet,raw,hash) => call('chain_drip_signed',{p_wallet:wallet,p_raw:raw,p_hash:hash}),
      result: (wallet,hash,success) => call('chain_drip_result',{p_wallet:wallet,p_hash:hash,p_success:success}),
    };
    const drip = createDrip({key:key as Hex, rpcUrl:Deno.env.get('FUJI_RPC_URL') || 'https://api.avax-test.network/ext/bc/C/rpc', store});
    const response = await drip(session.sub, getAddress(session.wallet), await dripIpHash(req.headers.get('x-forwarded-for'), secret));
    return json(req,response, response.status === 'pending' ? 202 : 200);
  } catch(error){const failure=chainFailure(error,'drip_unavailable');return json(req,failure.body,failure.status);}
});
