// Append an evidence-backed entry for each numeric miss; never change or rerun a sample.
import {readFile,appendFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const phase=process.argv[2];assert(['s5','s6'].includes(phase));
const root='reports/cardrpg-big/skills-v5',current=root+(phase==='s5'?'/s5/selected':'/s6/on');
const previous=root+(phase==='s5'?'/s5/before':'/s5/selected');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const [after,before,audit,design]=await Promise.all([json(current+'/numeric-gates.json'),json(previous+'/numeric-gates.json'),json(current+'/receipt-audit.json'),json(current+'/design-report.json')]);
assert.equal(audit.status,'PASS');assert.equal(after.count,500);assert.equal(after.offset,phase==='s5'?0:20000);
let log=await readFile(root+'/FIXLOG.md','utf8');
const format=r=>{
 if(!r)return 'not instrumented in the earlier cohort';
 const m=r.measured;
 if(r.id==='V5.D3-keyword-crews')return 'see the32 per-crew keyword assertions in the linked design report';
 if(r.id==='V5.D4-skill-diversity')return m.filter(c=>!c.pass).map(c=>c.cat+': '+c.skills.map(s=>s.id+' '+(100*s.share).toFixed(3)+'%').join(', ')).join('; ');
 if(r.id==='V5.named-crews')return m.filter(x=>!Object.values(x.approved).every(c=>c.within5)).length+'/'+m.length+' encounters miss';
 if(r.id==='A5.cats'||r.id==='A5.sets')return m.range.map(x=>(100*x).toFixed(3)+'%').join('–');
 if(r.id==='A5.band-ladder')return m.filter(x=>x.spreadPp<15||x.saturated).length+'/'+m.length+' intended-band cells miss';
 const s=JSON.stringify(m);return s.length<=900?s:'Detailed measured values retained in '+r.source;
};
function attribution(id){
 if(id.includes('fourth-slot')||id.includes('bare-piece')||id==='A5.sets')return ['Set thresholds interact with helpers/statuses; survivability items cross win boundaries; paired fixture saturation.','Isolate a single set/proc contribution on the same TRAIN pairs before considering a smaller V5-only effect. No item normalization is adopted.'];
 if(id.includes('display'))return ['Static utility weights disagree with nonlinear win effects; saturated cells weaken rank correlation; set completion dominates individual item estimates.','The320 registered shared-weight fits were all rejected. Investigate one attributable utility term; keep the existing Spearman gate.'];
 if(id==='A5.cats'||id==='V5.named-crews'||id.includes('fixture')||id.includes('crew-'))return ['Unequal encounter difficulty despite matched displayed power; helper/status synergy favors particular kits; support/control choices cross win thresholds.','Separate kit effects from reference-fixture difficulty on TRAIN; preserve the approved crews, reference fixture and current gates.'];
 if(id.includes('tiers')||id.includes('band-ladder'))return ['Intended-band saturation; item/status scaling changes tier benefits; helper pressure changes survivability thresholds.','Identify the first failing tier pair and its actual outcome differences before a narrowly scoped V5 change.'];
 if(id.includes('D3')||id.includes('keywords'))return ['Recorded Thread Burn attempts can both resist; Night lamp Daze suppresses Yarn Bitter; encounter mechanics determine exposure opportunities.','Consider a distinct secondary Bitter context without weakening successful control. Exact23miss replays are retained; no fourth S5 package.'];
 if(id.includes('D4'))return ['The automatic evaluator prefers other legal moves; capped/discounted shield value can underreward prevention; existing support companions cover the same need.','Value the distinct Warm welcome/Bread cover opportunity. Eighteen exact replays rule out availability in those cases; broad basic cooldowns remain rejected.'];
 if(id.includes('multi-ally'))return ['Guardian support moves are rarely selected; Cinnamon Clean apron remains single-patient; efficient single-target sustain competes with multi-ally casts.','The exact Cinnamon ally-splash/team fallback and later support rows are already selected. A future change should target one prevention opportunity with paired pacing checks.'];
 if(id.includes('normal-rounds'))return ['Setup/prevention replaces immediate damage; opening enemy sustain lengthens some fights; support can be chosen after its best window.','Broad cooldowns were rejected after17.967rounds. Next isolate one support/setup valuation term and retain full normal-battle denominators.'];
 if(id.includes('ultimates'))return ['Short encounters end before each cat casts; another legal skill can have higher policy value; defeats suppress later actions.','Cinnamon no-casualty fallback is implemented. Examine one actual missed-ultimate window without forced rotation or artificial casualties.'];
 if(id.includes('multi-foe')||id.includes('reaction'))return ['Foe survival determines available recipients; primer timing competes with immediate attacks; successful control/removal can prevent follow-up reactions.','Boss helpers and bounded Mark/Spread valuation are the selected changes. Use the saved event counts to isolate any remaining recipient/timing issue.'];
 return ['The exact numeric condition is not met in the retained rows; combat outcomes can alter earned progression; no individual causal contribution has yet been isolated.','Inspect the first failing registered row before proposing a narrowly scoped TRAIN change; retain the current threshold and all samples.'];
}
let added=0;
for(const row of after.rows.filter(r=>r.status==='MISS')){
 const title=`## ${phase.toUpperCase()}-GATE ${row.id} — PARTIAL`;
 if(log.includes(title))continue;
 const old=before.rows.find(r=>r.id===row.id),[hypotheses,next]=attribution(row.id);
 const entry=`\n${title}\n- Reproduce: fixed ${phase==='s5'?'TRAIN1–500':'acceptance20001–20500'}, \`node tools/cardrpg-big/skills-v5/numeric-gates.mjs ${current}\`; registered cases and saved outcomes: \`${row.source}\`. Gate unchanged: ${row.target}.\n- Measure: before ${format(old)}; after ${format(row)}. ${old?.status==='PASS'?'Regression from an earlier PASS.':'Original MISS is retained.'} Full per-skill/per-crew details remain in \`${current}/DESIGN-REPORT.md\`.\n- Ranked hypotheses (not isolated causal estimates): ${hypotheses}\n- Smallest next fix: ${next} ${phase==='s5'?'Three S5 design packages are already retained; no fourth candidate is introduced by this report.':'No retune after seeing this acceptance block. A future changed candidate requires TRAIN work and registered30001–30500.'}\n- Verification/status: full affected matrices and both mode-compatibility checks are recorded in \`${current}/receipt-audit.json\` and \`${root}/${phase==='s5'?'s5-selected':'s6'}/audit.json\`; current gate remains **PARTIAL / MISS**. Passing source/hash checks do not override it.\n`;
 await appendFile(root+'/FIXLOG.md',entry);log+=entry;added++;
}
assert.equal(design.cats.length,12);
console.log(JSON.stringify({phase,entriesAdded:added,numericMisses:after.counts.MISS,samplesRun:0}));
