// Throwaway localhost only. Never reads .env or production signing keys.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {dirname,resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {createServer as httpServer} from 'node:http';
import {randomBytes} from 'node:crypto';
export const root = resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const webRequire = createRequire(resolve(root,'apps/web/package.json'));
const testsRequire = createRequire(resolve(root,'supabase/tests/package.json'));
const esm = path => path.replace('/_cjs/','/_esm/');
const viem = await import(pathToFileURL(esm(webRequire.resolve('viem'))));
const accounts = await import(pathToFileURL(esm(webRequire.resolve('viem/accounts'))));
export const localRpc = 'http://127.0.0.1:5981';
export const localApi = 'http://127.0.0.1:5982';
export const localOrigin = 'http://127.0.0.1:5980';
// Public Anvil fixture, explicitly not a production credential.
const mnemonic = 'test test test test test test test test test test test junk';
export const devAccount = i => accounts.mnemonicToAccount(mnemonic,{addressIndex:i});
export const stringify = value => JSON.stringify(value,(_,v)=>typeof v === 'bigint'?v.toString():v);
const chain = {id:43113,name:'Local Fuji',nativeCurrency:{name:'AVAX',symbol:'AVAX',decimals:18},rpcUrls:{default:{http:[localRpc]}}};
export const localClient = () => viem.createPublicClient({chain,transport:viem.http(localRpc),pollingInterval:50});
const walletFor = account => viem.createWalletClient({chain,account,transport:viem.http(localRpc)});
const artifact = name => JSON.parse(readFileSync(resolve(root,`contracts/out/${name}.sol/${name}.json`),'utf8'));

