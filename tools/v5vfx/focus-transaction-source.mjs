/** Isolated current/pending/title measurement transaction; never changes application files. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {require} from './build-hud-production.mjs';
import {hash} from './victory-demand-source.mjs';
export const focusPath='apps/web/src/game/cardrpg/battle-v3/identified-focus.ts';
export const statusPath='apps/web/src/game/cardrpg/battle-v3/world-label-status.ts';
const replaceOnce=(source,from,to)=>{assert.equal(source.split(from).length,2,'Expected one '+from);return source.replace(from,to);};
export function transactStatus(source){
 source=replaceOnce(source,'export function pendingLabelExtents(nodes:readonly HTMLElement[]):Map<HTMLElement,LabelRect|null> {',
 'export function withPendingLabelExtents<T>(nodes:readonly HTMLElement[],measure:(extents:Map<HTMLElement,LabelRect|null>)=>T):T {');
 source=replaceOnce(source,'  return extents;','  return measure(extents);');
 const marker='/** Size one pending label with the same CSS, including overflowing stack counters. */';
 return replaceOnce(source,marker,'/** Keep the standalone measurement API and its cleanup behavior. */\nexport function pendingLabelExtents(nodes:readonly HTMLElement[]):Map<HTMLElement,LabelRect|null> {\n return withPendingLabelExtents(nodes,extents=>extents);\n}\n\n'+marker);
}
export function transactFocus(source){
 source=replaceOnce(source,"import {pendingLabelExtents} from './world-label-status';","import {withPendingLabelExtents} from './world-label-status';");
 const width="   this.title.style.width=Math.min(260,innerWidth-16)+'px';\n";
 source=replaceOnce(source,width,'');
 const anchors='   const anchors=owner.anchors.filter(a=>a.visible),caster=anchors.find(a=>a.id===owner.id)?.body;\n';
 source=replaceOnce(source,anchors,'');
 source=replaceOnce(source,'  if(this.dirty){\n','  if(this.dirty){\n'+width+anchors+
 "   const originalNodes=[...document.querySelectorAll<HTMLElement>('.b3-world')].filter(node=>anchors.some(a=>a.id===node.dataset.actor)&&visible(node));\n"+
 '   withPendingLabelExtents(originalNodes,pendingExtents=>{\n');
 source=replaceOnce(source,"   for(const node of document.querySelectorAll<HTMLElement>('.b3-world')){",'   for(const node of originalNodes){');
 source=replaceOnce(source,'   // Read before temporary pending labels invalidate layout on removal.\n', '   // All current and pending geometry shares the temporary clone lifetime.\n');
 source=replaceOnce(source,'   const pendingExtents=pendingLabelExtents(pendingNodes.map(item=>item.node));\n','');
 source=replaceOnce(source,'   this.dirty=false;','   });\n   this.dirty=false;');
 return source;
}
export async function transactionSources(root){
 const files={};for(const [path,transform]of [[focusPath,transactFocus],[statusPath,transactStatus]]){
  const baseline=await readFile(resolve(root,path),'utf8'),candidate=transform(baseline);
  files[path]={baseline,candidate,baselineSha256:hash(baseline),candidateSha256:hash(candidate)};
 }return files;
}
function compileForVite(source,served){
 const ts=require('typescript');let output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
 return output.replace(/from ["'](\.\/[^"']+)["']/g,(_,path)=>{
  const name=path.slice(2),urls=[...served.matchAll(/from ["']([^"']+)["']/g)].map(m=>m[1]);
  const url=urls.find(u=>u.split('?')[0].endsWith('/'+name+'.ts'));assert(url,'Missing served import '+path);return 'from '+JSON.stringify(url);
 });
}
export async function installFocusTransaction(page,{candidate=false,audit=false,sources}={}){
 const evidence={candidate,audit,modules:{}};
 for(const [path,key]of [[focusPath,'focus'],[statusPath,'status']])await page.route('**/'+path.split('/').at(-1)+'*',async route=>{
  const response=await route.fetch(),served=await response.text();let body=candidate?compileForVite(sources[path].candidate,served):served;
  if(key==='focus'&&audit){
   const imported=candidate?'withPendingLabelExtents':'pendingLabelExtents';
   body=body.replace(new RegExp('import \\{ '+imported+' \\} from'), 'import { '+imported+', bindWorldStatusSource } from');
   const marker='this.placement = layoutFocusBanner(';assert(body.includes(marker));
   body=body.replace(marker,'globalThis.__cxvStatusSourceBinder=bindWorldStatusSource;\n'+(candidate?'globalThis.__cxvWithPending=withPendingLabelExtents;\n':'')+'globalThis.__cxvFullFocusInputs?.push({labels,pendingLabels,placed,pendingPlaced,faces,worldHud,hud,title,parentOffset:this.parentOffset});\n'+marker);
  }
  evidence.modules[key]={url:route.request().url(),servedSha256:hash(served),overrideSha256:hash(body),applicationSha256:sources[path].baselineSha256,candidateSha256:candidate?sources[path].candidateSha256:null};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });return evidence;
}
