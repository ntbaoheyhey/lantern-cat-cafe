/** Executable rules are the authority for voice coverage, including future roster additions. */
import {loadRules,root} from '../../tools/cardrpg-sim/load.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export async function requiredCallouts(){
 const {load,vite}=await loadRules();
 try{
  const R=await load('packages/game-rules/src/cardrpg/depth/catalog.ts');
  const script=JSON.parse(readFileSync(resolve(root,'scripts/audio/data/callouts.json'),'utf8'));
  const sources=['packages/game-rules/src/cardrpg/depth/catalog.ts','packages/game-rules/src/cardrpg/depth/skills-v5/kits.ts','packages/game-rules/src/cardrpg/depth/skills-v5/enemies.ts'].map(path=>({path,sha256:createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex')}));
  const rows=[];
  for(const unit of [...R.CATS,...R.ENEMIES]){
   const cat=R.CATS.some(c=>c.id===unit.id),words=script[unit.id];
   if(!words)throw new Error('Missing authored voice script for live unit '+unit.id);
   const skills=cat?unit.skills.filter(s=>s.type!=='ultimate'):[{id:`enemy:${unit.id}:basic`,name:'Basic'},{id:`enemy:${unit.id}`,name:unit.mechanic}];
   const ultimate=cat?unit.skills.find(s=>s.type==='ultimate'):{id:`enemy:${unit.id}`,name:unit.mechanic};
   for(const [index,skill] of skills.entries()){
    if(!words.skills[index])throw new Error('Missing live skill script '+skill.id);
    rows.push({unitId:unit.id,kind:'skill',skillId:skill.id,skillName:skill.name,slot:index+1,cueId:`voice.${unit.id}.skill.${skill.id}`,text:words.skills[index],syncPointMs:0});
   }
   if(!ultimate)throw new Error('No ultimate/signature in rules for '+unit.id);
   for(const phase of ['charge','release'])rows.push({unitId:unit.id,kind:'ultimate',phase,skillId:ultimate.id,skillName:ultimate.name,cueId:`voice.${unit.id}.ult.${phase}`,text:phase==='charge'?words.ultimate.split(/\s+/)[0].replace(/[.!?]+$/,'')+'!':words.ultimate,syncPointMs:0});
  }
  return {rows,roster:[...R.CATS,...R.ENEMIES].map(unit=>({unitId:unit.id,tier:unit.tier??'playable',requiredCueIds:rows.filter(r=>r.unitId===unit.id).map(r=>r.cueId),sources})),sources};
 }finally{await vite.close();}
}

export function validateCalloutCoverage(required,actual,manifest){
 const errors=[];
 for(const row of required.rows){
  const found=actual.filter(a=>a.cueId===row.cueId&&a.unitId===row.unitId&&a.skillId===row.skillId);
  if(found.length!==1){errors.push(`${row.cueId}: expected one live skill/phase entry, got ${found.length}`);continue;}
  const samples=manifest.cues[row.cueId];
  if(!samples?.length)errors.push(`${row.cueId}: no playable samples`);
  if(row.kind==='ultimate'&&new Set(samples?.map(s=>s.variantId)).size<2)errors.push(`${row.cueId}: fewer than two distinct ultimate takes`);
  if(samples?.some(s=>s.bus!=='voice'||!s.processedVoice))errors.push(`${row.cueId}: invalid production routing`);
 }
 return errors;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const result=await requiredCallouts();
 writeFileSync(resolve(root,'reports/v3-shell/b2/VOICE-ROSTER.json'),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({units:result.roster.length,skills:result.rows.filter(r=>r.kind==='skill').length,ultimatePhases:result.rows.filter(r=>r.kind==='ultimate').length}));
}
