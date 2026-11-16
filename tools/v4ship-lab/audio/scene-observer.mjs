/** Observe original scene selection, decoded requests and source lifetimes; never change audio. */
export async function observeSceneAudio(page){
 await page.evaluate(()=>{
  const audio=window.__thAudio,journey=window.__journeyAudio;
  if(!audio||!journey?.installed)throw Error('Journey audio must be observed first');
  const state=window.__sceneAudioObservation={samples:[],requests:[],sceneCalls:[]};
  for(const name of ['music','ambience']){
   const method=audio[name];
   audio[name]=function(id){state.sceneCalls.push({method:name,id,at:performance.now()});return method.apply(this,arguments);};
  }
  const play=audio.play,start=audio.start;
  audio.play=function(id){
   state.requests.push({request:journey.requests.length,id,at:performance.now(),decoded:[...this.decoded.keys()],pending:[...this.buffers.keys()]});
   return play.apply(this,arguments);
  };
  audio.start=function(){
   const index=journey.starts.length,playing=start.apply(this,arguments);
   for(const row of journey.starts.slice(index)){
    row.ducking=playing.ducking;
    playing.source.addEventListener('ended',()=>{row.endedAudioTime=this.ctx.currentTime;});
   }
   return playing;
  };
  window.__sceneAudioTimer=setInterval(()=>{
   state.samples.push({at:performance.now(),audioTime:audio.ctx?.currentTime??null,context:audio.ctx?.state??null,duck:audio.duck?.gain.value??null,
    phase:document.querySelector('[data-journey-phase]')?.getAttribute('data-journey-phase')??null,
    battleVisible:document.querySelector('.dp-battle')?.checkVisibility()??false,loading:!!document.querySelector('.dp-battle .dp-loading'),
    desired:{...audio.bedIds},active:[...audio.active].filter(p=>['music','ambience'].includes(p.bus)).map(p=>({id:p.id,bus:p.bus,gain:p.gain.gain.value}))});
  },25);
 });
}

export function evaluateSceneAudio(data){
 const state=data.scene,rows=[];
 // Both local judge encounters are the Yarn Giant boss. Do not infer success from a requested bed alone.
 for(const phase of ['intro-battle','finale-battle']){
  const samples=state.samples.filter(s=>s.phase===phase&&s.battleVisible&&!s.loading),first=samples[0]?.at;
  // The unchanged engine crossfades for 800ms; preserve every sample and evaluate the settled bed after 1s.
  const settled=samples.filter(s=>s.at-first>=1000);
  const wanted=settled.filter(s=>s.desired.music==='music.boss'&&s.desired.ambience==='ambience.boss');
  const sounding=settled.filter(s=>s.active.some(p=>p.id==='music.boss'&&p.gain>0)&&s.active.some(p=>p.id==='ambience.boss'&&p.gain>0));
  const homeLeak=settled.filter(s=>s.active.some(p=>p.id==='music.home'&&p.gain>0));
  rows.push({phase,samples:samples.length,settledSamples:settled.length,correctDesired:wanted.length,correctActive:sounding.length,homeLeak:homeLeak.length,
   pass:settled.length>=100&&wanted.length===settled.length&&sounding.length===settled.length&&homeLeak.length===0});
 }
 const firstContacts=data.impact.scenes.map(scene=>{
  const plan=data.impact.plans.find(p=>p.scene===scene.sequence&&p.expectsAction),event=data.impact.events.find(e=>e.plan===plan?.sequence&&e.role==='impact');
  const requests=event?.requests??[],starts=data.starts.filter(s=>requests.includes(s.request)),observed=state.requests.filter(r=>requests.includes(r.request));
  return {scene:scene.sequence,plan:plan?.sequence,requests,packs:[...new Set(starts.map(s=>s.pack))],decodedAtRequest:observed.map(r=>r.decoded),
   predecoded:starts.length>0&&observed.length===1&&starts.every(s=>observed[0].decoded.includes(s.pack))};
 });
 const voice=data.starts.filter(s=>s.bus==='voice'),duckers=data.starts.filter(s=>s.ducking),held=state.samples.filter(s=>voice.some(v=>s.audioTime>=v.when+.1&&s.audioTime<(v.endedAudioTime??v.when+v.duration/v.rate)));
 const heldDb=held.map(s=>20*Math.log10(s.duck));
 const recovery=state.samples.filter(s=>{
  if(!s.audioTime||duckers.some(v=>s.audioTime>=v.when&&s.audioTime<(v.endedAudioTime??v.when+v.duration/v.rate)))return false;
  const ends=duckers.map(v=>v.endedAudioTime??v.when+v.duration/v.rate).filter(t=>t<=s.audioTime);
  return ends.length>0&&s.audioTime-Math.max(...ends)>=.45;
 });
 return {sceneCalls:state.sceneCalls,battles:rows,correctBattleBeds:rows.every(r=>r.pass),firstContacts,
  firstContactsPredecoded:firstContacts.length===2&&firstContacts.every(r=>r.predecoded),
  duck:{samples:heldDb.length,minDb:heldDb.length?Math.min(...heldDb):null,maxDb:heldDb.length?Math.max(...heldDb):null,
   depthPass:heldDb.length>0&&heldDb.every(v=>v>=-8.0001&&v<=-3.9999),recoverySamples:recovery.length,recoveryPass:recovery.length>0&&recovery.every(s=>s.duck>=.995)},
  voiceInterruptions:voice.filter(v=>(v.endedAudioTime??v.when+v.duration/v.rate)<v.when+v.duration/v.rate-.05).length,
  physicalOnsetVerified:false,humanListeningVerified:false,overallAudioGatePass:false};
}
