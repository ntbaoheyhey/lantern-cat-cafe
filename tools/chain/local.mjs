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
    const rewards = await loader.ssrLoadModule('/supabase/functions/_shared/chain-rewards.ts');
    const chainHttp = await loader.ssrLoadModule('/supabase/functions/_shared/chain-http.ts');
    const trade = await loader.ssrLoadModule('/packages/game-rules/src/cardrpg/trade.ts');
    const move = await loader.ssrLoadModule('/apps/web/src/game/cardrpg/chain/move.ts');
    const runtime = await loader.ssrLoadModule('/apps/web/src/game/cardrpg/chain/runtime.ts');
    return {...db,...auth,...drip,...relic,...judge,...items,...rewards,...chainHttp,...trade,...move,...runtime,close:()=>loader.close()};
  } catch(error){await loader.close();throw error;}
}
export async function startLocal({web = true} = {}) {
  mkdirSync(resolve(root,'work/chain'),{recursive:true});
  const handles = [];
  const stop = async () => {for(const close of handles.reverse()){try{await close();}catch{}}};
  try {
    // Fail if a listener already exists; never reuse an unknown chain.
    const probe = await fetch(localRpc,{method:'POST',headers:{'content-type':'application/json'},body:'{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'}).catch(()=>null);
    if(probe)throw new Error(`${localRpc} already in use; stop its owner first.`);
    // Public RPCs do not unlock operator wallets. Keep fixtures locked so tests
    // cannot accidentally pass by delegating transaction signing to Anvil.
    const anvil = spawn('anvil',['--host','127.0.0.1','--port',String(ports.rpc),'--chain-id','43113','--accounts','0','--silent'],{cwd:root,stdio:'ignore'});
    handles.push(async()=>{anvil.kill('SIGTERM');await new Promise(r=>anvil.exitCode!==null?r():anvil.once('exit',r));});
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
    const config={chainId:43113,rpcUrl:localRpc,RelicNFT,RelicMarket,YarnToken,RelicMarketV2,SeasonRewards,treasury:devAccount(4).address,startBlock:'0'};
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
    const store={
      reserve:a=>chainOne('select public.chain_drip_reserve($1,$2,$3,$4,$5,$6,$7) r',[a.player,a.wallet,a.ip,a.sponsor,a.nonce,a.gasPrice,a.balance]),
      signed:(wallet,raw,hash)=>chainOne('select public.chain_drip_signed($1,$2,$3) r',[wallet,raw,hash]),
      result:(wallet,hash,success)=>chainOne('select public.chain_drip_result($1,$2,$3) r',[wallet,hash,success]),
    };
    const drip=modules.createDrip({key:viem.toHex(sponsor.getHdKey().privateKey),rpcUrl:localRpc,store});
    const judge=modules.createJudge({signer:voucherSigner,nonceUsed:nonce=>client.readContract({address:RelicNFT,abi:nftAbi,functionName:'usedNonces',args:[nonce]}),store:{reserve:(player,wallet,ip,boss)=>chainOne('select public.chain_judge_reserve($1,$2,$3,$4) r',[player,wallet,ip,boss])}});
    const items=modules.createItems({signer:voucherSigner,
      paid:(wallet,intent)=>client.readContract({address:YarnToken,abi:artifact('YarnToken').abi,functionName:'sealPayments',args:[wallet,intent]}),
      nonceUsed:nonce=>client.readContract({address:RelicNFT,abi:nftAbi,functionName:'usedNonces',args:[nonce]}),
      store:{inventory:(player,wallet)=>chainOne('select public.chain_item_inventory($1,$2) r',[player,wallet]),
        reserve:(player,wallet,inventory,token,rarity,cost)=>chainOne('select public.chain_seal_reserve($1,$2,$3,$4,$5,$6) r',[player,wallet,inventory,token,rarity,cost]),
        finalize:(player,intent)=>chainOne('select public.chain_seal_finalize($1,$2) r',[player,intent])}});
    const reward=modules.createTesterReward({key:signerKey,contract:SeasonRewards,
      eligible:async(player,wallet)=>!!await one('select exists(select 1 from public.chain_judge_passes where player_id=$1 and wallet=$2) r',[player,wallet]),
      season:()=>client.readContract({address:SeasonRewards,abi:artifact('SeasonRewards').abi,functionName:'currentSeason'}),
      nonceUsed:nonce=>client.readContract({address:SeasonRewards,abi:artifact('SeasonRewards').abi,functionName:'usedNonces',args:[nonce]})});
    const authStore={
      createNonce:nonce=>db.query('select public.create_siwe_nonce($1)',[nonce]),
      consumeNonce:nonce=>one('select public.consume_siwe_nonce($1) r',[nonce]),
      upsertPlayerByWallet:async wallet=>({id:await one('select public.upsert_player_by_wallet($1) r',[wallet])}),
    };
    const jwtSecret=randomBytes(32).toString('hex');
    const authDeps={store:authStore,config:{jwtSecret,domain:new URL(localOrigin).host}};
    const server=httpServer(async(incoming,outgoing)=>{
      try{
        const origin=incoming.headers.origin;
        if(!['127.0.0.1','::ffff:127.0.0.1'].includes(incoming.socket.remoteAddress)||incoming.headers.host!==new URL(localApi).host||(origin&&origin!==localOrigin)){outgoing.writeHead(403).end();return;}
        outgoing.setHeader('access-control-allow-origin',localOrigin);
        outgoing.setHeader('access-control-allow-headers','content-type,authorization');outgoing.setHeader('access-control-allow-methods','POST,OPTIONS');outgoing.setHeader('cache-control','no-store');
        if(incoming.method==='OPTIONS'){outgoing.writeHead(204).end();return;}
        if(incoming.url==='/health'){outgoing.end('local-chain');return;}
        if(incoming.method!=='POST'){outgoing.writeHead(405).end();return;}
        const name=incoming.url.replace('/functions/v1/','');let input,result;
        if(['guest-drip','chain-items','chain-judge'].includes(name)){
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
          else if(name==='chain-items')result=input.action==='reward'?await reward(session.sub,viem.getAddress(session.wallet)):await items(session.sub,viem.getAddress(session.wallet),input);
          else if(name==='chain-judge')result=await judge(session.sub,viem.getAddress(session.wallet),await modules.dripIpHash(incoming.socket.remoteAddress,jwtSecret),input.action);
          else {outgoing.writeHead(404).end();return;}
        }
        outgoing.setHeader('content-type','application/json');outgoing.end(stringify(result));
      }catch(error){
        const failure=modules.chainFailure(error,'local_request_failed');
        outgoing.setHeader('content-type','application/json');
        outgoing.writeHead(error?.name==='AuthError'?401:failure.status).end(stringify(failure.body));
      }
    });
    await new Promise((r,j)=>{server.once('error',j);server.listen(ports.api,'127.0.0.1',r);});handles.push(()=>new Promise(r=>server.close(r)));
    mkdirSync(resolve(root,'apps/web/public'),{recursive:true});
    writeFileSync(resolve(root,'apps/web/public/chain-local.json'),stringify(config));
    writeFileSync(resolve(root,'work/chain/local-addresses.json'),stringify(config));
    if(web){
      Object.assign(process.env,{VITE_CHAIN_DEMO:'1',VITE_CHAIN_MODE:'local',VITE_SUPABASE_URL:localApi,VITE_FUJI_RPC_URL:localRpc,VITE_ALLOW_MOCK_AUTH:'0'});
      const {createServer}=await import(pathToFileURL(webRequire.resolve('vite')));
      const vite=await createServer({root:resolve(root,'apps/web'),envDir:false,server:{host:'127.0.0.1',port:ports.web,strictPort:true}});
      await vite.listen();handles.push(()=>vite.close());
    }
    return {config,client,db,modules,drip,judge,items,reward,authDeps,stop};
  }catch(error){await stop();throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const runtime=await startLocal({web:!process.argv.includes('--no-web')});
  console.log(`Local Fuji ready: ${localOrigin}/?demo=1&squad=1&cardrpg2=1&a6=1`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await runtime.stop();process.exit(0);});
}
