import test from 'node:test';
import assert from 'node:assert/strict';
import {compareRuns,cohort,balanceTargets} from './compare.mjs';

function run(){
 const e={seed:123,runId:1,node:'0-0',tutorial:false,boss:false,initial:{cats:['mochi'],enemies:['cushion']},choices:[{skillId:'mochi-1'}],result:'party',hpRemaining:.7,playbackSeconds:20,endedAt:25};
 return {seed:80001,completed:true,secondsRequested:1800,errors:[],encounters:[e],actions:[{at:1,type:'patrol'}],curve:[{nextRunId:2,team:['mochi'],cards:[{id:'mochi',level:1}],gear:1,currencies:{fish:20},xp:10}],summary:{activeSeconds:1800,encounters:1,wins:1,losses:0,firstLossSeconds:null,normalWinHpMedian:.7,boss:{medianSeconds:null,p90Seconds:null}}};
}
test('equal no-loss runs pass parity but retain censoring',()=>{
 const r=compareRuns(run(),run());assert.equal(r.pass,true);assert.equal(r.firstLossCensored,true);
 const summary=cohort([run(),run(),run()]);assert.equal(summary.firstLossMedianSeconds,null);assert.equal(summary.censoredSeeds,3);
});
test('equal summary numbers cannot conceal different combat decisions or outcomes',()=>{
 const actual=run(),predicted=run();predicted.encounters[0].choices=[{skillId:'mochi-4'}];
 assert.equal(compareRuns(actual,predicted).pass,false);
 predicted.encounters[0].choices=actual.encounters[0].choices;predicted.encounters[0].hpRemaining=.69;
 assert.equal(compareRuns(actual,predicted).pass,false);
});
test('session failure or a different horizon cannot pass acceptance',()=>{
 const actual=run();actual.completed=false;assert.equal(compareRuns(actual,run()).pass,false);
 actual.completed=true;actual.errors=[{message:'crash'}];assert.equal(compareRuns(actual,run()).pass,false);
 actual.errors=[];actual.secondsRequested=60;assert.equal(compareRuns(actual,run()).pass,false);
});
test('timing and economic differences above the threshold fail independently',()=>{
 const predicted=run();predicted.encounters[0].playbackSeconds=23.1;
 assert.equal(compareRuns(run(),predicted).pass,false);
 predicted.encounters[0].playbackSeconds=20;predicted.curve[0].currencies.fish=24;
 assert.equal(compareRuns(run(),predicted).pass,false);
});
test('a simulated loss cannot match a censored real observation',()=>{
 const predicted=run();predicted.summary.firstLossSeconds=900;predicted.encounters[0].result='enemy';predicted.encounters[0].endedAt=900;
 const result=compareRuns(run(),predicted);assert.equal(result.pass,false);assert.equal(result.firstLossCensored,false);
});
test('normal HP excludes elite encounters and earned skips, while keeping their wins',()=>{
 const r=run();r.encounters.push({...r.encounters[0],seed:124,kind:'elite',hpRemaining:1});
 r.encounters.push({...r.encounters[0],seed:125,skipped:true,hpRemaining:1});
 const c=cohort([r]);assert.equal(c.normalWinCount,1);assert.equal(c.normalWinHpMean,.7);
});
test('an in-progress real trace does not count as a completed seed',()=>{
 const r=run();delete r.completed;assert.equal(cohort([r]).completeSeeds,0);
});
test('cohort median includes censored sessions rather than just losing players',()=>{
 const reports=Array.from({length:5},run);reports[0].summary.firstLossSeconds=600;reports[1].summary.firstLossSeconds=700;
 assert.equal(cohort(reports).firstLossMedianSeconds,null);
 reports[2].summary.firstLossSeconds=1200;assert.equal(cohort(reports).firstLossMedianSeconds,1200);
 assert.equal(cohort(reports).earliestLossSeconds,600);
});
test('a decision or progression mismatch is rejected even with identical fights',()=>{
 const predicted=run();predicted.actions[0].type='open-team';assert.equal(compareRuns(run(),predicted).pass,false);
 predicted.actions[0].type='patrol';predicted.curve[0].cards[0].level=2;assert.equal(compareRuns(run(),predicted).pass,false);
});
test('missing or reordered middle encounters cannot hide behind matching aggregate counts',()=>{
 const actual=run(),predicted=run();
 actual.encounters=Array.from({length:10},(_,i)=>({...actual.encounters[0],seed:123+i}));
 predicted.encounters=structuredClone(actual.encounters);predicted.encounters.splice(4,1);
 assert.equal(compareRuns(actual,predicted).pass,false);
 predicted.encounters=structuredClone(actual.encounters);[predicted.encounters[3],predicted.encounters[4]]=[predicted.encounters[4],predicted.encounters[3]];
 assert.equal(compareRuns(actual,predicted).pass,false);
});
test('empty action traces or missing playback measurements cannot pass',()=>{
 const actual=run(),predicted=run();actual.actions=[];predicted.actions=[];
 assert.equal(compareRuns(actual,predicted).pass,false);
 actual.actions=predicted.actions=[{at:1,type:'patrol'}];actual.encounters[0].playbackSeconds=null;
 assert.equal(compareRuns(actual,predicted).pass,false);
 actual.encounters[0].playbackSeconds=20;actual.curve=[];predicted.curve=[];
 assert.equal(compareRuns(actual,predicted).pass,false);
});
test('balance requires uncensored median, no early loss, both HP statistics and the full cohort',()=>{
 const good={completeSeeds:5,minimumHorizonSeconds:1800,firstLossMedianSeconds:900,earlyLossSeeds:0,bossMedianSeconds:70,bossP90Seconds:100,normalWinHpMean:.7,normalWinHpMedian:.7};
 assert.equal(balanceTargets(good,5).pass,true);
 for(const change of [{completeSeeds:4},{minimumHorizonSeconds:60},{firstLossMedianSeconds:null},{earlyLossSeeds:1},{bossP90Seconds:111},{normalWinHpMean:.81}])assert.equal(balanceTargets({...good,...change},5).pass,false);
});
