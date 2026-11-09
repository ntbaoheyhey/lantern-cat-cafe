// S5 selected full-block report, preserving baseline and rejected trials.
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',json=async p=>JSON.parse(await readFile(p,'utf8'));
const [before,after,d,score,audit]=await Promise.all([json(root+'/s5/before/numeric-gates.json'),json(root+'/s5/selected/numeric-gates.json'),json(root+'/s5/selected/design-report.json'),json(root+'/s5/self-score.json'),json(root+'/s5-selected/audit.json')]);
assert.equal(after.count,500);assert.equal(after.offset,0);assert.equal(audit.status,'PASS');
const n=x=>Number(x).toFixed(2),pct=x=>n(x*100)+'%';
function measured(r){if(!r)return 'Not instrumented';const m=r.measured;
 if(typeof m==='number')return n(m);if(typeof m==='boolean')return m?'PASS':'MISS';
 if(r.id==='A5.fourth-slot')return `${m.misses}/${m.cells} misses, worst${n(m.worstPp)}pp`;
 if(r.id==='A5.bare-piece')return `${m.misses}/${m.cells} misses, worst${n(m.worstGainPp)}pp`;
 if(r.id==='A5.display-correlation')return m.map(n).join('/');
 if(m.range)return m.range.map(pct).join('–');
 if(r.id==='A5.fixture-calibration')return pct(m.median);
 if(r.id==='A5.crew-gain')return n(m.gainPp)+'pp';
 if(r.id==='A5.crew-diversity')return m.map(x=>x.nearBestCount).join('/');
 if(r.id==='A5.tiers')return `${m.positive}/${m.total}, ${m.reversals} reversals; acceptance half unused`;
 if(r.id==='A5.band-ladder')return `${m.filter(x=>x.spreadPp<15||x.saturated).length}/${m.length} misses`;
 if(r.id==='V5.named-crews')return `${m.filter(x=>Object.values(x.approved).every(c=>c.within5)).length}/${m.length} encounters`;
 if(r.id==='V5.reaction-coverage')return m.map(x=>x.id+' '+pct(x.share)).join('; ');
 if(r.id.endsWith('.keywords'))return Object.entries(m).map(([k,v])=>k+' '+pct(v)).join('; ');
 return r.status+'; see full receipt';
}
const rows=after.rows.filter(r=>!r.id.includes('probe180')&&!r.id.startsWith('V5.D')).map(r=>`|${r.id}: ${r.target}|${measured(before.rows.find(x=>x.id===r.id))}|${measured(r)}|${r.id==='A5.tiers'?'PARTIAL: acceptance unused':r.status}|`);
const text=`# S5 — selected design, TRAIN confirmation and retained misses

Selected **design3**, all fixed TRAIN1–500 samples retained. Before and selected source are separately registered. No held-out seed has been used. [Selection and tradeoff](s5/SELECTION.md), [all repairs](FIXLOG.md), [rejected trials](S5-TRIALS.md).

D1 adds existing Binding Threads to lone bosses/elites and phase changes. D2 gives Cinnamon ally splash and a legal team ultimate without casualties. D3/D4 improve through bounded Mark/Spread/prevention scoring, targeted cooldowns and later support row effects; Black cup power remains55. Every change is behind skillsV5. [Spec amendments](../../../docs/design/cardrpg/SKILLS-V5.md).

Three design attempts: design1 multi32.089/support29.595/normal12.080; design2b32.940/30.045/17.967 REJECTED; design3 prefix32.367/30.166/13.243 with10/12D4cats and31/32D3assertions. These prefixes are diagnostic; the full500 table below is the decision evidence. Design3 is selected for richer skill use while its pacing and support misses remain explicit. No fourth S5 numeric attempt or changed denominator.

|Unchanged gate|V5 before, TRAIN500|Selected, TRAIN500|Status|
|---|---|---|---|
${rows.join('\n')}

The original combined probe retains all three encounters including bosses:4,500 battles. Its180prefix remains separately reported. The seven base crews contribute10,500 rows; matched D4 adds18,000 rows. Matched power remains within±2%, which does not prove equal encounter difficulty. A5 matrix:4,505cells×500direct seeds, including2,304bare-item and384fourth-slot cells. Earned progression and local collectible protocols are separately registered.

|Addendum gate|Full500 result|Evidence|
|---|---|---|
|D3 every keyword≥1/3 per named crew|${d.gates.D3?'PASS':'MISS'}|[32 crew/keyword checks](s5/selected/design-report.json)|
|D4 every skill5–60% of cat actions|${d.cats.filter(c=>c.pass).length}/12cats, ${d.gates.D4?'PASS':'MISS'}|[Per-cat×skill table](s5/selected/DESIGN-REPORT.md)|
|D5 same-role top2 patterns distinct|${d.gates.D5?'PASS':'MISS'}; ${d.duplicates.length} duplicates|[Patterns](s5/selected/DESIGN-REPORT.md)|

Per-crew keyword/reaction/shape counts and fixed first-three live P-shot seeds are in the [full design report](s5/selected/DESIGN-REPORT.md). D6 outbox publishes these checkpoints for laneB. Reports retain every measured shortfall; tests do not override balance gates.

Self-score **${n(score.total)}/10**, target8.0: **${score.status}**. ${score.lines.map(l=>l.id+' '+n(l.score)+'×'+l.weight*100+'%').join('; ')}. [Arithmetic/evidence](S5-SELF-SCORE.md). First items of S8: ${score.priorities.join('; ')||'the planned cadence and startup measurements'}. Revisit open issues once before S6 and record attribution; do not conceal a three-attempt PARTIAL as a pass.

Compatibility: legacy8,250-route digest exact; fallback180battles/45routes exact; baseline-v1/13historical sims and old saves pass. [Current source closure](s5-selected/audit.json); [before receipt audit](s5/before/receipt-audit.json); [selected receipt audit](s5/selected/receipt-audit.json). Source hash ${after.sourceDigest}. Source gates and original failures are retained.

Next S8: one prospectively registered Home run, startup/size and elapsed boss evidence, followed by S6's single registered20001–20500 shipping/fallback acceptance and Z delivery. Main A4 demo remains unchanged. Human recognition/enjoyment NOT VERIFIED; no B-owned edits, merge or deploy.
`;
await writeFile(root+'/S5-REPORT.md',text);console.log(JSON.stringify({report:'S5-REPORT.md',lines:text.split('\n').length,score:score.total,counts:after.counts}));
