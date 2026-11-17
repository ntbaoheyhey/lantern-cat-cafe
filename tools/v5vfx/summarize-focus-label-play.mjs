import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-focus-label-play'),series=JSON.parse(await readFile(resolve(root,'series.json'),'utf8'));
assert(series.pass&&series.runs.length===6,'Six completed runs required');
const trials=await Promise.all(series.runs.map(async r=>({...r,report:JSON.parse(await readFile(r.path,'utf8'))})));
const median=values=>{const a=[...values].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const summary={utc:series.utc,ended:series.ended,recordedUtc:new Date().toISOString(),raw:root,viewport:{width:1280,height:720},order:series.order,method:'Six sequential alternating browser-only trials,32s at1x then4xCPU each. Same actual rule-selected boss play and common timing wrappers;three trials per mode. Aggregate medians are descriptive,not a confidence interval or physical laptop result. CPU submission is not GPU completion;fixture setup is not account progression.',pass:trials.every(t=>t.pass&&t.report.pass),sourceCommits:[...new Set(trials.map(t=>t.report.source))],runtimePatchHashes:[...new Set(trials.map(t=>t.report.runtimePatchSha256))],moduleSourceHashes:{},rates:[],trials:[]};
for(const module of ['status','focus'])summary.moduleSourceHashes[module]=[...new Set(trials.flatMap(t=>t.report.runs.map(r=>r.pendingOverride.modules[module].sourceSha256)))];
assert(summary.runtimePatchHashes.length===1&&Object.values(summary.moduleSourceHashes).every(h=>h.length===1),'Candidate runtime changed between trials');
for(const rate of [1,4]){
 const group={rate};
 for(const mode of ['off','on']){
  const rows=trials.filter(t=>t.mode===mode).map(t=>t.report.runs.find(r=>r.rate===rate)),entries=rows.flatMap(r=>r.focusEntries);
  group[mode]={runs:rows.length,entries:entries.length,entryCpuMedianMs:median(entries.map(e=>e.cpuMs)),entryCpuMaxMs:Math.max(...entries.map(e=>e.cpuMs)),entryFrameMedianMs:median(entries.map(e=>e.renderCpuMs)),entryFrameMaxMs:Math.max(...entries.map(e=>e.renderCpuMs)),perHero:Object.fromEntries([...new Set(entries.map(e=>e.skillId))].map(skill=>[skill,{count:entries.filter(e=>e.skillId===skill).length,cpuMedianMs:median(entries.filter(e=>e.skillId===skill).map(e=>e.cpuMs))}])),frameP95MedianMs:median(rows.map(r=>r.frameMs.p95)),steadyCpuMedianMs:median(rows.map(r=>r.submitCpuMs.median)),long50Median:median(rows.map(r=>r.over50)),wholeRunFrameMaxMedianMs:median(rows.map(r=>r.wholeRun.frameMs.max)),startupCpuMaxMedianMs:median(rows.map(r=>r.startup.submitCpuMs.max)),actions:rows.map(r=>r.plans.filter(p=>p.kind==='action').length),ultimates:rows.map(r=>r.plans.filter(p=>p.ultimate).length),logEvents:rows.map(r=>r.final.log-r.initial.log)};
 }
 summary.rates.push(group);
}
for(const trial of trials)summary.trials.push({index:trial.index,mode:trial.mode,path:trial.path,source:trial.report.source,url:trial.report.url,errors:trial.report.errors,rates:trial.report.runs.map(r=>({rate:r.rate,entries:r.focusEntries.length,entryCpu:r.focusEntryCpuMs,entryFrameCpu:r.focusEntryRenderCpuMs,frameP95:r.frameMs.p95,long50:r.over50}))});
summary.next='Use only to decide the pending-label batching candidate after controlled pixel parity;application integration still requires focused tests,typecheck,fresh runtime captures and CXI independent acceptance.';
await writeFile(resolve('reports/v5/CXV/V7-F-focus-label-play-summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify({pass:summary.pass,rates:summary.rates}));
