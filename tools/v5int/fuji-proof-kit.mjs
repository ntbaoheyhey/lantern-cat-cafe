#!/usr/bin/env node
// Owner-run sponsored guest funding proof; no private-key input or contract deployment.
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const FUNDING_WEI=50_000_000_000_000_000n;
const address=/^0x[\da-f]{40}$/i,hashPattern=/^0x[\da-f]{64}$/i;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const requireProof=(ok,message)=>{if(!ok)throw new Error(message);};
const decimal=value=>`${value/10n**18n}.${(value%10n**18n).toString().padStart(18,'0')}`.replace(/\.?0+$/,'');

export function publicConfig(env){
  const required=['PROOF_CONFIRM_FUJI','PROOF_RPC_URL','PROOF_DRIP_URL','PROOF_GUEST_ADDRESS','PROOF_GUEST_TOKEN'];
  requireProof(required.every(key=>typeof env[key]==='string'&&env[key].trim()),'Set all documented PROOF_* variables before using --fuji.');
  requireProof(env.PROOF_CONFIRM_FUJI==='YES','PROOF_CONFIRM_FUJI must be YES.');
  requireProof(address.test(env.PROOF_GUEST_ADDRESS),'Invalid guest address.');
  for(const key of ['PROOF_RPC_URL','PROOF_DRIP_URL']){
    let url;try{url=new URL(env[key]);}catch{throw new Error('Invalid proof endpoint.');}
    requireProof(url.protocol==='https:'&&!url.username&&!url.password,'Public proof endpoints require HTTPS without URL credentials.');
    requireProof(!['localhost','127.0.0.1','[::1]'].includes(url.hostname),'Use --dry-run for a local proof.');
    if(key==='PROOF_DRIP_URL')requireProof(url.pathname.endsWith('/functions/v1/guest-drip'),'Use the existing guest-drip function endpoint.');
  }
  return {rpcUrl:env.PROOF_RPC_URL,dripUrl:env.PROOF_DRIP_URL,guest:env.PROOF_GUEST_ADDRESS,token:env.PROOF_GUEST_TOKEN};
}

export function fundingProof({hash,guest,tx,receipt,confirmationMs,local}){
  requireProof(hashPattern.test(hash)&&address.test(guest),'Invalid proof identity.');
  requireProof(tx&&receipt&&equal(tx.hash,hash)&&equal(receipt.transactionHash,hash),'Transaction hash mismatch.');
  requireProof(receipt.status==='0x1','Funding transaction did not succeed.');
  requireProof(equal(tx.to,guest)&&equal(receipt.to,guest)&&address.test(tx.from)&&!equal(tx.from,guest)&&equal(receipt.from,tx.from),'Funding sender or recipient mismatch.');
  requireProof(/^0x[\da-f]+$/i.test(tx.value??'')&&BigInt(tx.value)===FUNDING_WEI,'Funding amount mismatch.');
  requireProof(['gasUsed','effectiveGasPrice','blockNumber'].every(key=>/^0x[\da-f]+$/i.test(receipt[key]??'')),'Incomplete receipt fee or block.');
  const fee=BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice);
  requireProof(BigInt(receipt.gasUsed)>0n&&Number.isFinite(confirmationMs)&&confirmationMs>=0,'Incomplete receipt timing or gas.');
  return {kind:'sponsored guest funding',network:local?'local Anvil':'Avalanche Fuji',chainId:43113,hash,guest,payer:receipt.from,
    fundingWei:FUNDING_WEI.toString(),feeWei:fee.toString(),feeAvax:decimal(fee),block:BigInt(receipt.blockNumber).toString(),
    confirmationMs:Math.round(confirmationMs),explorer:local?null:`https://testnet.snowtrace.io/tx/${hash}`,
    scope:local?'Local funding only; not a public Fuji or full game journey proof.':'Confirmed guest funding only; not a mint or full game journey proof.'};
}

export function rpcClient(url){
  return async(method,params=[])=>{
    let response;try{response=await fetch(url,{method:'POST',redirect:'error',headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(10_000)});}catch{throw new Error(`RPC unavailable (${method}).`);}
    requireProof(response.ok,`RPC HTTP failure (${method}).`);
    let body;try{body=await response.json();}catch{throw new Error('RPC returned invalid JSON.');}
    requireProof(!body.error&&Object.hasOwn(body,'result'),`RPC rejected ${method}.`);return body.result;
  };
}

