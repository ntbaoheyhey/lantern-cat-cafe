/** Native-browser exact-data and HTTP/SRI/stall recovery of the production loader. No game/FPS claim. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const root=resolve(import.meta.dirname,'../..'),app=resolve(root,'apps/web'),label=process.argv[2];
assert(/^[a-z0-9-]+$/.test(label??''),'Supply a distinct evidence label');
const out=resolve(root,'work/v5/CXI/batch-m',label);assert(!existsSync(out));await mkdir(out,{recursive:true});
const require=createRequire(resolve(app,'package.json')),{chromium,webkit}=require('@playwright/test');
const manifest=JSON.parse(await readFile(resolve(app,'src/game/cardrpg/spine/native-rig-data-manifest-loader.json'),'utf8'));
const ids=Object.keys(manifest.units),originals=Object.fromEntries(await Promise.all(ids.map(async id=>[id,JSON.parse(await readFile(resolve(app,`public/units/${id}/rig.json`),'utf8'))])));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const entry=resolve(out,'entry.ts');await writeFile(entry,`export {loadNativeRigData} from '${app}/src/game/cardrpg/spine/native-rig-data-loader.ts';`);
const {build}=await import(require.resolve('vite'));
await build({configFile:false,root:app,envFile:false,publicDir:false,logLevel:'silent',build:{outDir:out,emptyOutDir:false,minify:false,lib:{entry,formats:['es'],fileName:()=> 'fixture.mjs'}}});
const module=await readFile(resolve(out,'fixture.mjs'));
const timers=new Set();let scenario,requests=[];
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname,mode=scenario;
 requests.push({path:pathname,utc:new Date().toISOString()});
 if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Rig data diagnostic</title>');return;}
 if(pathname==='/fixture.mjs'){res.setHeader('Content-Type','text/javascript');res.end(module);return;}
 const isShared=pathname===manifest.shared.url,isUnit=pathname===manifest.units['needle-moth'].url;
 const failShared=isShared&&(mode==='dictionary-http'||mode==='dictionary-retry')&&requests.filter(r=>r.path===pathname).length===1;
 if((isUnit&&mode==='unit-http')||failShared){res.statusCode=503;res.end('Injected HTTP failure');return;}
 const path=resolve(app,'public','.'+pathname);
 if(!path.startsWith(resolve(app,'public')+'/')){res.statusCode=403;res.end();return;}
 try{
  let body=await readFile(path);res.setHeader('Content-Type','application/json');
  if((isUnit&&mode==='unit-integrity')||(isShared&&mode==='dictionary-integrity'))body=Buffer.concat([Buffer.from(' '),body]);
  if((isUnit&&mode==='unit-stall')||(isShared&&mode==='dictionary-stall')){
   const timer=setTimeout(()=>{timers.delete(timer);res.end(body);},3000);timers.add(timer);res.on('close',()=>{clearTimeout(timer);timers.delete(timer);});return;
  }
  res.end(body);
 }catch{res.statusCode=404;res.end();}
});
await new Promise((yes,no)=>{server.once('error',no);server.listen(6308,'127.0.0.1',yes);});
const url='http://127.0.0.1:6308/';
const report={utc:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),url,viewport:{width:1280,height:720},toolSha256:sha(await readFile(import.meta.filename)),moduleSha256:sha(module),manifestSha256:sha(await readFile(resolve(app,'src/game/cardrpg/spine/native-rig-data-manifest-loader.json'))),
 method:'Isolated HTTP fixture bundles the actual production rig data loader and serves exact shipped bytes. Native SRI is not mocked. No game rendering, visible capture, ordinary journey, cold budget or calibrated performance claim.',runs:[],complete:false};
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');await save();
try{
 for(const [engineName,engine]of Object.entries({chromium,webkit})){
  const browser=await engine.launch({headless:true});
  try{
   for(const mode of ['success','direct','unit-http','unit-integrity','dictionary-http','dictionary-integrity','dictionary-retry','unit-stall','dictionary-stall']){
    for(const stop of ['STOP-ALL','STOP-CXI'])assert(!existsSync('/Users/bao/taskbar-hero-mailbox/'+stop));
    scenario=mode;requests=[];const context=await browser.newContext({viewport:report.viewport,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    try{
     await page.goto(url);
     const result=await page.evaluate(async({mode,ids,originals})=>{
      const {loadNativeRigData}=await import('/fixture.mjs'),rows=[];
      async function one(id,direct=false){
       const start=performance.now(),data=await loadNativeRigData(id,!direct),seen=new WeakSet();let alias=false;
       function visit(x){if(!x||typeof x!=='object')return;if(seen.has(x))alias=true;seen.add(x);Object.values(x).forEach(visit);}visit(data);
       rows.push({id,exact:JSON.stringify(data)===JSON.stringify(originals[id]),noAliases:!alias,elapsedMs:performance.now()-start});
      }
      if(mode==='success')await Promise.all(ids.map(id=>one(id)));
      else if(mode==='dictionary-retry'){await Promise.all(['needle-moth','kettle-knight'].map(id=>one(id)));await one('teacup-healer');}
      else await one('needle-moth',mode==='direct');
      return rows;
     },{mode,ids,originals});
     assert(result.every(r=>r.exact&&r.noAliases));
     const sharedRequests=requests.filter(r=>r.path===manifest.shared.url).length,originalRequests=requests.filter(r=>r.path.endsWith('/rig.json')).map(r=>r.path);
     if(mode==='success'){assert.equal(result.length,10);assert.equal(sharedRequests,1);assert.deepEqual(originalRequests,[]);assert.deepEqual(errors,[]);}
     else if(mode==='direct'){assert.equal(sharedRequests,0);assert.deepEqual(originalRequests,['/units/needle-moth/rig.json']);assert.deepEqual(errors,[]);}
     else if(mode==='dictionary-retry'){assert.equal(sharedRequests,2);assert.deepEqual(originalRequests.sort(),['/units/kettle-knight/rig.json','/units/needle-moth/rig.json']);}
     else assert.deepEqual(originalRequests,['/units/needle-moth/rig.json']);
     if(mode.endsWith('-stall'))assert(result[0].elapsedMs>=1900&&result[0].elapsedMs<6000);
     report.runs.push({engine:engineName,version:browser.version(),mode,rows:result,sharedRequests,originalRequests,requests:[...requests],expectedFaultConsole:errors});await save();
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 report.complete=true;
}catch(error){report.error=String(error.stack);process.exitCode=1;}
finally{for(const timer of timers)clearTimeout(timer);await new Promise(yes=>server.close(yes));report.finishedUTC=new Date().toISOString();await save();}
console.log(JSON.stringify({out,complete:report.complete,runs:report.runs.length,error:report.error}));
