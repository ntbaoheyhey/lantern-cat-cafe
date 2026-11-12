/** Start the integrated guest game; public Fuji use is an explicit mode switch. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const mode=process.env.DEMO_CHAIN??'anvil';
if(!['anvil','fuji'].includes(mode))throw Error('DEMO_CHAIN must be anvil or fuji.');
const root=resolve(import.meta.dirname,'..'),web=resolve(root,'apps/web');
const url='http://127.0.0.1:5940/?demo=1&squad=1&cardrpg2=1&a6=1&lookSpine=1';
let stop;
if(mode==='anvil'){
 Object.assign(process.env,{CHAIN_LOCAL_WEB_PORT:'5940',CHAIN_LOCAL_RPC_PORT:'5971',CHAIN_LOCAL_API_PORT:'5972'});
 const {startLocal}=await import('./chain/local.mjs');
 const runtime=await startLocal();stop=()=>runtime.stop();
}else{
 const api=process.env.VITE_SUPABASE_URL;
 if(!api||new URL(api).protocol!=='https:')throw Error('Fuji mode requires VITE_SUPABASE_URL set to the public HTTPS project URL.');
 Object.assign(process.env,{VITE_CHAIN_DEMO:'1',VITE_CHAIN_MODE:'fuji',VITE_ALLOW_MOCK_AUTH:'0'});
 const require=createRequire(resolve(web,'package.json'));
 const {createServer}=await import(require.resolve('vite'));
 const server=await createServer({root:web,envDir:false,server:{host:'127.0.0.1',port:5940,strictPort:true}});
 await server.listen();stop=()=>server.close();
}
console.log(`Integrated ${mode} guest demo: ${url}`);
console.log(mode==='anvil'?'Throwaway local chain. Ctrl-C stops the game, API and Anvil.':'Fuji mode uses the public endpoints you provided. No deployment or signing runs at startup.');
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{if(stopping)return;stopping=true;await stop();process.exit(0);});
