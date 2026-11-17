/** Exact-score pruning experiment. Shared application source stays unchanged. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
export const root=resolve(import.meta.dirname,'../..');
const require=createRequire(resolve(root,'apps/web/package.json')),ts=require('typescript');
const hash=value=>createHash('sha256').update(value).digest('hex');
export const sourcePath='apps/web/src/game/squad/turn3d/label-layout.ts';
export function labelSearchSources(){
 const original=execFileSync('git',['show','42fbeaa6f:'+sourcePath],{cwd:root,encoding:'utf8'});
 const score='   // Strongly prefer above and local. Distant fallback is a last resort, never a hidden card.\n   const dx=x+labelWidth/2-p.x,dy=y+p.height-p.y;\n   const cost=dx*dx+dy*dy*1.8+(y>p.y?2500:0);';
 const collision='   for(const r of placed)if(';
 assert.equal(original.split(score).length,2);assert.equal(original.split(collision).length,2);
 const pruned=original.replace(score+'\n','').replace(collision,score+'\n   if(!(cost<bestCost))return;\n'+collision);
 return{original,pruned,sourcePath,baselineRef:'42fbeaa6f',originalSha256:hash(original),prunedSha256:hash(pruned)};
}
export function compileLabelSearch(source){
 return ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
}
export function loadLabelSearch(source){
 const exports={};new Function('exports',compileLabelSearch(source))(exports);return exports;
}
export async function installLabelSearchOverride(page,{mode='baseline',paired=false}={}){
 assert(['baseline','pruned'].includes(mode));const sources=labelSearchSources();
 const evidence={mode,paired,sourcePath,baselineRef:sources.baselineRef,originalSha256:sources.originalSha256,prunedSha256:sources.prunedSha256,modules:[]};
 const body=`const baseline=(()=>{const exports={};${compileLabelSearch(sources.original)};return exports})();\nconst pruned=(()=>{const exports={};${compileLabelSearch(sources.pruned)};return exports})();\n`+`
 const audit=globalThis.__cxvLabelSearch={mode:${JSON.stringify(mode)},paired:${paired},calls:0,totalCpuMs:0,pairedCalls:0,baselineCpuMs:0,prunedCpuMs:0,mismatches:[],cases:[]};
 export const intersects=baseline.intersects;
 export function layoutLabels(...args){
  const start=performance.now(),result=${mode}.layoutLabels(...args),elapsed=performance.now()-start;
  audit.calls++;audit.totalCpuMs+=elapsed;
  if(audit.paired){
   const otherStart=performance.now(),other=${mode==='baseline'?'pruned':'baseline'}.layoutLabels(...args),otherElapsed=performance.now()-otherStart;
   audit.pairedCalls++;audit.baselineCpuMs+=${mode==='baseline'?'elapsed':'otherElapsed'};audit.prunedCpuMs+=${mode==='pruned'?'elapsed':'otherElapsed'};
   const left=[...result],right=[...other];
   if(JSON.stringify(left)!==JSON.stringify(right)){audit.mismatches.push({args,left,right});throw Error('Label-search placement mismatch');}
   if(audit.cases.length<200&&(audit.calls<12||audit.calls%29===0))audit.cases.push({args:structuredClone(args),result:left});
  }
  return result;
 }
 `;
 await page.route('**/squad/turn3d/label-layout.ts*',async route=>{
  const response=await route.fetch(),actual=await response.text();
  assert(actual.includes('function layoutLabels('),'Expected active label-layout module');
  evidence.modules.push({url:route.request().url(),sourceSha256:hash(actual),overrideSha256:hash(body)});
  await route.fulfill({response,body,contentType:'text/javascript'});
 });
 return evidence;
}
