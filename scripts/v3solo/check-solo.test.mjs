import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkSolo,fixtures} from './check-solo.mjs';
const q2=()=>({rows:fixtures.flatMap(fixture=>[1,2,3].map(speed=>({fixture,speed,ultimateRequired:4,ultimatePlayed:4,ultimateInterrupted:0,skillPlayed:20,skillInterrupted:1,meanBarkIntervalSeconds:7.5,parity:true,errors:[]}))),mixes:[{name:'battle',voiceContoursPerMinute:3.25,durationSeconds:180},{name:'boss',voiceContoursPerMinute:6.75,durationSeconds:120}]});
const q3=()=>({fixtures:Object.fromEntries(fixtures.map(id=>[id,{enemyActions:10,movedEnemyActions:10,minEnemyDisplacementFraction:.061}]))});
const q7=()=>({plates:Array.from({length:13},(_,id)=>({id:String(id),casterIoU:.85})),fixtures:Object.fromEntries(fixtures.map(id=>[id,{saturationRatio:.7,luminanceRatio:.8}]))});
for(const [id,make] of [['Q2',q2],['Q3',q3],['Q7',q7]]){
 test(`${id} fake PASS at boundaries`,()=>assert.ok(checkSolo(id,make()).every(r=>r.pass)));
 test(`${id} missing evidence fails`,()=>assert.ok(checkSolo(id,null).some(r=>!r.pass)));
}
const cases=[
 ['Q2','matrix',q2,d=>d.rows.pop()],
 ['Q2','ultimates',q2,d=>d.rows[0].ultimatePlayed--],
 ['Q2','ultimate-interrupted',q2,d=>d.rows[0].ultimateInterrupted=1],
 ['Q2','skill-interrupted',q2,d=>d.rows[0].skillInterrupted=2],
 ['Q2','bark-spacing',q2,d=>d.rows[0].meanBarkIntervalSeconds=8.01],
 ['Q2','parity',q2,d=>d.rows[0].parity=false],
 ['Q2','browser-errors',q2,d=>d.rows[0].errors=['crash']],
 ['Q2','voice-contours',q2,d=>d.mixes[0].voiceContoursPerMinute=3.24],
 ['Q2','duration',q2,d=>d.mixes[1].durationSeconds=119],
 ['Q3','enemy-actions',q3,d=>d.fixtures.wave1.enemyActions=0],
 ['Q3','enemy-displacement',q3,d=>d.fixtures.wave1.movedEnemyActions=9],
 ['Q3','minimum-displacement',q3,d=>d.fixtures.wave1.minEnemyDisplacementFraction=.06],
 ['Q7','plates',q7,d=>d.plates.pop()],
 ['Q7','caster-silhouettes',q7,d=>d.plates[0].casterIoU=.851],
 ['Q7','effect-saturation',q7,d=>d.fixtures.boss.saturationRatio=.699],
 ['Q7','effect-luminance',q7,d=>d.fixtures.wave3.luminanceRatio=.799],
];
for(const [id,gate,make,mutate] of cases)test(`${id}.${gate} fake PASS and FAIL`,()=>{
 const data=make();assert.ok(checkSolo(id,data).filter(r=>r.id.endsWith('.'+gate)).every(r=>r.pass));
 mutate(data);assert.ok(checkSolo(id,data).some(r=>r.id.endsWith('.'+gate)&&!r.pass));
});
