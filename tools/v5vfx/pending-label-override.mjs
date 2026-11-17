/** Browser-only Vite module experiment. Application files remain unchanged. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {measurePendingLabelBatch} from './pending-label-prototype.mjs';
const hash=text=>createHash('sha256').update(text).digest('hex');
export async function installPendingLabelOverride(page,{batch=false,audit=false}={}){
 const evidence={batch,audit,modules:{}};
 await page.route('**/world-label-status.ts*',async route=>{
  const response=await route.fetch(),source=await response.text();
  assert(source.includes('const sources = new WeakMap()'),'Actual status source binding missing');
  const body=source+'\n'+measurePendingLabelBatch.toString()+`\nexport function pendingLabelExtents(nodes){return measurePendingLabelBatch(nodes,node=>node.parentElement&&sources.get(node.parentElement)?.().find(row=>row.id===node.dataset.actor));}\n`;
  evidence.modules.status={url:route.request().url(),sourceSha256:hash(source),overrideSha256:hash(body)};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 await page.route('**/identified-focus.ts*',async route=>{
  const response=await route.fetch(),source=await response.text();let body=source;
  if(batch){
   assert(body.includes('import { pendingLabelExtent }'),'Original pending-label import missing');
   body=body.replace('import { pendingLabelExtent }','import { pendingLabelExtents }');
   assert(body.includes('const labels = [], pendingLabels = [];'),'Label arrays missing');
   body=body.replace('const labels = [], pendingLabels = [];','const labels = [], pendingLabels = [], pendingNodes = [];');
   const start=body.indexOf('const pending = pendingLabelExtent(node);'),endText='} : labels[labels.length - 1]);',end=body.indexOf(endText,start);
   assert(start>0&&end>start,'Original pending-label loop missing');
   body=body.slice(0,start)+'pendingNodes.push({node,anchor,current:labels[labels.length-1]});'+body.slice(end+endText.length);
   const marker='const worldHud =';assert(body.includes(marker),'World HUD measurement missing');
   body=body.replace(marker,`const pendingExtents=pendingLabelExtents(pendingNodes.map(item=>item.node));
    for(const {node,anchor,current} of pendingNodes){const pending=pendingExtents.get(node);pendingLabels.push(pending?{id:anchor.id,side:node.dataset.side==='enemy'?'enemy':'party',rect:{...pending,x:offset.x+anchor.labelX+pending.x,y:offset.y+anchor.labelY+pending.y}}:current);}
    ${marker}`);
  }
  if(audit){
   const marker='const title = rect(this.title.getBoundingClientRect());';assert(body.includes(marker),'Title measurement missing');
   body=body.replace(marker,`globalThis.__cxvFullFocusInputs?.push({labels,pendingLabels,placed,pendingPlaced,faces,worldHud});\n${marker}`);
  }
  evidence.modules.focus={url:route.request().url(),sourceSha256:hash(source),overrideSha256:hash(body)};
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 return evidence;
}
