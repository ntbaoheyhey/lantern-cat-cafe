/** Preserve one synchronous focus layout while reusing its measured rectangles. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {hash} from './victory-demand-source.mjs';
export const focusPath='apps/web/src/game/cardrpg/battle-v3/identified-focus.ts';
export function reuseFocusReads(source,{browser=false}={}){
 const hud=browser?'const hud = hudNodes.map((n) => rect(n.getBoundingClientRect())).filter((r) => r.width && r.height);':'const hud=hudNodes.map(n=>rect(n.getBoundingClientRect())).filter(r=>r.width&&r.height);';
 const world=browser?'const worldHud = hudNodes.filter((n) => !n.classList.contains("b3-party")).map((n) => rect(n.getBoundingClientRect())).filter((r) => r.width && r.height);':"const worldHud=hudNodes.filter(n=>!n.classList.contains('b3-party')).map(n=>rect(n.getBoundingClientRect())).filter(r=>r.width&&r.height);";
 const title=browser?'const title = rect(this.title.getBoundingClientRect());':'const title=rect(this.title.getBoundingClientRect());';
 const pending=browser?'const pendingExtents = pendingLabelExtents':'const pendingExtents=pendingLabelExtents';
 for(const marker of [hud,world,title,pending])assert.equal(source.split(marker).length,2,'Expected exactly one '+marker);
 let result=source.replace(hud,'const hudRects=hudNodes.map(node=>({node,box:rect(node.getBoundingClientRect())}));\n   const hud=hudRects.map(row=>row.box).filter(r=>r.width&&r.height);');
 result=result.replace(world,"const worldHud=hudRects.filter(row=>!row.node.classList.contains('b3-party')).map(row=>row.box).filter(r=>r.width&&r.height);");
 result=result.replace(title,'').replace(pending,'// Read before temporary pending labels invalidate layout on removal.\n   '+title+'\n   '+pending);
 return result.replace(/\n[ \t]+\n/g,'\n\n');
}
export async function focusReadSources(root){
 const baseline=await readFile(resolve(root,focusPath),'utf8'),candidate=reuseFocusReads(baseline);
 return{baseline,candidate,baselineSha256:hash(baseline),candidateSha256:hash(candidate)};
}
export async function installFocusReadOverride(page,{candidate=false,audit=false,native=false}={}){
 const evidence={candidate,audit,native,modules:{}};
 await page.route('**/identified-focus.ts*',async route=>{
  const response=await route.fetch(),source=await response.text();let body=candidate&&!native?reuseFocusReads(source,{browser:true}):source;
  if(native)assert(source.includes('const hudRects ='),'Native same-paint reads missing');
  if(audit){
   const statusImport=body.match(/import \{ pendingLabelExtents \} from ("[^"\n]+world-label-status\.ts[^"\n]*");/);assert(statusImport);
   body=body.replace(statusImport[0],`import {pendingLabelExtents,bindWorldStatusSource} from ${statusImport[1]};`);
   const marker='this.placement = layoutFocusBanner(';assert(body.includes(marker));
   body=body.replace(marker,'globalThis.__cxvStatusSourceBinder=bindWorldStatusSource;\nglobalThis.__cxvFullFocusInputs?.push({labels,pendingLabels,placed,pendingPlaced,faces,worldHud,hud,title,parentOffset:this.parentOffset});\n'+marker);
  }
  evidence.modules.focus={url:route.request().url(),sourceSha256:hash(source),overrideSha256:hash(body)};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 return evidence;
}
