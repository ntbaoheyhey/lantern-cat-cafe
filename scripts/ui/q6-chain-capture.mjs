/** Disposable local receipt and wallet captures; never submits to Fuji. */
import {spawn} from 'node:child_process';
process.env.CHAIN_LOCAL_WEB_PORT='5995';
process.env.CHAIN_LOCAL_API_PORT='5997';
process.env.CHAIN_LOCAL_RPC_PORT='8546';
const {startLocal}=await import('../../tools/chain/local.mjs');
const local=await startLocal({web:true});
try{
 const child=spawn(process.execPath,['scripts/ui/q6-capture.mjs'],{stdio:'inherit',env:{...process.env,CAPTURE_URL:'http://127.0.0.1:5995',CAPTURE_LABEL:process.env.CAPTURE_LABEL||'chain-round1',SCREENS:process.env.SCREENS||'wallet-panel,wallet-history,wallet-fusion,wallet-ornament-forge,wallet-offline'}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 if(code)throw Error(`Wallet capture exited ${code}`);
}finally{await local.stop();}
