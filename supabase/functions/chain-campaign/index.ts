import {createClient} from '@supabase/supabase-js';
import {verifySessionToken} from '../../../packages/auth/src/index.ts';
import {json} from '../_shared/auth.ts';
import {readChainBody,chainStoreError,chainFailure} from '../_shared/chain-http.ts';
import {createCampaignService} from '../_shared/chain-campaign-service.ts';
import {CAMPAIGN_RULES_HASH} from '../_shared/chain-campaign-manifest.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:json(req,{}).headers});
  if(req.method!=='POST')return json(req,{error:'method_not_allowed'},405);
  let session;
  try{session=await verifySessionToken((req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''),
    {jwtSecret:Deno.env.get('SUPABASE_JWT_SECRET')||Deno.env.get('AUTH_JWT_SECRET')||''});}
  catch{return json(req,{error:'unauthenticated'},401);}
  try{
    const body=await readChainBody(req,'chain-campaign');
    if(Deno.env.get('CHAIN_CAMPAIGN_ENABLED')!=='1')return json(req,{error:'campaign_disabled'},503);
    const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
    const rpc=async(name:string,args:Record<string,unknown>)=>{const {data,error}=await db.rpc(name,args);if(error)throw chainStoreError(error);return data;};
    const campaign=createCampaignService({enabled:true,economyV3:Deno.env.get('CHAIN_ECONOMY_V3_ENABLED')==='1',rulesHash:CAMPAIGN_RULES_HASH,store:{
      boot:(p,w,r,s)=>rpc('chain_campaign_boot',{p_player:p,p_wallet:w,p_rules:r,p_state:s}),
      receipt:(p,w,id)=>rpc('chain_campaign_receipt',{p_player:p,p_wallet:w,p_id:id}),
      commit:c=>rpc('chain_campaign_commit',{p_player:c.player,p_wallet:c.wallet,p_rules:c.rules,p_id:c.id,p_request:c.requestHash,p_revision:c.revision,p_state:c.state,p_export:c.exportInstance}),
    }});
    return json(req,await campaign(session.sub,session.wallet.toLowerCase(),body));
  }catch(error){const failure=chainFailure(error,'campaign_unavailable');return json(req,failure.body,failure.status);}
});
