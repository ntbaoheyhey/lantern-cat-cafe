/** Browser-only density synchronization; source remains unchanged. */
export async function installDesktopDensityPrototype(page){
 return page.evaluate(()=>{
  const s=window.__depthScene,render=s.render,loop=s.loop,setRatio=s.renderer.setPixelRatio.bind(s.renderer),resizes=[];
  s.renderer.setPixelRatio=function(ratio){resizes.push({ratio,disposed:s.disposed});return setRatio(ratio);};
  s.render=function(view,delta=0){
   const ratio=Math.min(devicePixelRatio||1,2);
   if(this.renderer.getPixelRatio()!==ratio){this.renderer.setPixelRatio(ratio);this.postFx.resize(this.width,this.height);}
   return render.call(this,view,delta);
  };
  s.loop=function(now){if(!s.disposed&&s.renderer.getPixelRatio()!==Math.min(devicePixelRatio||1,2))s.dirty=true;return loop(now);};
  globalThis.__cxvDensityPrototype={resizes,render,loop};
  return{installed:true,initialRatio:s.renderer.getPixelRatio()};
 });
}
