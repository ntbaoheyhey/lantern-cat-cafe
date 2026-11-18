/** Isolated density prototype and inspectable source candidate; no application mutation. */
import assert from 'node:assert/strict';
import {auditSource,hash} from './victory-demand-source.mjs';
function once(source,pattern,replacement){assert.equal([...source.matchAll(new RegExp(pattern.source,'g'))].length,1,String(pattern));return source.replace(pattern,replacement);}
export function victoryDensitySource(source,{enabled='true'}={}){
 const guard=enabled==='true'?'':`(${enabled})&&`;
 let s=once(source,/const draw\s*=\s*\(now(?::\s*number)?\)\s*=>\s*\{/,
  `let densityMedia=window.matchMedia('(resolution: '+(devicePixelRatio||1)+'dppx)');
  const densityChanged=()=>{
   if(disposed)return;
   densityMedia.removeEventListener('change',densityChanged);
   densityMedia=window.matchMedia('(resolution: '+(devicePixelRatio||1)+'dppx)');
   densityMedia.addEventListener('change',densityChanged);
   if(${guard}renderer.getPixelRatio()!==Math.min(devicePixelRatio||1,1.5))requestDraw();
  };
  densityMedia.addEventListener('change',densityChanged);
  $&`);
 s=once(s,/const w\s*=\s*Math\.max\(1,\s*element\.clientWidth\)/,
  `const density=Math.min(devicePixelRatio||1,1.5);
   if(${guard}renderer.getPixelRatio()!==density)renderer.setPixelRatio(density);
   $&`);
 s=once(s,/disposed\s*=\s*true;/,"$&densityMedia.removeEventListener('change',densityChanged);");
 return s;
}
export async function installVictoryDensityPrototype(page){
 const evidence={modules:[]};
 await page.route('**/VictoryCrew.tsx*',async route=>{
  const response=await route.fetch(),original=await response.text();
  let body=auditSource(victoryDensitySource(original,{enabled:'globalThis.__cxvEnableDensity!==false'}));
  body=once(body,/cats\.forEach\(/,`audit.requestDraw=requestDraw;audit.notifyDensity=densityChanged;audit.resolutionQuery=()=>densityMedia;
   audit.ratioSets=[];const nativeRatio=renderer.setPixelRatio.bind(renderer);renderer.setPixelRatio=(ratio)=>{audit.ratioSets.push(ratio);nativeRatio(ratio);};
   $&`);
  evidence.modules.push({url:route.request().url(),originalSha256:hash(original),overrideSha256:hash(body)});
  await route.fulfill({response,body,contentType:'text/javascript'});
 });return evidence;
}
