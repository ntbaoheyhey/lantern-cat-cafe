/** Production build, matching-origin API and disposable Anvil. LEARN/S8.md. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
if(!/^\d+$/.test(attempt))throw Error('Specify a new production build number');
const reportPath=resolve(root,`reports/v4-ship/S8/production-build-${attempt}.json`);
const output=resolve(root,`work/v4ship-prep/S8-production-${attempt}/dist`);
if(existsSync(reportPath)||existsSync(output))throw Error('Preserve previous builds');
if(existsSync(resolve(root,'STOP-V4SHIP')))throw Error('STOP-V4SHIP');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
if(git(['branch','--show-current'])!=='codex/v4-ship-2026-11-16')throw Error('Wrong SHIP branch');
const runtimePaths=['apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'];
if(git(['diff','--name-only','HEAD','--',...runtimePaths]))throw Error('Commit runtime changes before building');
for(const key of Object.keys(process.env))if(key.startsWith('VITE_'))delete process.env[key];
Object.assign(process.env,{CHAIN_LOCAL_WEB_PORT:'5998',CHAIN_LOCAL_API_PORT:'5997',CHAIN_LOCAL_RPC_PORT:'8546',CHAIN_LOCAL_FIXTURE_ISOLATION:'1'});
const publicBuildFlags={
 VITE_CHAIN_DEMO:'0',VITE_ECONOMY_V3:'1',VITE_GUEST_WALLET:'1',VITE_CHAIN_LOOP:'1',
 VITE_ITEM_TRADING:'1',VITE_YARN_TOKEN:'1',VITE_SHIP_JOURNEY:'1',VITE_UI_V3:'1',
 VITE_CHAIN_CAMPAIGN:'1',VITE_CHAIN_CAMPAIGN_REWARDS:'0',VITE_RELIC_FORGE:'0',
 VITE_YARN_COSMETICS:'0',VITE_ALLOW_MOCK_AUTH:'0',VITE_CHAIN_MODE:'local',
 VITE_SUPABASE_URL:'http://127.0.0.1:5997',VITE_FUJI_RPC_URL:'http://127.0.0.1:8546',
 VITE_V3_START_BLOCK:'0',VITE_CHAIN_STATS_URL:'',
};
Object.assign(process.env,publicBuildFlags);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const log=[],sourceCommit=git(['rev-parse','HEAD']);let fixture,child,stopping=false,watch;
const report={at:new Date().toISOString(),sourceCommit,sourceCheckout:root,output,port:5998,
 mode:'Production shipping Vite config + same-origin-bound local API/Anvil; no public writes',
 config:'tools/v4ship-lab/rehearsal/vite.config.mts',publicBuildFlags,buildComplete:false,ready:false,
 supervisorPid:process.pid,harness:['tools/v4ship-lab/rehearsal/start.mjs','tools/v4ship-lab/rehearsal/vite.config.mts'].map(path=>({path,sha256:sha(readFileSync(resolve(root,path)))}))};
function save(){writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');}
async function stop(code){
 if(stopping)return;stopping=true;clearInterval(watch);child?.kill('SIGTERM');
 await fixture?.stop();process.exit(code);
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>void stop(0));
try{
 for(const port of [5998,5997,8546]){
  if(await fetch(`http://127.0.0.1:${port}`,{signal:AbortSignal.timeout(1000)}).catch(()=>null))throw Error(`Owned port ${port} must be free first`);
 }
 const {startLocal}=await import('../../chain/local.mjs');
 fixture=await startLocal({web:false,campaignRewards:false});
 report.fixtureId=fixture.config.fixtureId;
 report.localFixtureConfigSha256=sha(readFileSync(resolve(root,'apps/web/public/chain-local.json')));
 const origin='http://127.0.0.1:5998',endpoint='http://127.0.0.1:5997/functions/v1/auth-nonce';
 const preflight=async origin=>{const r=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});return {origin,status:r.status,allowedOrigin:r.headers.get('access-control-allow-origin')};};
 report.preflight=[await preflight(origin),await preflight('http://127.0.0.1:5994')];
 if(report.preflight[0].status!==204||report.preflight[0].allowedOrigin!==origin||report.preflight[1].status!==403)throw Error('Origin binding check failed');
 mkdirSync(resolve(output,'..'),{recursive:true});
 const args=['exec','vite','build','--config',resolve(root,report.config),'--outDir',output];
 report.buildCommand=['pnpm',...args];const started=Date.now();
 child=spawn('pnpm',args,{cwd:resolve(root,'apps/web'),env:process.env,stdio:['ignore','pipe','pipe']});
 for(const stream of ['stdout','stderr'])child[stream].on('data',chunk=>log.push(chunk));
 report.exitCode=await new Promise((r,j)=>{child.once('error',j);child.once('exit',r);});
 report.buildSeconds=(Date.now()-started)/1000;
 const bytes=gzipSync(Buffer.concat(log)),path=resolve(root,`reports/v4-ship/S8/production-build-${attempt}.log.gz`);
 writeFileSync(path,bytes);report.log={path:relative(root,path),sha256:sha(bytes)};
 if(report.exitCode!==0)throw Error('Production build failed; log preserved');
 report.buildComplete=true;report.indexSha256=sha(readFileSync(resolve(output,'index.html')));
 if(git(['diff','--name-only',sourceCommit,'--',...runtimePaths]))throw Error('Runtime changed during build');
 child=spawn('pnpm',['exec','vite','preview','--config',resolve(root,report.config),'--outDir',output,'--host','127.0.0.1','--port','5998','--strictPort'],{cwd:resolve(root,'apps/web'),env:process.env,stdio:['ignore','pipe','pipe']});
 report.previewLauncherPid=child.pid;
 child.once('exit',code=>{if(!stopping)void stop(code??1);});
 for(let n=0;n<100;n++){
  const r=await fetch(origin,{signal:AbortSignal.timeout(1000)}).catch(()=>null);
  if(r?.ok&&sha(Buffer.from(await r.arrayBuffer()))===report.indexSha256){report.ready=true;break;}
  await new Promise(r=>setTimeout(r,100));
 }
 if(!report.ready)throw Error('Preview did not serve the bound build');
 save();console.log(JSON.stringify({ready:true,report:relative(root,reportPath),fixtureId:report.fixtureId,supervisorPid:process.pid,previewLauncherPid:child.pid,preflight:report.preflight}));
 watch=setInterval(()=>{if(existsSync(resolve(root,'STOP-V4SHIP')))void stop(0);},2000);
}catch(error){report.failure=error.message;save();console.error(error.message);await stop(1);}
