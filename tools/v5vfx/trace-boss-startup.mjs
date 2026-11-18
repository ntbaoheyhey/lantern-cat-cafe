/** Short natural-play diagnostic; user-timing marks align sampled stacks with render intervals. */
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const production=process.env.CXV_TRACE_JUDGE==='1';
const {chromium,config,openFixture,runtimeEvidence,judgeUrl}=await import(production?'/Users/bao/taskbar-hero-chain/tools/v5int/production-fixture.mjs':'./production-candidate-fixture.mjs');
import {hash} from './victory-demand-source.mjs';
const out=resolve(process.env.CXV_CAPTURE_OUT);assert(!existsSync(resolve(out,'report.json')));await mkdir(out,{recursive:true});
const durationMs=Number(process.env.CXV_TRACE_DURATION_MS??6000);assert([6000,32000].includes(durationMs));
const shaderAudit=process.env.CXV_TRACE_SHADER==='1';
const report={utc:new Date().toISOString(),url:judgeUrl,...runtimeEvidence(),viewport:{width:1280,height:720},method:'Preserved current-runtime baseline artifact; seeded boss then6s normal speed1 automatic rule-selected play at1x/4x. Inclusive elapsed method/submission wrappers, CPU sampling and timeline traces add overhead. User-timing marks align render intervals to profiler samples. Attribution only; no FPS, exclusive-CPU, physical-laptop or judge-acceptance claim.',runs:[],errors:[],pass:false};
report.production=production;report.durationMs=durationMs;report.method=report.method.replace('Preserved current-runtime baseline artifact',production?'Current served judge artifact':'Preserved current-runtime baseline artifact').replace('then6s','then'+durationMs/1000+'s');
if(production){const board=await readFile('/Users/bao/taskbar-hero-mailbox/BOARD.md','utf8');report.servedSource=board.match(/Currently served candidate:([a-f0-9]{40})/)[1];assert.equal(report.indexSha256,board.match(/Currently served candidate:[^\n]*index:([a-f0-9]{64})/)[1]);}
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 for(const rate of [1,4]){
  const {page,errors,blockedRequests}=await openFixture(browser,config.fixtures.find(f=>f.id==='boss'));await page.locator('.b3-wave-intro').waitFor({state:'hidden',timeout:5000});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
  await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.stack',transferMode:'ReturnAsStream'});await cdp.send('Profiler.start');
  const run=await page.evaluate(async({rate,durationMs,shaderAudit})=>{
   const s=window.__depthScene,m=window.__depthReview,render=s.render,before=s.beforeFrame,restores=[],frames=[],plans=[],seen=new Set();
   let frame=null,serial=0,rafTime=0,lastRaf=null;const uploads=[],shaderCalls=[],objectIds=new WeakMap();let nextObjectId=0;
   const objectId=value=>{if(!value||typeof value!=='object')return null;if(!objectIds.has(value))objectIds.set(value,++nextObjectId);return objectIds.get(value);};
   const shaderBefore=shaderAudit?{programs:s.renderer.info.programs.length,checksEnabled:s.renderer.debug.checkShaderErrors,parallelSupported:s.renderer.getContext().getSupportedExtensions().includes('KHR_parallel_shader_compile')}:null;
   const sourceLabels=new Map();for(const [id,e]of s.actors)for(const [key,t]of Object.entries(e.craftPose?.drawing.set.textures??{})){const labels=sourceLabels.get(t.image)??[];labels.push({id,key});sourceLabels.set(t.image,labels);}
   performance.mark('cxv-startup-start');const start=performance.getEntriesByName('cxv-startup-start').at(-1).startTime;
   const instrument=(object,key,label)=>{if(!object||typeof object[key]!=='function')return;const original=object[key];object[key]=function(...args){
    const at=performance.now();let result;try{result=original.apply(this,args);return result;}finally{const elapsed=performance.now()-at;if(frame){const c=frame.costs[label]??(frame.costs[label]={calls:0,elapsedMs:0,maxMs:0});c.calls++;c.elapsedMs+=elapsed;c.maxMs=Math.max(c.maxMs,elapsed);
     if(shaderAudit&&/Shader|Program|ActiveUniform|ActiveAttrib|UniformLocation|AttribLocation/.test(key))shaderCalls.push({serial:frame.serial,at:at-start,elapsedMs:elapsed,label,object:objectId(args[0]),type:args[0]?.constructor.name??null,parameter:typeof args[1]==='number'?args[1]:null,result:typeof result==='boolean'||typeof result==='number'?result:typeof result==='string'?{length:result.length}:null});
     if(label.startsWith('gl.tex')){const source=args.findLast(v=>v&&typeof v==='object'&&('width'in v||'videoWidth'in v));uploads.push({serial:frame.serial,label,at:at-start,elapsedMs:elapsed,type:source?.constructor.name??null,width:source?.width??null,height:source?.height??null,sourceLabels:sourceLabels.get(source)??[],url:source?.currentSrc||source?.src||null});}
    }}
   };restores.push(()=>object[key]=original);};
   for(const [,e]of s.actors){instrument(e.actor,'sample','actor.sample');instrument(e.actor?.mesh,'pose','native.pose');instrument(e.craftPose,'deform','craft.deform');instrument(e.craftPose?.drawing,'sample','drawing.sample');}
   instrument(CanvasRenderingContext2D.prototype,'getImageData','canvas.getImageData');instrument(CanvasRenderingContext2D.prototype,'drawImage','canvas.drawImage');instrument(CanvasRenderingContext2D.prototype,'measureText','canvas.measureText');
   const gl=s.renderer.getContext();for(const name of ['texImage2D','texSubImage2D','compileShader','linkProgram','drawElements','drawArrays','bufferData','bufferSubData'])instrument(gl,name,'gl.'+name);
   if(shaderAudit)for(const name of ['getProgramInfoLog','getShaderInfoLog','getProgramParameter','getShaderParameter','getActiveUniform','getActiveAttrib','getUniformLocation','getAttribLocation'])instrument(gl,name,'gl.'+name);
   s.beforeFrame=function(now){rafTime=now;return before?.call(this,now);};
   s.render=function(...args){
    const id=++serial;performance.mark('cxv-render-start-'+id);const at=performance.now();frame={serial:id,at:at-start,rafInterval:lastRaf===null?null:rafTime-lastRaf,skill:m.plan?.skillId,age:m.animationAt,costs:{}};
    try{return render.apply(this,args);}finally{frame.elapsedMs=performance.now()-at;frame.drawCalls=s.stats.calls;frame.textures=s.stats.textures;frames.push(frame);frame=null;lastRaf=rafTime;performance.mark('cxv-render-end-'+id);
     if(m.plan&&!seen.has(m.plan)){seen.add(m.plan);plans.push({at:at-start,skill:m.plan.skillId,actor:m.plan.actorId,ultimate:m.plan.ultimate,duration:m.plan.duration});}
    }
   };
   const initial={round:m.battle.round,log:m.battle.log.length};cancelAnimationFrame(s.raf);m.paused=false;m.notify(false);s.raf=requestAnimationFrame(s.loop);
   await new Promise(done=>setTimeout(done,durationMs));m.paused=true;m.notify(false);cancelAnimationFrame(s.raf);s.render=render;s.beforeFrame=before;for(const restore of restores)restore();performance.mark('cxv-startup-end');
   return{rate,startPerformanceMs:start,timeOrigin:performance.timeOrigin,elapsedMs:performance.now()-start,frames,uploads,plans,initial,shader:shaderAudit?{before:shaderBefore,after:{programs:s.renderer.info.programs.length,checksEnabled:s.renderer.debug.checkShaderErrors},calls:shaderCalls}:undefined,final:{round:m.battle.round,log:m.battle.log.length,result:m.battle.result}};
  },{rate,durationMs,shaderAudit});
  const {profile}=await cdp.send('Profiler.stop');const profilePath=resolve(out,`${rate}x.cpuprofile`);await writeFile(profilePath,JSON.stringify(profile));
  const complete=new Promise(done=>cdp.once('Tracing.tracingComplete',done));await cdp.send('Tracing.end');const {stream}=await complete;assert(stream);let trace='';
  for(;;){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.base64Encoded?Buffer.from(chunk.data,'base64').toString('utf8'):chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});
  const tracePath=resolve(out,`${rate}x.trace.json`);await writeFile(tracePath,trace);await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
  const path=resolve(out,`${rate}x.png`);await page.screenshot({path});run.capture={path,sha256:hash(await readFile(path))};run.profile={path:profilePath,sha256:hash(await readFile(profilePath))};run.trace={path:tracePath,sha256:hash(trace)};run.errors=errors;run.blockedRequests=blockedRequests;run.utc=new Date().toISOString();assert(run.frames.length>40&&run.plans.length>1&&run.final.log>run.initial.log);report.runs.push(run);report.errors.push(...errors);await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({rate,frames:run.frames.length,plans:run.plans.length,maxElapsedMs:Math.max(...run.frames.map(f=>f.elapsedMs)),errors}));await page.close();
 }
 report.pass=report.runs.length===2&&!report.errors.length&&report.runs.every(r=>!r.blockedRequests.length);report.ended=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');assert(report.pass);
}finally{await browser.close();}