export async function collectProof({rpc,guest,submit,local}){
  requireProof(BigInt(await rpc('eth_chainId'))===43113n,'Expected Fuji chain ID 43113.');
  const start=performance.now(),hash=await submit();requireProof(hashPattern.test(hash),'Funding service did not return a transaction hash.');
  const deadline=performance.now()+45_000;
  while(performance.now()<deadline){
    const receipt=await rpc('eth_getTransactionReceipt',[hash]);
    if(receipt)return fundingProof({hash,guest,receipt,tx:await rpc('eth_getTransactionByHash',[hash]),confirmationMs:performance.now()-start,local});
    await sleep(500);
  }
  throw new Error('Funding confirmation timed out. No confirmed proof was produced.');
}

async function publicProof(config){
  return collectProof({rpc:rpcClient(config.rpcUrl),guest:config.guest,local:false,submit:async()=>{
    let response;try{response=await fetch(config.dripUrl,{method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${config.token}`},body:'{}',signal:AbortSignal.timeout(25_000)});}catch{throw new Error('Guest funding service unavailable.');}
    requireProof(response.ok,'Guest funding request failed. Check the guest session and sponsor budget.');
    let body;try{body=await response.json();}catch{throw new Error('Guest funding response is invalid.');}
    requireProof(['pending','confirmed'].includes(body.status),'Guest funding was not accepted.');return body.txHash;
  }});
}

async function assertFreePort(port){
  const server=createServer();await new Promise((done,reject)=>{server.once('error',()=>reject(new Error(`Owned local port ${port} is busy; no process was stopped.`)));server.listen(port,'127.0.0.1',done);});
  await new Promise((done,reject)=>server.close(error=>error?reject(error):done()));
}

export async function localProof(){
  const port=6308;await assertFreePort(port);
  const dir=resolve(import.meta.dirname,'../../work/v5/CXI/proof');await mkdir(dir,{recursive:true});
  // Ignore both streams: Anvil startup output must never expose development keys.
  const child=spawn('anvil',['--quiet','--host','127.0.0.1','--port',String(port),'--chain-id','43113','--accounts','2','--balance','1'],{stdio:'ignore',env:{PATH:process.env.PATH}});
  let launchFailed=false;child.on('error',()=>{launchFailed=true;});
  const pidPath=resolve(dir,'local-anvil.pid');
  try{
    if(child.pid)await writeFile(pidPath,`${child.pid}\n`);
    const rpc=rpcClient(`http://127.0.0.1:${port}`),deadline=performance.now()+10_000;
    let ready=false;
    while(performance.now()<deadline){
      await sleep(150);requireProof(!launchFailed&&child.exitCode===null,'Local Anvil failed to start.');
      try{ready=/anvil/i.test(await rpc('web3_clientVersion'));}catch{}
      if(ready)break;
    }
    requireProof(ready,'Local Anvil startup timed out.');
    const [sponsor,guest]=await rpc('eth_accounts');requireProof(address.test(sponsor)&&address.test(guest),'Local unlocked accounts unavailable.');
    return await collectProof({rpc,guest,local:true,submit:()=>rpc('eth_sendTransaction',[{from:sponsor,to:guest,value:`0x${FUNDING_WEI.toString(16)}`,gas:'0x5208'}])});
  }finally{
    if(child.pid&&child.exitCode===null){child.kill('SIGTERM');await new Promise(done=>{child.once('exit',done);setTimeout(done,2000).unref();});}
    if(child.pid&&child.exitCode===null)child.kill('SIGKILL');
    await rm(pidPath,{force:true});
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{
    requireProof(process.argv.length===3&&['--dry-run','--fuji'].includes(process.argv[2]),'Usage: node tools/v5int/fuji-proof-kit.mjs --dry-run | --fuji');
    const proof=process.argv[2]==='--dry-run'?await localProof():await publicProof(publicConfig(process.env));
    console.log(JSON.stringify(proof,null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
