/** Study-only Vite overrides. The cache mode is deliberately unsafe diagnostic evidence. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function installHudGeometryOverride(page,{mode='baseline',audit=true}={}){
 assert(['baseline','text','hidden','stable','cache-diagnostic'].includes(mode),'Unknown HUD experiment');
 const evidence={mode,audit,modules:{}};
 await page.addInitScript(()=>{globalThis.__cxvHudAudit=null;});
 const replace=(source,before,after)=>{assert(source.includes(before),'Missing experiment marker: '+before);return source.replace(before,after);};
 await page.route('**/BattleHud.tsx*',async route=>{
  const response=await route.fetch(),source=await response.text();let body=source;
  if(['text','stable'].includes(mode)){
   body=replace(body,'total.current.querySelector("b").textContent = String(state.amount);','const amount = total.current.querySelector("b"), text = String(state.amount); if (amount.textContent !== text) amount.textContent = text;');
  }
  if(['hidden','stable'].includes(mode)){
   body=replace(body,'if (skipButton.current) skipButton.current.hidden = !scene?.cinema?.audit.plate;','if (skipButton.current && skipButton.current.hidden !== !scene?.cinema?.audit.plate) skipButton.current.hidden = !scene?.cinema?.audit.plate;');
   body=replace(body,'total.current.hidden = now > state.until || !state.amount;','const hidden = now > state.until || !state.amount; if (total.current.hidden !== hidden) total.current.hidden = hidden;');
  }
  if(mode==='cache-diagnostic')body=replace(body,'document.querySelector(".dp-canvas")?.getBoundingClientRect()','(globalThis.__cxvUnsafeCanvasRect ??= document.querySelector(".dp-canvas")?.getBoundingClientRect())');
  if(audit){
   body=replace(body,'const paint = () => {','const paint = () => { const cxvStart = performance.now();');
   body=replace(body,'if (canvas && scene?.anchors) labelLayout.paint','const cxvRead = performance.now(); if (canvas && scene?.anchors) labelLayout.paint');
   body=replace(body,'document.body.classList.toggle("b3-cinema-occludes"','const cxvLabels = performance.now(); document.body.classList.toggle("b3-cinema-occludes"');
   body=replace(body,'raf = requestAnimationFrame(paint);','if (globalThis.__cxvHudAudit) globalThis.__cxvHudAudit.push([cxvRead-cxvStart,cxvLabels-cxvRead,performance.now()-cxvLabels]); raf = requestAnimationFrame(paint);');
  }
  evidence.modules.hud={url:route.request().url(),sourceSha256:hash(source),overrideSha256:hash(body)};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 if(['hidden','stable'].includes(mode))await page.route('**/world-label-dom.ts*',async route=>{
  const response=await route.fetch(),source=await response.text();
  const body=replace(source,'node.hidden = !anchor.visible;','if (node.hidden !== !anchor.visible) node.hidden = !anchor.visible;');
  evidence.modules.labels={url:route.request().url(),sourceSha256:hash(source),overrideSha256:hash(body)};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 return evidence;
}
