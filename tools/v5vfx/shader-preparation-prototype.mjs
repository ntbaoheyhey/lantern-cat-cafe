/** Actual renderer preparation in the harness; application responses stay unchanged. */
export async function prepareShaderPrograms(page,{active}){
 return page.evaluate(async active=>{
  const s=window.__depthScene,m=window.__depthReview,gl=s.renderer.getContext(),calls=[],restore=[];
  if(!s.renderer.debug.checkShaderErrors)throw Error('Shader diagnostics must remain enabled');
  const state=()=>JSON.stringify({battle:m.battle,plan:m.plan,age:m.animationAt,paused:m.paused,ready:s.ready});
  const before=state(),programsBefore=s.renderer.info.programs.length,parallelSupported=gl.getSupportedExtensions().includes('KHR_parallel_shader_compile');
  let phase='preparation';
  for(const name of ['compileShader','linkProgram','getProgramInfoLog','getShaderInfoLog','getProgramParameter']){const original=gl[name];gl[name]=function(...args){const start=performance.now();let value;try{value=original.apply(this,args);return value;}finally{calls.push({phase,name,elapsedMs:performance.now()-start,skill:m.plan?.skillId??null,age:m.animationAt,parameter:typeof args[1]==='number'?args[1]:null,result:typeof value==='boolean'?value:typeof value==='string'?{length:value.length}:null});}};restore.push(()=>gl[name]=original);}
  const start=performance.now();let callMs=0;
  if(active){const pending=s.renderer.compileAsync(s.scene,s.camera);callMs=performance.now()-start;await pending;}
  const elapsedMs=performance.now()-start,stateExact=state()===before,programsAfter=s.renderer.info.programs.length;
  globalThis.__cxvShaderStudy={calls,finish:()=>{for(const fn of restore)fn();return{programsAfter:s.renderer.info.programs.length,checksEnabled:s.renderer.debug.checkShaderErrors,calls};}};
  phase='play';if(!stateExact)throw Error('Preparation changed game state');
  return{active,callMs,elapsedMs,stateExact,programsBefore,programsAfter,parallelSupported,checksEnabled:s.renderer.debug.checkShaderErrors};
 },active);
}
export async function finishShaderPrograms(page){return page.evaluate(()=>globalThis.__cxvShaderStudy.finish());}
