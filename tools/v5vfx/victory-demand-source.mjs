/** Study-only source transforms; application files remain untouched. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
export const victoryModule='apps/web/src/game/cardrpg/battle-v3/VictoryCrew.tsx';
export const hash=value=>createHash('sha256').update(value).digest('hex');
function once(source,pattern,replacement){
 const matches=[...source.matchAll(new RegExp(pattern.source,'g'))];assert.equal(matches.length,1,'Expected one source marker: '+pattern);
 return source.replace(pattern,replacement);
}
export function demandSource(source){
 let s=once(source,/const media\s*=\s*window\.matchMedia\([^;]+;/,'$&\n  const requestDraw=()=>{if(!disposed&&!raf)raf=requestAnimationFrame(draw);};');
 s=once(s,/const draw\s*=\s*\(now(?::\s*number)?\)\s*=>\s*\{/,'$& raf=0;');
 s=once(s,/renderer\.render\(scene,\s*camera\);\s*raf\s*=\s*requestAnimationFrame\(draw\);/,'renderer.render(scene,camera);if(!calm)requestDraw();');
 s=once(s,/element\.dataset\.drawn\s*=\s*String\(drawings\.size\);/,'$&requestDraw();');
 s=once(s,/raf\s*=\s*requestAnimationFrame\(draw\);\s*return\s*\(\)\s*=>\s*\{/,
  'const resizeObserver=new ResizeObserver(requestDraw);resizeObserver.observe(element);\n  media.addEventListener("change",requestDraw);renderer.domElement.addEventListener("webglcontextrestored",requestDraw);\n  requestDraw();return()=>{');
 s=once(s,/disposed\s*=\s*true;\s*cancelAnimationFrame\(raf\);/,
  'disposed=true;resizeObserver.disconnect();media.removeEventListener("change",requestDraw);renderer.domElement.removeEventListener("webglcontextrestored",requestDraw);cancelAnimationFrame(raf);');
 return s;
}
export function auditSource(source){
 let s=once(source,/const draw\s*=\s*\(now(?::\s*number)?\)\s*=>\s*\{/,
  'const audit={draws:0,cpuMs:0,disposed:false,renderer,actors,drawings,element,lastNow:0};globalThis.__cxvVictory=audit;(globalThis.__cxvVictoryHistory??=[]).push(audit);\n  $& const cpuStart=performance.now();');
 s=once(s,/renderer\.render\(scene,\s*camera\);/,'$&audit.draws++;audit.lastNow=now;audit.cpuMs+=performance.now()-cpuStart;');
 s=once(s,/cats\.forEach\(/,'audit.renderAt=(now)=>{cancelAnimationFrame(raf);raf=0;start=1000;draw(now);cancelAnimationFrame(raf);raf=0;};\n  $&');
 s=once(s,/\.then\(async\s*\(actor\)\s*=>\s*\{/,'$&if(globalThis.__cxvVictoryLoadDelay)await new Promise(resolve=>setTimeout(resolve,globalThis.__cxvVictoryLoadDelay*i));');
 s=once(s,/disposed\s*=\s*true;/,'$&audit.disposed=true;');
 return s;
}
export async function sources(root){
 const original=await readFile(resolve(root,victoryModule),'utf8'),candidate=demandSource(original);
 return {original,candidate,originalSha256:hash(original),candidateSha256:hash(candidate)};
}
export async function installVictoryDemandOverride(page,{mode='baseline'}={}){
 assert(['baseline','demand','native'].includes(mode));const evidence={mode,modules:[]};
 await page.route('**/VictoryCrew.tsx*',async route=>{
  const response=await route.fetch(),original=await response.text();let body=mode==='demand'?demandSource(original):original;body=auditSource(body);
  evidence.modules.push({url:route.request().url(),sourceSha256:hash(original),overrideSha256:hash(body)});
  await route.fulfill({response,body,contentType:'text/javascript'});
 });return evidence;
}
