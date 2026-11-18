/** Isolated context-loss candidate; application source is not mutated. */
import assert from 'node:assert/strict';
import {auditSource,hash} from './victory-demand-source.mjs';
function once(source,pattern,replacement){assert.equal([...source.matchAll(new RegExp(pattern.source,'g'))].length,1,String(pattern));return source.replace(pattern,replacement);}
export function victoryContextSource(source,{enabled='true',typescript=true}={}){
 const active=enabled==='true'?'':`(${enabled})&&`;
 let s=once(source,/const media\s*=\s*window\.matchMedia\(/,'let contextLost=false,restoring=false;\n  $&');
 s=once(s,/if\s*\(!disposed\s*&&\s*!raf\)/,`if(!disposed&&!raf&&!(${active}contextLost))`);
 s=once(s,/if\s*\(disposed\)\s*return;\s*if\s*\(!start\)/,`if(disposed||(${active}contextLost))return;if(!start)`);
 s=once(s,/renderer\.render\(scene,\s*camera\);/,`$&if(${active}restoring&&!renderer.getContext().isContextLost()){restoring=false;renderer.domElement.style.visibility='';element.dataset.ready=String(actors.size===cats.length);}`);
 s=once(s,/element\.dataset\.ready\s*=\s*String\(actors\.size\s*===\s*cats\.length\);(?=\s*element\.dataset\.drawn)/,
  `element.dataset.ready=String(!(${active}(contextLost||restoring))&&actors.size===cats.length);`);
 s=once(s,/const resizeObserver\s*=\s*new ResizeObserver\(requestDraw\);/,`const contextLostHandler=(event${typescript?':Event':''})=>{
   if(disposed)return;
   if(${enabled}){event.preventDefault();contextLost=true;restoring=false;element.dataset.ready='false';renderer.domElement.style.visibility='hidden';cancelAnimationFrame(raf);raf=0;}
  };
  const contextRestored=()=>{if(disposed)return;if(${enabled}){contextLost=false;restoring=true;}requestDraw();};
  renderer.domElement.addEventListener('webglcontextlost',contextLostHandler);
  $&`);
 s=once(s,/renderer\.domElement\.addEventListener\("webglcontextrestored",\s*requestDraw\)/,'renderer.domElement.addEventListener("webglcontextrestored",contextRestored)');
 s=once(s,/renderer\.domElement\.removeEventListener\("webglcontextrestored",\s*requestDraw\);/,
  'renderer.domElement.removeEventListener("webglcontextrestored",contextRestored);renderer.domElement.removeEventListener("webglcontextlost",contextLostHandler);');
 return s;
}
export async function installVictoryContextPrototype(page){
 const evidence={modules:[]};
 await page.route('**/VictoryCrew.tsx*',async route=>{
  const response=await route.fetch(),original=await response.text();
  let body=auditSource(victoryContextSource(original,{enabled:'globalThis.__cxvContextEnabled',typescript:false}));
  body=once(body,/const resizeObserver\s*=\s*new ResizeObserver\(/,'audit.requestDraw=requestDraw;audit.contextLostHandler=contextLostHandler;audit.contextRestored=contextRestored;\n  $&');
  evidence.modules.push({url:route.request().url(),originalSha256:hash(original),overrideSha256:hash(body)});
  await route.fulfill({response,body,contentType:'text/javascript'});
 });return evidence;
}
