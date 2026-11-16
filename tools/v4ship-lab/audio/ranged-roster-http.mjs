/** Exercise the real roster/music loader and compare it with the preserved monolith. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const out=resolve(root,`reports/v4-ship/S11/ranged-roster-http-${attempt}.json`),raw=out.replace('.json','.log.json.gz');assert(!existsSync(out)&&!existsSync(raw));
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')));stop();
const hash=b=>createHash('sha256').update(b).digest('hex'),sign=p=>({path:relative(root,p),bytes:readFileSync(p).length,sha256:hash(readFileSync(p))});
const signature=runtimeSignature(root),installed=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/S11/ranged-palette-install-1.json')));
const verify=r=>{const b=readFileSync(resolve(root,r.path));assert.equal(hash(b),r.sha256);return b;};
const oldEngine=verify(installed.baseline.engine).toString(),oldManifest=verify(installed.baseline.manifest),newManifest=verify(installed.manifest);
const require=createRequire(resolve(root,'apps/web/package.json')),pw=require('@playwright/test'),{createServer}=await import(pathToFileURL(require.resolve('vite')).href);
const entries=new Map(),requests=[],details=[],rows=[],errors=[];let active='setup',browser;
const scenarios=['early-roster','before-unlock','late-roster','restart','new-arrival','unknown','absent','melee-healers','retry'];
const all=['v4-ranged-ember','v4-ranged-heavy','v4-ranged-shadow','v4-ranged-tide'];
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',harness:sign(import.meta.filename),signature,
 baseline:installed.baseline,installedEvidence:sign(resolve(root,'reports/v4-ship/S11/ranged-palette-install-1.json')),rows,complete:false,
 productionValidated:false,physicalOnsetVerified:false,humanListeningVerified:false,fullAudioGatePass:false,shippingTransferGatePass:false};
const save=()=>{writeFileSync(raw,gzipSync(JSON.stringify({requests,details,errors})));report.raw=sign(raw);writeFileSync(out,JSON.stringify(report,null,2)+'\n');};
const server=await createServer({root:resolve(root,'apps/web'),configFile:false,publicDir:false,logLevel:'error',server:{host:'127.0.0.1',port:5994,strictPort:true},plugins:[{
 name:'ranged-roster-comparison',enforce:'pre',transform(code,id){if(id.split('?')[0]===resolve(root,'apps/web/src/audio/engine.ts')&&id.includes('old-monolith=1'))return {code:oldEngine,map:null};},
 configureServer(vite){vite.middlewares.use((req,res,next)=>{
  const path=new URL(req.url,'http://127.0.0.1:5994').pathname,match=path.match(/^\/roster\/([a-z0-9-]+)\/(.*)$/);if(!match)return next();
  const entry=entries.get(match[1]);if(!entry){res.writeHead(404);res.end();return;}
  const file=match[2];let bytes,status=200,mime='text/plain',sourceFile=null;
  if(file==='index.html'){
   mime='text/html';bytes=Buffer.from(`<!doctype html><title>Roster loading comparison</title><button id="unlock">Begin</button><script type="module">
import {AudioEngine} from '/src/audio/engine.ts${entry.method==='monolith'?'?old-monolith=1':''}';
window.__engine=new AudioEngine(()=>.5,${JSON.stringify('/roster/'+match[1]+'/audio/')});window.__starts=[];
const original=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const e=window.__engine;window.__starts.push({pack:[...e.decoded].find(([,b])=>b===this.buffer)?.[0],args,at:performance.now(),frames:this.buffer?.length,rate:this.buffer?.sampleRate});return original.apply(this,args);};
document.querySelector('#unlock').onclick=async()=>{await window.__engine.unlock();window.__engine.setBus('master',0);window.__ready=true;};
</script>`);
  }else if(file==='audio/manifest.json'){bytes=entry.method==='monolith'?oldManifest:newManifest;mime='application/json';}
  else if(/^audio\/[a-zA-Z0-9_.-]+\.(webm|mp3)$/.test(file)){
   sourceFile=resolve(root,'apps/web/public',file);mime=file.endsWith('.mp3')?'audio/mpeg':'audio/webm';
   const fail=entry.fail&&/v4-ranged-(ember|impacts)\./.test(file);
   if(fail||(entry.format==='mp3'&&file.endsWith('.webm'))){status=503;bytes=Buffer.alloc(0);}else if(existsSync(sourceFile))bytes=readFileSync(sourceFile);else{status=404;bytes=Buffer.alloc(0);}
  }else{status=404;bytes=Buffer.alloc(0);}
  const row={caseId:match[1],phase:active,path,status,bytes:bytes.length,sha256:hash(bytes),sourceFile:sourceFile?relative(root,sourceFile):null,finished:false};requests.push(row);
  res.writeHead(status,{'Content-Type':mime,'Content-Length':bytes.length,'Cache-Control':'no-store'});res.once('finish',()=>row.finished=true);res.end(bytes);
 });}
}]});
async function unlock(page){await page.locator('#unlock').click();await page.waitForFunction(()=>window.__ready);}
async function select(page,actors){await page.evaluate(actors=>window.__engine.setBattleRoster?.(actors),actors);}
async function phase(page,entry,id,name,expected,targets,options={}){
 active=name;const begin=requests.length;
 const result=await page.evaluate(async({targets,options})=>{
  const e=window.__engine,at=performance.now(),before=[...e.decoded.keys()];
  if(options.roster)e.setBattleRoster?.(options.roster);
  if(options.music)e.music('boss');
  await e.preload('boss');await Promise.allSettled([...e.buffers.values()]);const readyAt=performance.now(),decoded=[...e.decoded.keys()],impacts=[];
  for(const element of targets){
   const cue=`kit.ranged-${element}.impact`,design=e.decodedManifest.designs[cue],variants=design.baked;
   const bounds=variants.length===36&&variants.every(v=>{const b=e.decoded.get(v.sample.pack);return b&&v.sample.start>=0&&v.sample.start+v.sample.duration<=b.duration+1/b.sampleRate;});
   const target=((e.last.get(cue)??-Infinity)+(design.cooldownMs??30)+1)/1000,wait=performance.now();
   while(e.ctx.currentTime<target&&performance.now()-wait<2500)await new Promise(r=>setTimeout(r,10));
   const start=window.__starts.length,hit=e.hits.length,requestedAt=performance.now();e.play(cue,{element});await new Promise(r=>setTimeout(r,150));
   impacts.push({cue,element,bounds,requestedAt,starts:window.__starts.slice(start).filter(s=>s.pack?.startsWith('v4-ranged-')),hits:e.hits.slice(hit),clockWaitMs:performance.now()-requestedAt-150});e.stop(cue);
  }
  return {before,decoded,readyAt,preloadMs:readyAt-at,impacts};
 },{targets,options});
 const network=requests.slice(begin).filter(r=>r.caseId===id),payload=network.filter(r=>r.status===200&&/\/v4-ranged-.*\.(webm|mp3)$/.test(r.path));
 const actual=result.decoded.filter(p=>p.startsWith('v4-ranged-')).sort();
 const impactPass=result.impacts.every(i=>i.bounds&&i.starts.length===1&&i.hits.some(h=>h.result==='played'));
 const row={caseId:id,browser:entry.browser,format:entry.format,method:entry.method,scenario:entry.scenario,phase:name,expected,decoded:actual,
  preloadMs:result.preloadMs,rangedBytes:payload.reduce((n,r)=>n+r.bytes,0),rangedRequests:payload.length,impactStarts:result.impacts.reduce((n,i)=>n+i.starts.length,0),
  pass:JSON.stringify(actual)===JSON.stringify([...expected].sort())&&impactPass&&network.every(r=>r.finished&&r.status!==404)};
 if(name==='repeat')row.pass&&=payload.length===0;
 details.push({caseId:id,phase:name,...result});rows.push(row);save();console.log(JSON.stringify(row));return row;
}
try{
 await server.listen();
 for(const browserName of ['chromium','webkit']){
  browser=await pw[browserName].launch({headless:true});
  for(const format of ['webm','mp3'])for(const scenario of scenarios)for(const method of ['monolith','palettes']){
   stop();const id=[browserName,format,scenario,method].join('-'),entry={browser:browserName,format,scenario,method,fail:false};entries.set(id,entry);
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',e=>errors.push({id,error:e.message.slice(0,250)}));page.on('request',r=>{const u=new URL(r.url());if(u.hostname!=='127.0.0.1'||u.port!=='5994')errors.push({id,foreign:u.origin+u.pathname});});
   try{
    await page.goto(`http://127.0.0.1:5994/roster/${id}/index.html`);await page.waitForFunction(()=>window.__engine);
    const roster=scenario==='unknown'?['soot','unknown']:scenario==='melee-healers'?['mochi','panko','clover','teacup-healer']:scenario==='new-arrival'?['soot']:['soot','needle-moth','mochi','clover'];
    if(scenario==='before-unlock')await select(page,roster);await unlock(page);
    const wanted=method==='monolith'?['v4-ranged-impacts']:scenario==='melee-healers'?[]:scenario==='new-arrival'?['v4-ranged-ember']:['unknown','absent','late-roster'].includes(scenario)?all:['v4-ranged-ember','v4-ranged-heavy'];
    if(scenario==='late-roster'){
     await phase(page,entry,id,'music-before-roster',wanted,['ember','heavy'],{music:true});
     await phase(page,entry,id,'late-roster',wanted,['ember','heavy'],{roster});
    }else if(scenario==='retry'){
     await select(page,roster);entry.fail=true;
     const failedExpected=method==='monolith'?[]:['v4-ranged-heavy'];
     await phase(page,entry,id,'expected-failure',failedExpected,[]);entry.fail=false;
     await phase(page,entry,id,'retry',wanted,['ember','heavy'],{music:true});
    }else{
     if(!['before-unlock','absent'].includes(scenario))await select(page,roster);
     const targets=scenario==='melee-healers'?[]:scenario==='new-arrival'?['ember']:['unknown','absent'].includes(scenario)?['ember','heavy','shadow','tide','ice']:['ember','heavy'];
     await phase(page,entry,id,'initial',wanted,targets,{music:true});
     if(scenario==='restart'){
      await page.evaluate(()=>window.__engine.stop());await select(page,roster);await phase(page,entry,id,'repeat',wanted,targets,{music:true});
     }else if(scenario==='new-arrival'){
      await phase(page,entry,id,'new-arrival',method==='monolith'?['v4-ranged-impacts']:all,['shadow','ice','heavy'],{roster:['soot','inkcap','velvet','binding-thread']});
     }
    }
   }catch(error){errors.push({id,phase:active,error:String(error.message).slice(0,250)});save();}
   finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assertUnchanged(root,signature);report.complete=true;
 report.payloadAccounting=[...entries.keys()].map(caseId=>({caseId,
  serverBytes:requests.filter(r=>r.caseId===caseId&&r.status===200&&r.path.includes('/v4-ranged-')).reduce((n,r)=>n+r.bytes,0),
  phaseBytes:rows.filter(r=>r.caseId===caseId).reduce((n,r)=>n+r.rangedBytes,0)}));
 report.pass=rows.length===104&&rows.every(r=>r.pass)&&errors.length===0&&report.payloadAccounting.every(r=>r.serverBytes===r.phaseBytes);
 report.summary={cases:72,phases:rows.length,passed:rows.filter(r=>r.pass).length,impactStarts:rows.reduce((n,r)=>n+r.impactStarts,0),errors:errors.length};
 report.limits=['Real engine and preserved baseline over loopback HTTP; no browser interception, desktop control or screenshots.',
  'Actual production shells are covered separately; these calls intentionally control roster/music ordering.',
  'Expected transport failures are injected only in the retry scenario; preserved separately from passing readiness.',
  'Physical onset, perception, arbitrary wide-area latency and full shipping transfer remain open.'];
 save();console.log(JSON.stringify({output:relative(root,out),pass:report.pass,...report.summary}));if(!report.pass)process.exitCode=1;
}finally{if(browser)await browser.close();await server.close();assertUnchanged(root,signature);save();}
