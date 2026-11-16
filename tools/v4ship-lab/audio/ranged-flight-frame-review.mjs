/** Compare actual frame coverage with one consistent recipient-aware motion definition. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
const root=resolve(import.meta.dirname,'../../..'),attempt=process.argv[2],candidate=process.argv[3];assert(/^\d+$/.test(attempt));
const output=resolve(root,`reports/v4-ship/S11/ranged-flight-frame-review-${attempt}.json`);assert(!existsSync(output)&&!existsSync(resolve(root,'STOP-V4SHIP')));
const hash=b=>createHash('sha256').update(b).digest('hex'),signed=path=>({path,sha256:hash(readFileSync(resolve(root,path)))}),read=path=>JSON.parse(readFileSync(resolve(root,path)));
const inventoryPath='reports/v4-ship/S11/ranged-class-inventory-1.json',inventory=read(inventoryPath),inputs=[signed(inventoryPath)],experiments=[];
for(const name of ['ranged-class-playback-1',...(candidate?[candidate]:[])]){
 assert(/^[a-z0-9-]+$/.test(name));const reportPath=`reports/v4-ship/S11/${name}.json`,report=read(reportPath),bytes=readFileSync(resolve(root,report.events.path));assert.equal(hash(bytes),report.events.sha256);inputs.push(signed(reportPath),report.events);
 const rows=JSON.parse(gunzipSync(bytes)),reviewed=rows.map(row=>{
  const c=inventory.rows.find(c=>c.id===row.id),ordinals=new Map();
  const paints=row.paints.map(p=>{const key=p.elapsed+':'+p.layer,recipient=ordinals.get(key)??0;ordinals.set(key,recipient+1);if(p.recipient!==undefined)assert.equal(p.recipient,recipient);return {...p,recipient};});
  const flight=paints.filter(p=>p.anchor==='flight'),before=flight.filter(p=>p.elapsed<c.impactMs),arrival=flight.filter(p=>p.elapsed>=c.impactMs&&p.elapsed<=c.impactMs+50*row.speed);
  const sameRecipientMotion=before.some(a=>flight.some(b=>b.layer===a.layer&&b.recipient===a.recipient&&b.elapsed>a.elapsed&&b.elapsed<=c.impactMs+50*row.speed&&Math.hypot(b.x-a.x,b.y-a.y)>1));
  const contact=paints.find(p=>p.layer==='impact-burst'&&p.elapsed>=c.impactMs),travelEvent=row.events.find(e=>e.role==='travel'),releaseEvent=row.events.find(e=>e.role==='release');
  const actualTravelPaint=c.hasFlight?before.find(p=>p.elapsed>=travelEvent.t):null;
  const uniqueFrames=[...new Map(paints.map(p=>[p.elapsed,p])).values()].sort((a,b)=>a.elapsed-b.elapsed);
  const predictions=c.hasFlight?['midpoint','speed-aware'].map(method=>{const t=method==='midpoint'?c.travelMs:c.launchMs+(c.travelMs-c.launchMs)/row.speed,frame=uniqueFrames.find(p=>p.elapsed>=t),draw=frame&&before.find(p=>p.elapsed===frame.elapsed);return {method,scheduledMs:t,firstObservedFrameMs:frame?.elapsed??null,dispatchBeforeContact:!!frame&&frame.elapsed<c.impactMs,flightOnDispatchFrame:!!draw};}):[];
  return {id:row.id,speed:row.speed,speech:row.speech,viewport:row.viewport,hasFlight:c.hasFlight,preContactFrames:new Set(before.map(p=>p.elapsed)).size,arrivalFrames:new Set(arrival.map(p=>p.elapsed)).size,sameRecipientMotion,contactPaint:!!contact,travelSubmittedMs:travelEvent?.submittedMs??null,releaseSubmittedMs:releaseEvent?.submittedMs??null,travelBeforeContact:!c.hasFlight||travelEvent.submittedMs<c.impactMs,travelPaintBeforeContact:!c.hasFlight||!!actualTravelPaint,sourceAdmissionPass:row.admissionPass,predictions,
   correctedPaintPass:paints.length>0&&paints.every(p=>p.visible)&&!!contact&&(c.hasFlight?before.length>0&&sameRecipientMotion&&!!actualTravelPaint:before.length===0)};
 });
 const flight=reviewed.filter(r=>r.hasFlight),predictionSummary=['midpoint','speed-aware'].map(method=>({method,cases:flight.length,dispatchBeforeContact:flight.filter(r=>r.predictions.find(p=>p.method===method).dispatchBeforeContact).length,flightOnDispatchFrame:flight.filter(r=>r.predictions.find(p=>p.method===method).flightOnDispatchFrame).length}));
 experiments.push({name,cases:reviewed.length,sourceAdmissionPassed:reviewed.filter(r=>r.sourceAdmissionPass).length,correctedPaintPassed:reviewed.filter(r=>r.correctedPaintPass).length,actualTravelAtOrAfterContact:flight.filter(r=>!r.travelBeforeContact).length,singlePreContactFrameCases:flight.filter(r=>r.preContactFrames===1).length,predictionSummary,rows:reviewed,pass:reviewed.length===168&&reviewed.every(r=>r.sourceAdmissionPass&&r.correctedPaintPass&&r.travelBeforeContact)});
}
const report={at:new Date().toISOString(),learn:'reports/v4-ship/LEARN/S11-ranged-audio.md',harness:signed(relative(root,import.meta.filename)),inputs,experiments,
 scope:'Same definition applied to both preserved runs: movement follows one layer and recipient across distinct submitted frames through arrival; multiple targets in one frame do not count as movement. An actual travel request must precede fixed contact and have a pre-contact flight draw at/after its authored checkpoint.',
 limits:['Predictions use frames that submitted paint and do not prove later source admission. Only the actual candidate run can validate its requests.','One pre-contact frame at3x can still show motion through the arrival frame. This correction changes the observer, not any authored renderer or acceptance threshold.','No physical audiovisual onset or human listening proof.'],candidatePass:candidate?experiments.at(-1).pass:null,overallAudioGatePass:false};
writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output:relative(root,output),experiments:experiments.map(({rows,...r})=>r)}));if(candidate&&!report.candidatePass)process.exitCode=1;
