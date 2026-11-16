/** Pair actual scene submissions with battle cue requests, without changing playback. */
export async function prepareImpactObservation(page){
 await page.addInitScript(()=>{
  const state=window.__impactObservation={scenes:[],plans:[],events:[],submissions:[],errors:[]};
  const attached=new WeakSet(),planIds=new Map();let active=null;
  function planFor(sceneId,view){
   const plan=view?.frame?.plan;if(!plan)return null;
   if(!planIds.has(sceneId))planIds.set(sceneId,new WeakMap());
   const ids=planIds.get(sceneId);
   if(!ids.has(plan)){
    const actor=view.actors?.find(a=>a.id===plan.actorId);
    const row={sequence:state.plans.length,scene:sceneId,planId:plan.id,actorId:plan.actorId,skillId:plan.skillId,presentationId:plan.presentationId??null,
     owner:view.models?.[plan.actorId]??actor?.cardRpg?.cardId??plan.actorId,side:actor?.side??null,
     fixedTiming:plan.fixedTiming===true,ultimate:!!plan.ultimate,impactMs:plan.beats[2]?.start??null,
     expectsAction:plan.events.some(e=>e.type==='action_start'||e.type==='charge'),
     firstElapsedMs:view.frame.elapsed,maxElapsedMs:view.frame.elapsed,observedBeforeImpact:view.frame.elapsed<(plan.beats[2]?.start??0),
     gallery:!!view.galleryPreview,frames:0,contact:null};
    ids.set(plan,row.sequence);state.plans.push(row);
   }
   const row=state.plans[ids.get(plan)];row.maxElapsedMs=Math.max(row.maxElapsedMs,view.frame.elapsed);return row;
  }
  function attach(scene){
   if(!scene||attached.has(scene))return;
   if(!scene.audio?.send||!scene.render||!scene.renderer?.render){state.errors.push('Unsupported scene observer interface');return;}
   attached.add(scene);
   const sceneId=state.scenes.length;
   state.scenes.push({sequence:sceneId,at:performance.now(),ready:scene.ready,initialElapsedMs:scene.currentView?.frame?.elapsed??null});
   planFor(sceneId,scene.currentView);
   const draw=scene.render,render=scene.renderer.render,send=scene.audio.send;
   scene.render=function(view,...rest){
    const previous=active,row=planFor(sceneId,view);
    active={scene:sceneId,view,plan:row};if(row)row.frames++;
    try{return draw.call(this,view,...rest);}finally{active=previous;}
   };
   scene.renderer.render=function(object,camera,...rest){
    const frame=active?.scene===sceneId?active:null,plan=frame?.plan;
    const eligible=object===scene.scene&&camera===scene.camera&&plan&&frame.view.frame.elapsed>=plan.impactMs&&plan.contact===null&&!frame.view.paused;
    const at=eligible?performance.now():null;
    const result=render.call(this,object,camera,...rest);
    if(eligible){
     const canvas=this.domElement,box=canvas.getBoundingClientRect();
     const row={sequence:state.submissions.length,scene:sceneId,plan:plan.sequence,elapsedMs:frame.view.frame.elapsed,performanceMs:at,returnMs:performance.now(),
      canvasVisible:canvas.checkVisibility()&&box.width>0&&box.height>0,sceneReady:scene.ready===true,
      documentVisible:!document.hidden,loadingOverlay:!!document.querySelector('.dp-battle .dp-loading')};
     plan.contact=row.sequence;state.submissions.push(row);
    }
    return result;
   };
   scene.audio.send=function(event,...rest){
    const current=active?.scene===sceneId?active.plan:null;
    const candidates=state.plans.filter(p=>p.scene===sceneId&&p.planId===event.planId&&p.actorId===event.actorId);
    const plan=current?.planId===event.planId&&current.actorId===event.actorId?current:candidates.length===1?candidates[0]:null;
    const audio=window.__journeyAudio,start=audio?.requests.length??0;
    const row={sequence:state.events.length,scene:sceneId,plan:plan?.sequence??null,...event,performanceMs:performance.now(),requests:[]};
    state.events.push(row);
    try{return send.call(this,event,...rest);}
    finally{row.requests=(audio?.requests.slice(start)??[]).filter(r=>r.id===event.cue).map(r=>r.sequence);}
   };
  }
  // React deletes the public scene reference between battles. A configurable
  // accessor observes normal assignment; re-arm after deletion without blocking it.
  let getter;
  function arm(){
   const descriptor=Object.getOwnPropertyDescriptor(window,'__depthScene');
   if(getter&&descriptor?.get===getter)return;
   let current=window.__depthScene;
   getter=()=>current;
   Object.defineProperty(window,'__depthScene',{configurable:true,enumerable:true,get:getter,set(value){current=value;try{attach(value);}catch(error){state.errors.push(String(error.message).slice(0,200));}}});
   try{attach(current);}catch(error){state.errors.push(String(error.message).slice(0,200));}
  }
  arm();window.__impactObserverTimer=setInterval(arm,50);
 });
}

