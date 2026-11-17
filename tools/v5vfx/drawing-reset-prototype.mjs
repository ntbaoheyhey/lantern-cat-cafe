/** Instance-only experiment; direct setup-pose APIs retain their behavior. */
export async function installDrawingResetPrototype(page,{active=false}={}){
 return page.evaluate(active=>{
  const s=window.__depthScene;cancelAnimationFrame(s.raf);const variants=[];
  const probe={active,variants,refresh,restore(){for(const v of variants){v.actor.sample=v.actorSample;v.d.sample=v.drawingSample;}delete window.__cxvDrawingReset;}};
  function refresh(){for(const [id,e]of s.actors){
   const actor=e.actor,d=e.craftPose?.drawing;if(!d||!actor.mesh)continue;
   if(variants.some(v=>v.actor===actor))continue;
   const v={id,unit:e.asset,actor,d,actorSample:actor.sample,drawingSample:d.sample,inActor:0,drawingCalls:0,setupCalls:0,skipped:0};variants.push(v);
   actor.sample=function(...args){v.inActor++;const beforeSkipped=v.skipped;try{return v.actorSample.apply(this,args);}catch(error){if(probe.active&&v.skipped>beforeSkipped)v.drawingSample.call(d,'idle',0,false);throw error;}finally{v.inActor--;}};
   d.sample=function(...args){v.drawingCalls++;if(v.inActor&&args.length===3&&args[0]==='idle'&&args[1]===0&&args[2]===false){v.setupCalls++;if(probe.active){v.skipped++;return;}}return v.drawingSample.apply(this,args);};
  }}refresh();
  window.__cxvDrawingReset=probe;return variants.map(({id,unit})=>({id,unit}));
 },active);
}
