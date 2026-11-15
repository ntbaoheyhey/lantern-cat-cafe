/** V3-CRAFT policy helpers. Source: LEARN/C0.md and REQUEST-CRAFT.txt. */
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

export const scheduleKeys = new Set(['basicDurationMs','basicAnticipationEndMs','basicImpactMs',
  'basicDurationSpreadMs','basicImpactSpreadMs','ultimateDurationMs','focusEndMs','ultimateImpactMs',
  'ultimateDurationSpreadMs','ultimateImpactSpreadMs','actionOverlapMs']);
const owners = {
  Q1: ['B01','B02','B13','B14','B18','U01','U02','U03','U04','U05','U22','U24'],
  Q2: ['C10','C12'], Q4: ['U23'], Q5: ['B11','B12','U17','U18'],
};
export function craftOwner(id) {
  return Object.entries(owners).find(([,ids])=>ids.includes(id))?.[0] ?? 'Q3';
}
export function completedItems(queue) {
  return queue.split('\n').flatMap(line=>{
    const cells=line.split('|').map(s=>s.trim());
    return cells[2]==='done' ? [cells[1]] : [];
  });
}
export function selectedItems(item, done=[]) {
  return item ? new Set([item,...done.filter(id=>!['Q0','QR'].includes(id)),'GLOBAL']) : null;
}
export function scopedDefects(defects, item, done=[]) {
  const selected=selectedItems(item,done);
  return defects.filter(row=>row.defect===true && selected.has(row.owner));
}
function localFile(base,path) {
  if(typeof path!=='string')return null;
  const absolute=resolve(base,path);
  return absolute.startsWith(resolve(base)+'/')&&existsSync(absolute)?absolute:null;
}
function hasNumbers(value) {
  if(typeof value==='number')return Number.isFinite(value);
  return value&&typeof value==='object'&&Object.values(value).some(hasNumbers);
}
export function learningReceipt(base,item,sources,commitMessage) {
  const path=`reports/v3-feel/LEARN/${item}.md`,file=localFile(base,path),errors=[];
  const text=file?readFileSync(file,'utf8').trim():'';
  if(!text)errors.push('missing learning record');
  const rows=sources.filter(s=>(s.topic===item||s.topics?.includes(item))&&text.includes(s.id));
  const unique=[...new Map(rows.map(s=>[s.url_or_path,s])).values()];
  if(unique.length<6)errors.push('fewer than six distinct cited sources');
  if(!unique.some(s=>['paper','formal'].includes(s.type)))errors.push('no paper/formal technical source');
  if(unique.filter(s=>['doc','breakdown'].includes(s.type)&&/^https:\/\//.test(s.url_or_path)).length<3)errors.push('fewer than three internet documents');
  const experiments=unique.filter(s=>s.type==='experiment').map(s=>localFile(base,s.url_or_path)).filter(Boolean);
  if(!experiments.some(p=>{
    try{return p.endsWith('.json')&&hasNumbers(JSON.parse(readFileSync(p,'utf8')));}catch{return false;}
  }))errors.push('no own experiment with recorded numbers');
  if(!commitMessage?.includes(path))errors.push('build commit does not cite the learning record');
  return {pass:errors.length===0,errors,sourceCount:unique.length,paths:[path,'reports/v3-feel/LEARN/sources.json',...unique.filter(s=>localFile(base,s.url_or_path)).map(s=>s.url_or_path)]};
}
export function craftTimeReceipt(log, item='Q3') {
  const errors=[],steps=(log?.steps??[]).filter(s=>s.item===item||s.item?.startsWith(item+'.'));
  if(!steps.length)return {pass:false,errors:['no timed steps']};
  const ordered=steps.map(s=>({...s,startMs:Date.parse(s.start),endMs:Date.parse(s.end)})).sort((a,b)=>a.startMs-b.startMs);
  let totalMs=0,authorMs=0,measureMs=0;
  const assets=new Map(),reviews=new Map();
  for(const [i,step] of ordered.entries()) {
    const duration=step.endMs-step.startMs;
    if(!Number.isFinite(duration)||duration<60000){errors.push('invalid/sub-minute step: '+step.asset);continue;}
    if(step.endMs>Date.now())errors.push('future step: '+step.asset);
    if(i&&step.startMs<ordered[i-1].endMs)errors.push('overlapping solo work intervals');
    if(!['author','measure','learn','review'].includes(step.category))errors.push('unknown time category');
    totalMs+=duration;
    if(step.category==='measure')measureMs+=duration;
    if(step.category==='review'&&step.asset&&Number.isInteger(step.revision)&&step.reviewPath){
      const rounds=reviews.get(step.asset)??new Set();rounds.add(step.revision);reviews.set(step.asset,rounds);
    }
    if(step.category==='author') {
      authorMs+=duration;
      if(!step.asset||!['ultimate','basic','pose','drill'].includes(step.kind)){errors.push('unidentified authored work');continue;}
      const asset=assets.get(step.asset)??{kind:step.kind,ms:0,revisions:new Set()};
      if(asset.kind!==step.kind)errors.push('asset kind changed');
      asset.ms+=duration;
      if(Number.isInteger(step.revision)&&step.revision>0)asset.revisions.add(step.revision);
      assets.set(step.asset,asset);
    }
  }
  // Item time includes gaps between logged steps; idle gaps cannot inflate authoring credit.
  const elapsed=ordered.at(-1).endMs-ordered[0].startMs;
  const itemMs=Math.max(totalMs,elapsed);
  if(!(authorMs/itemMs>=.6))errors.push('authoring below 60%');
  if(!(measureMs/itemMs<=.2))errors.push('measurement above 20%');
  const expectedAssets=(log.expectedAssets??[]).filter(a=>a.item===item||a.item?.startsWith(item+'.'));
  if(!expectedAssets.length)errors.push('no expected asset roster for this item');
  for(const expected of expectedAssets) {
    const asset=assets.get(expected.id),minimum={ultimate:60,basic:30,pose:20,drill:0}[expected.kind];
    if(!asset||asset.kind!==expected.kind||minimum===undefined||asset.ms<minimum*60000)errors.push('authoring floor not met: '+expected.id);
    if(['ultimate','basic','drill'].includes(expected.kind)&&(!asset||asset.revisions.size<2))errors.push('fewer than two revise rounds: '+expected.id);
    if(['ultimate','basic','drill'].includes(expected.kind)&&(!asset||[...asset.revisions].filter(r=>reviews.get(expected.id)?.has(r)).length<2))errors.push('missing review evidence for two revise rounds: '+expected.id);
  }
  return {pass:errors.length===0,errors,authorFraction:authorMs/itemMs,measureFraction:measureMs/itemMs,minutes:itemMs/60000};
}