export function evaluateImpactObservation(state,audio){
 const expected=state.plans.filter(p=>p.expectsAction&&!p.gallery),usedRequests=new Set();
 const rows=expected.map(plan=>{
  const contact=state.submissions.find(s=>s.plan===plan.sequence);
  const events=state.events.filter(e=>e.plan===plan.sequence&&e.role==='impact'&&e.requests.length);
  const requests=events.flatMap(e=>e.requests),unique=[...new Set(requests)];
  const reused=unique.some(id=>usedRequests.has(id));unique.forEach(id=>usedRequests.add(id));
  const starts=audio.starts.filter(s=>unique.includes(s.request)&&!s.loop);
  const first=starts.slice().sort((a,b)=>a.when-b.when)[0],timestamp=first?.outputTimestamp;
  const estimate=first&&contact&&timestamp?.contextTime>0?timestamp.performanceTime+(first.when-timestamp.contextTime)*1000-contact.performanceMs:null;
  const missing=unique.filter(id=>!starts.some(s=>s.request===id));
  const checks={observedBeforeImpact:plan.observedBeforeImpact,fixedTiming:plan.fixedTiming,contactReached:plan.maxElapsedMs>=plan.impactMs,
   renderedContact:!!contact&&contact.sceneReady&&contact.canvasVisible&&contact.documentVisible&&!contact.loadingOverlay,
   oneImpactRequest:events.length===1&&unique.length===1&&requests.length===1,
   uniqueRequest:!reused,sourceActuallyStarted:starts.length>0&&!missing.length};
  return {plan:plan.sequence,scene:plan.scene,planId:plan.planId,owner:plan.owner,skillId:plan.skillId,ultimate:plan.ultimate,impactMs:plan.impactMs,
   renderedAt:contact?.performanceMs??null,requestIds:unique,cues:events.map(e=>e.cue),sourceStarts:starts.length,
   sourceCallAfterSubmissionMs:first&&contact?first.callPerformanceMs-contact.performanceMs:null,
   estimatedAudioAfterSubmissionMs:estimate,within33msEstimate:estimate===null?null:Math.abs(estimate)<=33,checks,pass:Object.values(checks).every(Boolean)};
 });
 const unattributed=state.events.filter(e=>e.role==='impact'&&e.requests.length&&e.plan===null);
 const failed=rows.filter(r=>!r.pass);
 return {scenes:state.scenes.length,expectedContacts:rows.length,observedContacts:rows.filter(r=>r.checks.renderedContact).length,
  causallyPlayedContacts:rows.filter(r=>r.pass).length,failedContacts:failed.length,unattributedImpactEvents:unattributed.length,
  owners:[...new Set(rows.map(r=>r.owner))].sort(),rows,errors:state.errors,
  observedImpactCoveragePass:rows.length>0&&!failed.length&&!unattributed.length&&!state.errors.length,
  allEstimatedWithin33ms:rows.length>0&&rows.every(r=>r.within33msEstimate===true),
  physicalAudiovisualOnsetVerified:false,completeWeaponCoveragePass:false,
  scope:'Observed fixed-timing contacts in these scenes only. Renderer submission and audio output timestamps are estimates, not measured photons or acoustic onset; unobserved units and skill modes remain open.'};
}
