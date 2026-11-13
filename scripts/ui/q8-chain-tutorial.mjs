/** Wallet tours on disposable Anvil only; no transactions go to public Fuji. */
import {spawn} from 'node:child_process';
process.env.CHAIN_LOCAL_WEB_PORT='5995';
process.env.CHAIN_LOCAL_API_PORT='5997';
process.env.CHAIN_LOCAL_RPC_PORT='8546';
process.env.CHAIN_LOCAL_FIXTURE_ISOLATION='1';
const {startLocal}=await import('../../tools/chain/local.mjs');
const local=await startLocal({web:true});
try{
 for(const width of ['1280','1440','390']){
  const p=spawn(process.execPath,['scripts/ui/q8-tutorial.mjs'],{stdio:'inherit',env:{...process.env,CAPTURE_URL:'http://127.0.0.1:5995',LABEL:process.env.LABEL??'wallet-final',WIDTH:width,TOPICS:'wallet,cafe'}});
  const code=await new Promise((resolve,reject)=>{p.once('error',reject);p.once('exit',resolve);});
  if(code)throw Error(`Wallet walkthrough failed at ${width}`);
 }
}finally{await local.stop();}
