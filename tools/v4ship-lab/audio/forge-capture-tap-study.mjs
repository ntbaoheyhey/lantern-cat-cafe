/** The recorder must capture live destinations without intercepting offline preparation. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../../..'),out=resolve(root,'reports/v4-ship/S11/forge-capture-tap-1.json');
assert(!existsSync(out)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const path='scripts/audio/capture-page.mjs',source=readFileSync(resolve(root,path),'utf8');
const old='if(target===this.context.destination&&!tapped.has(this)){',replacement="if(typeof this.context.createMediaStreamDestination==='function'&&target===this.context.destination&&!tapped.has(this)){";
assert.equal(source.split(old).length,2);
const hash=b=>createHash('sha256').update(b).digest('hex'),require=createRequire(resolve(root,'apps/web/package.json'));
const {chromium}=require('@playwright/test'),browser=await chromium.launch({headless:true}),rows=[];
const raw=resolve(root,'work/v4ship-audio/forge-capture-tap-1');assert(!existsSync(raw));mkdirSync(raw,{recursive:true});
try{for(const method of ['original','live-context-guard']){
 const {installOutputCapture}=await import('data:text/javascript;base64,'+Buffer.from(method==='original'?source:source.replace(old,replacement)).toString('base64'));
 const p=await browser.newPage(),file=resolve(raw,method+'.webm');await installOutputCapture(p,file);
 await p.route('**/__forge-tap',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Audio capture context check</title>'}));
 await p.goto('http://127.0.0.1:5995/__forge-tap');
 const result=await p.evaluate(async()=>{
  const ctx=new AudioContext();await ctx.resume();const data=await(await fetch('/audio/b2-ui.webm')).arrayBuffer(),buffer=await ctx.decodeAudioData(data);
  const node=ctx.createBufferSource();node.buffer=buffer;node.connect(ctx.destination);await window.__outputCapture.start();node.start(0,7.0846875,.12);
  let offlineRendered=false,offlineError=null,maximumSampleError=null;const began=performance.now();
  try{const off=new OfflineAudioContext(buffer.numberOfChannels,buffer.length,buffer.sampleRate),s=off.createBufferSource();s.buffer=buffer;s.connect(off.destination);s.start();const rendered=await off.startRendering();let error=0;
   for(let channel=0;channel<buffer.numberOfChannels;channel++){const a=buffer.getChannelData(channel),b=rendered.getChannelData(channel);for(let i=0;i<a.length;i++)error=Math.max(error,Math.abs(a[i]-b[i]));}
   maximumSampleError=error;offlineRendered=true;
  }catch(e){offlineError=e instanceof Error?e.name+': '+e.message:String(e);}
  const offlineMs=performance.now()-began;await new Promise(r=>setTimeout(r,1100));await window.__outputCapture.stop();await ctx.close();
  return {offlineRendered,offlineError,maximumSampleError,offlineMs};
 });await p.close();const bytes=readFileSync(file);rows.push({method,...result,capture:{path:relative(root,file),bytes:bytes.length,sha256:hash(bytes)}});
}}finally{await browser.close();}
assert(rows.every(r=>r.capture.bytes>1000));assert.equal(rows[0].offlineRendered,false);assert.match(rows[0].offlineError,/createMediaStreamDestination/);
assert.equal(rows[1].offlineRendered,true);assert.equal(rows[1].maximumSampleError,0);
const report={at:new Date().toISOString(),harness:{path:relative(root,import.meta.filename),sha256:hash(readFileSync(import.meta.filename))},original:{path,sha256:hash(source)},guardedSha256:hash(source.replace(old,replacement)),rows,originalFailurePreserved:true,liveRecordingBoth:true,offlineExactWithGuard:true,acousticGateThresholdsChanged:false};
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,out),rows,pass:true}));
