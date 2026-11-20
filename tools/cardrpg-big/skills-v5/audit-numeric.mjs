// Verify completed registered receipts without replaying any battle.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.argv[2];assert(root);
const sha=b=>createHash('sha256').update(b).digest('hex'),json=async p=>JSON.parse(await readFile(p,'utf8'));
const expected={metrics:10500,equipped:384,teams:663,sets:64,tiers:210,pieces:2304,elites:880,economy:90,day7:90,editions:1500};
const rows=[];let sourceDigest,offset,skillsV5;
for(const [scope,originalCount]of Object.entries(expected)){
 const directory=root+'/'+scope,registration=await json(directory+'/REGISTERED-METHOD.json');
 const count=scope==='metrics'&&registration.designMetrics?28500:originalCount;
 for(const [p,h]of Object.entries({...registration.source,...registration.tools}))assert.equal(sha(await readFile(p)),h,p);
 sourceDigest??=registration.sourceDigest;offset??=registration.offset;skillsV5??=registration.skillsV5;
 assert.equal(registration.sourceDigest,sourceDigest);assert.equal(registration.offset,offset);assert.equal(registration.skillsV5,skillsV5);
 const bytes=await readFile(directory+'/results.json'),r=JSON.parse(bytes),data=r.rows??r.accounts??r.pairs;
 assert.equal(data.length,count,scope);
 if(r.methodHash)assert.equal(r.methodHash,sha(JSON.stringify(registration)));
 if(r.registration)assert.deepEqual(r.registration,registration);
 if(['equipped','teams','sets','tiers','pieces','elites'].includes(scope)){
  assert.equal(r.count,500);assert.equal(r.offset,offset);assert.equal(r.summaries.length,count);
  assert.equal(new Set(r.rows.map(row=>row.key)).size,count,'No duplicate cells');
  for(const row of r.summaries){
   assert.equal(row.n,500);assert(row.minPowerRatio>=.98&&row.maxPowerRatio<=1.02);
   const original=r.rows.find(x=>x.key===row.key);assert(original?.complete);assert.equal(original.outcomes.length,500);
   assert.equal(sha(JSON.stringify(original.outcomes)),original.digest);assert.equal(row.digest,original.digest);
   const outcomes=[...original.outcomes].map(Number),wins=outcomes.filter(n=>n%2===1).length;
   assert.equal(row.wins,wins);assert.equal(row.rate,wins/500);
   if(row.beforeWins!==null){const before=outcomes.filter(n=>n>=2).length;assert.equal(row.beforeWins,before);assert.equal(row.gainPp,100*(wins-before)/500);}
  }
 }
 if(scope==='metrics')assert.equal(new Set(data.map(row=>row.key)).size,count,'No duplicate probe battles');
 if(scope==='economy')assert(data.every(a=>a.days.length===45));
 if(scope==='editions'){assert.equal(r.races.length,500);assert.equal(r.maxPairedGainPp,0);}
 rows.push({scope,count,source:directory+'/results.json',sha256:sha(bytes),registrationSha256:sha(await readFile(directory+'/REGISTERED-METHOD.json'))});
}
const gates=await json(root+'/numeric-gates.json');assert.equal(gates.sourceDigest,sourceDigest);
await writeFile(root+'/receipt-audit.json',JSON.stringify({status:'PASS',sourceDigest,offset,skillsV5,rows,numericCounts:gates.counts,meaning:'Receipt integrity only. Numeric MISS gates remain MISS; this audit makes no gameplay acceptance claim.'},null,2)+'\n');
console.log(JSON.stringify({status:'PASS',offset,skillsV5,numericCounts:gates.counts,scopes:rows.length}));
