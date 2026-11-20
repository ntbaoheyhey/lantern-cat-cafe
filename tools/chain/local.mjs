// Throwaway localhost only. Never reads .env or production signing keys.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createServer as httpServer} from 'node:http';
import {Readable} from 'node:stream';
import {randomBytes} from 'node:crypto';
export const root = resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const webRequire = createRequire(resolve(root,'apps/web/package.json'));
const testsRequire = createRequire(resolve(root,'supabase/tests/package.json'));
const esm = path => path.replace('/_cjs/','/_esm/');
const viem = await import(pathToFileURL(esm(webRequire.resolve('viem'))));
const accounts = await import(pathToFileURL(esm(webRequire.resolve('viem/accounts'))));
const localPort = (name, fallback) => {
  const text = process.env[name] ?? String(fallback), value = Number(text);
  if (!/^\d+$/.test(text) || !Number.isSafeInteger(value) || value < 1024 || value > 65535) throw new Error(`${name} must be a port from 1024 to 65535.`);
  return value;
};
const ports = {web: localPort('CHAIN_LOCAL_WEB_PORT', 5980), rpc: localPort('CHAIN_LOCAL_RPC_PORT', 5981), api: localPort('CHAIN_LOCAL_API_PORT', 5982)};
if (new Set(Object.values(ports)).size !== 3) throw new Error('Local web, RPC and API ports must differ.');
export const localRpc = `http://127.0.0.1:${ports.rpc}`;
export const localApi = `http://127.0.0.1:${ports.api}`;
export const localOrigin = `http://127.0.0.1:${ports.web}`;
// Public Anvil fixture, explicitly not a production credential.
const mnemonic = 'test test test test test test test test test test test junk';
export const devAccount = i => accounts.mnemonicToAccount(mnemonic,{addressIndex:i});
export const stringify = value => JSON.stringify(value,(_,v)=>typeof v === 'bigint'?v.toString():v);
const chain = {id:43113,name:'Local Fuji',nativeCurrency:{name:'AVAX',symbol:'AVAX',decimals:18},rpcUrls:{default:{http:[localRpc]}}};
export const localClient = () => viem.createPublicClient({chain,transport:viem.http(localRpc),pollingInterval:50});
export const walletFor = account => viem.createWalletClient({chain,account,transport:viem.http(localRpc)});
export const artifact = name => JSON.parse(readFileSync(resolve(root,`contracts/out/${name}.sol/${name}.json`),'utf8'));

