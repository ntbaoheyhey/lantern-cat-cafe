/** Read-only browser measurements; never access game debug objects. */
export const median=values=>{const a=[...values].sort((x,y)=>x-y);return a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null;};
export function frameSummary(times){
 if(times.length<2)return {valid:false,frames:times.length,seconds:0,medianFps:null,windows:[]};
 const first=times[0],last=times.at(-1),seconds=(last-first)/1000,windows=[];
 if(!Number.isFinite(seconds)||seconds<=0||times.some((t,i)=>i&&t<=times[i-1]))return {valid:false,frames:times.length,seconds,medianFps:null,windows};
 for(let start=first;start+1000<=last;start+=1000)windows.push(times.filter(t=>t>start&&t<=start+1000).length);
 return {valid:seconds>=30&&windows.length>=30,frames:times.length,seconds,averageFps:(times.length-1)/seconds,medianFps:median(windows),minimumWindowFps:windows.length?Math.min(...windows):null,windows};
}
export function transferSummary(records,atBattle){
 const selected=[...records.values()].filter(r=>atBattle.has(r.id));
 const complete=selected.length>0&&selected.every(r=>r.finished&&Number.isFinite(r.totalBytes)&&r.totalBytes>=0&&!r.failed&&!r.cached);
 return {valid:complete,requests:selected.length,bytesObservedAtBattle:[...atBattle.values()].reduce((n,r)=>n+r,0),
  // Count the entire response of every request initiated before battle, even if it finished later.
  conservativeTransferBytes:selected.reduce((n,r)=>n+(r.totalBytes??0),0),incomplete:selected.filter(r=>!r.finished).map(r=>r.path),
  failed:selected.filter(r=>r.failed).map(r=>r.path),cached:selected.filter(r=>r.cached).map(r=>r.path),
  resources:selected.map(({path,totalBytes,type,cached,failed})=>({path,totalBytes,type,cached,failed}))};
}
export async function observeRehearsal(context,page){
 const cdp=await context.newCDPSession(page),records=new Map(),devPaths=new Set();let atBattle=new Map(),resourceTiming=[],boss=null;
 await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 cdp.on('Network.requestWillBeSent',e=>{
  const url=new URL(e.request.url);if(!['http:','https:'].includes(url.protocol))return;
  const path=url.origin+url.pathname;
  if(/\/(?:@vite|@fs|src)(?:\/|$)|\.tsx?$/.test(url.pathname)||url.searchParams.has('dev'))devPaths.add(path);
  records.set(e.requestId,{id:e.requestId,path,type:e.type,observed:0,finished:false,failed:false,cached:false});
 });
 cdp.on('Network.responseReceived',e=>{const r=records.get(e.requestId);if(r){r.observed=e.response.encodedDataLength??0;r.cached=Boolean(e.response.fromDiskCache||e.response.fromServiceWorker||e.response.fromPrefetchCache);}});
 cdp.on('Network.requestServedFromCache',e=>{const r=records.get(e.requestId);if(r)r.cached=true;});
 cdp.on('Network.dataReceived',e=>{const r=records.get(e.requestId);if(r)r.observed+=e.encodedDataLength;});
 cdp.on('Network.loadingFinished',e=>{const r=records.get(e.requestId);if(r){r.finished=true;r.totalBytes=e.encodedDataLength;r.observed=e.encodedDataLength;}});
 cdp.on('Network.loadingFailed',e=>{const r=records.get(e.requestId);if(r){r.finished=true;r.failed=true;}});
 await page.addInitScript(()=>{
  const meter={active:false,times:[],hiddenFrames:0,start(){this.active=true;this.times=[];this.hiddenFrames=0;},stop(){this.active=false;return {times:this.times,hiddenFrames:this.hiddenFrames};}};
  Object.defineProperty(window,'__shipRehearsalMeter',{value:meter});
  const frame=t=>{if(meter.active){if(document.hidden)meter.hiddenFrames++;else if(document.querySelector('.dp-battle')?.checkVisibility())meter.times.push(t);}requestAnimationFrame(frame);};
  requestAnimationFrame(frame);
 });
 return {
  async firstBattle(){
   atBattle=new Map([...records.values()].map(r=>[r.id,r.observed]));
   resourceTiming=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).origin+new URL(r.name).pathname,transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,duration:r.duration})));
  },
  async startBoss(){await page.evaluate(()=>window.__shipRehearsalMeter.start());},
  async endBoss(){const r=await page.evaluate(()=>window.__shipRehearsalMeter.stop());boss={...frameSummary(r.times),hiddenFrames:r.hiddenFrames};},
  async finish(){
   const transfer=transferSummary(records,atBattle),noDevelopmentPath=devPaths.size===0;
   const gates={transfer:transfer.valid&&transfer.conservativeTransferBytes<=8_000_000,bossFps:!!boss?.valid&&boss.hiddenFrames===0&&boss.medianFps>=50,noDevelopmentPath};
   await cdp.detach();
   return {pass:Object.values(gates).every(Boolean),gates,transfer,boss,developmentPaths:[...devPaths],resourceTiming,
    method:'Fresh browser context, service workers blocked, HTTP cache disabled; CDP full encoded responses for requests begun before first battle (conservative upper bound); rAF cadence only while the visible boss battle renders, including stalls.',
    limitations:['rAF measures browser rendering cadence; it is not a hardware display scanout measurement.','Local API and Anvil are isolated production-build test infrastructure. This does not prove public network or sponsor latency.']};
  },
 };
}
