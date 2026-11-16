/** Same disposable Anvil/database fixture as B Q6/Q8, with a dedicated Vite child. */
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'../..'),out=resolve(root,'reports/v4-ship/S0');
mkdirSync(out,{recursive:true});
Object.assign(process.env,{
  CHAIN_LOCAL_WEB_PORT:'5994',CHAIN_LOCAL_API_PORT:'5997',CHAIN_LOCAL_RPC_PORT:'8546',
});
const {startLocal}=await import('../../tools/chain/local.mjs');
const local=await startLocal({web:false,campaignRewards:true});
const vite=spawn('pnpm',['exec','vite','--config','../../tools/v3-demo/vite.config.mts','--host','127.0.0.1','--port','5994','--strictPort'],{
  cwd:resolve(root,'apps/web'),stdio:['ignore','inherit','inherit'],env:{...process.env,
    VITE_CHAIN_DEMO:'1',VITE_V3_START_BLOCK:'0',VITE_CHAIN_MODE:'local',
    VITE_YARN_COSMETICS:'1',VITE_RELIC_FORGE:'1',VITE_CHAIN_CAMPAIGN:'1',
    VITE_CHAIN_CAMPAIGN_REWARDS:'1',VITE_SUPABASE_URL:'http://127.0.0.1:5997',
    VITE_FUJI_RPC_URL:'http://127.0.0.1:8546',VITE_ALLOW_MOCK_AUTH:'0',VITE_UI_V3:'1',
  },
});
writeFileSync(resolve(out,'live-processes.json'),JSON.stringify({
  started:new Date().toISOString(),supervisor:process.pid,viteLauncher:vite.pid,
  ports:{vite:5994,api:5997,anvil:8546},mode:'Disposable local Anvil; no public transactions',
  stop:`kill ${process.pid}`,
},null,2)+'\n');
let stopping=false;
async function stop(code=0){
  if(stopping)return;stopping=true;
  vite.kill('SIGTERM');await local.stop();process.exit(code);
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void stop());
vite.once('error',error=>{console.error(error.message);void stop(1);});
vite.once('exit',code=>{if(!stopping)void stop(code??1);});
console.log(`V4 SHIP supervisor ${process.pid}; Vite launcher ${vite.pid}; http://localhost:5994`);
