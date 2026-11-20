/** Actual HTTP/cache comparison of installed loading and isolated palette selection. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,relative,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';

const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];
assert(/^\d+$/.test(attempt));
const out=resolve(root,`reports/v4-ship/S11/ranged-delivery-http-${attempt}.json`),log=out.replace('.json','.log.json.gz');
const folder=resolve(root,`work/v4ship-audio/ranged-delivery-http-${attempt}`);
assert(![out,log,folder].some(existsSync));
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')));stop();mkdirSync(folder,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const sign=path=>({path:relative(root,path),bytes:readFileSync(path).length,sha256:hash(readFileSync(path))});
const read=path=>JSON.parse(readFileSync(resolve(root,path)));
const verify=record=>{const bytes=readFileSync(resolve(root,record.path));assert.equal(hash(bytes),record.sha256);return bytes;};
const sourcePath='reports/v4-ship/S11/ranged-delivery-comparison-2.json',source=read(sourcePath);
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath);
assert(source.reconstructionPass&&inventory.rows.length===14);
const signature=runtimeSignature(root),installedPath=resolve(root,'apps/web/public/audio/manifest.json');
const installedBytes=readFileSync(installedPath),installed=JSON.parse(installedBytes),candidate=structuredClone(installed);
const selected=source.packages.filter(p=>['ember','heavy','shadow','tide'].includes(p.id));assert.equal(selected.length,4);
const files=new Map(),rebased=new Map(),allPacks=selected.map(p=>p.pack).sort();
for(const pack of selected){
 candidate.packs[pack.pack]={};
 for(const file of pack.files){verify(file);files.set(basename(file.path),resolve(root,file.path));candidate.packs[pack.pack][file.format]='/audio/'+basename(file.path);}
 for(const variant of pack.variants){assert(!rebased.has(variant.sample.variantId));rebased.set(variant.sample.variantId,variant);}
}
let rebound=0;
for(const [key,design]of Object.entries(candidate.designs))for(const variant of design.baked??[]){
 if(variant.sample.pack!=='v4-ranged-impacts')continue;
 assert(key.startsWith('kit.ranged-')&&key.endsWith('.impact'));
 const replacement=rebased.get(variant.sample.variantId);assert(replacement);
 const a={...variant.sample},b={...replacement.sample};delete a.pack;delete a.start;delete b.pack;delete b.start;assert.deepEqual(a,b);
 assert.deepEqual(variant.layers,replacement.layers);variant.sample={...replacement.sample};rebound++;
}
assert.equal(rebound,180);delete candidate.packs['v4-ranged-impacts'];
const manifestPath=resolve(folder,'palette-manifest.json');writeFileSync(manifestPath,JSON.stringify(candidate,null,2)+'\n');
const candidateBytes=readFileSync(manifestPath);
const expectedPacks=elements=>!elements?.length||elements.some(e=>!['ember','heavy','shadow','tide','ice'].includes(e))?allPacks:[...new Set(elements.map(e=>'v4-ranged-'+(e==='ice'?'tide':e)))].sort();
const rosterRouting=inventory.rows.map(row=>{
 const cue='kit.ranged-'+row.element+'.impact',design=candidate.designs[cue];assert(design?.baked?.length===36);
 const packs=[...new Set(design.baked.map(v=>v.sample.pack))].sort();assert.deepEqual(packs,expectedPacks([row.element]));
 return {owner:row.owner,action:row.id,element:row.element,cue,packs,variants:design.baked.length};
});
const originalEngine=readFileSync(resolve(root,'apps/web/src/audio/engine.ts'),'utf8');
const needle="['b2-hits','b2-motion','b2-magic','v4-ranged-impacts']";assert.equal(originalEngine.split(needle).length,2);
const selector=` private selectedRangedPacks?:string[];
 setRangedPalettes(elements?:readonly string[]){
  const all=${JSON.stringify(allPacks)};
  this.selectedRangedPacks=!elements?.length||elements.some(e=>!['ember','heavy','shadow','tide','ice'].includes(e))?all:[...new Set(elements.map(e=>'v4-ranged-'+(e==='ice'?'tide':e)))].sort();
 }
`;
const candidateEngine=originalEngine.replace(' async preload(screen:',selector+' async preload(screen:').replace(needle,`['b2-hits','b2-motion','b2-magic',...(this.selectedRangedPacks??${JSON.stringify(allPacks)})]`);
assert(candidateEngine!==originalEngine);const enginePath=resolve(folder,'palette-engine.ts');writeFileSync(enginePath,candidateEngine);
const require=createRequire(resolve(root,'apps/web/package.json')),playwright=require('@playwright/test');
const {createServer}=await import(pathToFileURL(require.resolve('vite')).href);
const cases=new Map(),requests=[],rows=[],pageErrors=[],foreignRequests=[];
let activePhase='setup',activeCase='',transformedCandidate=0;
const html=(id,method)=>`<!doctype html><html><head><meta charset="utf-8"><title>Audio HTTP research</title></head><body><button id="unlock">Begin isolated audio probe</button><script type="module">
import {AudioEngine} from '/src/audio/engine.ts${method==='palettes'?'?palette-probe=1':''}';
import {resolveDesign} from '/src/audio/cues.ts';
window.__probeSetup=async()=>{
 const engine=new AudioEngine(()=>.5,${JSON.stringify('/probe/'+id+'/audio/')});window.__probeEngine=engine;
 await engine.unlock();engine.setBus('master',0);window.__probeReady=true;
};
window.__resolveDesign=resolveDesign;
window.__probeStarts=[];
const start=AudioBufferSourceNode.prototype.start;
AudioBufferSourceNode.prototype.start=function(...args){
 const e=window.__probeEngine,pack=[...e.decoded].find(([,buffer])=>buffer===this.buffer)?.[0];
 window.__probeStarts.push({pack,args,at:performance.now(),frames:this.buffer?.length,rate:this.buffer?.sampleRate});
 return start.apply(this,args);
};
document.querySelector('#unlock').onclick=()=>window.__probeSetup();
</script></body></html>`;
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-audio-delivery.md',harness:sign(import.meta.filename),
 inputs:[sign(resolve(root,sourcePath)),sign(resolve(root,inventoryPath)),sign(installedPath),...selected.flatMap(p=>p.files)],signature,
 candidate:{engine:sign(enginePath),manifest:sign(manifestPath),reboundMappings:rebound,uniqueSprites:rebased.size,rosterRouting},
 policy:{port:5994,assetCacheControl:'public, max-age=31536000, immutable',manifestCacheControl:'no-store',browserRouting:false,loopbackOnly:true,masterBusZero:true},
 rows,complete:false,runtimeChanged:false,productionWiringTested:false,overallTransferGatePass:false,physicalOnsetVerified:false,humanListeningVerified:false};
const priorAttempt=resolve(root,'reports/v4-ship/S11/ranged-delivery-http-attempt-1.json');
if(existsSync(priorAttempt))report.priorAttempt=sign(priorAttempt);
const save=()=>{writeFileSync(log,gzipSync(JSON.stringify({requests,pageErrors,foreignRequests})));report.log=sign(log);writeFileSync(out,JSON.stringify(report,null,2)+'\n');};
const server=await createServer({root:resolve(root,'apps/web'),configFile:false,publicDir:false,logLevel:'error',
 server:{host:'127.0.0.1',port:5994,strictPort:true},plugins:[{
 name:'v4ship-isolated-palette-http',enforce:'pre',
 transform(code,id){if(id.split('?')[0]===resolve(root,'apps/web/src/audio/engine.ts')&&id.includes('palette-probe=1')){assert.equal(code,originalEngine);transformedCandidate++;return {code:candidateEngine,map:null};}},
 configureServer(vite){vite.middlewares.use((req,res,next)=>{
  const path=new URL(req.url,'http://127.0.0.1:5994').pathname,match=path.match(/^\/probe\/([a-z0-9-]+)\/(.*)$/);
  if(!match)return next();
  const entry=cases.get(match[1]);if(!entry){res.writeHead(404);res.end();return;}
  const file=match[2];let bytes,mime,status=200,cache='no-store',sourceFile=null;
  if(file==='index.html'){bytes=Buffer.from(html(match[1],entry.method));mime='text/html';}
  else if(file==='audio/manifest.json'){bytes=entry.method==='palettes'?candidateBytes:installedBytes;mime='application/json';}
  else if(file.startsWith('audio/')&&/^[a-zA-Z0-9_.-]+\.(webm|mp3)$/.test(file.slice(6))){
   const name=file.slice(6);sourceFile=files.get(name)??resolve(root,'apps/web/public/audio',name);
   if(!existsSync(sourceFile)){status=404;bytes=Buffer.alloc(0);}else if(entry.format==='fallback-mp3'&&name.endsWith('.webm')){status=503;bytes=Buffer.alloc(0);}else{bytes=readFileSync(sourceFile);cache='public, max-age=31536000, immutable';}
   mime=name.endsWith('.mp3')?'audio/mpeg':'audio/webm';
  }else{status=404;bytes=Buffer.alloc(0);mime='text/plain';}
  const row={caseId:match[1],phase:activePhase,path,status,bodyBytes:bytes.length,sha256:hash(bytes),cacheControl:cache,
   requestCacheControl:req.headers['cache-control']??null,requestPragma:req.headers.pragma??null,requestIfNoneMatch:req.headers['if-none-match']??null,
   sourceFile:sourceFile?relative(root,sourceFile):null,finished:false};requests.push(row);
  res.writeHead(status,{'Content-Type':mime,'Content-Length':bytes.length,'Cache-Control':cache,'X-Content-Type-Options':'nosniff'});
  res.once('finish',()=>row.finished=true);res.end(bytes);
 });}
}]});
let browser;
async function unlock(page){await page.waitForFunction(()=>typeof window.__probeSetup==='function');await page.locator('#unlock').click();await page.waitForFunction(()=>window.__probeReady===true);}
async function phase(page,entry,id,name,elements,reload=false){
 activeCase=id;activePhase=name;stop();if(reload){await page.evaluate(async()=>{window.__probeEngine.stop();await window.__probeEngine.ctx.close();});await page.reload();await unlock(page);}
 const begin=requests.length;
 const data=await page.evaluate(async({method,elements})=>{
  const e=window.__probeEngine;if(method==='palettes')e.setRangedPalettes(elements);
  performance.clearResourceTimings();const before=[...e.decoded.keys()],started=performance.now();await e.preload('battle');const readyAt=performance.now();
  const decoded=[...e.decoded.keys()],manifest=e.decodedManifest,targets=elements?.length&&!elements.includes('unknown')?[...new Set(elements)]:['ember','heavy','shadow','tide','ice'];
  const impacts=[];let allBounds=true;
  for(const element of targets){
   const cue='kit.ranged-'+element+'.impact',design=window.__resolveDesign(cue,manifest),variants=design?.baked??[];
   allBounds&&=variants.length===36&&variants.every(v=>{const b=e.decoded.get(v.sample.pack);return b&&v.sample.start>=0&&v.sample.start+v.sample.duration<=b.duration+1/b.sampleRate;});
   // A running-state Promise does not demonstrate clock progress. Observe the
   // existing cooldown in audio time rather than clearing it or changing gates.
   const clockStart=e.ctx.currentTime,waitStarted=performance.now(),target=((e.last.get(cue)??-Infinity)+(design?.cooldownMs??30)+1)/1000;
   while(e.ctx.currentTime<target&&performance.now()-waitStarted<2500)await new Promise(resolve=>setTimeout(resolve,10));
   const clock={state:e.ctx.state,start:clockStart,atRequest:e.ctx.currentTime,target:Number.isFinite(target)?target:null,waitMs:performance.now()-waitStarted,ready:e.ctx.currentTime>=target};
   const startIndex=window.__probeStarts.length,hitIndex=e.hits.length,requestedAt=performance.now();e.play(cue,{element});
   await new Promise(resolve=>setTimeout(resolve,150));
   impacts.push({cue,element,requestedAt,clock:{...clock,after:e.ctx.currentTime},hits:e.hits.slice(hitIndex),starts:window.__probeStarts.slice(startIndex)});e.stop(cue);
  }
  return {before,decoded,preloadMs:readyAt-started,readyAt,allBounds,impacts,
   resources:performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname.includes('/audio/')).map(r=>({path:new URL(r.name).pathname,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,startTime:r.startTime,responseEnd:r.responseEnd}))};
 },{method:entry.method,elements});
 const network=requests.slice(begin).filter(r=>r.caseId===id),ranged=network.filter(r=>/\/v4-ranged-[^/]+\.(webm|mp3)$/.test(r.path));
 const expected=entry.method==='monolith'?['v4-ranged-impacts']:expectedPacks(elements);
 const impactPass=data.impacts.every(i=>i.clock.ready&&i.clock.state==='running'&&i.hits.some(h=>h.result==='played')&&i.starts.length===1&&i.starts[0].pack&&expected.includes(i.starts[0].pack));
 const late=data.resources.filter(r=>r.startTime>data.readyAt+.01);
 const row={caseId:id,...entry,phase:name,elements:elements??null,...data,expectedRangedPacks:expected,serverResponses:network.length,
  serverBodyBytes:network.reduce((n,r)=>n+r.bodyBytes,0),rangedPayloadBytes:ranged.filter(r=>r.status===200).reduce((n,r)=>n+r.bodyBytes,0),
  rangedPayloadRequests:ranged.filter(r=>r.status===200).length,expectedFallbacks:ranged.filter(r=>r.status===503).length,
  unexpectedStatuses:network.filter(r=>r.status!==200&&!(entry.format==='fallback-mp3'&&r.status===503&&r.path.endsWith('.webm'))),
  networkAfterReady:late.length,pass:data.allBounds&&impactPass&&expected.every(p=>data.decoded.includes(p))&&late.length===0&&network.every(r=>r.finished)};
 if(row.unexpectedStatuses.length)row.pass=false;
 rows.push(row);save();console.log(JSON.stringify({caseId:id,phase:name,pass:row.pass,preloadMs:row.preloadMs,rangedBytes:row.rangedPayloadBytes,rangedRequests:row.rangedPayloadRequests,lateLoads:late.length}));
}
try{
 await server.listen();save();
 for(const browserName of ['chromium','webkit']){
  browser=await playwright[browserName].launch({headless:true});
  for(const format of ['webm','fallback-mp3'])for(const scope of ['observed','all'])for(const method of (scope==='observed'?['monolith','palettes']:['palettes','monolith'])){
   stop();const id=[browserName,format,scope,method].join('-'),entry={browser:browserName,version:browser.version(),format,scope,method};cases.set(id,entry);
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   page.on('pageerror',error=>pageErrors.push({caseId:id,phase:activePhase,error:String(error.message).slice(0,200)}));
   page.on('request',request=>{const u=new URL(request.url());if(u.hostname!=='127.0.0.1'||u.port!=='5994')foreignRequests.push({caseId:id,url:u.origin+u.pathname});});
   try{
    activeCase=id;activePhase='load';await page.goto(`http://127.0.0.1:5994/probe/${id}/index.html`);await unlock(page);
    const initial=scope==='observed'?['ember','heavy']:['ember','heavy','shadow','tide','ice'];
    await phase(page,entry,id,'cold',initial);
    await phase(page,entry,id,'same-engine-repeat',initial);
    await phase(page,entry,id,'overlap',['heavy','shadow']);
    await phase(page,entry,id,'unknown-all',['unknown']);
    await phase(page,entry,id,'reload-observed',['ember','heavy'],true);
    await phase(page,entry,id,'reload-all',undefined,true);
   }catch(error){report.failures??=[];report.failures.push({caseId:id,phase:activePhase,error:String(error.message).slice(0,250)});save();}
   finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assertUnchanged(root,signature);assert(transformedCandidate>0);
 report.transformedCandidate=transformedCandidate;report.complete=true;
 report.pass=rows.length===96&&rows.every(r=>r.pass)&&!pageErrors.length&&!foreignRequests.length&&!report.failures?.length;
 report.summary={cases:rows.length,passed:rows.filter(r=>r.pass).length,cold:rows.filter(r=>r.phase==='cold').map(({caseId,rangedPayloadBytes,rangedPayloadRequests,preloadMs,pass})=>({caseId,rangedPayloadBytes,rangedPayloadRequests,preloadMs,pass})),pageErrors:pageErrors.length,foreignRequests:foreignRequests.length};
 report.limits=['Owned loopback HTTP server and explicit immutable headers; no deployed cache policy or wide-area latency claim.',
 'Candidate receives explicit element selections; actual roster-arrival and battle wiring are unimplemented and untested.',
 'Only preload selection and baked sample pack/start change in research copies. Installed source/assets and all ART files remain unchanged.',
 'Muted master output and source-call metadata do not measure physical onset, listening, mix or complete battle performance.',
 'Known first WebKit EncodingError remains preserved; all new errors/cases are retained.'];
 save();console.log(JSON.stringify({output:relative(root,out),pass:report.pass,summary:report.summary}));
 if(!report.pass)process.exitCode=1;
}finally{if(browser)await browser.close();await server.close();assertUnchanged(root,signature);save();}
