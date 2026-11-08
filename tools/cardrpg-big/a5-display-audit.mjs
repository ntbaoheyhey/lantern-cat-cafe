// REFERENCE: B1 display36 prospective registration. Audit completed static receipts, no combat samples.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const out='reports/cardrpg-big/a5/b1/display-calibration-36';
const sha=b=>createHash('sha256').update(b).digest('hex');
const result=JSON.parse(await readFile(out+'/results.json'));
const reg=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
assert.deepEqual(result.registration,reg);
assert.equal(sha(await readFile('tools/cardrpg-big/a5-display-calibration.mjs')),reg.scriptSha256);
const bytes=await readFile(reg.control);assert.equal(sha(bytes),reg.controlSha256);
const control=JSON.parse(bytes);assert.equal(control.count,50);assert.equal(control.offset,0);
assert.equal(result.cases.length,384);assert.equal(result.features.length,6400);
for(const [path,hash] of Object.entries(reg.source))assert.equal(sha(await readFile(reg.sourceRoot+'/'+path)),hash,path);
const features=new Map(result.features.map(r=>[r.key,r]));assert.equal(features.size,6400);
for(const row of result.cases){const original=control.summaries.find(r=>r.key===row.key);assert(original);
 assert.equal(row.gainPp,original.gainPp);assert.equal(row.oldMeanShare,original.meanShare);
}
const rank=values=>values.map(v=>values.filter(x=>x<v).length+(values.filter(x=>x===v).length-1)/2);
const mean=values=>values.reduce((n,v)=>n+v,0)/values.length;
function rho(x,y){const a=rank(x),b=rank(y),am=mean(a),bm=mean(b);let cov=0,av=0,bv=0;
 for(let i=0;i<a.length;i++){cov+=(a[i]-am)*(b[i]-bm);av+=(a[i]-am)**2;bv+=(b[i]-bm)**2;}
 return cov/Math.sqrt(av*bv);
}
const dot=(vector,weights)=>vector.reduce((n,v,i)=>n+v*weights[i],0);
const expected=[];
for(const hp of reg.grid.hp)for(const attack of reg.grid.attack)for(const defense of reg.grid.defense)for(const utility of reg.grid.utility)expected.push([hp,attack,defense,utility]);
assert.equal(result.grid.length,expected.length);
assert.equal(new Set(result.grid.map(r=>r.weights.join())).size,expected.length);
for(const row of result.grid){assert(expected.some(w=>w.join()===row.weights.join()));
 const shares=new Map();let maximumShare=0;
 for(const [key,point] of features){
  const before=dot(point.before,row.weights),after=dot(point.after,row.weights),enhanced=dot(point.enhanced,row.weights);
  shares.set(key,(after-before)/after);maximumShare=Math.max(maximumShare,(after-before)/after,(enhanced-before)/enhanced);
 }
 assert(Math.abs(maximumShare-row.maximumShare)<1e-12);
 const correlations=[1,2,3].map(chapter=>{
  const cases=result.cases.filter(r=>r.chapter===chapter);
  return rho(cases.map(r=>mean(Array.from({length:50},(_,i)=>shares.get(r.templateId+'/'+(i+1))))),cases.map(r=>r.gainPp));
 });
 for(let i=0;i<3;i++)assert(Math.abs(correlations[i]-row.correlations[i])<1e-12);
 assert.equal(row.minimum,Math.min(...row.correlations));
}
const ordered=[...result.grid].sort((a,b)=>b.minimum-a.minimum||a.maximumShare-b.maximumShare||a.weights.join().localeCompare(b.weights.join()));
assert.deepEqual(result.best,ordered.find(r=>r.maximumShare<=.1));
assert.deepEqual(result.passing,ordered.filter(r=>r.maximumShare<=.1&&r.minimum>=.6));
assert.equal(result.passing.length,0);
const paths=[out+'/REGISTERED-METHOD.json',out+'/results.json',reg.control,'tools/cardrpg-big/a5-display-calibration.mjs'];
const audit={passed:true,gridCases:expected.length,existingCombatCells:384,existingSeedsPerCell:50,newCombatSamples:0,
 original:result.original,best:result.best,passingModels:result.passing.length,
 receipts:await Promise.all(paths.map(async path=>({path,sha256:sha(await readFile(path))}))),
 decision:'Reject this finite shared linear family. No production score, gear main stat, matched fixture, gate or acceptance block is changed.'};
await writeFile(out+'/audit.json',JSON.stringify(audit,null,2)+'\n');
const fmt=r=>`|${r===result.original?'Current formula':'Best registered candidate'}|${r.weights.join(' / ')}|${r.correlations.map(v=>v.toFixed(3)).join(' / ')}|${(r.maximumShare*100).toFixed(3)}%|`;
await writeFile('reports/cardrpg-big/a5/B1-DISPLAY-CALIBRATION.md',`# Shared display calibration36\n\nAll ${expected.length} prospectively registered positive/nonnegative HP, attack, defense and utility weight combinations were measured against the existing384 fourth-slot TRAIN1–50 cells. The original displayed shares reconstruct exactly from6,400 actual gear rolls. This diagnostic performs **zero new combat simulations** and uses no acceptance seeds.\n\n|Model|HP / attack / defense / utility weights|Spearman chapters1 /2 /3|Maximum piece share, including+12|\n|---|---|---|---:|\n${fmt(result.original)}\n${fmt(result.best)}\n\nNo registered model reaches Spearman≥0.6 in all three chapters while keeping piece share≤10%. Reject this finite family; this does not prove every possible contextual score is impossible. The best model also discards utility and reduces chapter1/2 correlation, so it is not adopted as an improvement. All320 scores remain in the receipt.\n\nThe current rawPowerV4 formula also determines actual item main stats through gearMainV4. Replacing it to improve a display metric would silently alter combat and the matched-power budget. No such change is made. A later contextual display proposal must be isolated from those mechanics and validated on full TRAIN500 and the untouched acceptance block.\n\n[Prospective method](b1/display-calibration-36/REGISTERED-METHOD.md) · [all models and features](b1/display-calibration-36/results.json) · [independent reconstruction audit](b1/display-calibration-36/audit.json). Original balance misses remain open; no gate is relaxed.\n`);
console.log(JSON.stringify(audit));
