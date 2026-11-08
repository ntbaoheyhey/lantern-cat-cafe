// REFERENCE: A5 B2. Retain both improvement and regression in the original TRAIN matrix.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const [beforeRoot,afterRoot,output]=process.argv.slice(2);
assert(beforeRoot&&afterRoot&&output,'Provide before/after balance directories and an output JSON path');
const sha=data=>createHash('sha256').update(data).digest('hex'),receipts=[],rows=[],crewSelections=[];
async function read(path){const data=await readFile(path);receipts.push({path,sha256:sha(data)});return JSON.parse(data);}
const counts={equipped:384,tiers:210,sets:64,teams:663};
for(const [scope,count] of Object.entries(counts)){
  const arms=await Promise.all([beforeRoot,afterRoot].map(root=>read(`${root}/${scope}/results.json`)));
  for(const arm of arms){
    assert.equal(arm.scope,scope);assert.equal(arm.count,50);assert.equal(arm.offset,0);assert.equal(arm.sample,'pilot');
    assert.equal(arm.rows.length,count);assert.equal(new Set(arm.rows.map(row=>row.key)).size,count);
    for(const row of arm.rows){
      assert(row.complete);assert.equal(row.outcomes.length,50);assert.equal(row.digest,sha(JSON.stringify(row.outcomes)));
      assert.match(row.outcomes,['pieces','pieces-equipped','crew'].includes(row.kind)?/^[0-3]{50}$/:/^[01]{50}$/);
    }
  }
  const [before,after]=arms,old=new Map(before.rows.map(row=>[row.key,row]));
  if(scope==='teams')crewSelections.push({before:before.chosenCrew,after:after.chosenCrew,
    exact:JSON.stringify(before.chosenCrew)===JSON.stringify(after.chosenCrew)});
  for(const b of after.rows){
    const a=old.get(b.key);
    if(!a){assert.equal(b.kind,'crew','Non-crew fixture changed');continue;}
    const paired=['pieces','pieces-equipped','crew'].includes(b.kind);
    for(const arm of paired?['reference','enhanced']:['fixture']){
      let beforeWins=0,afterWins=0,improved=0,worsened=0;
      for(let i=0;i<50;i++){
        const av=arm==='reference'?Number(a.outcomes[i])>=2:Number(a.outcomes[i])%2===1;
        const bv=arm==='reference'?Number(b.outcomes[i])>=2:Number(b.outcomes[i])%2===1;
        beforeWins+=Number(av);afterWins+=Number(bv);improved+=Number(!av&&bv);worsened+=Number(av&&!bv);
      }
      assert.equal(afterWins-beforeWins,improved-worsened);
      rows.push({scope,key:b.key,kind:b.kind,arm,battles:50,beforeWins,afterWins,improved,worsened,
        gainPp:2*(afterWins-beforeWins),same:improved+worsened===0});
    }
  }
}
const groups=[...new Set(rows.map(row=>row.kind+':'+row.arm))].map(key=>{
  const selected=rows.filter(row=>row.kind+':'+row.arm===key);
  return {key,cells:selected.length,battles:50*selected.length,
    improved:selected.reduce((n,r)=>n+r.improved,0),worsened:selected.reduce((n,r)=>n+r.worsened,0),
    positiveCells:selected.filter(r=>r.gainPp>0).length,negativeCells:selected.filter(r=>r.gainPp<0).length,
    exactOutcomeCells:selected.filter(r=>r.same).length};
});
const report={scope:'Original1321TRAIN1–50 cells per source; no resampling, no acceptance.',
  beforeRoot,afterRoot,crewSelections,groups,rows,receipts,
  limitations:['Reference/enhanced bits are compared separately for the same build, not mixed into a piece-gain estimate.',
    'Reselected crews are explicitly unpaired; the full original results remain in the linked receipts.',
    'Overlapping cat builds and seed cases are not independent samples; pooled counts are descriptive only.']};
await writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify({crewSelections,groups}));
