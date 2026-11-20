// REFERENCE: GAMEPLAY-V4 section9. Compute every gate from measured registered receipts.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir='reports/cardrpg-big/a4/p6';
const train=JSON.parse(await readFile(`${dir}/train/results.json`,'utf8')),heldout=JSON.parse(await readFile(`${dir}/heldout/results.json`,'utf8'));
assert.equal(train.sample,'train');assert.equal(heldout.sample,'heldout');assert.equal(train.offset,0);assert.equal(heldout.offset,10000);assert.deepEqual(train.source,heldout.source);
assert(train.count>=500&&heldout.count>=500);assert.equal(train.summaries.length,3625);assert.equal(heldout.summaries.length,3625);
const rows=heldout.summaries,mean=xs=>xs.reduce((n,x)=>n+x,0)/xs.length,checks=[];
function gate(id,condition,measured,target){let status='PASS';try{assert(condition,id);}catch{status='MISS';}checks.push({id,status,measured,target});}
const adjacent=[];
for(const data of [train,heldout])for(const level of [1,6])for(const chapter of [1,2,3])for(let i=1;i<data.tiers.length;i++){
 const a=data.summaries.find(r=>r.kind==='tiers'&&r.level===level&&r.chapter===chapter&&r.rarity===data.tiers[i-1]),b=data.summaries.find(r=>r.kind==='tiers'&&r.level===level&&r.chapter===chapter&&r.rarity===data.tiers[i]);
 adjacent.push({sample:data.sample,level,chapter,from:a.rarity,to:b.rarity,gainPp:100*(b.rate-a.rate)});
}
const positive=adjacent.filter(r=>r.gainPp>=2-1e-8).length,reversals=adjacent.filter(r=>r.gainPp< -1e-8).length;
gate('tiers',positive>=44&&reversals===0,{positive,total:48,reversals,rows:adjacent},'>=44/48 steps gain >=2pp; zero reversals');
const bands=[];
for(const level of [1,2,3,4,5,6,7,8,9,10,50])for(const chapter of [1,2,3]){
 const group=rows.filter(r=>r.kind==='bands'&&r.level===level&&r.chapter===chapter),bare=group.find(r=>r.rarity==='none'),best=group.find(r=>r.rarity==='legendary');
 bands.push({level,chapter,spreadPp:100*(best.rate-bare.rate),saturated:group.every(r=>r.rate>=.95),rates:group.map(r=>({rarity:r.rarity,rate:r.rate,wilson95:r.wilson95}))});
}
gate('bands',bands.every(r=>r.spreadPp>=15&&!r.saturated),bands,'Every intended band: bare to best >=15pp; not all tiers >=95%');
const pieces=rows.filter(r=>['pieces','pieces-equipped'].includes(r.kind)),worst=pieces.reduce((a,b)=>b.gainPp>a.gainPp?b:a),maxShare=Math.max(...pieces.map(r=>Math.max(r.maxShare,r.maxEnhancedShare)));const informative=pieces.filter(r=>r.beforeWins>0&&r.beforeWins<r.n);const bareFloor=pieces.filter(r=>r.kind==='pieces'&&r.beforeWins===0).length;
gate('single-piece',worst.gainPp<=12&&maxShare<=.10&&informative.length>0,{worst,maxShare,bareFloorCells:bareFloor,informativeCells:informative.length,equippedCells:pieces.filter(r=>r.kind==='pieces-equipped').length,cells:pieces.length},'Worst paired heldout gain <=12pp across bare and coherent-kit placements, at least one informative baseline; +0/+12 utility-aware share <=10%; floor cells disclosed');
const sets=[...new Set(rows.filter(r=>r.kind==='sets').map(r=>r.setId))].map(id=>{
 const group=rows.filter(r=>r.kind==='sets'&&r.setId===id);return {id,rate:mean(group.map(r=>r.rate)),leadingSituations:group.filter(r=>r.rate>=Math.max(...rows.filter(x=>x.kind==='sets'&&x.scene===r.scene).map(x=>x.rate))).map(r=>r.scene)};
});
gate('sets',sets.every(r=>r.rate>=.35&&r.rate<=.75&&r.leadingSituations.length>0),sets,'Each set aggregate 35–75% at matched power and leads at least one common situation (ties disclosed)');
const teams=rows.filter(r=>r.kind==='teams'),ids=[...new Set(teams.flatMap(r=>r.team))];
const cats=ids.map(id=>{
 const group=teams.filter(r=>r.team.includes(id)),best=group.reduce((a,b)=>b.rate>a.rate?b:a);
 const top=group.filter(r=>{const partners=r.team.filter(x=>x!==id);return r.rate>=Math.max(...teams.filter(x=>x.chapter===r.chapter&&partners.every(p=>x.team.includes(p))).map(x=>x.rate));});
 return {id,rate:mean(group.map(r=>r.rate)),bestTeam:best.team,bestRate:best.rate,topPickCells:top.length};
});
gate('cats',cats.every(r=>r.rate>=.55&&r.rate<=.75&&r.topPickCells>0),cats,'Every cat aggregate 55–75% at matched power, and top pick with a fixed pair of partners');
const crew=rows.filter(r=>r.kind==='crew'),crewGain=mean(crew.map(r=>r.gainPp));
gate('crew',crewGain>=10&&crewGain<=25,{gainPp:crewGain,chosenOnTrain:train.chosenCrew,rows:crew},'Train-selected coherent crew vs frozen random legal equal-power sampling:10–25pp');
const matched=rows.filter(r=>['sets','teams','crew'].includes(r.kind));
gate('matched-power',matched.every(r=>r.minPowerRatio>=.98&&r.maxPowerRatio<=1.02),{min:Math.min(...matched.map(r=>r.minPowerRatio)),max:Math.max(...matched.map(r=>r.maxPowerRatio))},'All paired parties within2% of fixed utility-aware power');
// Fit a single explanatory relationship only on training outcomes, then report heldout residuals.
// This evaluates the UI estimate; it does not change the combat or hide uncertainty.
const trainingPieces=train.summaries.filter(r=>r.kind==='pieces-equipped');
const xbar=mean(trainingPieces.map(r=>r.meanShare*100)),ybar=mean(trainingPieces.map(r=>r.gainPp));
const denominator=trainingPieces.reduce((n,r)=>n+(r.meanShare*100-xbar)**2,0);
const slope=denominator?trainingPieces.reduce((n,r)=>n+(r.meanShare*100-xbar)*(r.gainPp-ybar),0)/denominator:0,intercept=ybar-slope*xbar;
const evaluated=pieces.filter(r=>r.kind==='pieces-equipped').map(r=>({...r,predictedPp:intercept+slope*r.meanShare*100,residualPp:r.gainPp-intercept-slope*r.meanShare*100}));
let concordant=0,discordant=0,ties=0;
for(let i=0;i<evaluated.length;i++)for(let j=i+1;j<evaluated.length;j++){
 const a=evaluated[i],b=evaluated[j];if(a.chapter!==b.chapter||a.cardId!==b.cardId)continue;
 const product=(a.meanShare-b.meanShare)*(a.gainPp-b.gainPp);if(product>1e-10)concordant++;else if(product< -1e-10)discordant++;else ties++;
}
const utility={method:'Mean utility-aware team-share percentage versus measured paired gain on coherent-kit placements. Linear fit uses training only; conditional pairwise ordering compares same carrier/chapter, ties excluded.',slope,intercept,rankingAgreement:concordant+discordant?concordant/(concordant+discordant):null,concordant,discordant,ties,worstResidual:evaluated.reduce((a,b)=>Math.abs(b.residualPp)>Math.abs(a.residualPp)?b:a),label:'Approximate build estimate; not win probability'};
const result={method:'500 registered seeds/cell/sample; train1–500; heldout10001–10500. No heldout-driven changes. Controlled combat fixtures, not earned account progression.',source:heldout.source,counts:{train:train.summaries.length,heldout:rows.length,trainTrials:train.summaries.reduce((n,r)=>n+r.n,0),heldoutTrials:rows.reduce((n,r)=>n+r.n,0)},checks,utility};
await mkdir(dir,{recursive:true});await writeFile(`${dir}/balance-gates.json`,JSON.stringify(result,null,2));console.log(checks.map(({id,status})=>({id,status})));
