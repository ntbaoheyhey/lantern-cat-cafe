/** Causal input/receipt -> request -> actual start observation. Never alter audio admission. */
export async function prepareJourneyAudio(page){
 await page.addInitScript(()=>{
  const state=window.__journeyAudio={controls:[],receipts:[],requests:[],starts:[],results:[],activeControl:null,activeReceipt:null};
  for(const kind of ['click','pointerup','input','change'])document.addEventListener(kind,event=>{
   const control=event.target instanceof Element?event.target.closest('button,a[href],input,select,[role="button"]'):null;
   if(!control)return;
   const row={sequence:state.controls.length,kind,label:control.getAttribute('aria-label')||control.textContent?.trim().slice(0,100)||'',performanceMs:performance.now(),disabled:control.matches(':disabled,[aria-disabled="true"]')};
   state.controls.push(row);state.activeControl=row.sequence;
   // Native event dispatch may checkpoint microtasks between listeners. Keep
   // this input token through the event task so the later feedback handler sees it.
   setTimeout(()=>{if(state.activeControl===row.sequence)state.activeControl=null;},0);
  },true);
  window.addEventListener('chain:receipt',event=>{
   const proof=event.detail,row={sequence:state.receipts.length,hash:proof.hash,action:proof.action,confirmedAt:proof.confirmedAt,performanceMs:performance.now()};
   state.receipts.push(row);state.activeReceipt=row.sequence;
   queueMicrotask(()=>{if(state.activeReceipt===row.sequence)state.activeReceipt=null;});
  });
 });
}

export async function observeJourneyAudio(page){
 await page.evaluate(()=>{
  const audio=window.__thAudio,state=window.__journeyAudio;
  if(!audio||!state||state.installed)throw Error('Audio probe installation mismatch');
  state.installed=true;
  const original={play:audio.play,perform:audio.perform,record:audio.record,start:audio.start},pending=new Map();let active=null;
  const requestFor=id=>{
   if(active?.id===id)return active.sequence;
   const candidates=[...pending.values()].filter(r=>r.id===id);
   return candidates.length===1?candidates[0].sequence:null;
  };
  audio.play=function(id,options){
   const previous=active,row={sequence:state.requests.length,id,control:state.activeControl,receipt:id==='tx.confirmed'?state.activeReceipt:null,performanceMs:performance.now(),audioTime:this.ctx?.currentTime??null};
   state.requests.push(row);active=row;
   try{return original.play.apply(this,arguments);}finally{active=previous;}
  };
  audio.perform=function(id,options){
   const request=active?.id===id?active:null;
   if(request)pending.set(request.sequence,request);
   try{
    const result=original.perform.apply(this,arguments);
    return Promise.resolve(result).finally(()=>{if(request)pending.delete(request.sequence);});
   }catch(error){if(request)pending.delete(request.sequence);throw error;}
  };
  audio.record=function(id,result,layers){
   state.results.push({id,result,request:requestFor(id),performanceMs:performance.now(),audioTime:this.ctx?.currentTime??null});
   return original.record.apply(this,arguments);
  };
  audio.start=function(id,buffer,sample,priority,rate,volume,delay,eq,group){
   const request=requestFor(id),create=this.ctx.createBufferSource;
   this.ctx.createBufferSource=function(){
    const source=create.call(this),start=source.start;
    source.start=function(when=0,offset=0,duration){
     const record={id,bus:sample.bus,request,group,variantId:sample.variantId,pack:sample.pack,when,offset,duration:duration??sample.duration,rate:this.playbackRate.value,loop:this.loop,callPerformanceMs:performance.now(),outputTimestamp:this.context.getOutputTimestamp()};
     const result=start.apply(this,arguments);state.starts.push(record);return result;
    };return source;
   };
   try{return original.start.apply(this,arguments);}finally{this.ctx.createBufferSource=create;}
  };
 });
}

export function evaluateJourneyAudio(data){
 const forRequest=sequence=>data.starts.filter(s=>s.request===sequence&&!s.loop);
 const resultFor=sequence=>data.results.filter(r=>r.request===sequence).map(r=>r.result);
 const measured=request=>{
  const starts=forRequest(request.sequence),first=starts.slice().sort((a,b)=>a.when-b.when)[0],stamp=first?.outputTimestamp;
  const estimatedOnsetMs=stamp?.contextTime>0?stamp.performanceTime+(first.when-stamp.contextTime)*1000-request.performanceMs:null;
  const durationMs=first?(Math.max(...starts.map(s=>s.when+s.duration/s.rate))-first.when)*1000:null;
  return {request:request.sequence,id:request.id,starts:starts.length,groups:[...new Set(starts.map(s=>s.group))],results:resultFor(request.sequence),estimatedOnsetMs,durationMs,played:starts.length>0};
 };
 const controls=data.controls.filter(c=>c.kind==='click'&&!c.disabled).map(control=>{
  const requests=data.requests.filter(r=>r.control===control.sequence&&r.id.startsWith('ui.')).map(measured);
  return {label:control.label,sequence:control.sequence,requests,pass:requests.length>0&&requests.some(r=>r.played&&r.durationMs<=300+1e-6)};
 });
 const receipts=data.receipts.map(receipt=>{
  const requests=data.requests.filter(r=>r.receipt===receipt.sequence).map(measured);
  return {hash:receipt.hash,action:receipt.action,requests,pass:requests.length===1&&requests[0].played};
 });
 const starts=data.starts.slice().sort((a,b)=>a.when-b.when);let left=0,maxStartsPer100ms=0;
 for(let right=0;right<starts.length;right++){
  while(starts[right].when-starts[left].when>=.1-1e-9)left++;
  maxStartsPer100ms=Math.max(maxStartsPer100ms,right-left+1);
 }
 return {controls,receipts,maxStartsPer100ms,sourceBudgetPass:maxStartsPer100ms<=6,primaryControlsPass:controls.length===10&&controls.every(r=>r.pass),everyReceiptChimePass:receipts.length===18&&receipts.every(r=>r.pass),unattributedTransientStarts:starts.filter(s=>!s.loop&&s.request===null).length,physicalOnsetVerified:false,overallAudioGatePass:false};
}
