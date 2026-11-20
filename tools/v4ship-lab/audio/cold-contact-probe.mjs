/** Paired fresh-production diagnostics; candidate preloading exists only in each page. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {prepareJourneyAudio,observeJourneyAudio} from './journey-observer.mjs';
import {prepareImpactObservation,evaluateImpactObservation} from './impact-observer.mjs';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/cold-contact-probe-${attempt}.json`),raw=output.replace('.json','.events.json.gz');
assert(!existsSync(output)&&!existsSync(raw),'Preserve previous diagnostic');
const hash=b=>createHash('sha256').update(b).digest('hex'),git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const stop=()=>assert(!existsSync(resolve(root,'STOP-V4SHIP')),'STOP-V4SHIP');stop();
assert.equal(git(['branch','--show-current']),'codex/v4-ship-2026-11-16');
const buildPath=process.env.V4_BUILD_REPORT??'reports/v4-ship/S8/production-build-13.json',build=JSON.parse(readFileSync(resolve(root,buildPath)));
const unchanged=()=>git(['diff','--name-only',build.sourceCommit,'--','apps/web/src','apps/web/public','packages/game-rules/src','supabase/functions'])==='';assert(unchanged());
const response=await fetch('http://127.0.0.1:5998');assert(response.ok&&hash(Buffer.from(await response.arrayBuffer()))===build.indexSha256);
const require=createRequire(resolve(root,'apps/web/package.json')),{chromium}=require('@playwright/test');
const methods=(process.env.V4_COLD_CONTACT_METHODS??'current,roster-warm').split(',');assert(methods.length===2&&methods.every(m=>['current','roster-warm','scene-follow'].includes(m)));
const report={at:new Date().toISOString(),sourceCommit:build.sourceCommit,buildEvidence:buildPath,
 scope:'Four paired fresh production entries at both required sizes, alternating method order. Existing real gesture/unlock and first eight rendered contacts. Candidates warm the existing battle packs or select the actual boss/battle soundscape at roster observation inside this browser only. This hook is a measured prototype, not a claim that the missing React wiring is implemented. No product/source/audio edits, normalization, screenshots or extra input. Diagnostic timing estimates are not physical onset acceptance.',
 harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},rows:[],complete:false};
const rawRows=[],save=()=>writeFileSync(output,JSON.stringify(report,null,2)+'\n');
const fixture=async action=>{const r=await fetch(`http://127.0.0.1:5997/__fixture/${action}`,{method:'POST'});assert(r.ok,`Fixture ${action}`);};
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(let pair=0;pair<4;pair++)for(const method of pair%2?methods.slice().reverse():methods){
  stop();assert(unchanged());const width=pair%2?1440:1280,height=width===1440?900:720;
  const row={pair,method,viewport:{width,height},errors:[],blocked:[],rollback:false};report.rows.push(row);save();
  let context,active=false;
  try{
   await fixture('begin');active=true;context=await browser.newContext({viewport:{width,height},serviceWorkers:'block'});const page=await context.newPage();
   page.on('pageerror',e=>row.errors.push(String(e.message).slice(0,200)));
   await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),local=['blob:','data:'].includes(u.protocol)||u.hostname==='127.0.0.1'&&['5998','5997','8546'].includes(u.port),font=u.protocol==='https:'&&r.method()==='GET'&&(u.hostname==='fonts.googleapis.com'&&r.resourceType()==='stylesheet'||u.hostname==='fonts.gstatic.com'&&r.resourceType()==='font');if(local||font)await route.continue();else{row.blocked.push(u.origin+u.pathname);await route.abort();}});
   await prepareJourneyAudio(page);await prepareImpactObservation(page);
   await page.goto('http://127.0.0.1:5998/?demo=1&squad=1&cardrpg2=1&a6=1');
   await page.getByRole('button',{name:'Play free',exact:true}).waitFor();await observeJourneyAudio(page);
   await page.evaluate(method=>{
    const e=window.__thAudio,s=window.__coldContact={method,calls:[],loads:[],requests:[],initialDecoded:[...e.decoded.keys()],initialBeds:{...e.bedIds}};
    const buffer=e.buffer;e.buffer=function(pack,manifest){const row={pack,at:performance.now(),decoded:this.decoded.has(pack),inflight:this.buffers.has(pack)};s.loads.push(row);const p=buffer.apply(this,arguments);p.then(()=>row.readyAt=performance.now(),()=>row.failed=true);return p;};
    for(const name of ['music','musicScope','preload','preloadVoices']){const original=e[name];e[name]=function(...args){s.calls.push({name,args,at:performance.now()});const p=original.apply(this,args);if(name==='preloadVoices'&&method==='roster-warm')void this.preload('battle');if(name==='preloadVoices'&&method==='scene-follow'){const scene=args[0].some(id=>/yarn-giant/.test(id))?'boss':'battle';this.music(scene);this.ambience(scene);}return p;};}
    const play=e.play;e.play=function(id,options){s.requests.push({id,options,at:performance.now(),decoded:[...this.decoded.keys()],inflight:[...this.buffers.keys()].filter(p=>!this.decoded.has(p))});return play.apply(this,arguments);};
   },method);
   await page.getByRole('button',{name:'Play free',exact:true}).click();await page.getByRole('button',{name:'Start trial',exact:true}).click();
   await page.waitForFunction(()=>window.__impactObservation.plans.filter(p=>p.expectsAction&&p.contact!==null).length>=8,{},{timeout:40000});await page.waitForTimeout(300);
   const data=await page.evaluate(()=>{clearInterval(window.__impactObserverTimer);return {audio:window.__journeyAudio,impact:window.__impactObservation,diagnostic:window.__coldContact,resources:performance.getEntriesByType('resource').filter(r=>new URL(r.name).pathname.startsWith('/audio/')).map(r=>({path:new URL(r.name).pathname,startTime:r.startTime,responseEnd:r.responseEnd,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize})),finalBeds:{...window.__thAudio.bedIds},finalDecoded:[...window.__thAudio.decoded.keys()]};});
   rawRows.push({pair,method,...data});const impact=evaluateImpactObservation(data.impact,data.audio),contacts=impact.rows.filter(r=>r.checks.contactReached);
   row.contacts=contacts;row.calls=data.diagnostic.calls;row.firstRequest=data.diagnostic.requests.find(r=>r.id==='kit.holy.impact');
   row.firstContact=contacts[0];row.firstImpactPacks=[...new Set(data.audio.starts.filter(s=>s.request===row.firstContact.requestIds[0]).map(s=>s.pack))];
   row.firstImpactLoads=data.diagnostic.loads.filter(l=>row.firstImpactPacks.includes(l.pack));row.finalBeds=data.finalBeds;
   row.audioTransferBytes=data.resources.reduce((n,r)=>n+r.encodedBodySize,0);row.resources=data.resources;
   row.pass=contacts.length>=8&&contacts.every(r=>r.pass)&&row.errors.length===0&&row.blocked.length===0;
   assert(row.pass,'Observed contact diagnostic failed');
  }catch(error){row.failure=String(error.message).replace(/0x[\da-f]{64,}/gi,'[hash]').slice(0,250);throw error;}
  finally{if(context)await context.close();if(active){await fixture('rollback');row.rollback=true;}save();}
  console.log(JSON.stringify({pair,method,firstRequestMs:row.firstContact.sourceCallAfterSubmissionMs,estimatedOnsetMs:row.firstContact.estimatedAudioAfterSubmissionMs,firstImpactPacks:row.firstImpactPacks,decodedBeforeImpact:row.firstImpactPacks.every(p=>row.firstRequest.decoded.includes(p)),audioTransferBytes:row.audioTransferBytes,rollback:row.rollback}));
 }
 assert(unchanged());report.complete=true;
}finally{await browser.close();const bytes=gzipSync(JSON.stringify(rawRows));writeFileSync(raw,bytes);report.events={path:relative(root,raw),sha256:hash(bytes)};save();}
