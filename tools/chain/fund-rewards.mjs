// Explicit operator action. No dotenv, no key output, no direct RPC account unlocking.
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url)),req=createRequire(resolve(root,'apps/web/package.json'));
const load=n=>import(pathToFileURL(req.resolve(n).replace('/_cjs/','/_esm/')));
if(!process.argv.includes('--run')){console.log('Operator only: DISTRIBUTOR_PRIVATE_KEY, YARN_TOKEN_ADDRESS, SEASON_REWARDS_ADDRESS, FUJI_RPC_URL in env; --run sends 10,000 test YARN if the pool is empty.');process.exit(0);}
try{
 const {createPublicClient,createWalletClient,http,getAddress,parseEther}=await load('viem'),{privateKeyToAccount}=await load('viem/accounts'),{avalancheFuji}=await load('viem/chains');
 const token=getAddress(process.env.YARN_TOKEN_ADDRESS||''),rewards=getAddress(process.env.SEASON_REWARDS_ADDRESS||''),rpc=process.env.FUJI_RPC_URL||avalancheFuji.rpcUrls.default.http[0];
 const client=createPublicClient({chain:avalancheFuji,transport:http(rpc)});if(await client.getChainId()!==43113)throw new Error();
 const abi=n=>JSON.parse(readFileSync(resolve(root,`contracts/out/${n}.sol/${n}.json`),'utf8')).abi;
 if((await client.readContract({address:rewards,abi:abi('SeasonRewards'),functionName:'yarn'})).toLowerCase()!==token.toLowerCase())throw new Error();
 const existing=await client.readContract({address:token,abi:abi('YarnToken'),functionName:'balanceOf',args:[rewards]});
 if(existing>0n){console.log('Pool already funded; no transaction sent.');process.exit(0);}
 const wallet=createWalletClient({chain:avalancheFuji,account:privateKeyToAccount(process.env.DISTRIBUTOR_PRIVATE_KEY||''),transport:http(rpc)});
 const simulation=await client.simulateContract({address:token,abi:abi('YarnToken'),functionName:'transfer',args:[rewards,parseEther('10000')],account:wallet.account});
 const hash=await wallet.writeContract(simulation.request);if((await client.waitForTransactionReceipt({hash})).status!=='success')throw new Error();
 console.log(`Funded 10,000 test YARN: https://testnet.snowtrace.io/tx/${hash}`);
}catch{console.error('Funding stopped. Check Fuji, token/pool addresses, distributor balance and environment. No secret values logged.');process.exitCode=1;}
