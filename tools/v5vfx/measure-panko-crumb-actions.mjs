/** Measure complete action captures and baseline differences before visual inspection. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..'),out=resolve(process.env.CXV_CAPTURE_OUT??resolve(root,'work/v5/CXV/films/V7-D-panko-crumb/full-actions'));
assert(out.startsWith(resolve(root,'work/v5/CXV')+'/'));
const report=JSON.parse(readFileSync(resolve(out,'report.json')));assert(report.pass&&report.cases.length===4);
const dest=resolve(out,'measurements.json');assert(!existsSync(dest),'Preserve measured/reviewed evidence');
const rgba=path=>execFileSync('ffmpeg',['-v','error','-i',path,'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'],{maxBuffer:8*1024*1024});
const cases=[];
for(const c of report.cases){
 const samples=[];
 for(const row of c.samples){
  const a=rgba(row.baseline.path),b=rgba(row.candidate.path);assert.equal(a.length,1280*720*4);assert.equal(b.length,a.length);
  let changed=0,changedOver4=0,maxChannel=0,minX=1280,minY=720,maxX=-1,maxY=-1,topHud=0,bottomHud=0;
  for(let i=0;i<a.length;i+=4){let d=0;for(let k=0;k<4;k++)d=Math.max(d,Math.abs(a[i+k]-b[i+k]));if(!d)continue;
   const p=i/4,x=p%1280,y=Math.floor(p/1280);changed++;changedOver4+=d>4;maxChannel=Math.max(maxChannel,d);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);topHud+=y<40;bottomHud+=y>=640;
  }
  assert.equal(row.baseline.draws.length,0);for(const draw of row.candidate.draws){assert.equal(draw.operation,'source-over');assert.equal(draw.cssBlend,'normal');}
  const active=row.ms>=c.mote.startMs&&row.ms<c.mote.startMs+c.mote.durationMs;
  assert(active||row.candidate.draws.length===0,'Crumb drawn outside its existing lifetime');
  samples.push({ms:row.ms,active,draws:row.candidate.draws.length,changed,changedOver4,maxChannel,bounds:changed?[minX,minY,maxX+1,maxY+1]:null,topHud,bottomHud,candidateSha256:createHash('sha256').update(readFileSync(row.candidate.path)).digest('hex')});
 }
 const meta=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height','-of','json',c.sheet],{encoding:'utf8'})).streams[0];assert(meta.width<=1024&&meta.height<=1024);
 const b=rgba(c.sheet),mean=b.reduce((sum,v)=>sum+v,0)/b.length;assert(mean>10&&mean<245);
 cases.push({id:c.id,reduced:c.reduced,sheet:c.sheet,sheetSha256:createHash('sha256').update(readFileSync(c.sheet)).digest('hex'),...meta,samples});
}
const result={utc:new Date().toISOString(),source:report.source,url:report.url,assetSha256:report.sha256,cases,reviewedUtc:null,limits:'Full-action browser substitution only; approved loader integration is separate. Pixel differences include replacing the procedural mote; masks do not infer subjective quality.'};
writeFileSync(dest,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({cases:cases.map(c=>({id:c.id,reduced:c.reduced,sheet:c.sheet,width:c.width,height:c.height,samples:c.samples.map(s=>({ms:s.ms,draws:s.draws,changed:s.changed,bounds:s.bounds,topHud:s.topHud,bottomHud:s.bottomHud}))}))}));