export async function loadModules() {
  const {createServer} = await import(pathToFileURL(webRequire.resolve('vite')));
  const loader = await createServer({root,configFile:false,envDir:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false,watch:null},
    resolve:{alias:[...['game-rules','api-contract','chain'].map(name=>({find:`@taskbar-hero/${name}`,replacement:resolve(root,`packages/${name}/src/index.ts`)})),
      ...['viem','viem/accounts','viem/siwe'].map(name=>({find:new RegExp(`^${name}$`),replacement:esm(testsRequire.resolve(name))}))]},
    ssr:{noExternal:['@taskbar-hero/game-rules','@taskbar-hero/api-contract','@taskbar-hero/chain']}});
  try {
    const db = await loader.ssrLoadModule('/supabase/tests/src/standalone-db.ts');
    const auth = await loader.ssrLoadModule('/packages/auth/src/index.ts');
    const drip = await loader.ssrLoadModule('/supabase/functions/_shared/guest-drip.ts');
    const relic = await loader.ssrLoadModule('/supabase/functions/_shared/relic.ts');
    const judge = await loader.ssrLoadModule('/supabase/functions/_shared/chain-judge.ts');
    return {...db,...auth,...drip,...relic,...judge,close:()=>loader.close()};
  } catch(error){await loader.close();throw error;}
}
export async function startLocal({web = true} = {}) {
  mkdirSync(resolve(root,'work/chain'),{recursive:true});
  const handles = [];
  const stop = async () => {for(const close of handles.reverse()){try{await close();}catch{}}};
  try {
    // Fail if a listener already exists; never reuse an unknown chain.
    const probe = await fetch(localRpc,{method:'POST',headers:{'content-type':'application/json'},body:'{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'}).catch(()=>null);
    if(probe)throw new Error('Port 5981 already in use; stop its owner first.');
    const anvil = spawn('anvil',['--host','127.0.0.1','--port','5981','--chain-id','43113','--silent'],{cwd:root,stdio:'ignore'});
    handles.push(async()=>{anvil.kill('SIGTERM');await new Promise(r=>anvil.exitCode!==null?r():anvil.once('exit',r));});
    const client=localClient();
    for(let i=0;;i++){try{if(await client.getChainId()===43113)break;}catch{}if(i>=50)throw new Error('Anvil unavailable');await new Promise(r=>setTimeout(r,100));}
    execFileSync('forge',['build','--root','contracts'],{cwd:root,stdio:'pipe'});
    const deployer=devAccount(0), signer=devAccount(2), bot=devAccount(1), sponsor=devAccount(3);
    const deployWallet=walletFor(deployer);
    const deploy=async(name,args)=>{
      const a=artifact(name), hash=await deployWallet.deployContract({abi:a.abi,bytecode:a.bytecode.object,args});
      const receipt=await client.waitForTransactionReceipt({hash});
      if(receipt.status!=='success'||!receipt.contractAddress)throw new Error('Local deployment failed');return receipt.contractAddress;
    };
    const RelicNFT=await deploy('RelicNFT',[deployer.address,signer.address,'http://127.0.0.1:5980/relics/{id}.json']);
    const RelicMarket=await deploy('RelicMarket',[RelicNFT]);
    const config={chainId:43113,rpcUrl:localRpc,RelicNFT,RelicMarket,startBlock:'0'};
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
    await send(botWallet,RelicNFT,nftAbi,'setApprovalForAll',[RelicMarket,true]);
    const expiry=BigInt(Math.floor(Date.now()/1000)+3600);
    for(let id=1;id<=4;id++){
      const voucher={player:bot.address,relicId:BigInt(id),rarity:id-1,nonce:BigInt(id),expiry};
      await send(botWallet,RelicNFT,nftAbi,'mint',[voucher,await voucherSigner.sign(voucher)]);
      await send(botWallet,RelicMarket,marketAbi,'list',[BigInt(id),1n,viem.parseEther('0.001')]);
    }
    const one=async(sql,args)=>(await db.query(sql,args)).rows[0]?.r;
    const store={
      reserve:a=>one('select public.chain_drip_reserve($1,$2,$3,$4,$5,$6,$7) r',[a.player,a.wallet,a.ip,a.sponsor,a.nonce,a.gasPrice,a.balance]),
      signed:(wallet,raw,hash)=>one('select public.chain_drip_signed($1,$2,$3) r',[wallet,raw,hash]),
      result:(wallet,hash,success)=>one('select public.chain_drip_result($1,$2,$3) r',[wallet,hash,success]),
    };
    const drip=modules.createDrip({key:viem.toHex(sponsor.getHdKey().privateKey),rpcUrl:localRpc,store});
    const judge=modules.createJudge({signer:voucherSigner,nonceUsed:nonce=>client.readContract({address:RelicNFT,abi:nftAbi,functionName:'usedNonces',args:[nonce]}),store:{reserve:(player,wallet,ip,boss)=>one('select public.chain_judge_reserve($1,$2,$3,$4) r',[player,wallet,ip,boss])}});
    const authStore={
      createNonce:nonce=>db.query('select public.create_siwe_nonce($1)',[nonce]),
      consumeNonce:nonce=>one('select public.consume_siwe_nonce($1) r',[nonce]),
      upsertPlayerByWallet:async wallet=>({id:await one('select public.upsert_player_by_wallet($1) r',[wallet])}),
    };
    const jwtSecret=randomBytes(32).toString('hex');
    const authDeps={store:authStore,config:{jwtSecret,domain:'127.0.0.1:5980'}};
    const server=httpServer(async(incoming,outgoing)=>{
      try{
        const origin=incoming.headers.origin;
        if(!['127.0.0.1','::ffff:127.0.0.1'].includes(incoming.socket.remoteAddress)||incoming.headers.host!=='127.0.0.1:5982'||(origin&&origin!==localOrigin)){outgoing.writeHead(403).end();return;}
        outgoing.setHeader('access-control-allow-origin',localOrigin);
        outgoing.setHeader('access-control-allow-headers','content-type,authorization');outgoing.setHeader('access-control-allow-methods','POST,OPTIONS');outgoing.setHeader('cache-control','no-store');
        if(incoming.method==='OPTIONS'){outgoing.writeHead(204).end();return;}
        if(incoming.url==='/health'){outgoing.end('local-chain');return;}
        if(incoming.method!=='POST'){outgoing.writeHead(405).end();return;}
        const chunks=[];let size=0;for await(const chunk of incoming){size+=chunk.length;if(size>8192){outgoing.writeHead(413).end();return;}chunks.push(chunk);}
        const input=JSON.parse(Buffer.concat(chunks).toString()||'{}');
        const name=incoming.url.replace('/functions/v1/','');let result;
        if(name==='auth-nonce')result=await modules.issueNonce(authDeps);
        else if(name==='auth-verify')result=await modules.verifySignIn(authDeps,input);
        else {
          const token=(incoming.headers.authorization||'').replace(/^Bearer\s+/i,'');
          const session=await modules.verifySessionToken(token,{jwtSecret});
          if(name==='guest-drip')result=await drip(session.sub,viem.getAddress(session.wallet),await modules.dripIpHash(incoming.socket.remoteAddress,jwtSecret));
          else if(name==='chain-judge')result=await judge(session.sub,viem.getAddress(session.wallet),await modules.dripIpHash(incoming.socket.remoteAddress,jwtSecret),input.action);
          else {outgoing.writeHead(404).end();return;}
        }
        outgoing.setHeader('content-type','application/json');outgoing.end(stringify(result));
      }catch(error){outgoing.writeHead(error?.name==='AuthError'?401:503).end(stringify({error:'local_request_failed'}));}
    });
    await new Promise((r,j)=>{server.once('error',j);server.listen(5982,'127.0.0.1',r);});handles.push(()=>new Promise(r=>server.close(r)));
    mkdirSync(resolve(root,'apps/web/public'),{recursive:true});
    writeFileSync(resolve(root,'apps/web/public/chain-local.json'),stringify(config));
    writeFileSync(resolve(root,'work/chain/local-addresses.json'),stringify(config));
    if(web){
      Object.assign(process.env,{VITE_CHAIN_DEMO:'1',VITE_CHAIN_MODE:'local',VITE_SUPABASE_URL:localApi,VITE_FUJI_RPC_URL:localRpc,VITE_ALLOW_MOCK_AUTH:'0'});
      const {createServer}=await import(pathToFileURL(webRequire.resolve('vite')));
      const vite=await createServer({root:resolve(root,'apps/web'),envDir:false,server:{host:'127.0.0.1',port:5980,strictPort:true}});
      await vite.listen();handles.push(()=>vite.close());
    }
    return {config,client,db,modules,drip,authDeps,stop};
  }catch(error){await stop();throw error;}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const runtime=await startLocal({web:!process.argv.includes('--no-web')});
  console.log(`Local Fuji ready: ${localOrigin}/?demo=1&squad=1&cardrpg2=1&a6=1`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await runtime.stop();process.exit(0);});
}
