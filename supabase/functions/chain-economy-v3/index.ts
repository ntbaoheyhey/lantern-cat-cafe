import {createClient} from '@supabase/supabase-js';
import {createPublicClient,getAddress,http,type Hex} from 'viem';
import {verifySessionToken} from '../../../packages/auth/src/index.ts';
import fuji from '../../../packages/chain/deployments/43113.json' with {type:'json'};
import {json} from '../_shared/auth.ts';
import {readChainBody,chainFailure,chainStoreError} from '../_shared/chain-http.ts';
import {createEconomy,EconomyError} from '../_shared/economy-v3.ts';
import {economyChain} from '../_shared/economy-v3-chain.ts';
import {economyStore} from '../_shared/economy-v3-store.ts';
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:json(req,{}).headers});
 if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
 let session;try{session=await verifySessionToken((req.headers.get('authorization')??'').replace(/^Bearer\s+/i,''),{jwtSecret:Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||''});}catch{return json(req,{error:'unauthenticated'},401);}
 if(Deno.env.get('CHAIN_ECONOMY_V3_ENABLED')!=='1')return json(req,{error:'campaign_disabled'},503);
 try{
  const body=await readChainBody(req,'chain-economy-v3');
  const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
  const store=economyStore(async(name,args)=>{const {data,error}=await db.rpc(name,args);if(error)throw chainStoreError(error);return data;});
  const client=createPublicClient({transport:http(Deno.env.get('FUJI_RPC_URL')||'https://api.avax-test.network/ext/bc/C/rpc')});
  const act=createEconomy({enabled:true,demo:Deno.env.get('CHAIN_ECONOMY_V3_DEMO')==='1',store,chain:economyChain({client,nft:getAddress(fuji.RelicNFT),token:getAddress(Deno.env.get('YARN_TOKEN_ADDRESS')||''),rewards:getAddress(Deno.env.get('SEASON_REWARDS_ADDRESS')||''),key:Deno.env.get('VOUCHER_SIGNER_PRIVATE_KEY') as Hex})});
  return json(req,await act(session.sub,getAddress(session.wallet),body));
 }catch(e){if(e instanceof EconomyError)return json(req,{error:'economy_rule',message:e.reason},409);const failure=chainFailure(e,'economy_unavailable');return json(req,failure.body,failure.status);}
});
