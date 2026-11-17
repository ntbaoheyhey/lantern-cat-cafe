/** Independent QA infrastructure: real production bundle + existing local fixture. */
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {createServer} from 'node:net';
import {loadavg} from 'node:os';

const qa=resolve(import.meta.dirname,'../..'),source='/Users/bao/taskbar-hero-qa-clone';
const attempt=process.argv[2]??'1';
if(!/^\d+$/.test(attempt))throw Error('Numeric attempt required');
const dir=resolve(qa,`work/v4qa/production-${attempt}`),reportPath=resolve(qa,`reports/v4-qa/Q1/build-${attempt}.json`);
if(existsSync(dir)||existsSync(reportPath))throw Error('Preserve earlier build evidence');
mkdirSync(dir,{recursive:true});mkdirSync(resolve(reportPath,'..'),{recursive:true});
const report={started:new Date().toISOString(),source,sourceSha:execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim(),supervisorPid:process.pid,mode:'production Vite + local API/Anvil',timingScope:'shared-machine, indicative',ports:{web:6200,api:6201,rpc:6202},ready:false};
const save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let fixture,child,stopping=false;
async function stop(code){if(stopping)return;stopping=true;clearInterval(watch);child?.kill('SIGTERM');await fixture?.stop();process.exit(code);}
const watch=setInterval(()=>{if(existsSync(resolve(qa,'STOP-V4QA')))void stop(0);},1000);
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>void stop(0));
async function guard(label){while(loadavg()[0]>9){console.log(`DEFER ${label} load1=${loadavg()[0].toFixed(2)}`);await delay(300000);}console.log(`START ${label} load1=${loadavg()[0].toFixed(2)}`);}
async function free(port){await new Promise((ok,bad)=>{const s=createServer();s.once('error',bad);s.listen(port,'127.0.0.1',()=>s.close(ok));});}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
try{
  for(const port of [6200,6201,6202])await free(port);
  for(const name of Object.keys(process.env))if(name.startsWith('VITE_')||name.startsWith('CHAIN_LOCAL_'))delete process.env[name];
  const publicFlags={VITE_CHAIN_DEMO:'0',VITE_ECONOMY_V3:'1',VITE_GUEST_WALLET:'1',VITE_CHAIN_LOOP:'1',VITE_ITEM_TRADING:'1',VITE_YARN_TOKEN:'1',VITE_SHIP_JOURNEY:'1',VITE_UI_V3:'1',VITE_CHAIN_CAMPAIGN:'1',VITE_CHAIN_CAMPAIGN_REWARDS:'0',VITE_RELIC_FORGE:'0',VITE_YARN_COSMETICS:'0',VITE_ALLOW_MOCK_AUTH:'0',VITE_CHAIN_MODE:'local',VITE_SUPABASE_URL:'http://127.0.0.1:6201',VITE_FUJI_RPC_URL:'http://127.0.0.1:6202',VITE_V3_START_BLOCK:'0',VITE_CHAIN_STATS_URL:''};
  Object.assign(process.env,publicFlags,{CHAIN_LOCAL_WEB_PORT:'6200',CHAIN_LOCAL_API_PORT:'6201',CHAIN_LOCAL_RPC_PORT:'6202',CHAIN_LOCAL_FIXTURE_ISOLATION:'1'});
  report.publicBuildFlags=publicFlags;save();
  await guard('local fixture and contracts');
  const {startLocal}=await import(pathToFileURL(resolve(source,'tools/chain/local.mjs')));
  fixture=await startLocal({web:false,campaignRewards:false});
  report.fixtureId=fixture.config.fixtureId;report.contracts=fixture.config;
  const preflight=await fetch('http://127.0.0.1:6201/functions/v1/auth-nonce',{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:6200','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
  report.originBinding={status:preflight.status,allowed:preflight.headers.get('access-control-allow-origin')};
  if(preflight.status!==204||report.originBinding.allowed!=='http://127.0.0.1:6200')throw Error('Origin binding failed');
  await guard('production build');
  const output=resolve(dir,'dist'),config=resolve(qa,'tools/v4qa/vite.config.mts');
  const log=[];child=spawn('pnpm',['exec','vite','build','--config',config,'--outDir',output],{cwd:resolve(source,'apps/web'),env:process.env,stdio:['ignore','pipe','pipe']});
  for(const stream of ['stdout','stderr'])child[stream].on('data',b=>log.push(b));
  report.buildPid=child.pid;save();report.buildExit=await new Promise((ok,bad)=>{child.once('error',bad);child.once('exit',ok);});
  writeFileSync(resolve(dir,'build.log'),Buffer.concat(log));
  if(report.buildExit!==0)throw Error('Production build failed; inspect build.log');
  report.output=output;report.indexSha256=sha(readFileSync(resolve(output,'index.html')));
  child=spawn('pnpm',['exec','vite','preview','--config',config,'--outDir',output,'--host','127.0.0.1','--port','6200','--strictPort'],{cwd:resolve(source,'apps/web'),env:process.env,stdio:'ignore'});
  report.previewPid=child.pid;child.once('exit',code=>{if(!stopping)void stop(code??1);});
  for(let i=0;i<120;i++){
    const response=await fetch('http://127.0.0.1:6200',{signal:AbortSignal.timeout(1000)}).catch(()=>null);
    if(response?.ok&&sha(Buffer.from(await response.arrayBuffer()))===report.indexSha256){report.ready=true;break;}
    await delay(250);
  }
  if(!report.ready)throw Error('Preview not ready');
  report.readyAt=new Date().toISOString();save();console.log(`READY http://127.0.0.1:6200 SHIP ${report.sourceSha}`);
}catch(error){report.failure={type:error.name,message:String(error.message).replace(/0x[0-9a-f]{64}/gi,'[redacted64hex]').slice(0,200)};save();console.log('FAILED production setup; see build report');await stop(1);}
