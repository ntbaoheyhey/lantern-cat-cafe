/** Verify the installed cache against historical graph operations and exact native replay. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {runtimeSignature,assertUnchanged} from '../../../scripts/audio/runtime-signature.mjs';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-ship/S11/forge-install-study-1.json'),raw=out.replace('.json','.rows.json.gz');
assert(!existsSync(out)&&!existsSync(raw)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))});
const revision='52aaaba39',path='apps/web/src/audio/engine.ts',original=execFileSync('git',['show',`${revision}:${path}`],{cwd:root});
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript'),browsers=require('@playwright/test');
const js=ts.transpileModule(original.toString(),{compilerOptions:{target:ts.ScriptTarget.ESNext,module:ts.ModuleKind.ESNext}}).outputText.replaceAll('import.meta.env.DEV','false');
const signature=runtimeSignature(root),rows=[];
for(const name of ['chromium','webkit']){
 const browser=await browsers[name].launch({headless:true});try{
  const p=await browser.newPage();await p.route('**/*',route=>{
   const u=new URL(route.request().url());if(u.pathname==='/__forge-install')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Native forge integration</title>'});
   if(u.pathname==='/src/audio/forge-original.js')return route.fulfill({contentType:'text/javascript',body:js});
   return u.hostname==='127.0.0.1'&&u.port==='5995'?route.continue():route.abort();
  });await p.goto('http://127.0.0.1:5995/__forge-install');
  for(const requestedRate of [48000,44100]){
   const data=await p.evaluate(async requestedRate=>{
    const {AudioEngine}=await import('/src/audio/engine.ts'),{AudioEngine:Historical}=await import('/src/audio/forge-original.js');
    const e=new AudioEngine(()=>.5);e.ctx=new AudioContext({sampleRate:requestedRate});await e.unlock();
    const starts=[],create=e.ctx.createBufferSource;e.ctx.createBufferSource=function(){const s=create.call(this),start=s.start;s.start=function(when=0,offset=0,duration){starts.push({when,offset,duration,rate:this.playbackRate.value});return start.call(this,when,offset,duration);};return s;};
    let preparationMs=0;const render=e.renderForge;e.renderForge=async function(){const begin=performance.now();try{return await render.apply(this,arguments);}finally{preparationMs+=performance.now()-begin;}};
    await Promise.all([e.preload('home'),e.preload('home')]);const before=e.diagnostics,preparationStarts=starts.length;
    const requests=()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/audio/')).length;
    const loaded=requests();await e.preload('home');const repeatRequests=requests()-loaded;
    const rate=e.ctx.sampleRate,m=e.decodedManifest,rows=[];
    const difference=(a,b)=>{let max=0;for(let i=0;i<Math.max(a.length,b.length);i++)max=Math.max(max,Math.abs((a[i]??0)-(b[i]??0)));return max;};
    const bufferError=(a,b)=>Math.max(...Array.from({length:a.numberOfChannels},(_,c)=>difference(a.getChannelData(c),b.getChannelData(c))));
    async function direct(Engine,id,design,samples,input,length){
     const context=new OfflineAudioContext(input.numberOfChannels,length,rate),nodes=[],calls=[];
     for(const [method,kind] of [['createBufferSource','source'],['createGain','gain'],['createBiquadFilter','filter']]){
      const create=context[method];context[method]=function(){const node=create.call(this),index=nodes.length;nodes.push({node,kind});
       const connect=node.connect;node.connect=function(target,...args){calls.push([index,'connect',target===context.destination?-1:nodes.findIndex(r=>r.node===target),...args]);return connect.call(this,target,...args);};
       if(kind==='gain')for(const op of ['setValueAtTime','linearRampToValueAtTime']){const original=node.gain[op];node.gain[op]=function(...args){calls.push([index,op,...args]);return original.apply(this,args);};}
       if(kind==='source'){const start=node.start;node.start=function(...args){calls.push([index,'start',...args]);return start.apply(this,args);};}
       return node;
      };
     }
     const a=new Engine(()=>.5);a.ctx=context;a.buses.set('ui',context.destination);
     design.layers.forEach((l,i)=>a.start(id,input,samples[i],design.priority,1,10**(l.gainDb/20),l.offsetMs/1000,l.eq,1,0));
     const graph={calls,nodes:nodes.map(({node,kind})=>kind==='source'?{kind,rate:node.playbackRate.value,loop:node.loop,sameDecodedInput:node.buffer===input}:kind==='gain'?{kind,gain:node.gain.value}:{kind,type:node.type,frequency:node.frequency.value,Q:node.Q.value,gain:node.gain.value})};
     return {graph,buffer:await context.startRendering()};
    }
    for(const [id,takes] of e.nativeForge){
     const design=m.designs[m.bindings[id]],input=e.decoded.get(design.layers[0].variants[0].pack);
     for(const [key,take] of takes){
      const coordinates=JSON.parse(key),samples=coordinates.map((c,i)=>design.layers[i].variants.find(s=>JSON.stringify([s.pack,s.start,s.duration])===JSON.stringify(c)));
      const original=await direct(Historical,id,design,samples,input,take.buffer.length),current=await direct(AudioEngine,id,design,samples,input,take.buffer.length),replays=[];
      for(const method of ['raw-node','engine-composite']){
       const context=new OfflineAudioContext(take.buffer.numberOfChannels,take.buffer.length+128,rate);
       if(method==='raw-node'){const s=context.createBufferSource();s.buffer=take.buffer;s.connect(context.destination);s.start(0,0,take.buffer.duration);}
       else{const a=new AudioEngine(()=>.5);a.ctx=context;a.buses.set('ui',context.destination);a.start(id,take.buffer,take.sample,design.priority,1,1,0,'flat',1,0);}
       replays.push({method,maximumError:bufferError(take.buffer,await context.startRendering())});
      }
      rows.push({id,variants:samples.map(s=>s.variantId),graphOperationsIdentical:JSON.stringify(original.graph)===JSON.stringify(current.graph),
       nominalIndependentRenderError:bufferError(original.buffer,take.buffer),currentIndependentRenderError:bufferError(original.buffer,current.buffer),replays,
       retainedBytes:take.buffer.length*take.buffer.numberOfChannels*4,durationMs:take.buffer.duration/.97*1000});
     }
    }
    for(const id of ['ui.hover','ui.release','ui.click','ui.forge.hammer','ui.forge.success','voice.mochi.forge'])e.play(id);
    const burst={starts:starts.length,hits:e.hits.map(h=>({id:h.id,result:h.result,layers:h.layers?.length??0})),times:starts.map(s=>s.when)};
    await new Promise(r=>setTimeout(r,150));const beforeGeneric=starts.length;e.play('ui.confirm');const genericConfirmStarts=starts.length-beforeGeneric;
    e.stop();await e.ctx.close();return {requestedRate,sampleRate:rate,preparationMs,preparationStarts,repeatRequests,preparedVariants:before.forgeVariants,burst,genericConfirmStarts,rows};
   },requestedRate);rows.push({browser:name,version:browser.version(),...data});
  }
 }finally{await browser.close();}
}
assertUnchanged(root,signature);writeFileSync(raw,gzipSync(JSON.stringify(rows)));
const summary=rows.map(({rows,...r})=>({...r,cases:rows.length,graphOperationFailures:rows.filter(x=>!x.graphOperationsIdentical).length,
 exactReplayChecks:rows.reduce((n,r)=>n+r.replays.filter(x=>x.maximumError===0).length,0),maximumReplayError:Math.max(...rows.flatMap(r=>r.replays.map(x=>x.maximumError))),
 nominalIndependentRenderFailures:rows.filter(r=>r.nominalIndependentRenderError>1e-7).length,maximumNominalIndependentRenderError:Math.max(...rows.map(r=>r.nominalIndependentRenderError)),
 retainedBufferBytes:rows.reduce((n,r)=>n+r.retainedBytes,0),maximumDurationMs:Math.max(...rows.map(r=>r.durationMs))}));
const pass=summary.every(r=>r.cases===72&&r.preparedVariants===72&&r.graphOperationFailures===0&&r.exactReplayChecks===144&&r.preparationStarts===0&&r.repeatRequests===0&&r.genericConfirmStarts===2&&r.maximumDurationMs<=300&&r.burst.starts===6&&r.burst.hits.length===6&&r.burst.hits.every(h=>h.result==='played'));
writeFileSync(out,JSON.stringify({at:new Date().toISOString(),harness:signed(relative(root,import.meta.filename)),historicalSource:{revision,path,sha256:hash(original)},signature,raw:signed(relative(root,raw)),summary,pass,
 limits:'Historical and current graph operations must match exactly; native replay must match its actual cached samples exactly. Independent graph render differences remain reported against the original1e-7 criterion. This does not prove physical onset, listening, dynamic range or real UI interactions.'},null,2)+'\n');
console.log(JSON.stringify({output:relative(root,out),pass,summary}));if(!pass)process.exitCode=1;