export async function loadModules() {
  const {createServer} = await import(pathToFileURL(webRequire.resolve('vite')));
  const loader = await createServer({root,configFile:false,envDir:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,ws:false,watch:null},
    resolve:{alias:[...['game-rules','api-contract','chain'].map(name=>({find:`@taskbar-hero/${name}`,replacement:resolve(root,`packages/${name}/src/index.ts`)})),
      ...['viem','viem/accounts','viem/siwe'].map(name=>({find:new RegExp(`^${name}$`),replacement:esm(testsRequire.resolve(name))}))]},
    ssr:{noExternal:['@taskbar-hero/game-rules','@taskbar-hero/api-contract','@taskbar-hero/chain']}});
  try {
    const db = await loader.ssrLoadModule('/supabase/tests/src/standalone-db.ts');
    const auth = await loader.ssrLoadModule('/packages/auth/src/index.ts');
    const drip = await loader.ssrLoadModule('/supabase/functions/_shared/guest-drip.ts');
    const relic = await loader.ssrLoadModule('/supabase/functions/_shared/relic.ts');
    const judge = await loader.ssrLoadModule('/supabase/functions/_shared/chain-judge.ts');
    const items = await loader.ssrLoadModule('/supabase/functions/_shared/chain-items.ts');
    const cosmeticsModule = await loader.ssrLoadModule('/supabase/functions/_shared/chain-cosmetics.ts');
    const source = await loader.ssrLoadModule('/supabase/functions/_shared/chain-source.ts');
    const campaign = await loader.ssrLoadModule('/supabase/functions/_shared/chain-campaign.ts');
    const campaignService = await loader.ssrLoadModule('/supabase/functions/_shared/chain-campaign-service.ts');
    const campaignManifest = await loader.ssrLoadModule('/supabase/functions/_shared/chain-campaign-manifest.ts');
    const campaignRewards = await loader.ssrLoadModule('/supabase/functions/_shared/chain-campaign-rewards.ts');
    const campaignClaim = await loader.ssrLoadModule('/supabase/functions/_shared/chain-campaign-claim.ts');
    const routine = await loader.ssrLoadModule('/supabase/functions/_shared/chain-routine.ts');
    const rewards = await loader.ssrLoadModule('/supabase/functions/_shared/chain-rewards.ts');
    const testerBudget = await loader.ssrLoadModule('/supabase/functions/_shared/chain-tester-budget.ts');
    const budgetRegister = await loader.ssrLoadModule('/supabase/functions/_shared/chain-budget-register.ts');
    const chainHttp = await loader.ssrLoadModule('/supabase/functions/_shared/chain-http.ts');
    const trade = await loader.ssrLoadModule('/packages/game-rules/src/cardrpg/trade.ts');
    const move = await loader.ssrLoadModule('/apps/web/src/game/cardrpg/chain/move.ts');
    const runtime = await loader.ssrLoadModule('/apps/web/src/game/cardrpg/chain/runtime.ts');
    const economy = await loader.ssrLoadModule('/supabase/functions/_shared/economy-v3.ts');
    const economyAdapter = await loader.ssrLoadModule('/supabase/functions/_shared/economy-v3-chain.ts');
    const economyStoreModule = await loader.ssrLoadModule('/supabase/functions/_shared/economy-v3-store.ts');
    const forgeClient = await loader.ssrLoadModule('/apps/web/src/game/cardrpg/chain/forge-client.ts');
    return {...economy,...economyAdapter,...economyStoreModule,...db,...auth,...drip,...relic,...judge,...items,...cosmeticsModule,...source,...campaign,...campaignService,...campaignManifest,...campaignRewards,...campaignClaim,...routine,...rewards,...testerBudget,...budgetRegister,...chainHttp,...trade,...move,...runtime,...forgeClient,close:()=>loader.close()};
  } catch(error){await loader.close();throw error;}
}
export async function startLocal({web = true, campaignRewards = web, economyV3 = true} = {}) {
  mkdirSync(resolve(root,'work/chain'),{recursive:true});
  // Release checkouts omit reports; local checks create their own evidence output.
  mkdirSync(resolve(root,'reports/chain'),{recursive:true});
  const handles = [];
  let anvil, stopping;
  const stop = () => {
    // Vite also handles process signals and can exit while async cleanup waits.
    // Terminate our child synchronously before closing either HTTP server.
    anvil?.kill('SIGTERM');
    return stopping ??= (async()=>{for(const close of [...handles].reverse()){try{await close();}catch{}}})();
  };
  try {
    // Fail if a listener already exists; never reuse an unknown chain.
    const probe = await fetch(localRpc,{method:'POST',headers:{'content-type':'application/json'},body:'{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'}).catch(()=>null);
    if(probe)throw new Error(`${localRpc} already in use; stop its owner first.`);
    // Public RPCs do not unlock operator wallets. Keep fixtures locked so tests
    // cannot accidentally pass by delegating transaction signing to Anvil.
    anvil = spawn('anvil',['--host','127.0.0.1','--port',String(ports.rpc),'--chain-id','43113','--accounts','0','--silent'],{cwd:root,stdio:'ignore'});
    handles.push(()=>new Promise(r=>anvil.exitCode!==null||anvil.signalCode!==null?r():anvil.once('exit',r)));
    const client=localClient();
    for(let i=0;;i++){try{if(await client.getChainId()===43113)break;}catch{}if(i>=50)throw new Error('Anvil unavailable');await new Promise(r=>setTimeout(r,100));}
    if((await client.request({method:'eth_accounts'})).length)throw new Error('Local RPC must not expose unlocked wallets.');
    for(let i=0;i<10;i++)await client.request({method:'anvil_setBalance',params:[devAccount(i).address,viem.toHex(viem.parseEther('10000'))]});
    execFileSync('forge',['build','--root','contracts'],{cwd:root,stdio:'pipe'});
    const deployer=devAccount(0), signer=devAccount(2), bot=devAccount(1), sponsor=devAccount(3);
    const deployWallet=walletFor(deployer);
    const deploy=async(name,args)=>{
      const a=artifact(name), hash=await deployWallet.deployContract({abi:a.abi,bytecode:a.bytecode.object,args});
      const receipt=await client.waitForTransactionReceipt({hash});
      if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Local deployment failed');return receipt.contractAddress;
    };
    const RelicNFT=await deploy('RelicNFT',[deployer.address,signer.address,`${localOrigin}/relics/{id}.json`]);
    const RelicMarket=await deploy('RelicMarket',[RelicNFT]);
    const YarnToken=await deploy('YarnToken',[deployer.address]);
    const RelicMarketV2=await deploy('RelicMarketV2',[RelicNFT,YarnToken,devAccount(4).address,500n]);
    const stamp=(await client.getBlock()).timestamp,epoch=stamp-(stamp-345600n)%604800n;
    const SeasonRewards=await deploy('SeasonRewards',[YarnToken,deployer.address,signer.address,viem.parseEther('32'),epoch]);
    const RelicForge=await deploy('RelicForge',[RelicNFT,YarnToken]);
    const config={fixtureId:`${Date.now()}-${process.pid}`,RelicForge,chainId:43113,rpcUrl:localRpc,RelicNFT,RelicMarket,YarnToken,RelicMarketV2,SeasonRewards,treasury:devAccount(4).address,startBlock:'0'};
    const modules=await loadModules(); handles.push(()=>modules.close());
    const db=await modules.buildMigratedDb();handles.push(()=>db.close());
    // Seed four real escrow listings using only public Anvil fixture accounts.
    const signerKey=viem.toHex(signer.getHdKey().privateKey);
    const voucherSigner=modules.voucherSigner(signerKey,RelicNFT), botWallet=walletFor(bot);
    const nftAbi=artifact('RelicNFT').abi, marketAbi=artifact('RelicMarket').abi;
    const send=async(w,address,abi,functionName,args,value)=>{
      const hash=await w.writeContract({address,abi,functionName,args,...(value===undefined?{}:{value})});
      const r=await client.waitForTransactionReceipt({hash});if(r.status!=='success')throw new Error('Seed reverted');return hash;
    };
    await send(deployWallet,YarnToken,artifact('YarnToken').abi,'transfer',[SeasonRewards,viem.parseEther('10000')]);
    // Local fixture only: a finite100-gift program, funded from the local pool.
    // Production migration inserts no budget and cannot enable issuance.
    await db.query('insert into public.chain_tester_budgets(contract,ceiling,evidence_hash,enabled) values($1,$2,$3,true)',
      [SeasonRewards.toLowerCase(),viem.parseEther('2000').toString(),'0'.repeat(64)]);
    await send(botWallet,RelicNFT,nftAbi,'setApprovalForAll',[RelicMarket,true]);
    await send(botWallet,RelicNFT,nftAbi,'setApprovalForAll',[RelicMarketV2,true]);
    const expiry=BigInt(Math.floor(Date.now()/1000)+3600);
    for(let id=1;id<=4;id++){
      const voucher={player:bot.address,relicId:BigInt(id),rarity:id-1,nonce:BigInt(id),expiry};
      await send(botWallet,RelicNFT,nftAbi,'mint',[voucher,await voucherSigner.sign(voucher)]);
      await send(botWallet,RelicMarket,marketAbi,'list',[BigInt(id),1n,viem.parseEther('0.001')]);
      const v2={...voucher,nonce:BigInt(id+10)};
      await send(botWallet,RelicNFT,nftAbi,'mint',[v2,await voucherSigner.sign(v2)]);
      await send(botWallet,RelicMarketV2,artifact('RelicMarketV2').abi,'list',[BigInt(id),1n,id%2?viem.parseEther('0.001'):viem.parseEther('1'),id%2?0:1]);
    }
    const one=async(sql,args)=>(await db.query(sql,args)).rows[0]?.r;
    const chainOne=async(sql,args)=>{try{return await one(sql,args);}catch(error){throw modules.chainStoreError(error);}};
    // Explicit local test policy, deterministic server seed, never a production default.
    await db.query('insert into chain_source_policies(source_id,rules_hash,enabled) values($1,$2,true)',[modules.CAMPAIGN_SOURCE,modules.CAMPAIGN_RULES_HASH]);
    await db.exec('update chain_v3_budget set enabled=true,ceiling=10000000000000000000000');
    const economy=modules.createEconomy({enabled:true,demo:true,store:modules.economyStore(async(name,args)=>{const values=Object.values(args).map(v=>v&&typeof v==='object'?JSON.stringify(v):v);return chainOne('select '+name+'('+values.map((_,i)=>'$'+(i+1)).join(',')+') r',values);}),chain:modules.economyChain({client,nft:RelicNFT,token:YarnToken,rewards:SeasonRewards,key:signerKey})});
    const campaign=modules.createCampaignService({enabled:true,rulesHash:modules.CAMPAIGN_RULES_HASH,seed:()=>43113,store:{
      boot:(p,w,r,s)=>chainOne('select chain_campaign_boot($1,$2,$3,$4) r',[p,w,r,JSON.stringify(s)]),
      receipt:(p,w,i)=>chainOne('select chain_campaign_receipt($1,$2,$3) r',[p,w,i]),
      commit:c=>chainOne('select chain_campaign_commit($1,$2,$3,$4,$5,$6,$7,$8) r',[c.player,c.wallet,c.rules,c.id,c.requestHash,c.revision,JSON.stringify(c.state),c.exportInstance])}});
    const store={
      reserve:a=>chainOne('select public.chain_drip_reserve($1,$2,$3,$4,$5,$6,$7) r',[a.player,a.wallet,a.ip,a.sponsor,a.nonce,a.gasPrice,a.balance]),
      signed:(wallet,raw,hash)=>chainOne('select public.chain_drip_signed($1,$2,$3) r',[wallet,raw,hash]),
      result:(wallet,hash,success)=>chainOne('select public.chain_drip_result($1,$2,$3) r',[wallet,hash,success]),
    };
    const drip=modules.createDrip({key:viem.toHex(sponsor.getHdKey().privateKey),rpcUrl:localRpc,store});
    const judge=modules.createJudge({signer:voucherSigner,nonceUsed:nonce=>client.readContract({address:RelicNFT,abi:nftAbi,functionName:'usedNonces',args:[nonce]}),store:{reserve:(player,wallet,ip,boss)=>chainOne('select public.chain_judge_reserve($1,$2,$3,$4) r',[player,wallet,ip,boss])}});
    const items=modules.createItems({signer:voucherSigner,
      sealPolicy:process.env.CHAIN_SEAL_PRICE_TRIAL==='1'?'basket-trial-v1':'standard-v1',
      paid:(wallet,intent)=>client.readContract({address:YarnToken,abi:artifact('YarnToken').abi,functionName:'sealPayments',args:[wallet,intent]}),
      nonceUsed:nonce=>client.readContract({address:RelicNFT,abi:nftAbi,functionName:'usedNonces',args:[nonce]}),
      store:{inventory:(player,wallet)=>chainOne('select public.chain_item_inventory($1,$2) r',[player,wallet]),
        reserve:(player,wallet,inventory,token,rarity,cost)=>chainOne('select public.chain_seal_reserve($1,$2,$3,$4,$5,$6) r',[player,wallet,inventory,token,rarity,cost]),
        finalize:(player,intent)=>chainOne('select public.chain_seal_finalize($1,$2) r',[player,intent])}});
    const cosmetics=modules.createCosmetics({enabled:true,token:YarnToken,
      paid:(wallet,intent)=>client.readContract({address:YarnToken,abi:artifact('YarnToken').abi,functionName:'sealPayments',args:[wallet,intent]}),
      store:{state:(p,w)=>chainOne('select public.chain_cosmetic_state($1,$2) r',[p,w]),
        reserve:(p,w,s,t)=>chainOne('select public.chain_cosmetic_reserve($1,$2,$3,$4) r',[p,w,s,t]),
        finalize:(p,w,i)=>chainOne('select public.chain_cosmetic_finalize($1,$2,$3) r',[p,w,i]),
        equip:(p,w,s)=>chainOne('select public.chain_cosmetic_equip($1,$2,$3) r',[p,w,s])}});
    const reserveTester=async request=>{
      // Anvil can mine ahead of wall time. Pin each request's clock and balance
      // to its own block; production still validates against the real clock.
      const block=await client.getBlock({blockTag:'latest'});
      const balance=await client.readContract({address:YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[SeasonRewards],blockNumber:block.number});
      const snapshot={chainId:43113,contract:SeasonRewards,block:block.number,blockHash:block.hash,timestamp:block.timestamp,balance};
      return modules.createTesterBudgetReservation({contract:SeasonRewards,snapshot:async()=>snapshot,
        now:()=>Number(block.timestamp)*1000,
        reserve:row=>chainOne('select public.chain_tester_reserve($1::jsonb) r',[JSON.stringify(row)])})(request);
    };
    const reward=modules.createTesterReward({key:signerKey,contract:SeasonRewards,reserve:reserveTester,reservationRequired:true,
      eligible:async(player,wallet)=>!!await one('select exists(select 1 from public.chain_judge_passes where player_id=$1 and wallet=$2) r',[player,wallet]),
      season:()=>client.readContract({address:SeasonRewards,abi:artifact('SeasonRewards').abi,functionName:'currentSeason'}),
      nonceUsed:nonce=>client.readContract({address:SeasonRewards,abi:artifact('SeasonRewards').abi,functionName:'usedNonces',args:[nonce]})});
    if(campaignRewards){
      const b=await client.getBlock({blockTag:'latest'}),contract=SeasonRewards.toLowerCase();
      const plan={id:'local-campaign-only',contract,season:0,source_id:modules.CAMPAIGN_SOURCE,rules_hash:modules.CAMPAIGN_RULES_HASH,
        evidence_hash:'1'.repeat(64),ceiling:viem.parseEther('3000').toString(),boss_max:viem.parseEther('1.5').toString(),
        rank_max:viem.parseEther('1.5').toString(),weekly_cap:viem.parseEther('12').toString()};
      await chainOne('select chain_reward_budget_register($1::jsonb) r',[JSON.stringify({budget:plan,
        pool_balance:(await client.readContract({address:YarnToken,abi:artifact('YarnToken').abi,functionName:'balanceOf',args:[SeasonRewards],blockNumber:b.number})).toString(),block:b.number.toString(),block_hash:b.hash})]);
      // Explicit disposable program. No row or enabled setting is migrated publicly.
      await db.query('insert into chain_campaign_reward_programs values($1,$2,$3,0,0,true)',[contract,Number(epoch),modules.CAMPAIGN_RULES_HASH]);
      await db.query('update chain_reward_budgets set enabled=true where id=$1',[plan.id]);
    }
    const campaignClaim=modules.createCampaignClaim({enabled:campaignRewards,contract:SeasonRewards,token:YarnToken,
      key:signerKey,rulesHash:modules.CAMPAIGN_RULES_HASH,client,
      read:(p,w,c,k,t)=>chainOne('select chain_campaign_reward_evidence($1,$2,$3,$4,$5) r',[p,w,c,k,t]),
      reserve:r=>chainOne('select chain_reward_reserve($1::jsonb) r',[JSON.stringify(r)]),
      renew:r=>chainOne('select chain_reward_renew($1::jsonb) r',[JSON.stringify(r)]),
      stored:(source,receipt)=>one('select to_jsonb(r) r from chain_reward_reservations r where source_id=$1 and receipt_id=$2',[source,receipt])});
    const authStore={
      createNonce:nonce=>db.query('select public.create_siwe_nonce($1)',[nonce]),
      consumeNonce:nonce=>one('select public.consume_siwe_nonce($1) r',[nonce]),
      upsertPlayerByWallet:async wallet=>({id:await one('select public.upsert_player_by_wallet($1) r',[wallet])}),
    };
    const jwtSecret=randomBytes(32).toString('hex');
    const authDeps={store:authStore,config:{jwtSecret,domain:new URL(localOrigin).host}};
    // Opt-in local browser-test isolation. Preserve real SQL, quotas and signed
    // transactions while rolling back BOTH ledgers between disposable accounts.
    let fixtureId=null,apiRequests=0;
    const server=httpServer(async(incoming,outgoing)=>{
      let counted=false;
      try{
        const origin=incoming.headers.origin;
        if(!['127.0.0.1','::ffff:127.0.0.1'].includes(incoming.socket.remoteAddress)||incoming.headers.host!==new URL(localApi).host||(origin&&origin!==localOrigin)){outgoing.writeHead(403).end();return;}
        outgoing.setHeader('access-control-allow-origin',localOrigin);
        outgoing.setHeader('access-control-allow-headers','content-type,authorization');outgoing.setHeader('access-control-allow-methods','POST,OPTIONS');outgoing.setHeader('cache-control','no-store');
        if(incoming.method==='OPTIONS'){outgoing.writeHead(204).end();return;}
        if(incoming.url==='/health'){outgoing.end('local-chain');return;}
        if(incoming.method!=='POST'){outgoing.writeHead(405).end();return;}
        if(process.env.CHAIN_LOCAL_FIXTURE_ISOLATION==='1'&&['/__fixture/begin','/__fixture/rollback'].includes(incoming.url)){
          incoming.resume();
          for(let n=0;apiRequests&&n<200;n++)await new Promise(r=>setTimeout(r,50));
          if(apiRequests)throw new Error('Local fixture requests did not settle');
          if(incoming.url.endsWith('/begin')){
            if(fixtureId!==null)throw new Error('Local fixture already open');
            await db.query('begin');fixtureId=await client.request({method:'evm_snapshot',params:[]});
          }else{
            if(fixtureId===null)throw new Error('No local fixture to restore');
            await db.query('rollback');const restored=await client.request({method:'evm_revert',params:[fixtureId]});fixtureId=null;
            if(!restored)throw new Error('Local chain snapshot expired');
          }
          outgoing.setHeader('content-type','application/json');outgoing.end(JSON.stringify({ok:true,open:fixtureId!==null}));return;
        }
        apiRequests++;counted=true;
        const name=incoming.url.replace('/functions/v1/','');let input,result;
        if(['guest-drip','chain-items','chain-judge','chain-cosmetics','chain-campaign','chain-campaign-reward','chain-economy-v3'].includes(name)){
          const abort=new AbortController(),cancel=()=>abort.abort();incoming.once('aborted',cancel);
          try{input=await modules.readChainBody(new Request(localApi+incoming.url,{method:'POST',headers:incoming.headers,body:Readable.toWeb(incoming),duplex:'half',signal:abort.signal}),name);}
          finally{incoming.off('aborted',cancel);}
        }else{
          const chunks=[];let size=0;for await(const chunk of incoming){size+=chunk.length;if(size>8192){outgoing.writeHead(413).end();return;}chunks.push(chunk);}
          input=JSON.parse(Buffer.concat(chunks).toString()||'{}');
        }
        if(name==='auth-nonce')result=await modules.issueNonce(authDeps);
        else if(name==='auth-verify')result=await modules.verifySignIn(authDeps,input);
        else {
          const token=(incoming.headers.authorization||'').replace(/^Bearer\s+/i,'');
          const session=await modules.verifySessionToken(token,{jwtSecret});
          if(name==='guest-drip')result=await drip(session.sub,viem.getAddress(session.wallet),await modules.dripIpHash(incoming.socket.remoteAddress,jwtSecret));
          else if(name==='chain-economy-v3')result=await economy(session.sub,session.wallet,input);
            else if(name==='chain-items')result=input.action==='reward'?await reward(session.sub,viem.getAddress(session.wallet)):await items(session.sub,viem.getAddress(session.wallet),input);
          else if(name==='chain-cosmetics')result=await cosmetics(session.sub,viem.getAddress(session.wallet),input);
          else if(name==='chain-campaign-reward'){
            // Anvil has no background block producer; tick only the local chain.
            await client.request({method:'evm_mine',params:[]});
            try{result=await campaignClaim(session.sub,viem.getAddress(session.wallet),input.action,input.kind);}
            catch(error){throw modules.routineError(error);}
          }
          else if(name==='chain-campaign')result=await campaign(session.sub,session.wallet.toLowerCase(),input);
          else if(name==='chain-judge')result=await judge(session.sub,viem.getAddress(session.wallet),await modules.dripIpHash(incoming.socket.remoteAddress,jwtSecret),input.action);
          else {outgoing.writeHead(404).end();return;}
        }
        outgoing.setHeader('content-type','application/json');outgoing.end(stringify(result));
      }catch(error){
        const failure=modules.chainFailure(error,'local_request_failed');
        // Unexpected failures surface to the UI as a generic retry; keep the cause in the CI log.
        if(failure.status>=500&&error?.name!=='AuthError')console.error('[chain-local]',incoming.url,error?.code??'',error?.message??error);
        outgoing.setHeader('content-type','application/json');
        outgoing.writeHead(error?.name==='AuthError'?401:failure.status).end(stringify(failure.body));
      }finally{if(counted)apiRequests--;}
    });
    await new Promise((r,j)=>{server.once('error',j);server.listen(ports.api,'127.0.0.1',r);});handles.push(()=>new Promise(r=>server.close(r)));
    mkdirSync(resolve(root,'apps/web/public'),{recursive:true});
    // Anvil keeps block timestamps strictly increasing, so the burst of deploy and
    // seed blocks above runs ahead of the wall clock on a fast machine. Reward
    // quotes refuse a chain head more than 5 s in the future (routine_snapshot),
    // so let real time catch up before the fixture opens.
    for(let head=Number((await client.getBlock()).timestamp);head>Math.floor(Date.now()/1000);head=Number((await client.getBlock()).timestamp))
      await new Promise(r=>setTimeout(r,250));
    writeFileSync(resolve(root,'apps/web/public/chain-local.json'),stringify(config));
    writeFileSync(resolve(root,'work/chain/local-addresses.json'),stringify(config));
    if(web){
      // The optional legacy chain suite exercises Seal and campaign rewards;
      // the current demo uses Café instead. Select that fixture explicitly.
      Object.assign(process.env,{VITE_CHAIN_DEMO:economyV3?'1':'0',VITE_ECONOMY_V3:economyV3?'1':'0',VITE_GUEST_WALLET:'1',VITE_CHAIN_LOOP:'1',VITE_ITEM_TRADING:'1',VITE_YARN_TOKEN:'1',VITE_V3_START_BLOCK:'0',VITE_CHAIN_MODE:'local',VITE_YARN_COSMETICS:'1',VITE_RELIC_FORGE:'1',VITE_CHAIN_CAMPAIGN:'1',VITE_CHAIN_CAMPAIGN_REWARDS:campaignRewards?'1':'0',VITE_SUPABASE_URL:localApi,VITE_FUJI_RPC_URL:localRpc,VITE_ALLOW_MOCK_AUTH:'0'});
      const {createServer}=await import(pathToFileURL(webRequire.resolve('vite')));
      const vite=await createServer({root:resolve(root,'apps/web'),envDir:false,server:{host:'127.0.0.1',port:ports.web,strictPort:true}});
      await vite.listen();handles.push(()=>vite.close());
    }
    return {economy,config,client,db,modules,drip,judge,items,cosmetics,campaign,campaignClaim,reward,authDeps,stop};
  }catch(error){await stop();throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const runtime=await startLocal({web:!process.argv.includes('--no-web'),economyV3:!process.argv.includes('--legacy-economy')});
  console.log(`Local Fuji ready: ${localOrigin}/?demo=1&squad=1&cardrpg2=1&a6=1`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await runtime.stop();process.exit(0);});
}
