// REFERENCE: A5 B2 eligibility21. Audit identical controlled inputs across all three registered sources.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root='reports/cardrpg-big/a5/b2/hush-eligibility-21',receipts=[];
const sha=data=>createHash('sha256').update(data).digest('hex');
async function read(path){const data=await readFile(path);receipts.push({path,sha256:sha(data)});return JSON.parse(data);}
const method=await read(root+'/REGISTERED-METHOD.json'),arms={};
for(const id of ['current16','signature19','eligibility21']){
  arms[id]=await read(`${root}/${id}.json`);
  assert.equal(arms[id].total,144);assert.equal(arms[id].rows.length,144);
  assert.equal(arms[id].methodSha256,sha(JSON.stringify(method)));
}
assert.equal(arms.current16.pass,125);assert.equal(arms.signature19.pass,137);assert.equal(arms.eligibility21.pass,144);
assert.deepEqual(arms.eligibility21.source,method.source);
let exactOff=0;
for(let i=0;i<144;i++){
  const after=arms.eligibility21.rows[i];assert(Object.values(after.checks).every(Boolean));
  for(const id of ['current16','signature19']){
    const before=arms[id].rows[i];
    for(const key of ['enemyId','setup','gameplayV4','signature','control','inputSha256']) assert.equal(after[key],before[key],key);
    assert.deepEqual(after.hits,before.hits,'Attribution must leave these controlled attacks unchanged');
    if(!after.gameplayV4) assert.deepEqual(after.events,before.events,'OFF events must be exact');
  }
  if(!after.gameplayV4)exactOff++;
}
assert.equal(exactOff,72);
const output={status:'PASS',total:144,exactOff,originalPass:125,signatureOnlyPass:137,candidatePass:144,
  previousCandidateRemainingMisses:arms.signature19.failures,receipts,
  timing:'Summon suppression credit and Lantern healing now resolve after the summon-capacity and survival checks; heal/shield credit and Drowsy still precede their skipped/softened actions.',
  limitation:'Controlled actions only. Wider TRAIN and saved-day7 comparison must be registered before sampling.'};
await writeFile(root+'/audit.json',JSON.stringify(output,null,2));console.log(JSON.stringify(output));
