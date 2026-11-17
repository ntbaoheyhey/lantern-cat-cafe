/** Small report from raw ordinary-play experiments; keep films and full rows ignored. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const input=resolve(process.env.CXV_CAPTURE_OUT??'work/v5/CXV/films/V7-F-hud-text-play');
const output=resolve(process.env.CXV_SUMMARY_OUT??'reports/v5/CXV/V7-F-hud-text-experiment.json');
const series=JSON.parse(await readFile(resolve(input,'series.json'),'utf8'));
const median=v=>{const a=[...v].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
const trials=[];
for(const row of series.runs){
 const d=JSON.parse(await readFile(row.path,'utf8'));
 for(const r of d.runs)trials.push({index:row.index,mode:row.mode,rate:r.rate,url:d.url,utc:d.utc,ended:d.ended,source:d.source,identity:r.identity,identityAfter:r.identityAfter,errors:d.errors,samples:r.samples,frameMs:r.frameMs,over33:r.over33,over50:r.over50,submitCpuMs:r.submitCpuMs,hud:r.hud,layout:r.layout,focusEntryCpuMs:r.focusEntryCpuMs,focusEntryRenderCpuMs:r.focusEntryRenderCpuMs,presentations:r.plans.length,actions:r.plans.filter(p=>p.kind==='action').length,ultimates:r.plans.filter(p=>p.ultimate).length,logEvents:r.final.log-r.initial.log,override:r.hudOverride,raw:row.path});
}
const summary=[];
for(const rate of [...new Set(trials.map(r=>r.rate))])for(const mode of [...new Set(trials.map(r=>r.mode))]){
 const rows=trials.filter(r=>r.rate===rate&&r.mode===mode),get=f=>median(rows.map(f));
 summary.push({rate,mode,trials:rows.length,samples:get(r=>r.samples),frameMedianMs:get(r=>r.frameMs.median),frameP95Ms:get(r=>r.frameMs.p95),over50:get(r=>r.over50),submitMedianMs:get(r=>r.submitCpuMs.median),canvasMedianMs:get(r=>r.hud.canvas.median),canvasTotalMs:get(r=>r.hud.canvas.totalMs),labelsTotalMs:get(r=>r.hud.labels.totalMs),tailTotalMs:get(r=>r.hud.tail.totalMs),styleTotalMs:get(r=>r.layout.RecalcStyleDuration*1000),stylePerFrameMs:get(r=>r.layout.RecalcStyleDuration*1000/r.hud.canvas.calls),layoutTotalMs:get(r=>r.layout.LayoutDuration*1000),focusMedianMs:get(r=>r.focusEntryCpuMs.median)});
}
const stableSource=new Set(trials.map(r=>r.override.modules.hud.sourceSha256)).size===1&&new Set(trials.map(r=>r.source)).size===1&&new Set(trials.map(r=>JSON.stringify(r.identity))).size===1;
const report={utc:new Date().toISOString(),order:series.order,stableSource,pass:series.pass&&stableSource&&trials.every(r=>!r.errors.length&&JSON.stringify(r.identity)===JSON.stringify(r.identityAfter)),method:'Sequential alternating32s actual game loop per1x/4xCPU rate. HUD timing instrumentation is shared by baseline and text prototype;CDP timings are attribution,4x is a stress proxy. Browser-only source overrides are not production acceptance;summary uses medians across trials,not a pooled frame sample.',summary,trials};
await writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify({output,pass:report.pass,summary}));
