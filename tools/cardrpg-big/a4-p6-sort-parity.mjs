// REFERENCE: P6 frozen policy. Read-only equivalence of memoized gear ordering.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
const out='reports/cardrpg-big/a4/p6/harness-parity';
const {load,rules:C,vite}=await loadRules();
const R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const fixtureBytes=gunzipSync(await readFile(`${out}/fixtures.json.gz`));
const fixtures=JSON.parse(fixtureBytes);
const rows=[];let oldCalls=0,newCalls=0,oldMs=0,newMs=0;
try {
 for(const row of fixtures){
  const s=row.state,before=JSON.stringify(s);
  for(const id of s.team)for(const slot of C.EQUIPMENT_SLOTS){
   const other=new Set(Object.entries(s.equipment).filter(([cat])=>cat!==id).flatMap(([,slots])=>Object.values(slots)));
   const candidates=s.gear.filter(g=>R.GEAR_BY_ID[g.templateId].slot===slot&&!other.has(g.id));
   let start=performance.now();
   const original=[...candidates].sort((a,b)=>{oldCalls+=2;return R.itemUtilityV4(s,id,b)-R.itemUtilityV4(s,id,a);});
   oldMs+=performance.now()-start;start=performance.now();
   const memoized=candidates.map(item=>{newCalls++;return {item,utility:R.itemUtilityV4(s,id,item)};}).sort((a,b)=>b.utility-a.utility).map(x=>x.item);
   newMs+=performance.now()-start;
   assert.deepEqual(memoized,original,'Complete stable ranking, including ties');
   assert.equal(JSON.stringify(s),before,'Scoring must not mutate state');
   if(original.length)assert.deepEqual(R.equipGear(s,id,original[0].id),R.equipGear(s,id,memoized[0].id));
   rows.push({style:row.style,index:row.index,day:row.days.length,id,slot,count:candidates.length,rankingSha256:createHash('sha256').update(JSON.stringify(original.map(x=>x.id))).digest('hex')});
  }
 }
 await writeFile(`${out}/checks.json`,JSON.stringify({pass:true,method:'Identical complete stable ranking and public equip result from frozen saved states; pure scores cached only within each sort, never across equipment mutations. No new acceptance sample or gameplay change.',fixturesSha256:createHash('sha256').update(fixtureBytes).digest('hex'),rows,oldCalls,newCalls,oldMs,newMs},null,2));
 console.log(JSON.stringify({pass:true,comparisons:rows.length,oldCalls,newCalls,oldMs,newMs}));
}finally{await vite.close();}
