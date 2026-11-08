// REFERENCE: Starplans46. Exact original earned Home02 save; public commands only, no new combat samples.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {loadRules} from '../../a4-load.mjs';
const root='reports/cardrpg-big/a5/e2-star-plans',out=root+'/fixtures',sha=b=>createHash('sha256').update(b).digest('hex');
const input='reports/cardrpg-big/a5/engagement/home-02/session/state-checkpoint.json';
const reg=JSON.parse(await readFile('reports/cardrpg-big/a5/engagement/opportunities-45/registration.json'));
const bytes=await readFile(input);assert.equal(sha(bytes),reg.inputs[input]);
const loader=await loadRules();
try{
 const R=await loader.load('packages/game-rules/src/cardrpg/depth/index.ts'),s=JSON.parse(bytes);
 assert(s.run.complete);assert.deepEqual(s.team,['mochi','soot','clover']);assert.equal(R.starCountV4(s),49);
 const goal=Object.values(s.v4.journey.stars).find(r=>r.conditions.some(c=>!c));
 assert.equal(goal.kind,'event');assert.deepEqual(goal.conditions,[true,true,false]);assert.equal(goal.band,1);
 const team=s.team.map(id=>id==='soot'?'mallow':id),rows={...s.rows,mallow:s.rows.soot};
 const changed=R.configureTeam(s,team,rows,s.skills);assert(changed.ok);assert.deepEqual(changed.state.account.currencies,s.account.currencies);
 assert.deepEqual(changed.state.equipment,s.equipment);let acknowledged=changed.state;
 while(acknowledged.v4.journey.pending.length){const r=R.acknowledgeDiscoveryV4(acknowledged,acknowledged.v4.journey.pending[0].sequence);assert(r.ok);acknowledged=r.state;}
 await mkdir(out,{recursive:true});const fixtures=[];
 for(const[name,state]of [['earned',s],['after-swap',changed.state],['after-acknowledgement',acknowledged],['off',R.setGameplayV4(s,false)]]){
  const save=R.exportSave(state);assert.equal(R.exportSave(R.importSave(save)),save);
  const path=out+'/'+name+'.save',statePath=out+'/'+name+'.json';await writeFile(path,save+'\n');await writeFile(statePath,JSON.stringify(state,null,2)+'\n');
  fixtures.push({name,path,sha256:sha(await readFile(path)),statePath,stateSha256:sha(await readFile(statePath))});
 }
 await writeFile(out+'/checks.json',JSON.stringify({passed:true,input,inputSha256:sha(bytes),goal,fixtures,method:'Original earned final Home02 checkpoint; public configureTeam/acknowledgeDiscovery/setGameplayV4/export/import only. No injected progression or simulated battles.'},null,2)+'\n');
 console.log(JSON.stringify({passed:true,goal,fixtures:fixtures.map(f=>f.name)}));
}finally{await loader.vite.close();}
