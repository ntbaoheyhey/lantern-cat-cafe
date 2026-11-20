// Evaluate unchanged numeric gates from receipts; no samples or tuning here.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.argv[2];assert(root);
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const matrix=await json(root+'/summary.json'),metrics=await json(root+'/metrics/results.json');
const train=await json(`reports/cardrpg-big/skills-v5/s5/${matrix.skillsV5===false?'fallback':process.env.V5_TRAIN_DIR??'selected'}/summary.json`);
const rows=[],add=(id,target,measured,pass,source)=>rows.push({id,target,measured,status:pass?'PASS':'MISS',source});
const range=xs=>[Math.min(...xs),Math.max(...xs)];
add('A5.fourth-slot','Every paired gain ≤12pp',{misses:matrix.pieces.misses,cells:matrix.pieces.cells,worstPp:matrix.pieces.worst.gainPp},matrix.pieces.misses===0,root+'/equipped/results.json');
add('A5.bare-piece','Every paired gain ≤12pp',matrix.barePieces,matrix.barePieces.misses===0,root+'/pieces/results.json');
add('A5.display-share','Every +0/+12 display share ≤10%',Math.max(matrix.pieces.maxShare,matrix.barePieces.maxShare),Math.max(matrix.pieces.maxShare,matrix.barePieces.maxShare)<=.1+1e-8,root+'/summary.json');
add('A5.display-correlation','Spearman ≥.6 each chapter',matrix.pieces.spearmanByChapter,matrix.pieces.spearmanByChapter.every(r=>r>=.6),root+'/summary.json');
add('A5.cats','Every cat55–75%, each top pick somewhere',{range:range(matrix.cats.map(r=>r.rate)),cats:matrix.cats.map(({id,rate,topPickCells})=>({id,rate,topPickCells}))},matrix.cats.every(r=>r.rate>=.55&&r.rate<=.75&&r.topPickCells>0),root+'/teams/results.json');
const teamResults=await json(root+'/teams/results.json'),reference=teamResults.summaries.filter(r=>r.kind==='teams'&&['mochi','soot','clover'].every(id=>r.team.includes(id))).sort((a,b)=>a.rate-b.rate);
assert.equal(reference.length,3);
add('A5.fixture-calibration','Reference matched-power median55–60% on TRAIN; measured on acceptance',{median:reference[1].rate,byChapter:reference.map(r=>({chapter:r.chapter,rate:r.rate})),note:'Unchanged fixture; no calibration or gate adjustment adopted.'},reference[1].rate>=.55&&reference[1].rate<=.60,root+'/teams/results.json');
add('A5.sets','Each set35–75% and leads ≥1 shared situation',{range:range(matrix.sets.map(r=>r.rate)),sets:matrix.sets},matrix.sets.every(r=>r.rate>=.35&&r.rate<=.75&&r.leadingSituations.length>0),root+'/sets/results.json');
add('A5.crew-gain','Coherent minus random10–25pp',matrix.crew,matrix.crew.gainPp>=10&&matrix.crew.gainPp<=25,root+'/teams/results.json');
add('A5.crew-diversity','≥4distinct triples within5pp of best per boss/elite',matrix.diversity.map(({kind,scene,nearBestCount,best})=>({kind,scene,nearBestCount,best})),matrix.diversity.length===7&&matrix.diversity.every(r=>r.nearBestCount>=4),root+'/summary.json');
add('V5.named-crews','All4approved crews within5pp of best at every boss/elite',matrix.diversity,matrix.diversity.length===7&&matrix.diversity.every(r=>Object.values(r.approved).every(c=>c.within5)),root+'/summary.json');
if(metrics.registration.designMetrics){const d=await json(root+'/design-report.json');add('V5.D3-keyword-crews','Each of8keywords in≥1/3 battles of every named crew',d.perCrew,d.gates.D3,root+'/design-report.json');add('V5.D4-skill-diversity','Each skill5–60% of all its cat actions in matched battles',d.cats,d.gates.D4,root+'/design-report.json');add('V5.D5-distinct-patterns','No identical same-role top2 shape+status pattern',d.duplicates,d.gates.D5,root+'/design-report.json');}
const isTrain=matrix.offset===0;
add('A5.tiers',isTrain?'TRAIN24comparisons; combined44/48 evaluated after acceptance':'TRAIN+acceptance≥44/48 at≥2pp, zero reversals',isTrain?matrix.tiers:{train:train.tiers,acceptance:matrix.tiers,positive:train.tiers.positive+matrix.tiers.positive,total:train.tiers.total+matrix.tiers.total},isTrain?matrix.tiers.positive>=22&&matrix.tiers.reversals===0:train.tiers.positive+matrix.tiers.positive>=44&&train.tiers.total+matrix.tiers.total===48&&train.tiers.reversals===0&&matrix.tiers.reversals===0,root+'/tiers/results.json');
add('A5.band-ladder','Bare→legendary≥15pp; no intended-band saturation',matrix.bands,matrix.bands.length===33&&matrix.bands.every(r=>r.spreadPp>=15&&!r.saturated),root+'/tiers/results.json');
for(const [scope,s]of [['full500',metrics.summary],['probe180',metrics.probe180]]){
 add(`V5.${scope}.multi-foe`,'≥30% damage actions hit multiple foes',s.multiFoeShare,s.multiFoeShare>=30,root+'/metrics/results.json');
 add(`V5.${scope}.multi-ally`,'≥35% support actions touch multiple allies',s.multiAllyShare,s.multiAllyShare>=35,root+'/metrics/results.json');
 add(`V5.${scope}.reactions`,'≥2announced reactions/battle',s.reactionsPerBattle,s.reactionsPerBattle>=2,root+'/metrics/results.json');
 add(`V5.${scope}.normal-rounds`,'Mean8–12normal rounds',s.normalRounds,s.normalRounds>=8&&s.normalRounds<=12,root+'/metrics/results.json');
 add(`V5.${scope}.ultimates`,'≥1executed ultimate per cat per normal battle',s.allCatsUltimateShare,s.allCatsUltimateShare===100,root+'/metrics/results.json');
 add(`V5.${scope}.keywords`,'Every core keyword in≥1/3battles',s.keywordBattles,Object.values(s.keywordBattles).every(x=>x>=1/3),root+'/metrics/results.json');
 add(`V5.${scope}.cleanse`,'Cleanse≥3%of support actions',s.cleanseSupportShare,s.cleanseSupportShare>=3,root+'/metrics/results.json');
}
const reactions=[['crumb-burst','night-lamp'],['wildfire','oven'],['rupture','thread'],['spread','thread']].map(([id,crew])=>({id,crew,share:metrics.byCrew[crew].reactionBattleShare[id]}));
add('V5.reaction-coverage','Every reaction in≥40%of its named crew battles',reactions,reactions.every(r=>r.share>=.4),root+'/metrics/results.json');
for(const kind of ['economy','day7','editions']){
 const path=`${root}/${kind}/${kind==='economy'?'summary':'results'}.json`,r=await json(path);
 if(kind==='editions')add('A5.collectibles','Local editions paired gain≤3pp',r.maxPairedGainPp,r.maxPairedGainPp<=3,path);
 else for(const [id,pass]of Object.entries(r.gates))add(`A5.${kind}.${id}`,'Unchanged A5 registered gate',pass,pass,path);
}
const receipt={offset:matrix.offset,count:matrix.count,sourceDigest:matrix.sourceDigest,rows,counts:{PASS:rows.filter(r=>r.status==='PASS').length,MISS:rows.filter(r=>r.status==='MISS').length},limitations:['Numeric bot fixtures only; human recognition, real x1 timing, startup and screenshots are separate evidence.','TRAIN-only22/24 is an interim diagnostic, never a substitute for the original combined44/48 gate.','Fallback uses the same TRAIN-selected coherent crew as shipping; no held-out selection.']};
await writeFile(root+'/numeric-gates.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt.counts));
