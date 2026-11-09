// Summarize completed TRAIN receipts; never launches a simulation or changes a gate.
import {readFile, writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',base=root+'/s5/before';
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const [s,m,g,a,day,economy,fallback]=await Promise.all([
  json(base+'/summary.json'),json(base+'/metrics/results.json'),json(base+'/numeric-gates.json'),
  json(base+'/receipt-audit.json'),json(base+'/day7/results.json'),json(base+'/economy/summary.json'),
  json(root+'/s5/fallback/summary.json'),
]);
assert.equal(a.status,'PASS');assert.equal(s.offset,0);assert.equal(s.count,500);
assert.equal(s.scopes.length,6);assert.equal(s.barePieces.cells,2304);
const num=n=>Number(n).toFixed(2),percent=n=>num(n*100)+'%';
const status=id=>g.rows.find(r=>r.id===id)?.status??'NOT VERIFIED';
const all=m.summary,prefix=m.probe180;
const text=`# S5 — TRAIN balance and retained misses

Production combat remains the S4 implementation; S7 changes explanations only. TRAIN seeds **1–500**, equal weight per cell, all outcomes retained. This is not acceptance. Rules digest: \`${s.sourceDigest}\`.

The completed matrix contains ${s.cells.toLocaleString('en-US')} cells and ${s.trials.toLocaleString('en-US')} cell trials, plus 10,500 probe battles, 90 earned 45-day accounts, their day-7 checks, 1,500 collectible pairs and 500 capacity races. Paired trials may contain two battles; cell-trial counts are not unique-battle counts. Receipt integrity passes independently of numeric results.

|Gate|Earlier A5 / original probe|V5 TRAIN 500|Status|
|---|---|---|---|
|Fourth slot ≤12 pp|63/384 misses; worst 88.8 pp|${s.pieces.misses}/384; worst ${num(s.pieces.worst.gainPp)} pp|${status('A5.fourth-slot')}|
|Bare item ≤12 pp|Not rerun on latest A5|${s.barePieces.misses}/2304; worst ${num(s.barePieces.worstGainPp)} pp|${status('A5.bare-piece')}|
|Display share ≤10%|≤4.51%|${percent(Math.max(s.pieces.maxShare,s.barePieces.maxShare))}|${status('A5.display-share')}|
|Display Spearman ≥.6/chapter|.644/.547/.432, older TRAIN50|${s.pieces.spearmanByChapter.map(num).join(' / ')}|${status('A5.display-correlation')}|
|Cats 55–75%, top pick somewhere|61.70–86.61%, older TRAIN50|${percent(Math.min(...s.cats.map(r=>r.rate)))}–${percent(Math.max(...s.cats.map(r=>r.rate)))}; all have a top-pick cell|${status('A5.cats')}|
|Reference fixture median55–60%|Earlier A5 calibration diagnostic retained|${percent(g.rows.find(r=>r.id==='A5.fixture-calibration').measured.median)}; unchanged common budget|${status('A5.fixture-calibration')}|
|Sets 35–75%, leading niche|76.75–92.25%, older TRAIN50|${percent(Math.min(...s.sets.map(r=>r.rate)))}–${percent(Math.max(...s.sets.map(r=>r.rate)))}|${status('A5.sets')}|
|Coherent minus random 10–25 pp|24.67 pp, older TRAIN50|${num(s.crew.gainPp)} pp; ${s.crew.chosen.join('/')}|${status('A5.crew-gain')}|
|≥4 near-best triples per boss/elite|Elite coverage incomplete|${s.diversity.map(r=>r.nearBestCount).join(' / ')}|${status('A5.crew-diversity')}|
|All four approved crews within 5 pp|Not measured|${s.diversity.filter(r=>Object.values(r.approved).every(c=>c.within5)).length}/7 encounters|${status('V5.named-crews')}|
|Tiers ≥44/48, zero reversals|23/24 TRAIN|${s.tiers.positive}/24 V5 TRAIN, ${s.tiers.reversals} reversals; fallback ${fallback.tiers.positive}/24|PARTIAL: acceptance half unused|
|Bands ≥15 pp, no saturation|2/33 misses|${s.bands.filter(r=>r.spreadPp<15||r.saturated).length}/33 misses|${status('A5.band-ladder')}|
|Multi-foe ≥30%|9.1043%, original180|${num(all.multiFoeShare)}% full4500; ${num(prefix.multiFoeShare)}% prefix180|${status('V5.full500.multi-foe')}|
|Multi-ally ≥35%|19.3730%, original180|${num(all.multiAllyShare)}%; prefix ${num(prefix.multiAllyShare)}%|${status('V5.full500.multi-ally')}|
|≥2 announced reactions/battle|4.7778 unannounced detonation records|${num(all.reactionsPerBattle)}; prefix ${num(prefix.reactionsPerBattle)}|${status('V5.full500.reactions')}|
|Normal mean 8–12 rounds|17.2667 all encounters; different scope|${num(all.normalRounds)} normal; ${num(all.rounds)} all encounters|${status('V5.full500.normal-rounds')}|
|Every cat uses an ultimate/normal|2–3% of actions|${num(all.allCatsUltimateShare)}% of normal battles meet all-cat coverage|${status('V5.full500.ultimates')}|
|Every keyword ≥1/3 battles|Cleanse 0.1% of actions|${Object.entries(all.keywordBattles).map(([k,v])=>k+' '+percent(v)).join('; ')}|${status('V5.full500.keywords')}|
|Cleanse ≥3% support actions|Different original denominator|${num(all.cleanseSupportShare)}%|${status('V5.full500.cleanse')}|
|Each reaction ≥40% named crew battles|Unmeasured|${g.rows.find(r=>r.id==='V5.reaction-coverage').measured.map(r=>r.id+' '+percent(r.share)).join('; ')}|${status('V5.reaction-coverage')}|
|Earned day7 casual/regular first2 ≥50/70%|Earlier receipts separate|${percent(day.cohorts[0].twoAttemptWinRate)} / ${percent(day.cohorts[1].twoAttemptWinRate)}|${Object.values(day.gates).every(Boolean)?'PASS':'MISS'}|
|Heavy first win ≤95%; advice after loss|Earlier receipts separate|${percent(day.cohorts[2].firstWinRate)}; ${day.cohorts.reduce((n,r)=>n+r.availableAdvice,0)}/${day.cohorts.reduce((n,r)=>n+r.losses,0)} losses have an available change|${Object.values(day.gates).every(Boolean)?'PASS':'MISS'}|
|Earned economy and selectors|Earlier receipts separate|${Object.values(economy.gates).filter(Boolean).length}/${Object.keys(economy.gates).length} gates|${Object.values(economy.gates).every(Boolean)?'PASS':'MISS'}|
|Collectible gain ≤3 pp|Unverified on latest A5|0 pp; local only|${status('A5.collectibles')}|

V5 alone improves the fourth-slot cliffs; it does not close the unchanged 12 pp limit. Normal encounters separately reach 27.745% multi-foe damage actions; the required combined probe includes a singleton boss and remains below 30%. Neither the denominator nor target changes.

All candidate decisions are retained in [S5-TRIALS.md](S5-TRIALS.md): policy horizon, Black cup strike 55→85, and 320 static-display weight fits are **REJECTED**. No numeric change is adopted. Historical A5 Scent, pressure, reply, support-cooldown and fixture trials remain rejected. The matched-power fixtures still have saturated cases; ±2% budget assertions do not prove equal difficulty. No calibration or eligible-carrier redefinition was substituted.

Cinnamon's approved unchanged revival requires a fallen ally and has no multi-target skill; the unconditional all-cat ultimate/multi-target requirements conflict with that keep-kit instruction. The original gate remains visible. No illegal revival or artificial casualty is introduced.

Full outcomes, paired differences, Wilson intervals, per-cat top-pick cells, set niches and named-crew gaps: [summary](s5/before/summary.json), [numeric gates](s5/before/numeric-gates.json), [receipt audit](s5/before/receipt-audit.json). Numeric diagnostics: ${g.counts.PASS} PASS / ${g.counts.MISS} MISS; the interim TRAIN tier label is not the original combined acceptance gate.

Compatibility reuses S7 only after all 53 production-rule hashes match S4: legacy8,250 digest and fallback180-battle/45-route hashes exact. Phase source gates and closure are recorded in [s5/audit.json](s5/audit.json). Tests establish source integrity, not balance acceptance.

Next: one prospectively registered V5 Home session, startup/size observations, then one combined shipping/fallback acceptance on 20001–20500. Human recognition and enjoyment remain NOT VERIFIED. No B-owned source, merge, deployment or main-demo replacement.
`;
await writeFile(root+'/S5-REPORT.md',text);
console.log(JSON.stringify({report:root+'/S5-REPORT.md',lines:text.split('\n').length,cells:s.cells,numeric:g.counts}));
