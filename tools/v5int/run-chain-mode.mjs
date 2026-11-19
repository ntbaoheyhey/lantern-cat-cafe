#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url)),web=fileURLToPath(new URL('../../apps/web',import.meta.url));
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {loadEnv}=await import(require.resolve('vite'));
const fixture=process.argv.includes('--fixture'),check=process.argv.includes('--check');
if(process.argv.slice(2).some(arg=>!['--fixture','--check'].includes(arg)))throw Error('Usage: node tools/v5int/run-chain-mode.mjs [--fixture] [--check]');
const publicEnv=loadEnv('production',web,'VITE_');
if(!fixture&&!publicEnv.VITE_SUPABASE_URL){console.error('Fill apps/web/.env.local using docs/RUN-CHAIN-MODE.md, or pass --fixture for a labelled offline preview.');process.exit(1);}
const env={...process.env,...publicEnv,VITE_CHAIN_MODE:'fuji',VITE_CHAIN_DEMO:fixture?'0':'1'};
if(fixture)for(const name of ['VITE_SUPABASE_URL','VITE_GUEST_WALLET','VITE_CHAIN_LOOP','VITE_ITEM_TRADING','VITE_YARN_TOKEN','VITE_YARN_COSMETICS','VITE_RELIC_FORGE','VITE_CHAIN_CAMPAIGN','VITE_CHAIN_CAMPAIGN_REWARDS','VITE_ECONOMY_V3'])env[name]='';
console.log(fixture?'Fixture preview: no transaction will be submitted.':'Fuji recording build: live transactions require a configured backend and funded sponsor.');
if(!check){
 const run=args=>new Promise((resolve,reject)=>{const child=spawn('pnpm',args,{cwd:root,env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`pnpm exited ${code}`)));});
 await run(['--filter','@taskbar-hero/web','build']);
 console.log('Judge URL: http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3');
 await run(['--filter','@taskbar-hero/web','exec','vite','preview','--host','127.0.0.1','--port','6301','--strictPort']);
}
