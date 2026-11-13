/** Additional SOLO measurements. Original A2/B2 thresholds are untouched. */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
export const fixtures=['wave1','wave3','boss'];
const finite=Number.isFinite;
export function checkSolo(id,data){
 const rows=[];
 const check=(name,value,pass,required)=>rows.push({id:`${id}.${name}`,pass:!!pass,measured:value??'missing',required});
 if(id==='Q2'){
  const matrix=data?.rows??[];
  check('matrix',matrix.length,matrix.length===9&&new Set(matrix.map(r=>r.fixture+':'+r.speed)).size===9,'3 fixtures x3 speeds');
  for(const fixture of fixtures)for(const speed of [1,2,3]){
   const r=matrix.find(r=>r.fixture===fixture&&r.speed===speed),tag=`${fixture}.x${speed}`;
   check(`${tag}.ultimates`,r?.ultimatePlayed,finite(r?.ultimateRequired)&&r.ultimateRequired>0&&r.ultimatePlayed===r.ultimateRequired,'all required charge/release callouts played');
   check(`${tag}.ultimate-interrupted`,r?.ultimateInterrupted,r?.ultimateInterrupted===0,'eq0');
   const ratio=r?.skillPlayed>0?r.skillInterrupted/r.skillPlayed:null;
   check(`${tag}.skill-interrupted`,ratio,finite(ratio)&&ratio>=0&&ratio<=.05,'<=0.05 of played skills');
   check(`${tag}.bark-spacing`,r?.meanBarkIntervalSeconds,finite(r?.meanBarkIntervalSeconds)&&r.meanBarkIntervalSeconds>=7&&r.meanBarkIntervalSeconds<=8,'7–8 seconds');
   check(`${tag}.parity`,r?.parity,r?.parity===true,'true');
   check(`${tag}.browser-errors`,r?.errors?.length,Array.isArray(r?.errors)&&r.errors.length===0,'eq0');
  }
  for(const name of ['battle','boss']){
   const r=data?.mixes?.find(r=>r.name===name),v=r?.voiceContoursPerMinute;
   check(`${name}.voice-contours`,v,finite(v)&&v>=3.25&&v<=6.75,'3.25–6.75/min');
   check(`${name}.duration`,r?.durationSeconds,finite(r?.durationSeconds)&&r.durationSeconds>=(name==='battle'?180:120),'full S5 duration');
  }
 }else if(id==='Q3'){
  for(const fixture of fixtures){
   const r=data?.fixtures?.[fixture];
   check(`${fixture}.enemy-actions`,r?.enemyActions,finite(r?.enemyActions)&&r.enemyActions>0,'>0 measured enemy actions');
   check(`${fixture}.enemy-displacement`,r?.movedEnemyActions,r?.enemyActions>0&&r.movedEnemyActions===r.enemyActions,'100% >6% viewport width');
   check(`${fixture}.minimum-displacement`,r?.minEnemyDisplacementFraction,finite(r?.minEnemyDisplacementFraction)&&r.minEnemyDisplacementFraction>.06,'>0.06');
  }
 }else if(id==='Q7'){
  const plates=data?.plates??[];
  check('plates',plates.length,plates.length===13&&new Set(plates.map(p=>p.id)).size===13,'13 distinct plates');
  check('caster-silhouettes',plates.map(p=>p.casterIoU),plates.length===13&&plates.every(p=>finite(p.casterIoU)&&p.casterIoU>=0&&p.casterIoU<=.85),'all13 caster-region IoU <=0.85');
  for(const fixture of fixtures){
   const r=data?.fixtures?.[fixture];
   check(`${fixture}.effect-saturation`,r?.saturationRatio,finite(r?.saturationRatio)&&r.saturationRatio>=.7,'>=70% reference median');
   check(`${fixture}.effect-luminance`,r?.luminanceRatio,finite(r?.luminanceRatio)&&r.luminanceRatio>=.8,'>=80% reference median');
  }
 }else throw Error('Unknown SOLO item '+id);
 return rows;
}
export const format=r=>`${r.pass?'PASS':'FAIL'} ${r.id}: measured=${JSON.stringify(r.measured)}; required=${r.required}`;
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ids=process.argv.slice(2);const rows=(ids.length?ids:['Q2','Q3','Q7']).flatMap(id=>{
  const path=resolve(root,'reports/v3-solo',id,'metrics.json');return checkSolo(id,existsSync(path)?JSON.parse(readFileSync(path)):null);
 });
 rows.forEach(r=>console.log(format(r)));console.log(`TOTAL ${rows.filter(r=>r.pass).length} PASS / ${rows.filter(r=>!r.pass).length} FAIL / ${rows.length} gates`);
 process.exitCode=rows.every(r=>r.pass)?0:1;
}
